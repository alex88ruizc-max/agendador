#!/bin/bash
# 🔑 AUTORIZAR GOOGLE (una sola vez): después, el Apps Script del agendador se actualiza solo desde el VPS (por Telegram).
#    Usa clasp (la herramienta oficial de Google) dentro de Docker: no instala nada en el VPS. Uso: bash ~/agendador/instalar-google.sh
cd "$(dirname "$0")" || exit 1
CLASP="sudo docker run --rm -i -v $(pwd)/google:/w -v $(pwd)/clasp:/root -w /w node:22-slim npx -y @google/clasp@3.4.1"
mkdir -p google clasp
echo "PASO 1 · En tu PC abre  https://script.google.com/home/usersettings  (con la cuenta dueña del agendador)"
echo "         y ACTIVA «API de Google Apps Script». Enter cuando esté listo."; read -r _
if [ ! -s clasp/.clasprc.json ]; then
  echo "PASO 2 · Ahora sale un enlace largo. Ábrelo en tu PC, elige tu cuenta y toca «Permitir»."
  echo "         Al final el navegador va a una página que NO carga (localhost…). Copia esa dirección COMPLETA y pégala aquí."
  sudo docker run --rm -it -v "$(pwd)/clasp:/root" node:22-slim npx -y @google/clasp@3.4.1 login --no-localhost || { echo "❌ No quedó autorizado. Vuelve a correr este instalador."; exit 1; }
  sudo chown -R "$(id -u):$(id -g)" clasp
fi
[ -s clasp/.clasprc.json ] || { echo "❌ No quedó autorizado."; exit 1; }
echo "✅ Google autorizado."
if [ ! -f google/.clasp.json ]; then
  echo "PASO 3 · En script.google.com abre el proyecto del AGENDADOR › ⚙️ Configuración del proyecto › copia el «ID de la secuencia de comandos»:"
  read -r SID; SID=$(echo "$SID" | tr -dc 'A-Za-z0-9_-')
  sudo docker run --rm -v "$(pwd)/google:/w" -v "$(pwd)/clasp:/root" -w /w node:22-slim npx -y @google/clasp@3.4.1 clone "$SID" >/dev/null 2>&1 || { echo "❌ No pude bajar el proyecto $SID (¿ID correcto? ¿API activada?)."; exit 1; }
  sudo chown -R "$(id -u):$(id -g)" google
fi
# La implementación (la URL /exec que usan la página y Mary) se saca sola de GAS_URL: …/macros/s/<ID>/exec
DEP=$(grep -m1 '^GAS_URL=' agendador-ia.env 2>/dev/null | sed -E 's#.*/macros/s/([^/]+)/exec.*#\1#')
[ -n "$DEP" ] && echo "DEPLOY_ID=$DEP" > google/despliegue.env
echo "✅ Proyecto del agendador listo en ~/agendador/google ($(ls google/*.gs google/*.js 2>/dev/null | wc -l) archivos). Implementación: ${DEP:-¿?}"
echo "   Desde ahora, cuando me mandes agendador-ia-….zip por Telegram, el Apps Script también se actualiza (misma URL /exec)."
