#!/usr/bin/env python3
# 📬 CARTERO DEL AGENDADOR: actualiza todo por TELEGRAM, igual que Epic, pero con SU PROPIO BOT y sin tocar nada de Epic.
#    Le mandas al bot un archivo y él lo instala (solo si viene de TU chat):
#      agendador-ia-*.zip    → el Agendador IA del VPS (Mary por dentro) + su Apps Script en Google (actualizar.sh: banco de pruebas; si falla NO instala)
#      agendador-web-*.zip   → la página tuagenda.vip (sube los archivos a GitHub, rama main, con respaldo de lo anterior)
#    Comandos:  /estado  (cómo está Mary)   /registro  (qué hizo Mary)   /soporte  (línea de soporte)   /epicmd  (copia del md de Epic, solo lectura)   /ayuda
#    Solo usa la librería estándar de Python. Corre como servicio de systemd (agendador-cartero), lo instala instalar-cartero.sh.
import json, os, re, subprocess, sys, time, urllib.request, urllib.parse, zipfile, io, base64

AQUI = os.path.dirname(os.path.abspath(__file__))
CFG = {}
for linea in open(os.path.join(AQUI, 'cartero.env'), encoding='utf-8'):
    if '=' in linea and not linea.strip().startswith('#'):
        k, v = linea.strip().split('=', 1); CFG[k] = v
TOKEN, DUENO = CFG.get('TG_TOKEN', ''), str(CFG.get('TG_DUENO', ''))
GH_TOKEN, GH_REPO, GH_RAMA = CFG.get('GH_TOKEN', ''), CFG.get('GH_REPO', 'alex88ruizc-max/agendador'), CFG.get('GH_RAMA', 'main')
SERVIDOR_VIEJO = 'AKfycbyRSqnsiFCE402uiML6Su3ECC4YxYKXDTilLmzA1Zvsq4UA5PvyxGZmpb8tN_3L_E1DXQ'   # cuenta alex88ruizc: ya no se usa
SERVIDOR_NUEVO = 'https://script.google.com/macros/s/AKfycbwkfrob2BW4PdWyvelRae04akMPz0LNXJ9ZtZpf1Tw3TUqguJg5vu65R_BY2ctMuW8b/exec'   # tuagenda.servidor
API = 'https://api.telegram.org/bot' + TOKEN
WEB_PERMITIDOS = re.compile(r'^(index|admin|super|privacidad|404)\.html$|^(app|admin|super|common|config|theme|sw)\.js$|^[a-z0-9_-]+\.css$|^[a-z0-9_-]+\.(png|svg|webmanifest|ico|apk)$')

def tg(metodo, datos=None, timeout=70):
    req = urllib.request.Request(API + '/' + metodo, data=json.dumps(datos or {}).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as r: return json.load(r)
def decir(texto):
    try: tg('sendMessage', {'chat_id': DUENO, 'text': texto[:3900], 'disable_web_page_preview': True})
    except Exception as e: print('telegram:', e, flush=True)
def bajar(file_id):
    f = tg('getFile', {'file_id': file_id})['result']
    with urllib.request.urlopen('https://api.telegram.org/file/bot' + TOKEN + '/' + f['file_path'], timeout=120) as r: return r.read()

def resumen(salida):
    L = [l.strip() for l in salida.splitlines() if re.search(r'🧪|✅|❌|⚠️|ℹ️|🐳|☁️|version', l)]
    return '\n'.join(L[-12:]) or salida[-1500:]

# ---------- Mary del agendador ----------
def instalar_mary(nombre, datos):
    try: zipfile.ZipFile(io.BytesIO(datos)).testzip()
    except Exception: return '❌ ' + nombre + ' no es un zip válido.'
    ruta = os.path.join(AQUI, '.llegada.zip'); open(ruta, 'wb').write(datos)
    r = subprocess.run(['unzip', '-o', ruta, '-d', AQUI], capture_output=True, text=True)
    if r.returncode != 0: return '❌ No pude abrir ' + nombre
    r = subprocess.run(['bash', os.path.join(AQUI, 'actualizar.sh')], capture_output=True, text=True, timeout=900)
    open(os.path.join(AQUI, 'datos', 'actualizar-telegram.log'), 'w').write(r.stdout + r.stderr)
    return resumen(r.stdout + r.stderr)

# ---------- Página (GitHub) ----------
def gh(metodo, ruta, cuerpo=None):
    req = urllib.request.Request('https://api.github.com/repos/' + GH_REPO + ruta, method=metodo, data=json.dumps(cuerpo).encode() if cuerpo else None,
                                 headers={'Authorization': 'Bearer ' + GH_TOKEN, 'Accept': 'application/vnd.github+json', 'User-Agent': 'agendador-cartero'})
    try:
        with urllib.request.urlopen(req, timeout=60) as r: return r.status, json.load(r)
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read() or b'{}')
def banco_web(archivos):
    """Corre banco/web.js (dentro de la imagen de Mary, que trae Node) sobre los archivos del zip, sin red."""
    import tempfile, shutil
    d = tempfile.mkdtemp(prefix='web-')
    try:
        for n, b in archivos.items():
            if '/' in n: continue
            open(os.path.join(d, n), 'wb').write(b)
        os.chmod(d, 0o755)
        r = subprocess.run(['sudo', 'docker', 'run', '--rm', '--network', 'none', '-v', d + ':/w:ro', 'agendador-ia-agendador-ia', 'sh', '-c',
                            '[ -f banco/web.js ] && node banco/web.js /w || echo SIN_BANCO'], capture_output=True, text=True, timeout=120)
        sal = (r.stdout or '').strip()
        if 'SIN_BANCO' in sal: return '⚠️ Banco de la página aún no instalado (llega con agendador-ia-2.7).'
        lineas = [l for l in sal.split('\n') if not l.startswith('# ')]
        if r.returncode != 0 or '# fail 0' not in sal: return '❌ La página NO pasó el banco de pruebas:\n' + '\n'.join(lineas[:12])
        return '\n'.join(lineas[:6])
    except Exception as e:
        return '⚠️ No pude correr el banco de la página (' + str(e)[:80] + ').'
    finally:
        shutil.rmtree(d, ignore_errors=True)

