#!/bin/bash
# 📲 CONECTAR EL WHATSAPP DE UN NEGOCIO A MARY DEL AGENDADOR. Uso:  bash conectar.sh studio-lua 573001234567
#    Con el celular: sale un CÓDIGO de 8 letras → en el WhatsApp del negocio: Dispositivos vinculados › Vincular con número de teléfono.
#    Sin celular: guarda el QR en ~/agendador/datos/qr-<negocio>.png (y lo muestra si tienes qrencode).
cd "$(dirname "$0")" || exit 1
BID="$1"; NUM=$(echo "$2" | tr -dc '0-9')
echo "$BID" | grep -qE '^[a-z0-9][a-z0-9-]{1,29}$' || { echo "Uso: bash conectar.sh <identificador-del-negocio> [celular con 57]"; exit 1; }
EK=$(grep -m1 '^AUTHENTICATION_API_KEY=' evolution-agendador.env | cut -d= -f2-); EVO=http://127.0.0.1:8095
EXISTE=$(curl -s -H "apikey: $EK" "$EVO/instance/fetchInstances?instanceName=$BID" | grep -c "\"$BID\"")
if [ "$EXISTE" = "0" ]; then
  R=$(curl -s -X POST -H "apikey: $EK" -H 'Content-Type: application/json' $EVO/instance/create -d "{\"instanceName\":\"$BID\",\"integration\":\"WHATSAPP-BAILEYS\",\"qrcode\":true,\"rejectCall\":false,\"groupsIgnore\":true,\"alwaysOnline\":false,\"readMessages\":false,\"syncFullHistory\":false,\"webhook\":{\"url\":\"http://agendador-ia:3060/webhook\",\"byEvents\":false,\"base64\":true,\"events\":[\"MESSAGES_UPSERT\",\"CONNECTION_UPDATE\",\"QRCODE_UPDATED\"]}}")
  echo "$R" | grep -q "\"$BID\"" || { echo "❌ Evolution no creó la conexión: $(echo "$R" | head -c 300)"; exit 1; }
  echo "✅ Conexión «$BID» creada en el Evolution del agendador."
else
  curl -s -X POST -H "apikey: $EK" -H 'Content-Type: application/json' $EVO/webhook/set/$BID -d '{"webhook":{"enabled":true,"url":"http://agendador-ia:3060/webhook","byEvents":false,"base64":true,"events":["MESSAGES_UPSERT","CONNECTION_UPDATE","QRCODE_UPDATED"]}}' >/dev/null
fi
# el negocio entra a negocios.json (si no estaba)
python3 - "$BID" <<'EOP'
import json,sys
b=sys.argv[1]; L=json.load(open('negocios.json'))
if not any(x.get('bid')==b for x in L):
    L.append({"bid":b,"instancia":b,"activo":True,"recordatorioMin":120,"estados":{"activo":True,"hoy":"07:30","semana":"07:00","semanaDia":1}})
    json.dump(L,open('negocios.json','w'),ensure_ascii=False,indent=2); print("📒 Agregué «%s» a negocios.json" % b)
EOP
C=$(curl -s -H "apikey: $EK" "$EVO/instance/connect/$BID${NUM:+?number=$NUM}")
PC=$(echo "$C" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("pairingCode") or "")' 2>/dev/null)
echo "$C" | python3 -c 'import sys,json,base64; d=json.load(sys.stdin); b=(d.get("base64") or "").split(",")[-1]; open("datos/qr-'"$BID"'.png","wb").write(base64.b64decode(b)) if b else None' 2>/dev/null
if [ -n "$PC" ]; then echo; echo "🔢 CÓDIGO PARA VINCULAR: $PC"; echo "   En el WhatsApp del negocio: ⋮ › Dispositivos vinculados › Vincular dispositivo › Vincular con número de teléfono."; fi
if [ -s "datos/qr-$BID.png" ]; then echo "🖼  QR guardado en ~/agendador/datos/qr-$BID.png"; Q=$(echo "$C" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("code") or "")' 2>/dev/null); [ -n "$Q" ] && command -v qrencode >/dev/null && qrencode -t ANSIUTF8 "$Q"; fi
echo; echo "Revisa el estado:  curl -s -H \"apikey: $EK\" $EVO/instance/connectionState/$BID"
echo "Correo de pagos (opcional): agrega \"correo\" a «$BID» en ~/agendador/negocios.json (mira negocios.json.ejemplo). Mary lo relee sola."
