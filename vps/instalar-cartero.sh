#!/bin/bash
# 📬 INSTALAR EL CARTERO DEL AGENDADOR (una vez): con esto, todo se actualiza mandándole archivos a un bot de Telegram, como en Epic.
#    Usa un BOT NUEVO, solo del agendador (no el de Epic, no el de avisos del agendador). Uso: bash ~/agendador/instalar-cartero.sh
cd "$(dirname "$0")" || exit 1
if [ ! -f cartero.env ]; then
  echo "1) En Telegram abre @BotFather › /newbot › ponle un nombre (ej. «Agenda VPS») › copia el TOKEN."
  read -r -p "   Pega el token: " TK
  echo "2) Abre tu bot nuevo en Telegram y escríbele «hola». Te espero…"
  CH=""; for i in $(seq 1 60); do CH=$(curl -s "https://api.telegram.org/bot$TK/getUpdates" | python3 -c 'import sys,json; r=json.load(sys.stdin).get("result",[]); print(r[-1]["message"]["chat"]["id"] if r and "message" in r[-1] else "")' 2>/dev/null); [ -n "$CH" ] && break; sleep 3; done
  [ -n "$CH" ] || { echo "❌ No me llegó tu «hola». Vuelve a correr el instalador."; exit 1; }
  echo "   ✅ Tu chat: $CH (solo este chat puede mandarle órdenes al cartero)"
  echo "3) (Opcional, para subir la página) Token de GitHub: github.com › Settings › Developer settings › Fine-grained tokens ›"
  echo "   Repository access: solo alex88ruizc-max/agendador › Permissions › Contents: Read and write. Pégalo (o Enter para después):"
  read -r GH
  { echo "TG_TOKEN=$TK"; echo "TG_DUENO=$CH"; echo "GH_TOKEN=$GH"; echo "GH_REPO=alex88ruizc-max/agendador"; echo "GH_RAMA=main"; } > cartero.env; chmod 600 cartero.env
fi
sudo tee /etc/systemd/system/agendador-cartero.service >/dev/null <<EOS
[Unit]
Description=Cartero del agendador (actualizaciones por Telegram)
After=network-online.target docker.service
[Service]
User=$(id -un)
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/python3 $(pwd)/cartero.py
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOS
sudo systemctl daemon-reload && sudo systemctl enable --now agendador-cartero >/dev/null 2>&1 && sudo systemctl restart agendador-cartero
sleep 2; systemctl is-active --quiet agendador-cartero && echo "✅ Cartero encendido. Escríbele /estado a tu bot." || echo "❌ No arrancó: journalctl -u agendador-cartero -n 30"