def subir_web(nombre, datos):
    if not GH_TOKEN: return '❌ Falta GH_TOKEN en ~/agendador/cartero.env (token de GitHub con permiso «Contents: read and write» solo para ' + GH_REPO + ').'
    try: z = zipfile.ZipFile(io.BytesIO(datos))
    except Exception: return '❌ ' + nombre + ' no es un zip válido.'
    # 1.4: también .nojekyll y .well-known/assetlinks.json (la verificación de la APK de Android), con su carpeta
    ESPECIALES = {'.nojekyll', '.well-known/assetlinks.json'}
    def destino(n):
        n = n.replace('\\', '/').lstrip('./') if not n.startswith('.well-known') and n != '.nojekyll' else n
        if n in ESPECIALES: return n
        return os.path.basename(n) if WEB_PERMITIDOS.match(os.path.basename(n)) else None
    archivos = {destino(n): z.read(n) for n in z.namelist() if not n.endswith('/') and destino(n)}
    raros = [n for n in z.namelist() if not n.endswith('/') and not destino(n)]
    if not archivos: return '❌ ' + nombre + ' no trae archivos de la página.'
    # 3.26 · 🛡️ el servidor de Google de la página: el VIEJO (cuenta alex88ruizc) nunca vuelve; el NUEVO no se cambia por un zip.
    #        (la 3.25 conservaba lo que hubiera en GitHub, y en GitHub había quedado el viejo: por eso seguía el «No hay conexión»)
    aviso_api = ''
    if 'config.js' in archivos and not nombre.startswith('config.js (servidor nuevo)'):
        try:
            m_zip = re.search(rb'export const API_URL = "([^"]*)";', archivos['config.js'])
            url_zip = m_zip.group(1).decode() if m_zip else ''
            url_gh = ''
            try:
                s_, r_ = gh('GET', '/contents/config.js?ref=' + GH_RAMA)
                m_act = re.search(r'export const API_URL = "([^"]*)";', base64.b64decode(r_['content']).decode('utf-8'))
                url_gh = m_act.group(1) if m_act else ''
            except Exception:
                pass
            def malo(u): return (not u) or SERVIDOR_VIEJO in u
            if malo(url_zip):   bueno = url_gh if not malo(url_gh) else SERVIDOR_NUEVO
            elif malo(url_gh):  bueno = url_zip
            else:               bueno = url_gh
            if m_zip and bueno != url_zip:
                archivos['config.js'] = re.sub(rb'export const API_URL = "[^"]*";', ('export const API_URL = "' + bueno + '";').encode(), archivos['config.js'])
                aviso_api = '\n🛡️ config.js traía otra dirección del servidor de Google: dejé la buena (' + bueno[-18:] + ').'
            elif malo(url_gh) and url_gh:
                aviso_api = '\n✅ La página vuelve al servidor de Google nuevo (' + bueno[-18:] + ').'
        except Exception as e:
            aviso_api = '\n⚠️ No pude revisar la dirección del servidor en config.js: ' + str(e)[:80]
    # 0) 🧪 2.7: banco de pruebas de la página. Si algo falla, NO se sube nada (la página sigue como estaba)
    banco = banco_web(archivos)
    if banco.startswith('❌'): return banco + '\n🛑 No subí nada: tuagenda.vip sigue como estaba.'
    # 1) respaldo: lo que hay hoy en GitHub queda en la rama respaldo-AAAAMMDD-HHMM
    s, ref = gh('GET', '/git/ref/heads/' + GH_RAMA)
    if s != 200: return '❌ GitHub no respondió (' + str(s) + '): ' + str(ref.get('message', ''))[:200]
    base = ref['object']['sha']; resp = 'respaldo-' + time.strftime('%Y%m%d-%H%M')
    gh('POST', '/git/refs', {'ref': 'refs/heads/' + resp, 'sha': base})
    # 2) un solo commit con todos los archivos
    s, c = gh('GET', '/git/commits/' + base)
    arbol = []
    for n, b in archivos.items():
        s, blob = gh('POST', '/git/blobs', {'content': base64.b64encode(b).decode(), 'encoding': 'base64'})
        if s != 201: return '❌ No pude subir ' + n + ': ' + str(blob.get('message', ''))[:200]
        arbol.append({'path': n, 'mode': '100644', 'type': 'blob', 'sha': blob['sha']})
    s, t = gh('POST', '/git/trees', {'base_tree': c['tree']['sha'], 'tree': arbol})
    s, nc = gh('POST', '/git/commits', {'message': 'Página ' + nombre + ' (por Telegram, respaldo en ' + resp + ')', 'tree': t['sha'], 'parents': [base]})
    s, r = gh('PATCH', '/git/refs/heads/' + GH_RAMA, {'sha': nc['sha']})
    if s != 200: return '❌ GitHub no aceptó el cambio: ' + str(r.get('message', ''))[:200]
    v = ''
    for n in ('common.js',):
        if n in archivos:
            m = re.search(rb"APP_VERSION = '([^']+)'", archivos[n]); v = (' · versión ' + m.group(1).decode()) if m else ''
    return (banco + aviso_api + '\n✅ Página subida a GitHub (' + str(len(archivos)) + ' archivos' + v + '). tuagenda.vip se actualiza en 1-2 min.\n↩️ Respaldo: rama ' + resp +
            ('\n⚠️ Ignoré: ' + ', '.join(raros[:8]) if raros else ''))

