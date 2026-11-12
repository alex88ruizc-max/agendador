#!/bin/bash
# ☁️ SUBIR EL APPS SCRIPT DEL AGENDADOR desde el VPS (lo llama actualizar.sh). Misma URL /exec: no hay que cambiar nada en la página.
#    1) baja lo que hay hoy en Google (por si cambiaste algo a mano)  2) respaldo  3) pone encima los archivos nuevos de gs/
#    4) sube  5) publica una versión nueva en la MISMA implementación  6) comprueba que responde
cd "$(dirname "$0")" || exit 1
[ -s clasp/.clasprc.json ] && [ -f google/.clasp.json ] || { echo "ℹ️  Google no está autorizado todavía: bash ~/agendador/instalar-google.sh"; exit 0; }
C(){ sudo docker run --rm -v "$(pwd)/google:/w" -v "$(pwd)/clasp:/root" -w /w node:22-slim npx -y @google/clasp@3.4.1 "$@"; }
# 2.3: nuestros archivos se quitan antes de bajar (Google los devuelve como .js y con los .gs locales choca: «Conflicting files found»)
rm -f google/mary.gs google/mary.js google/correo.gs google/correo.js google/mary-clave.gs google/mary-clave.js
C pull >/tmp/agendador-pull.log 2>&1 || { echo "❌ Google: no pude bajar el proyecto:"; tail -4 /tmp/agendador-pull.log | sed 's/^/   /'; grep -qiE 'invalid_grant|unauthorized|login' /tmp/agendador-pull.log && echo "   🔑 Vuelve a autorizar: bash ~/agendador/instalar-google.sh"; exit 1; }
for f in google/*.gs; do [ -f "${f%.gs}.js" ] && rm -f "$f"; done   # si quedó el mismo archivo en .gs y .js, se deja el que acaba de bajar
sudo chown -R "$(id -u):$(id -g)" google
R=respaldo/google-$(date +%Y%m%d-%H%M); mkdir -p "$R" && cp -f google/*.gs google/*.js google/*.json "$R"/ 2>/dev/null
for f in gs/*.gs; do b=$(basename "$f" .gs); rm -f "google/$b.js"; cp -f "$f" "google/$b.gs"; done
KEY=$(grep -m1 '^MARY_KEY=' agendador-ia.env | cut -d= -f2-); rm -f google/mary-clave.js
printf "// Generado por el VPS (actualizar-google.sh). Clave entre el Agendador IA del VPS y este servidor. No la compartas.\nconst MARY_CLAVE = '%s';\n" "$KEY" > google/mary-clave.gs   # clasp guarda .gs o .js según la versión: se deja uno solo
# 📑 orden de carga en Google: primero lo del proyecto, al final los complementos (así correo.gs reemplaza al correo viejo y Mary se registra bien)
python3 - <<'EOP'
import json, os
f = 'google/.clasp.json'; c = json.load(open(f))
nuestros = ['mary-clave.gs'] + sorted(os.path.basename(x) for x in os.listdir('gs') if x.endswith('.gs'))
suyos = sorted(x for x in os.listdir('google') if x.endswith(('.gs', '.js')) and x not in nuestros)
c['filePushOrder'] = suyos + [x for x in nuestros if os.path.exists('google/' + x)]
json.dump(c, open(f, 'w'), indent=2)
EOP
C push --force >/dev/null 2>&1 || { echo "❌ Google: no pude subir. Vuelvo al respaldo $R"; cp -f "$R"/* google/ 2>/dev/null; C push --force >/dev/null 2>&1; exit 1; }
DEP=$(grep -m1 '^DEPLOY_ID=' google/despliegue.env 2>/dev/null | cut -d= -f2)
V=$(grep -ho "MARY_VERSION = '[^']*'" gs/*.gs | head -1 | cut -d"'" -f2)
if [ -n "$DEP" ]; then C deploy -i "$DEP" -d "${V:-actualización} por Telegram" >/dev/null 2>&1 || { echo "❌ Google: subí el código pero no pude publicar la versión nueva."; exit 1; }; fi
URL=$(grep -m1 '^GAS_URL=' agendador-ia.env | cut -d= -f2-); KEY=$(grep -m1 '^MARY_KEY=' agendador-ia.env | cut -d= -f2-)
NEG=$(python3 -c 'import json;L=json.load(open("negocios.json"));print(L[0]["bid"] if L else "")' 2>/dev/null)
if [ -n "$NEG" ]; then R2=$(curl -sL -m 60 -H 'Content-Type: text/plain' -d "{\"action\":\"mary\",\"businessId\":\"$NEG\",\"key\":\"$KEY\",\"op\":\"info\"}" "$URL")
  echo "$R2" | grep -q "\"version\":\"$V\"" && echo "☁️  Google al día: $V (respondió bien)" || echo "⚠️ Google: subido, pero la prueba respondió: ${R2:0:200}"
else echo "☁️  Google al día: ${V:-subido} (sin negocio conectado para probar)"; fi
