#!/bin/bash
# 🔌 MARY CON SU PROPIO WAHA (2.6). Uso: bash ~/agendador/configurar-waha.sh
#    ⚖️ REGLA: el agendador NUNCA toca otro proyecto (Epic ni ninguno). Solo usa SU contenedor «waha-agendador».
#       De otro WAHA, a lo sumo LEE qué versión usa, para copiarla. No lo une a su red, no le cambia avisos, no lo reinicia.
#    1) deshace lo de la 2.2 (si un contenedor ajeno quedó en la red del agendador, se saca, sin reiniciarlo)
#    2) enciende waha-agendador  3) vincula el WhatsApp del negocio con un código de 8 letras  4) Mary queda atendiendo
cd "$(dirname "$0")" || exit 1
NUESTROS=" agendador-ia evolution-agendador postgres-agendador waha-agendador "
# 1) la red del agendador es solo del agendador
for C in $(sudo docker network inspect agendador-red -f '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null); do
  case "$NUESTROS" in *" $C "*) ;; *) sudo docker network disconnect agendador-red "$C" >/dev/null 2>&1 && echo "↩️  Saqué «$C» de la red del agendador (no es del agendador; no lo reinicié ni le cambié nada)." ;; esac
done
# 2) WAHA propio: misma versión que ya te funciona (solo se LEE el nombre de la imagen), clave nueva solo suya
touch .env; chmod 600 .env
if ! grep -q '^WAHA_IMAGEN=' .env; then
  IMG=$(sudo docker ps --format '{{.Image}}' | grep -m1 -i 'devlikeapro/waha'); IMG=${IMG:-devlikeapro/waha:arm}
  echo "WAHA_IMAGEN=$IMG" >> .env
