#!/bin/bash
# ⬆️ ACTUALIZAR EL AGENDADOR IA sin tocar su configuración. Lo corre el cartero de Telegram (o a mano: bash ~/agendador/actualizar.sh)
#    1) Construye la versión nueva  2) banco de pruebas: si una falla NO se instala  3) si no arranca, vuelve sola a la anterior
#    4) si el zip trae google/*.gs, los sube al Apps Script del agendador (actualizar-google.sh)
cd "$(dirname "$0")" || exit 1
# 1.8: Mary se calla 15 min cuando el dueño escribe (antes 12 h) y no repite lo mismo en 15 min (antes 30). Se pasan los valores viejos solos.
if [ -f agendador-ia.env ]; then sed -i 's/^SILENCIO_MIN=30$/SILENCIO_MIN=15/; /^HUMANO_HORAS=/d' agendador-ia.env; grep -q '^HUMANO_MIN=' agendador-ia.env || echo 'HUMANO_MIN=15' >> agendador-ia.env; fi
IMG=agendador-ia-agendador-ia
# 2.9: limpia el negocio falso «default» que se creó al vincular por WAHA (solo en el negocios.json del agendador)
[ -f negocios.json ] && python3 - <<'EOL'
import json
try: L = json.load(open('negocios.json'))
except Exception: L = None
if isinstance(L, list):
    N = [x for x in L if not (x.get('bid') == 'default' and x.get('instancia') == 'default')]
    if len(N) != len(L): json.dump(N, open('negocios.json', 'w'), ensure_ascii=False, indent=2); print('🧹 Quité el negocio falso «default» de negocios.json')
EOL
# 3.33 · 🧹 contenedores temporales del agendador que hayan quedado colgados (SOLO los nuestros: agendador-tmp-…; nunca otro proyecto)
T=$(sudo docker ps -aq --filter name=^agendador-tmp- 2>/dev/null; sudo docker ps -aq --filter name=^agendador-tarea- 2>/dev/null); [ -n "$T" ] && sudo docker rm -f $T >/dev/null 2>&1 && echo "🧹 Quité contenedores temporales del agendador que habían quedado colgados."
CODIGOS="principal.js textos.js correo.js estado.js asistente.js cuposLocal.js guia.js push.js soporte.js fuentes package.json package-lock.json Dockerfile docker-compose.yml banco"
volver(){ for f in $CODIGOS; do [ -e "respaldo/$f" ] && cp -rf "respaldo/$f" .; done
  sudo docker image inspect $IMG:buena >/dev/null 2>&1 && sudo docker tag $IMG:buena $IMG:latest; }   # 1.1: la imagen vuelve a la buena (no queda la que falló)
sudo docker image inspect $IMG:latest >/dev/null 2>&1 && sudo docker tag $IMG:latest $IMG:buena
sudo nice -n 19 docker compose build agendador-ia >/dev/null 2>&1 || { echo "❌ No se pudo construir la versión nueva. Sigue la de antes."; volver; exit 1; }
B=$(sudo docker compose run --rm -T --no-deps --name agendador-tarea-banco-$$ tarea-banco timeout 600 sh -c 'mkdir -p /datos && node --test banco/pruebas.js banco/escenarios.js' 2>&1)
if ! echo "$B" | grep -q '^# fail 0'; then echo "$B" | grep -E '^not ok|Error' | head
  echo "❌ La versión nueva NO pasó el banco de pruebas. No la instalé: sigue la de antes."; volver; exit 1; fi
# 2.8 · REGLA N.º 1: si algún script del paquete tocaría un contenedor ajeno (Epic u otro), NO se instala
RG=$(sudo docker compose run --rm -T --no-deps --name agendador-tarea-reglas-$$ -v "$(pwd)":/p:ro tarea-banco timeout 300 node --test /p/banco/reglas.js 2>&1)
if ! echo "$RG" | grep -q '^# fail 0'; then echo "$RG" | grep -E '→' | head -5
  echo "🚫 Esta versión tocaría otro proyecto (regla N.º 1: Epic no se toca). No la instalé: sigue la de antes."; volver; exit 1; fi
echo "🧪 Banco de pruebas OK ($(echo "$B" | grep -o '^# pass [0-9]*' | cut -d' ' -f3) pruebas)"
sudo docker compose up -d agendador-ia --force-recreate >/dev/null 2>&1
OK=0; for i in $(seq 1 30); do curl -s -m 3 http://127.0.0.1:3070/salud | grep -q '"ok":true' && { OK=1; break; }; sleep 2; done
if [ $OK = 1 ]; then mkdir -p respaldo && for f in $CODIGOS; do [ -e "$f" ] && cp -rf "$f" respaldo/; done; echo "✅ Agendador IA: $(curl -s -m 3 http://127.0.0.1:3070/salud | grep -o '"version":"[^"]*"')"
else echo "❌ La versión nueva no arrancó. Vuelvo a la anterior…"; volver; sudo docker compose up -d agendador-ia --force-recreate >/dev/null 2>&1; exit 1; fi
# 3.13 · 👂 el oído del agendador (se construye en segundo plano: la primera vez tarda unos minutos y baja el modelo de voz)
if [ -d oido ]; then (nohup sudo nice -n 19 docker compose up -d --build oido-agendador >/tmp/oido-agendador.log 2>&1 &); echo "👂 Oído: instalando/actualizando en segundo plano (la primera vez ~5-10 min). Mira /estado."; fi
if ls gs/*.gs >/dev/null 2>&1; then bash actualizar-google.sh; fi
# 3.35 · reglas del servidor: al terminar, «docker ps -a» sin contenedores sueltos ni detenidos del agendador
Q=$(sudo docker ps -a --filter name=^agendador-tarea- --format '{{.Names}}' 2>/dev/null; sudo docker ps -a --filter status=exited --format '{{.Names}}' 2>/dev/null | grep -E '^(agendador-ia|evolution-agendador|postgres-agendador|waha-agendador|oido-agendador)$')
if [ -z "$Q" ]; then echo "🧹 docker ps -a: limpio (sin tareas sueltas ni contenedores del agendador detenidos)."; else echo "⚠️ docker ps -a: quedó del agendador: $Q"; fi
