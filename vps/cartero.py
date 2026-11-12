#!/usr/bin/env python3
# 📬 CARTERO DEL AGENDADOR: actualiza todo por TELEGRAM, igual que Epic, pero con SU PROPIO BOT y sin tocar nada de Epic.
#    Le mandas al bot un archivo y él lo instala (solo si viene de TU chat):
#      agendador-ia-*.zip    → el Agendador IA del VPS (Mary por dentro) + su Apps Script en Google (actualizar.sh: banco de pruebas; si falla NO instala)
#      agendador-web-*.zip   → la página tuagenda.vip (sube los archivos a GitHub, rama main, con respaldo de lo anterior)
#    Comandos:  /estado  (cómo está Mary)   /registro  (qué hizo Mary)   /ayuda
#    Solo usa la librería estándar de Python. Corre como servicio de systemd (agendador-cartero), lo instala instalar-cartero.sh.
import json, os, re, subprocess, sys, time, urllib.request, urllib.parse, zipfile, io, base64

AQUI = os.path.dirname(os.path.abspath(__file__))
CFG = {}
for linea in open(os.path.join(AQUI, 'cartero.env'), encoding='utf-8'):
    if '=' in linea and not linea.strip().startswith('#'):
        k, v = linea.strip().split('=', 1); CFG[k] = v
TOKEN, DUENO = CFG.get('TG_TOKEN', ''), str(CFG.get('TG_DUENO', ''))
GH_TOKEN, GH_REPO, GH_RAMA = CFG.get('GH_TOKEN', ''), CFG.get('GH_REPO', 'alex88ruizc-max/agendador'), CFG.get('GH_RAMA', 'main')
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
    return (banco + '\n✅ Página subida a GitHub (' + str(len(archivos)) + ' archivos' + v + '). tuagenda.vip se actualiza en 1-2 min.\n↩️ Respaldo: rama ' + resp +
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
    elif texto: decir('Hola 👋 Soy el cartero del Agendador IA.\nMándame:\n• agendador-ia-….zip → actualizo el VPS (Mary) y el Apps Script de Google\n• agendador-web-….zip → subo la página tuagenda.vip\n/apk → genero la app de Android\n/estado · /registro')

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