fi
grep -q '^WAHA_CLAVE=' .env || echo "WAHA_CLAVE=$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')" >> .env
. ./.env
echo "🆕 Encendiendo el WAHA propio del agendador ($WAHA_IMAGEN)…"
sudo docker compose up -d waha-agendador >/tmp/waha-agendador.log 2>&1 || { echo "❌ No encendió:"; tail -5 /tmp/waha-agendador.log; exit 1; }
sed -i '/^WAHA_URL=/d;/^WAHA_KEY=/d' agendador-ia.env
{ echo "WAHA_URL=http://waha-agendador:3000"; echo "WAHA_KEY=$WAHA_CLAVE"; } >> agendador-ia.env
sed -i '/^WA_MOTOR=/d' agendador-ia.env   # los que conectan desde el panel siguen por el Evolution del agendador
sudo docker compose up -d agendador-ia --force-recreate >/dev/null 2>&1
for i in $(seq 1 30); do curl -s -m 3 http://127.0.0.1:3070/salud | grep -q '"ok":true' && break; sleep 2; done
api(){ sudo docker exec agendador-ia node -e "fetch('http://waha-agendador:3000'+process.argv[1],{method:process.argv[2]||'GET',headers:{'X-Api-Key':process.env.WAHA_KEY,'Content-Type':'application/json'},body:process.argv[3]||undefined}).then(r=>r.text()).then(t=>console.log(t)).catch(e=>console.log('ERROR '+e.message))" "$@"; }
for i in $(seq 1 30); do api /api/sessions?all=true | grep -q '^\[' && break; sleep 3; done
api /api/sessions?all=true | grep -q '^\[' || { echo "❌ El WAHA del agendador no responde: sudo docker logs waha-agendador --tail 30"; exit 1; }
echo "✅ WAHA del agendador encendido."
# 3) el negocio
echo; read -r -p "Identificador del negocio (lo que va después de ?b= en su enlace, ej. studio-lua): " B
echo "$B" | grep -qE '^[a-z0-9][a-z0-9-]{1,29}$' || { echo "❌ «$B» no es válido."; exit 1; }
read -r -p "Número de WhatsApp del negocio, con 57 (ej. 573001234567): " TEL; TEL=$(echo "$TEL" | tr -cd '0-9')
[ ${#TEL} -ge 11 ] || { echo "❌ Número incompleto."; exit 1; }
CONF='{"name":"default","start":true,"config":{"webhooks":[{"url":"http://agendador-ia:3060/webhook","events":["message.any","session.status"]}]}}'
if api /api/sessions/default | grep -q '"name"'; then api /api/sessions/default PUT "$CONF" >/dev/null; api /api/sessions/default/start POST >/dev/null
else api /api/sessions POST "$CONF" >/dev/null; fi
ST=""; for i in $(seq 1 20); do ST=$(api /api/sessions/default | grep -oE '"status":"[A-Z_]+"' | head -1 | cut -d'"' -f4); [ "$ST" = SCAN_QR_CODE ] || [ "$ST" = WORKING ] && break; sleep 3; done
if [ "$ST" != WORKING ]; then
  R=$(api /api/default/auth/request-code POST "{\"phoneNumber\":\"$TEL\"}")
  COD=$(echo "$R" | grep -oE '"code":"[^"]+"' | cut -d'"' -f4)
  [ -n "$COD" ] || { echo "❌ WAHA no dio el código: ${R:0:200}"; exit 1; }
  echo; echo "🔢 CÓDIGO:  $COD"
  echo "   En el WhatsApp del negocio: ⋮ › Dispositivos vinculados › Vincular un dispositivo › «Vincular con número de teléfono» y escribe el código."
  echo "   (Tiene unos minutos. Espero aquí…)"
  for i in $(seq 1 100); do ST=$(api /api/sessions/default | grep -oE '"status":"[A-Z_]+"' | head -1 | cut -d'"' -f4); [ "$ST" = WORKING ] && break; sleep 3; done
fi
[ "$ST" = WORKING ] || { echo "❌ No se vinculó (estado: $ST). Corre otra vez el script para pedir otro código."; exit 1; }
echo "✅ WhatsApp vinculado al WAHA del agendador."
python3 - "$B" <<'EOP'
import json, sys
b = sys.argv[1]
try: L = json.load(open('negocios.json'))
except Exception: L = []
for x in L:
    if x.get('motor') == 'waha' and x.get('sesion') == 'default' and x.get('bid') != b: x['activo'] = False   # una sola sesión «default»
n = next((x for x in L if x.get('bid') == b), None)
if not n: n = {"bid": b, "recordatorioMin": 120, "estados": {"activo": True, "hoy": "07:30", "semana": "07:00", "semanaDia": 1}}; L.append(n)
n.update({"instancia": b, "motor": "waha", "sesion": "default", "activo": True})
json.dump(L, open('negocios.json', 'w'), ensure_ascii=False, indent=2); print("📒 negocios.json: «%s» usa el WAHA del agendador" % b)
EOP
M=$(grep -m1 '^MARY_MODO=' agendador-ia.env | cut -d= -f2)
echo "🧪 Mary está en modo «$M»$( [ "$M" = prueba ] && echo ": SOLO responde a $(grep -m1 '^MARY_PRUEBA=' agendador-ia.env | cut -d= -f2)")."
read -r -p "¿Abrir Mary a TODOS los clientes? (s/N): " TO
[ "$TO" = "s" ] || [ "$TO" = "S" ] && sed -i 's/^MARY_MODO=.*/MARY_MODO=todos/' agendador-ia.env
sudo docker compose up -d agendador-ia --force-recreate >/dev/null 2>&1
for i in $(seq 1 20); do curl -s -m 3 http://127.0.0.1:3070/salud | grep -q '"ok":true' && break; sleep 2; done
echo; echo "✅ Listo: $(curl -s -m 3 http://127.0.0.1:3070/salud | grep -oE '"version":"[^"]*"|"modo":"[^"]*"' | tr '\n' ' ')"
echo "👉 Escríbele «hola» al negocio desde tu número de prueba y mira:  curl -s 127.0.0.1:3070/registro?n=5"
