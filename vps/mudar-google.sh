#!/bin/bash
# 🚚 MUDAR EL SERVIDOR DEL AGENDADOR A OTRO GMAIL (su propio cupo de Google). Uso: bash ~/agendador/mudar-google.sh
#    La base de datos (Firebase), citas, clientes y negocios NO se mueven: solo cambia la cuenta de Google donde corre el Apps Script.
#    1) autorizas la cuenta NUEVA  2) se crea el proyecto allí con el MISMO código  3) se publica  4) activas sus permisos (2 clics)
#    5) se cambia todo a la dirección nueva: Mary, el VPS y la página (config.js en GitHub). La cuenta vieja queda de respaldo.
cd "$(dirname "$0")" || exit 1
CL(){ D="$1"; shift; sudo docker compose run --rm -T --no-deps --name agendador-tarea-mudar-$$-$RANDOM -v "$(pwd)/$D:/w" -v "$(pwd)/clasp-nuevo:/root" tarea-clasp timeout 600 npx -y @google/clasp@3.4.1 "$@"; }
[ -d google ] && ls google/*.gs google/*.js >/dev/null 2>&1 || { echo "❌ No encontré el código actual en ~/agendador/google. Corre antes: bash instalar-google.sh"; exit 1; }
VIEJA=$(grep -m1 '^GAS_URL=' agendador-ia.env | cut -d= -f2-)
echo "🚚 Mudanza del servidor del agendador a un Gmail nuevo."
echo "   Dirección actual: $VIEJA"
echo
echo "PASO 1 · Entra a https://script.google.com/home/usersettings con la cuenta NUEVA y ACTIVA «API de Google Apps Script». Enter cuando esté."; read -r _
mkdir -p clasp-nuevo
if [ ! -s clasp-nuevo/.clasprc.json ]; then
  echo "PASO 2 · Abre el enlace que sale, elige la cuenta NUEVA (¡no la de Epic!), toca «Permitir» y pega la dirección de la página que NO carga."
  sudo docker compose run --rm --no-deps --name agendador-tarea-login-$$ -v "$(pwd)/clasp-nuevo:/root" tarea-clasp timeout 900 npx -y @google/clasp@3.4.1 login --no-localhost || { echo "❌ No quedó autorizada."; exit 1; }
  sudo chown -R "$(id -u):$(id -g)" clasp-nuevo
fi
# 3) copia del código actual (lo que corre hoy en Google, con Mary y los correos)
echo "📥 Bajando la versión de hoy para copiarla tal cual…"
rm -f google/mary.gs google/mary.js google/correo.gs google/correo.js google/mary-clave.gs google/mary-clave.js
sudo docker compose run --rm -T --no-deps --name agendador-tarea-pull-$$ -v "$(pwd)/google:/w" -v "$(pwd)/clasp:/root" tarea-clasp timeout 600 npx -y @google/clasp@3.4.1 pull >/tmp/mudar-pull.log 2>&1 || { echo "❌ No pude bajar el servidor de hoy:"; tail -4 /tmp/mudar-pull.log; exit 1; }
for f in google/*.gs; do [ -f "${f%.gs}.js" ] && rm -f "$f"; done
sudo chown -R "$(id -u):$(id -g)" google
# 2.1: si ya se creó el proyecto en un intento anterior, se reutiliza (no se crean dos)
SID=$(python3 -c 'import json;print(json.load(open("google-nuevo/.clasp.json"))["scriptId"])' 2>/dev/null)
SID=${SID:-$(cat clasp-nuevo/proyecto.txt 2>/dev/null)}; SID=${1:-$SID}   # 2.4: también se recuerda aparte, o se indica a mano: bash mudar-google.sh <ID>
rm -rf google-nuevo && mkdir google-nuevo
if [ -z "$SID" ]; then
  echo "🆕 Creando el proyecto en la cuenta nueva…"
  CL google-nuevo create-script --type standalone --title "Tu Agenda · servidor" --rootDir . >/tmp/mudar.log 2>&1 || CL google-nuevo create --type standalone --title "Tu Agenda · servidor" --rootDir . >>/tmp/mudar.log 2>&1
  sudo chown -R "$(id -u):$(id -g)" google-nuevo
  SID=$(python3 -c 'import json;print(json.load(open("google-nuevo/.clasp.json"))["scriptId"])' 2>/dev/null)
  [ -n "$SID" ] || SID=$(grep -oE 'script.google.com/d/[A-Za-z0-9_-]+' /tmp/mudar.log | head -1 | cut -d/ -f3)
  [ -n "$SID" ] || { echo "❌ No se pudo crear el proyecto: $(tail -5 /tmp/mudar.log)"; exit 1; }
else echo "♻️  Uso el proyecto que ya está en la cuenta nueva ($SID)"; fi
echo "$SID" > clasp-nuevo/proyecto.txt
# el código: lo que corre hoy (google/) + nuestros archivos (gs/). Sin duplicados .gs/.js (Google no deja subir los dos)
find google-nuevo -maxdepth 1 -type f \( -name '*.gs' -o -name '*.js' -o -name 'appsscript.json' \) -delete
for f in google/*.js google/*.gs; do [ -f "$f" ] || continue; b=$(basename "$f"); n="${b%.*}"
  case "$n" in mary|correo|mary-clave) continue ;; esac
  [ -f "google-nuevo/$n.js" ] || [ -f "google-nuevo/$n.gs" ] || cp -f "$f" "google-nuevo/$b"; done
for f in gs/*.gs; do cp -f "$f" google-nuevo/; done
KEY=$(grep -m1 '^MARY_KEY=' agendador-ia.env | cut -d= -f2-)
printf "// Generado por el VPS. Clave entre el Agendador IA del VPS y este servidor. No la compartas.\nconst MARY_CLAVE = '%s';\n" "$KEY" > google-nuevo/mary-clave.gs
cp -f google/appsscript.json google-nuevo/appsscript.json 2>/dev/null
python3 - <<'EOP'
import json
f = 'google-nuevo/appsscript.json'
try: m = json.load(open(f))
except Exception: m = {}
m["timeZone"] = m.get("timeZone") or "America/Bogota"; m["runtimeVersion"] = "V8"; m.setdefault("exceptionLogging", "STACKDRIVER")
m["webapp"] = {"executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS"}   # igual que hoy: «Ejecutar como: yo» y «Cualquier usuario»
json.dump(m, open(f, "w"), indent=2)
EOP
echo "📄 Archivos que se suben: $(ls google-nuevo | tr '\n' ' ')"
# los datos del proyecto (a cuál subir y en qué orden: primero el principal, al final los complementos)
python3 - "$SID" <<'EOP'
import json, os, sys
f = 'google-nuevo/.clasp.json'
try: c = json.load(open(f))
except Exception: c = {}
c["scriptId"] = sys.argv[1]; c["rootDir"] = "."
nuestros = ['mary-clave.gs', 'mary.gs', 'correo.gs']
suyos = sorted(x for x in os.listdir('google-nuevo') if x.endswith(('.gs', '.js')) and x not in nuestros)
c['filePushOrder'] = suyos + [x for x in nuestros if os.path.exists('google-nuevo/' + x)]
json.dump(c, open(f, 'w'), indent=2)
EOP
[ -s google-nuevo/.clasp.json ] || { echo "❌ No pude preparar los datos del proyecto."; exit 1; }
echo "⬆️  Subiendo el código y publicando…"
CL google-nuevo push --force >/tmp/mudar-push.log 2>&1 || { echo "❌ No pude subir el código:"; tail -8 /tmp/mudar-push.log; exit 1; }
DEP=$(CL google-nuevo deploy -d "Tu Agenda · inicial" 2>&1 | grep -oE 'AKfy[A-Za-z0-9_-]+' | head -1)
[ -n "$DEP" ] || { echo "❌ No pude publicar la aplicación web: $(tail -5 /tmp/mudar.log)"; exit 1; }
NUEVA="https://script.google.com/macros/s/$DEP/exec"
# el servidor necesita conocer su propia dirección (Telegram, enlaces de pago)
for f in google-nuevo/*.gs google-nuevo/*.js; do [ -f "$f" ] && sed -i "s#WEBAPP_URL: '[^']*'#WEBAPP_URL: '$NUEVA'#" "$f"; done
CL google-nuevo push --force >>/tmp/mudar.log 2>&1 && CL google-nuevo deploy -i "$DEP" -d "Tu Agenda · dirección propia" >>/tmp/mudar.log 2>&1
echo "✅ Servidor nuevo publicado: $NUEVA"
echo
echo "PASO 3 · Permisos (solo Google deja hacerlo a mano). Abre: https://script.google.com/d/$SID/edit"
echo "   Con la cuenta NUEVA, arriba elige cada función y toca «Ejecutar», aceptando los permisos que pida:"
echo "     1) setupInicial      (crea los activadores: recordatorios, vencimientos y resumen diario)"
echo "     2) setupTelegram     (los botones de Aprobar/Rechazar del bot de avisos pasan al servidor nuevo)"
echo "     3) autorizarCorreo   (permiso para mandar los correos de las citas)"
echo "   Enter cuando las 3 digan ✅ en el registro."; read -r _
R=$(curl -sL -m 60 "$NUEVA"); echo "$R" | grep -q "funcionando" || { echo "❌ El servidor nuevo no responde bien: ${R:0:200}. No cambié nada: todo sigue con el de antes."; exit 1; }
echo "🧪 El servidor nuevo responde: «$R»"
# 5) cambio: VPS + Mary + página
TS=$(date +%Y%m%d-%H%M); mkdir -p respaldo
cp -f agendador-ia.env "respaldo/agendador-ia.env.$TS"
sed -i "s#^GAS_URL=.*#GAS_URL=$NUEVA#" agendador-ia.env
rm -rf "respaldo/google-viejo-$TS" && mv google "respaldo/google-viejo-$TS" && mv google-nuevo google
rm -rf "respaldo/clasp-viejo-$TS" && mv clasp "respaldo/clasp-viejo-$TS" && mv clasp-nuevo clasp
echo "DEPLOY_ID=$DEP" > google/despliegue.env
sudo docker compose up -d agendador-ia --force-recreate >/dev/null 2>&1
python3 - "$NUEVA" <<'EOP'
import sys, json, base64, io, zipfile, urllib.request
sys.path.insert(0, '.'); import cartero as c
nueva = sys.argv[1]
if not c.GH_TOKEN: print('⚠️ Sin token de GitHub: cambia API_URL en config.js a ' + nueva + ' (o pídeme el zip de la página)'); sys.exit(0)
s, r = c.gh('GET', '/contents/config.js?ref=' + c.GH_RAMA)
txt = base64.b64decode(r['content']).decode('utf-8')
import re
nuevo = re.sub(r'export const API_URL = "[^"]*";', 'export const API_URL = "' + nueva + '";', txt)
if nuevo == txt: print('⚠️ No encontré API_URL en config.js'); sys.exit(0)
b = io.BytesIO(); z = zipfile.ZipFile(b, 'w'); z.writestr('config.js', nuevo); z.close()
print(c.subir_web('config.js (servidor nuevo)', b.getvalue()))
EOP
echo
echo "🎉 LISTO: el agendador ya usa el servidor del Gmail nuevo ($NUEVA)."
echo "   ⚠️ IMPORTANTE, en la cuenta VIEJA (alex88ruizc), proyecto del agendador › ⏰ Activadores › BORRA todos"
echo "      (si no, los recordatorios y vencimientos corren dos veces). No borres el proyecto: queda de respaldo."
echo "   📧 Si usas el pago automático de planes por Bre-B: en el Gmail donde llegan los avisos de Nequi crea un filtro que los"
echo "      REENVÍE al Gmail nuevo (el servidor lee los avisos en su propia cuenta)."
echo "   📨 Si los correos salían desde citas@tuagenda.vip: agrégalo en el Gmail NUEVO › Configuración › Cuentas › «Enviar correo como»."
echo "   ↩️ Para volver al de antes: los respaldos están en ~/agendador/respaldo/*-$TS"