# ---------- 📱 APK de Android (la genera el servicio oficial de PWABuilder desde el VPS) ----------
# /apk → arma la app «Tu Agenda» a partir de tuagenda.vip, la firma con NUESTRA llave (la primera vez se crea y se guarda en
# ~/agendador/apk/ y te llega por Telegram de respaldo), sube tu-agenda.apk y .well-known/assetlinks.json a GitHub y te da el link.
APK_DIR = os.path.join(AQUI, 'apk')
def tg_doc(nombre, datos, texto=''):
    b = '----agenda' + str(int(time.time() * 1000)); cuerpo = io.BytesIO()
    for k, v in (('chat_id', DUENO), ('caption', texto[:900])):
        cuerpo.write(('--' + b + '\r\nContent-Disposition: form-data; name="' + k + '"\r\n\r\n' + v + '\r\n').encode())
    cuerpo.write(('--' + b + '\r\nContent-Disposition: form-data; name="document"; filename="' + nombre + '"\r\nContent-Type: application/octet-stream\r\n\r\n').encode())
    cuerpo.write(datos); cuerpo.write(('\r\n--' + b + '--\r\n').encode())
    req = urllib.request.Request(API + '/sendDocument', data=cuerpo.getvalue(), headers={'Content-Type': 'multipart/form-data; boundary=' + b})
    with urllib.request.urlopen(req, timeout=120) as r: return json.load(r)
