#!/bin/bash
# 👩‍💼 INSTALAR EL AGENDADOR IA (una sola vez). Uso:  mkdir -p ~/agendador && unzip -o agendador-ia-*.zip -d ~/agendador && bash ~/agendador/instalar.sh
#    TODO APARTE DE EPIC: su propio Evolution (puerto 8095), su base de datos y su red «agendador-red». De Epic solo se LEE qué versión de Evolution usas.
cd "$(dirname "$0")" || exit 1
command -v docker >/dev/null || { echo "❌ No encontré Docker."; exit 1; }
mkdir -p datos; [ -f negocios.json ] || echo "[]" > negocios.json
# 1) Imagen de Evolution: la MISMA versión que ya te funciona en Epic (solo se lee; no se toca nada de Epic)
if [ ! -f .env ]; then
  IMG=$(sudo docker inspect evolution -f '{{.Config.Image}}' 2>/dev/null); IMG=${IMG:-atendai/evolution-api:v2.2.3}
  PG=$(head -c 24 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 24)
  { echo "EVO_IMAGEN=$IMG"; echo "PG_CLAVE=$PG"; } > .env; chmod 600 .env
  echo "🐳 Evolution de Mary del agendador: $IMG (aparte del de Epic)"
fi
. ./.env
# 2) Evolution propio
if [ ! -f evolution-agendador.env ]; then
  EK=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)
  cat > evolution-agendador.env <<EOV
SERVER_URL=http://127.0.0.1:8095
AUTHENTICATION_API_KEY=$EK
DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://evolution:$PG_CLAVE@postgres-agendador:5432/evolution?schema=public
DATABASE_CONNECTION_CLIENT_NAME=agenda
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=false
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=true
DATABASE_SAVE_DATA_CHATS=false
CACHE_REDIS_ENABLED=false
CACHE_LOCAL_ENABLED=true
CONFIG_SESSION_PHONE_CLIENT=Tu Agenda
CONFIG_SESSION_PHONE_NAME=Chrome
DEL_INSTANCE=false
QRCODE_LIMIT=30
LOG_LEVEL=ERROR,WARN
LANGUAGE=es
EOV
  chmod 600 evolution-agendador.env
fi
EK=$(grep -m1 '^AUTHENTICATION_API_KEY=' evolution-agendador.env | cut -d= -f2-)
# 3) Datos de Mary
if [ ! -f agendador-ia.env ]; then
  G0=https://script.google.com/macros/s/AKfycbyRSqnsiFCE402uiML6Su3ECC4YxYKXDTilLmzA1Zvsq4UA5PvyxGZmpb8tN_3L_E1DXQ/exec
  echo; echo "🔗 URL del servidor del agendador (Enter = la de tuagenda.vip):"; read -r GAS; GAS=${GAS:-$G0}
  MK=$(head -c 32 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 32)   # la clave de Mary: el VPS la sube solo a Google (actualizar-google.sh)
  echo "📱 Tus números de prueba (con 57, separados por coma). Mary SOLO les responde a ellos hasta que pongas MARY_MODO=todos:"; read -r NUMS
  { echo "GAS_URL=$GAS"; echo "MARY_KEY=$MK"; echo "EVO_KEY=$EK"; echo "MARY_MODO=prueba"; echo "MARY_PRUEBA=$NUMS"; echo "SILENCIO_MIN=15"; echo "HUMANO_MIN=15"; } > agendador-ia.env
  chmod 600 agendador-ia.env
fi
# 4) Construir, PROBAR y encender
echo "🐳 Construyendo (la primera vez tarda 2-3 min)…"
sudo docker compose build agendador-ia >/dev/null || { echo "❌ No se pudo construir."; exit 1; }
B=$(sudo docker run --rm --network none agendador-ia-agendador-ia sh -c 'mkdir -p /datos && node --test banco/pruebas.js' 2>&1)
echo "$B" | grep -q '^# fail 0' || { echo "$B" | grep -E '^not ok|Error' | head; echo "❌ El banco de pruebas falló. No encendí nada."; exit 1; }
echo "🧪 Banco de pruebas OK ($(echo "$B" | grep -o '^# pass [0-9]*' | cut -d' ' -f3) pruebas)"
sudo docker compose up -d || { echo "❌ No encendió: sudo docker compose -f ~/agendador/docker-compose.yml logs --tail 40"; exit 1; }
for i in $(seq 1 40); do curl -s -m 3 http://127.0.0.1:3070/salud | grep -q '"ok":true' && break; sleep 2; done
for i in $(seq 1 40); do curl -s -m 3 -H "apikey: $EK" http://127.0.0.1:8095/instance/fetchInstances >/dev/null 2>&1 && break; sleep 3; done
echo "✅ Mary del agendador encendida: $(curl -s -m 3 http://127.0.0.1:3070/salud)"
echo; echo "👉 Ahora conecta el WhatsApp de cada negocio:  bash ~/agendador/conectar.sh <identificador-del-negocio> [celular con 57]"
# 5) Telegram y Google (una sola vez): después TODO se actualiza mandándole archivos a tu bot
echo; echo "📬 Ahora el cartero de Telegram (para actualizar todo sin volver a entrar aquí)…"; bash instalar-cartero.sh
echo; echo "☁️  Y Google (para que el Apps Script del agendador también se actualice desde aquí)…"; bash instalar-google.sh
echo; echo "🎉 Listo. Desde ahora: mándale a tu bot agendador-ia-….zip o agendador-web-….zip y él instala todo."