# 🗂️ 3.40 · /servidor → te manda por Telegram el código del servidor de Google del AGENDADOR (la copia que el VPS bajó en la
#    última actualización, en ~/agendador/google), SIN claves: se quitan llaves privadas, tokens, contraseñas y la clave de Mary.
#    Solo lee la carpeta del agendador (regla N.º 1). Sirve para que Claude vea cómo funcionan los planes sin adivinar.
SECRETOS = [
    (re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----', re.S), '«LLAVE PRIVADA QUITADA»'),
    (re.compile(r'(["\']?(?:private_key|private_key_id|client_secret|refresh_token|access_token|password|passwd|clave|secret|secreto|token|apikey|api_key|integrity)[\w-]*["\']?\s*[:=]\s*)(["\'])[^"\'\n]{6,}\2', re.I), r'\1\2«QUITADO»\2'),
    (re.compile(r'\b\d{8,10}:[A-Za-z0-9_-]{30,}\b'), '«TOKEN DE TELEGRAM QUITADO»'),
    (re.compile(r'\b(?:prv|pub|prod|test)_(?:prod|test)_[A-Za-z0-9]{10,}\b'), '«LLAVE DE WOMPI QUITADA»'),
    (re.compile(r'\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}\b'), '«LLAVE QUITADA»'),
]
def limpiar_secretos(txt):
    n = 0
    for rx, rep in SECRETOS:
        txt, k = rx.subn(rep, txt); n += k
    return txt, n
# 📖 3.60 · /epicmd — SOLO MIRAR (autorizado por Alex el 2026-11-14: «te autorizo a que solo mires en epic con el comando»).
#    Busca los archivos .md que hay en el VPS FUERA de ~/agendador (ahí vive el md de Epic) y le manda a Alex una COPIA por Telegram.
#    Regla N.º 1: aquí solo se LEE. No se escribe, no se borra, no se mueve ni se ejecuta nada de Epic. Antes de mandar, se quitan las claves.
def epic_mds():
    casa = os.path.dirname(AQUI); L = []
    for raiz, carpetas, archivos in os.walk(casa):
        if raiz[len(casa):].count(os.sep) >= 4: carpetas[:] = []
        carpetas[:] = [c for c in carpetas if not c.startswith('.') and c not in ('node_modules', 'datos', 'respaldo', 'backup', '__pycache__') and os.path.join(raiz, c) != AQUI]
        for f in archivos:
            if not f.lower().endswith('.md'): continue
            ruta = os.path.join(raiz, f)
            try: L.append((ruta, os.path.getsize(ruta), os.path.getmtime(ruta)))
            except Exception: pass
    return sorted(L)[:40]
def cmd_epicmd(texto):
    try: L = epic_mds()
    except Exception as e: decir('⚠️ No pude buscar: ' + str(e)[:200]); return
    if not L: decir('📖 No encontré archivos .md fuera de ~/agendador (hasta 4 carpetas de profundidad).'); return
    p = texto.split()
    if len(p) < 2 or not p[1].isdigit() or not (1 <= int(p[1]) <= len(L)):
        casa = os.path.dirname(AQUI)
        decir('📖 Archivos .md en el VPS (solo los miro, no toco nada):\n\n' + '\n'.join(str(i + 1) + '. ' + r[len(casa) + 1:] + '  (' + str(max(1, t // 1024)) + ' KB · ' + time.strftime('%d/%m %H:%M', time.localtime(m)) + ')' for i, (r, t, m) in enumerate(L))
              + '\n\nEscribe /epicmd y el número para que te mande la copia. Ejemplo: /epicmd 1'); return
    ruta, tam, _ = L[int(p[1]) - 1]
    if tam > 3 * 1024 * 1024: decir('Ese archivo pesa más de 3 MB. No lo mando.'); return
    try:
        with open(ruta, 'rb') as f: txt = f.read().decode('utf-8', 'replace')
        txt, n = limpiar_secretos(txt)
        tg_doc(os.path.basename(os.path.dirname(ruta)) + '-' + os.path.basename(ruta), txt.encode('utf-8'), '📖 Copia de ' + os.path.basename(ruta) + ' (solo lectura).' + (' Quité ' + str(n) + ' clave(s).' if n else '') + ' Reenvíasela a Claude.')
    except Exception as e: decir('❌ No pude leerlo: ' + str(e)[:200])
def servidor():
    carpeta = os.path.join(AQUI, 'google')
    if not os.path.isdir(carpeta): return None, '❌ No encontré ~/agendador/google (Google no está conectado todavía).'
    buf, quitados, n = io.BytesIO(), 0, 0
    with zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(os.listdir(carpeta)):
            if f.startswith('mary-clave') or f.startswith('.') or f.endswith('.env') or not f.endswith(('.gs', '.js', '.json', '.html')): continue
            txt = open(os.path.join(carpeta, f), encoding='utf-8', errors='replace').read()
            txt, k = limpiar_secretos(txt); quitados += k; n += 1
            z.writestr(f, txt)
    if not n: return None, '❌ La carpeta del servidor de Google está vacía.'
    return buf.getvalue(), '🗂️ Código del servidor de Google (' + str(n) + ' archivos, copia de la última actualización). Quité ' + str(quitados) + ' clave(s) o token(s). Pásaselo a Claude.'
def hacer_apk():
    os.makedirs(APK_DIR, exist_ok=True)
    est_f = os.path.join(APK_DIR, 'estado.json')
    try: est = json.load(open(est_f))
    except Exception: est = {}
    if not est.get('clave'):
        import secrets; est['clave'] = secrets.token_urlsafe(18)
    est['version'] = int(est.get('version', 0)) + 1
    base = 'https://tuagenda.vip'
    llave = os.path.join(APK_DIR, 'signing.keystore')
    firma = {'file': None, 'alias': 'tuagenda', 'fullName': 'Tu Agenda', 'organization': 'Tu Agenda', 'organizationalUnit': 'Apps', 'countryCode': 'CO',
             'keyPassword': est['clave'], 'storePassword': est['clave']}
    if os.path.exists(llave): firma['file'] = 'data:application/octet-stream;base64,' + base64.b64encode(open(llave, 'rb').read()).decode()
    pedido = {
        'packageId': 'vip.tuagenda.app', 'name': 'Tu Agenda', 'launcherName': 'Tu Agenda',
        'appVersion': '1.0.' + str(est['version']), 'appVersionCode': est['version'],
        'host': 'tuagenda.vip', 'startUrl': '/?app=1', 'webManifestUrl': base + '/manifest.webmanifest', 'fullScopeUrl': base + '/',
        'iconUrl': base + '/icon-512.png', 'maskableIconUrl': base + '/icon-maskable-512.png', 'monochromeIconUrl': None,
        'themeColor': '#121216', 'themeColorDark': '#121216', 'backgroundColor': '#121216',
        'navigationColor': '#121216', 'navigationColorDark': '#121216', 'navigationDividerColor': '#121216', 'navigationDividerColorDark': '#121216',
        'display': 'standalone', 'orientation': 'portrait', 'fallbackType': 'customtabs', 'enableNotifications': True,
        'enableSiteSettingsShortcut': True, 'isChromeOSOnly': False, 'isMetaQuest': False, 'minSdkVersion': 21, 'splashScreenFadeOutDuration': 300,
        'shortcuts': [], 'features': {}, 'additionalTrustedOrigins': [], 'retainedBundles': [], 'includeSourceCode': False, 'generatorApp': 'PWABuilder',
        'signingMode': 'mine' if firma['file'] else 'new', 'signing': firma,
    }
    req = urllib.request.Request('https://pwabuilder-cloudapk.azurewebsites.net/generateAppPackage', data=json.dumps(pedido).encode(), headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=600) as r: datos = r.read()
    except urllib.error.HTTPError as e: return '❌ PWABuilder no pudo generar la app (' + str(e.code) + '): ' + e.read().decode('utf-8', 'ignore')[:300]
    try: z = zipfile.ZipFile(io.BytesIO(datos))
    except Exception: return '❌ PWABuilder respondió algo que no es un zip: ' + datos[:200].decode('utf-8', 'ignore')
    nombres = z.namelist()
    apk = next((n for n in nombres if n.lower().endswith('.apk') and 'unsigned' not in n.lower()), None)
    links = next((n for n in nombres if n.endswith('assetlinks.json')), None)
    if not apk: return '❌ El paquete no trae APK. Archivos: ' + ', '.join(nombres[:10])
    open(os.path.join(APK_DIR, 'paquete-' + str(est['version']) + '.zip'), 'wb').write(datos)
    nueva = 'signing.keystore' in [os.path.basename(n) for n in nombres] and not os.path.exists(llave)
    for n in nombres:
        if os.path.basename(n) in ('signing.keystore', 'signing-key-info.txt') and not os.path.exists(os.path.join(APK_DIR, os.path.basename(n))):
            open(os.path.join(APK_DIR, os.path.basename(n)), 'wb').write(z.read(n))
    json.dump(est, open(est_f, 'w')); os.chmod(est_f, 0o600)
    b = io.BytesIO(); w = zipfile.ZipFile(b, 'w'); w.writestr('tu-agenda.apk', z.read(apk))
    if links: w.writestr('.well-known/assetlinks.json', z.read(links))
    w.close()
    r = subir_web('tu-agenda-apk-' + str(est['version']), b.getvalue())
    if nueva:   # 🔐 respaldo de la llave de firma: sin ella no se puede actualizar la app con el mismo nombre
        try: tg_doc('tu-agenda-llave-firma.zip', (lambda bb: (lambda zz: ([zz.writestr('signing.keystore', open(llave, 'rb').read()), zz.writestr('clave.txt', 'Clave de la llave y del almacén: ' + est['clave'] + '\nAlias: tuagenda\nPaquete: vip.tuagenda.app\n'), zz.close()], bb.getvalue())[1])(zipfile.ZipFile(bb, 'w')))(io.BytesIO()),
                     '🔐 Llave de firma de la app Tu Agenda. GUÁRDALA (Drive o tu PC). Sin ella no se puede actualizar la app.')
        except Exception as e: decir('⚠️ No pude mandarte la llave de firma: ' + str(e)[:200] + '. Está en ~/agendador/apk/')
    return r + '\n📱 App versión 1.0.' + str(est['version']) + ': ' + base + '/tu-agenda.apk'

def curl(ruta):
    try:
        with urllib.request.urlopen('http://127.0.0.1:3070' + ruta, timeout=10) as r: return r.read().decode()
    except Exception as e: return 'Mary no responde: ' + str(e)

def atender(m):
    if str(m.get('chat', {}).get('id')) != DUENO: return   # 🔒 solo tu chat
    texto = (m.get('text') or '').strip().lower(); doc = m.get('document')
    if doc:
        n = doc.get('file_name') or ''
        if re.match(r'^agendador-ia-[\w.-]+\.zip$', n):
            decir('📦 Recibí ' + n + '. Instalando (banco de pruebas primero)…'); decir('📦 ' + n + '\n' + instalar_mary(n, bajar(doc['file_id'])))
            try: decir(auditoria())   # 3.18: después de cada instalación, la revisión de que no se tocó a nadie
            except Exception as e: decir('⚠️ No pude hacer la auditoría: ' + str(e)[:120])
            return 'reiniciar'   # el zip pudo traer un cartero nuevo
        elif re.match(r'^agendador-web-[\w.-]+\.zip$', n): decir('📦 Recibí ' + n + '. Subiendo la página…'); decir(subir_web(n, bajar(doc['file_id'])))
        elif n == 'assetlinks.json' or re.match(r'^tu-agenda[\w.-]*\.apk$', n):   # 1.4: la APK de Android y su verificación, directo
            datos = bajar(doc['file_id'])
            if n == 'assetlinks.json':
                try: json.loads(datos.decode('utf-8'))
                except Exception: decir('❌ assetlinks.json no es un JSON válido.'); return
            b = io.BytesIO(); z = zipfile.ZipFile(b, 'w'); z.writestr('.well-known/assetlinks.json' if n == 'assetlinks.json' else 'tu-agenda.apk', datos); z.close()
            decir('📦 Recibí ' + n + '. Subiéndolo…'); decir(subir_web(n, b.getvalue()))
        else: decir('🤔 No sé instalar «' + n + '». Mándame agendador-ia-….zip, agendador-web-….zip, tu-agenda.apk o assetlinks.json')
    elif texto.startswith('/apk'): decir('📱 Generando la app de Android… (tarda 1 a 3 minutos)'); decir(hacer_apk())
    elif texto.startswith('/estado'): decir(curl('/salud'))
    elif texto.startswith('/registro'): decir(curl('/registro?n=12'))
    elif texto.startswith('/soporte'):   # 3.58: la línea de soporte (el WhatsApp personal de Alex). El número lo escribe Alex aquí mismo.
        p = texto.split(); accion = p[1] if len(p) > 1 else 'estado'; numero = re.sub(r'\D', '', p[2]) if len(p) > 2 else ''
        if accion not in ('vincular', 'desvincular', 'estado'):
            decir('🆘 Línea de soporte:\n/soporte vincular 573001234567  (tu número, con el 57)\n/soporte estado\n/soporte desvincular'); return
        if accion == 'vincular' and len(numero) < 11: decir('Escribe tu número con el 57 adelante. Ejemplo: /soporte vincular 573001234567'); return
        try:
            req = urllib.request.Request('http://127.0.0.1:3070/soporte?accion=' + accion + '&numero=' + numero, data=b'', method='POST')
            with urllib.request.urlopen(req, timeout=120) as r: j = json.loads(r.read().decode())
        except Exception as e: decir('⚠️ No pude: ' + str(e)[:200]); return
        if not j.get('ok'): decir('❌ ' + str(j.get('error') or 'no se pudo'))
        elif j.get('codigo'):
            decir('🆘 Código para vincular tu WhatsApp ' + numero + ':\n\n' + j['codigo'] + '\n\nTienes 5 minutos.\nEn TU celular: WhatsApp › Dispositivos vinculados › Vincular un dispositivo › Vincular con el número de teléfono › escribe el código.\n\n'
                  '⚠️ Solo tu número personal. Nunca el de una tienda ni el de Epic.\nDespués: en tu súper panel prende «Línea de soporte» y pon ese mismo número.')
        elif accion == 'estado':
            decir('🆘 Línea de soporte\nConexión: ' + ('✅ vinculada (' + str(j.get('numero')) + ')' if j.get('estado') == 'WORKING' else '⚪ ' + str(j.get('estado')))
                  + '\nSúper panel: ' + ('✅ prendida' if j.get('prendidaEnElSuperPanel') else '⚪ apagada') + (' · número ' + str(j.get('numeroEnElSuperPanel')) if j.get('numeroEnElSuperPanel') else '')
                  + '\nPersonas de tiendas que ya escribieron: ' + str(j.get('personasDeTiendas', 0))
                  + '\nNúmeros de dueños que reconoce: ' + str(j.get('numerosDeDuenos', 0)) + ' (de ' + str(j.get('tiendasRevisadas', 0)) + ' tiendas) · ' + str(j.get('listaDeDuenos', '')))
        else: decir('🆘 ' + str(j.get('estado')) + ((' (' + str(j.get('numero')) + ')') if j.get('numero') else ''))
    elif texto.startswith('/guia') or texto.startswith('/guía'):   # 3.50: publica YA el estado «Cómo agendar» de una tienda (para probar sin esperar)
        bid = re.sub(r'[^a-z0-9-]', '', (texto.split() + [''])[1].lower())
        if not bid: decir('Dime la tienda. Ejemplo: /guia elbarba'); return
        decir('📲 Publicando «Cómo agendar» de ' + bid + '… (tarda cerca de 1 minuto)')
        try:
            req = urllib.request.Request('http://127.0.0.1:3070/publicar?tipo=guia&bid=' + bid, data=b'', method='POST')
            with urllib.request.urlopen(req, timeout=240) as r: decir(r.read().decode() + '\n\nMira /registro para ver a cuántos contactos se mandó.')
        except Exception as e: decir('No se pudo: ' + str(e))
    elif texto.startswith('/auditoria') or texto.startswith('/auditoría'): decir(auditoria())
    elif texto.startswith('/limpiar'): decir(limpiar())
    elif texto.startswith('/epicmd'): cmd_epicmd(texto)   # 3.60: solo mirar
    elif texto.startswith('/servidor'):
        datos, msj = servidor()
        if not datos: decir(msj)
        else:
            try: tg_doc('servidor-google-' + time.strftime('%Y%m%d-%H%M') + '.zip', datos, msj)
            except Exception as e: decir('❌ No pude mandarte el archivo: ' + str(e)[:200])
    elif texto.startswith('/modo'): decir(cmd_modo(texto))
    elif texto.startswith('/prueba'): decir(cmd_prueba(texto))
    elif texto: decir('Hola 👋 Soy el cartero del Agendador IA.\nMándame:\n• agendador-ia-….zip → actualizo el VPS (Mary) y el Apps Script de Google\n• agendador-web-….zip → subo la página tuagenda.vip\n/apk → genero la app de Android\n/estado · /registro\n/auditoria → reviso que el agendador no toque a Epic ni a nadie (solo lee)\n/limpiar → quito contenedores sueltos del agendador (solo los nuestros)\n/servidor → te mando el código del servidor de Google (sin claves) para Claude\n/modo → ver o cambiar el modo (prueba, todos, apagado)\n/prueba <números> → tus números de prueba')

# ---------- 🧪 3.1 · modo del asistente por Telegram: /modo · /modo prueba|todos|apagado · /prueba <números> ----------
ENV_IA = os.path.join(AQUI, 'agendador-ia.env')
def env_leer():
    try: return open(ENV_IA, encoding='utf-8').read().splitlines()
    except Exception: return []
def env_valor(k):
    for l in env_leer():
        if l.startswith(k + '='): return l.split('=', 1)[1]
    return ''
def env_poner(k, v):
    L = [l for l in env_leer() if not l.startswith(k + '=')] + [k + '=' + v]
    open(ENV_IA + '.tmp', 'w', encoding='utf-8').write('\n'.join(L) + '\n'); os.replace(ENV_IA + '.tmp', ENV_IA)
def reiniciar_ia():
    # solo el contenedor del agendador (regla N.º 1: nada de otros proyectos)
    r = subprocess.run(['sudo', 'docker', 'compose', 'up', '-d', 'agendador-ia', '--force-recreate'], cwd=AQUI, capture_output=True, text=True, timeout=300)
    if r.returncode != 0: return '❌ No pude reiniciar el asistente: ' + (r.stderr or r.stdout)[-300:]
    for _ in range(30):
        time.sleep(2)
        s = curl('/salud')
        if '"ok":true' in s.replace(' ', ''): return s
    return '⚠️ Reinicié, pero aún no responde. Mira /estado en un minuto.'
MODOS = {'prueba': '🧪 PRUEBA: solo responde a tus números de prueba', 'todos': '✅ TODOS: atiende a todos los clientes', 'apagado': '⏸️ APAGADO: no responde, no lee correos, no publica'}
def cmd_modo(texto):
    p = texto.split()
    actual = env_valor('MARY_MODO') or 'prueba'
    if len(p) == 1:
        return ('Modo actual: ' + MODOS.get(actual, actual) + '\nNúmeros de prueba: ' + (env_valor('MARY_PRUEBA') or '(ninguno)') +
                '\n\nCambiar:\n/modo prueba\n/modo todos\n/modo apagado\n/prueba 573001234567,573009998877')
    nuevo = p[1]
    if nuevo not in MODOS: return '🤔 Modos: prueba, todos o apagado. Ej.: /modo todos'
    if nuevo == actual: return 'Ya está en ' + MODOS[nuevo]
    if nuevo == 'todos' and (len(p) < 3 or p[2] not in ('confirmo', 'si', 'sí')):
        return ('⚠️ En modo TODOS el asistente le responde a CUALQUIERA que escriba a los WhatsApp vinculados y publica los estados.\n'
                'Si tienes vinculado un número personal (ej. tu 318), también les respondería a tus contactos.\n\nSi estás seguro, escribe:\n/modo todos confirmo')
    env_poner('MARY_MODO', nuevo)
    return '🔄 Cambiando a ' + MODOS[nuevo] + '…\n' + reiniciar_ia()
def cmd_prueba(texto):
    nums = [re.sub(r'\D', '', x) for x in re.split(r'[,\s]+', texto.split(None, 1)[1] if len(texto.split(None, 1)) > 1 else '')]
    nums = [('57' + n if len(n) == 10 and n.startswith('3') else n) for n in nums if n]
    if not nums or any(len(n) < 11 or len(n) > 15 for n in nums): return '🤔 Escríbelos con el indicativo, separados por coma. Ej.:\n/prueba 573001234567,573009998877'
    env_poner('MARY_PRUEBA', ','.join(nums))
    return '🧪 Números de prueba: ' + ', '.join(nums) + '\n' + reiniciar_ia()

# ---------- 🔍 3.18 · /auditoria: ¿el agendador tocó o interfiere con Epic u otro proyecto? SOLO LEE (regla N.º 1) ----------
NUESTROS = ('agendador-ia', 'evolution-agendador', 'postgres-agendador', 'waha-agendador', 'oido-agendador')
def dk(*a):
    try:
        r = subprocess.run(['sudo', 'docker'] + list(a), capture_output=True, text=True, timeout=60)
        return (r.stdout or '').strip()
    except Exception as e:
        return ''
# 🧹 3.33 · contenedores SUELTOS del agendador (p. ej. «vigorous_burnell»: un banco o un clasp que quedó colgado).
#    Solo cuenta como nuestro lo que se PRUEBA: imagen del agendador, o una carpeta montada dentro de ~/agendador.
#    Nunca: los fijos del agendador (NUESTROS), nada con «epic» en el nombre, ni contenedores de un docker compose (de nadie).
IMAGENES_NUESTRAS = ('agendador-ia-agendador-ia', 'agendador-ia', 'agendador-ia-agendador-ia:latest', 'agendador-ia-agendador-ia:buena')
def sueltos():
    out = []
    for cid in [x for x in dk('ps', '-aq').split('\n') if x]:
        try: d = json.loads(dk('inspect', cid))[0]
        except Exception: continue
        nombre = str(d.get('Name', '')).lstrip('/')
        if nombre in NUESTROS or 'epic' in nombre.lower(): continue
        proyecto = ((d.get('Config') or {}).get('Labels') or {}).get('com.docker.compose.project')
        tarea = nombre.startswith('agendador-tarea-') and proyecto == 'agendador-ia'   # 3.35: una tarea nuestra que quedó colgada
        if proyecto and not tarea: continue   # de un compose (de otro o un servicio fijo): no es suelto
        img = str((d.get('Config') or {}).get('Image', ''))
        montajes = [str(m.get('Source', '')) for m in (d.get('Mounts') or [])]
        if tarea or img in IMAGENES_NUESTRAS or any(m == AQUI or m.startswith(AQUI + '/') for m in montajes):
            out.append({ 'id': cid, 'nombre': nombre, 'imagen': img, 'estado': str((d.get('State') or {}).get('Status', '')), 'desde': str((d.get('State') or {}).get('StartedAt', ''))[:16] })
    return out
def limpiar():
    L = sueltos()
    if not L: return '✅ No hay contenedores sueltos del agendador. No toqué nada.'
    hechos = []
    for x in L:
        dk('rm', '-f', x['id'])   # solo los probados como del agendador (ver sueltos())
        hechos.append('🧹 ' + x['nombre'] + ' (' + x['imagen'] + ', ' + x['estado'] + ' desde ' + x['desde'] + ')')
    return 'Quité ' + str(len(hechos)) + ' contenedor(es) suelto(s) del agendador:\n' + '\n'.join(hechos) + '\nEpic y los demás no se tocaron.'
def auditoria():
    L, mal = ['🔍 *Auditoría del agendador* (solo lectura: no cambia nada)'], 0
    # 1) la red del agendador solo tiene contenedores del agendador
    en_red = dk('network', 'inspect', 'agendador-red', '-f', '{{range .Containers}}{{.Name}} {{end}}').split()
    ajenos = [x for x in en_red if x not in NUESTROS]
    if ajenos: mal += 1; L.append('❌ En la red del agendador hay contenedores AJENOS: ' + ', '.join(ajenos) + ' (no los toco: avísale a Claude)')
    else: L.append('✅ Red del agendador: solo contenedores del agendador (' + ', '.join(en_red) + ')')
    # 2) ningún contenedor ajeno está conectado a la red del agendador, y los de Epic siguen en sus redes de siempre
    todos = [x for x in dk('ps', '-a', '--format', '{{.Names}}').split('\n') if x]
    otros = [x for x in todos if x not in NUESTROS]
    epic = [x for x in otros if 'epic' in x.lower()]
    for x in epic:
        redes = dk('inspect', x, '-f', '{{range $k, $v := .NetworkSettings.Networks}}{{$k}} {{end}}').split()
        estado = dk('ps', '-a', '--filter', 'name=^' + x + '$', '--format', '{{.Status}}')
        reinicios = dk('inspect', x, '-f', '{{.RestartCount}}')
        if 'agendador-red' in redes: mal += 1; L.append('❌ ' + x + ' está en la red del agendador')
        L.append(('✅ ' if estado.startswith('Up') else '⚠️ ') + x + ': ' + (estado or '?') + ' · redes: ' + (' '.join(redes) or '—') + (' · reinicios: ' + reinicios if reinicios and reinicios != '0' else ''))
    if not epic: L.append('ℹ️ No veo contenedores con «epic» en el nombre.')
    # 3) puertos: los del agendador no chocan con los de nadie
    def puertos(n): return set(p.strip() for p in dk('port', n).split('\n') if p.strip())
    nuestros_p = set().union(*[set(p.split('->')[-1].strip() for p in puertos(n)) for n in NUESTROS if n in todos]) if any(n in todos for n in NUESTROS) else set()
    choques = [x for x in otros if set(p.split('->')[-1].strip() for p in puertos(x)) & nuestros_p]
    if choques: mal += 1; L.append('❌ Puertos repetidos con: ' + ', '.join(choques))
    else: L.append('✅ Puertos del agendador: propios (' + (', '.join(sorted(nuestros_p)) or '—') + ')')
    # 4) consumo: oído y agendador al lado de Epic
    st = dk('stats', '--no-stream', '--format', '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}')
    filas = [x.split('|') for x in st.split('\n') if x and (x.split('|')[0] in NUESTROS or 'epic' in x.split('|')[0].lower())]
    if filas: L.append('📊 Consumo ahora:\n' + '\n'.join('  · ' + f[0] + ': CPU ' + f[1] + ' · RAM ' + f[2].split('/')[0].strip() for f in filas if len(f) >= 3))
    su = sueltos()
    parados = [x for x in NUESTROS if x in todos and not dk('ps', '-a', '--filter', 'name=^' + x + '$', '--format', '{{.Status}}').startswith('Up')]
    if su: L.append('🧹 Contenedores sueltos del agendador: ' + ', '.join(x['nombre'] + ' (' + x['imagen'] + ')' for x in su) + ' → mándame /limpiar para quitarlos')
    if parados: L.append('⚠️ Contenedores del agendador detenidos: ' + ', '.join(parados))
    if not su and not parados: L.append('🧹 docker ps -a: limpio (sin contenedores sueltos ni detenidos del agendador)')
    L.append('\n' + ('✅ *Epic no está tocado por el agendador.*' if not mal else '⚠️ Hay ' + str(mal) + ' punto(s) para revisar (arriba). No toqué nada.'))
    return '\n'.join(L)

INICIO = os.path.getmtime(os.path.abspath(__file__))
def main():
    if not TOKEN or not DUENO: print('Falta TG_TOKEN o TG_DUENO en cartero.env', flush=True); sys.exit(1)
    pos = 0
    while True:
        try:
            r = tg('getUpdates', {'offset': pos, 'timeout': 50, 'allowed_updates': ['message']}, timeout=70)
            for u in r.get('result', []):
                pos = u['update_id'] + 1
                if 'message' in u:
                    try: hacer = atender(u['message'])
                    except Exception as e: hacer = None; decir('❌ Error: ' + str(e)[:300])
                    if hacer == 'reiniciar' and os.path.getmtime(__file__) != INICIO:
                        tg('getUpdates', {'offset': pos, 'timeout': 0}, timeout=20)   # confirma el mensaje antes de reiniciar (si no, lo volvería a instalar)
                        decir('🔄 Cartero actualizado.'); os.execv(sys.executable, [sys.executable, os.path.abspath(__file__)])
        except Exception as e:
            print('ciclo:', e, flush=True); time.sleep(5)

if __name__ == '__main__': main()
