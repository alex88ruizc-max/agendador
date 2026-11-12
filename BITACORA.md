# 📒 Bitácora de Tu Agenda (tuagenda.vip)

> **Regla:** cada cambio al proyecto se anota aquí, en «Historial», el mismo día. Esto se hace antes de entregar el zip.
> Aquí se guarda todo lo que hay que saber para retomar el proyecto sin perder nada.
> Última actualización: **2026-11-12** · Mary **agendador-ia-3.24** · Página **2026-11-12h** · Servidor de Google **2026-10-10n** (cuenta nueva)

---

## 🚫 REGLA UNIVERSAL N.º 1 — EPIC NO SE TOCA (manda sobre todo lo demás)
**Epic** (Mary de Epic, Luisa, la tienda, epic-waha, epic-tiendas, Epic Channels y todo lo que sea de Epic) y **cualquier otro proyecto**:
- ✅ **Solo se puede COPIAR**: leer su código o su versión y hacer una copia propia del agendador, aparte y con su propio nombre.
- ❌ **JAMÁS se modifica**: ni sus contenedores, ni sus redes, ni sus webhooks, ni sus sesiones de WhatsApp, ni sus archivos, ni su base de datos, ni sus repositorios. Ni reiniciarlo, ni detenerlo, ni conectarlo o desconectarlo de nada.
- ❌ **Ni siquiera para «deshacer», «arreglar» o «limpiar»**. (El 2026-11-12 sacar `epic-waha` de una red «para deshacer» le cortó la conexión a la tienda de Epic.)
- ❌ Ningún script del agendador ejecuta comandos sobre contenedores o archivos que no sean del agendador (`agendador-ia`, `evolution-agendador`, `postgres-agendador`, `waha-agendador`, `oido-agendador`, `~/agendador`).
- 🛑 Si algún paso pudiera afectar a Epic, **se para y se le pregunta a Alex**. Solo Alex, con palabras explícitas, puede autorizar algo sobre Epic.
Ver también `CLAUDE.md` y `vps/LEEME.txt`.

---

## 🧭 Qué es
**Tu Agenda** es un agendador de citas por suscripción para cualquier tipo de negocio: uñas, pestañas, barbería, spa, consultorios…

- **Página del cliente:** categorías y cupos libres a la vista. Pide iniciar sesión con Google o con correo solo al momento de apartar. Cobra el abono.
- **Panel del dueño** (`admin.html`) y **panel de la plataforma** (`super.html`).
- **Mary** es la recepcionista de WhatsApp y vive en el VPS. **No tiene IA**: siempre responde con plantillas fijas.

---

## 🗺️ Dónde vive cada cosa
| Pieza | Dónde | Cómo se actualiza |
|---|---|---|
| Página tuagenda.vip | Este repo, en la raíz (GitHub Pages, rama `main`) | Zip `agendador-web-AAAA-MM-DDx.zip` → bot de Telegram «Agendador VPS» (el cartero) |
| Mary + cartero (VPS) | Código en `vps/` de este repo; en el VPS vive en `~/agendador` | Zip `agendador-ia-X.Y.zip` → mismo bot |
| Servidor de Google (Apps Script) | Cuenta **tuagenda.servidor@gmail.com**. Los complementos `vps/gs/mary.gs` y `correo.gs` los sube el VPS | Viajan en el zip de Mary (carpeta `gs/`) |
| Base de datos | Firebase / Firestore, proyecto `agendador-alex` | — |
| Mapa del código | `graphify-out/` (Graphify) | `graphify update .` después de cada cambio |

**VPS:** `ubuntu@168.138.128.157`. Desde PowerShell en el PC:
```powershell
$k = "C:\evolution\ssh-key-2026-10-29 (2).key"; $d = "ubuntu@168.138.128.157"
ssh -i $k $d
```

**Contenedores del agendador** (red `agendador-red`). Todos son propios; ninguno es de Epic.
- `agendador-ia`: Mary. Escucha en 127.0.0.1:3070, que adentro es el 3060.
- `evolution-agendador`: 127.0.0.1:8095.
- `postgres-agendador`.
- `waha-agendador`: 127.0.0.1:3080. Existe desde la 2.6 y lo enciende `configurar-waha.sh`.
- El cartero corre como servicio de systemd: `agendador-cartero`.

**Archivos clave en el VPS (`~/agendador`):**
- `agendador-ia.env`: modo de Mary, números de prueba, GAS_URL, claves.
- `negocios.json`: qué WhatsApp atiende Mary y con qué motor.
- `.env`: imágenes de Docker y claves internas.
- `cartero.env`: token de Telegram y de GitHub.
- `respaldo/`.

---

## 👩‍💼 Qué hace Mary (reglas actuales)
- **Cliente sin cita:** le manda el link para agendar y cuántos cupos quedan hoy.
- **Cliente con cita:** le muestra la cita con el link «Mi cita» para cambiarla o cancelarla, y el abono que falta si aplica.
- **Si el dueño escribe a mano** en un chat, Mary se calla **15 min** en ese chat.
- **Si el cliente tiene la cita confirmada**, solo responde a patrones: hola, buenas, confirmar, cancelar, cambiar, reagendar, pago, hora, código R-…
- **No repite** la misma respuesta en 15 min. Como máximo responde 2 veces seguidas lo mismo.
- **Captura del pago:** la cita pasa a «en revisión» y el dueño recibe la captura en Telegram con ✅ Aprobar / ❌ Rechazar. Después Mary le avisa al cliente.
- **Correo del banco (IMAP):** si un pago coincide con una cita, la confirma sola. Si tiene dudas, le avisa al dueño.
- **Estados de WhatsApp:** «Cupos de hoy» a las 7:30 y «Tu semana» los lunes.
- **Recordatorio** 2 h antes de cada cita.
- **Modos** (`MARY_MODO`):
  - `prueba`: solo atiende los números de `MARY_PRUEBA`.
  - `todos`: atiende a todos los clientes.
  - `apagado`: no hace nada.
- **Desde la 2.6, `/registro` dice por qué se calló.**

---

## 🧪 Bancos de pruebas (copia de la idea del banco de Epic; no usan nada de Epic)
- **`vps/banco/pruebas.js`:** prueba piezas sueltas (textos, correos, estados, reglas). 17 pruebas.
- **`vps/banco/escenarios.js`:** Mary completa con WhatsApp (WAHA y Evolution) y Google simulados. Manda avisos reales y revisa qué contestó. 18 escenarios.
- `actualizar.sh` corre los dos antes de instalar. **Si uno falla, no instala**, y si la versión nueva no arranca vuelve sola a la anterior.
- **`vps/banco/web.js`:** banco de la página, que el cartero corre antes de subir un zip de la página. Revisa:
  - errores de escritura en los `.js`;
  - que todos los `?v=` sean iguales a `APP_VERSION`;
  - que lo que importa o enlaza cada página exista;
  - que `API_URL` en `config.js` sea válida.

  **Si algo falla, no sube nada.**

**Antes de entregar cualquier zip:**
```bash
cd vps && node --test banco/pruebas.js banco/escenarios.js banco/reglas.js   # Mary + regla N.º 1
node vps/banco/web.js <carpeta con los archivos de la página>  # página
```

---

## ⏳ Pendientes
1. Instalar 3.1 + página 2026-11-12b y probar el agendamiento por listas con El Barba (tu 318) desde el número aparte. Luego `MARY_MODO=todos`.
   Verificar en un celular real: que la lista llegue por WAHA (si no, sale el texto con números) y que la invitación entre al calendario.
   El panel guarda `maryReminderMinutes` en settings: confirmar que las reglas de Firestore lo dejan guardar.
8. ✅ Oído probado con una nota de voz real (3.17/3.18).
2. Que el panel conecte por WAHA (hoy conecta por Evolution). WAHA gratis = 1 WhatsApp: para varios negocios, arreglar Evolution o WAHA Plus.
3. Generar la APK con `/apk` en el bot. Falta confirmar si ya se hizo.
4. **Rotar secretos** que quedaron expuestos en chats anteriores:
   - llave de la cuenta de servicio de Firebase (id 0dd1d316…);
   - token del bot de Telegram del agendador (8454986905:…);
   - secreto de la app de Meta.
5. Borrar el proyecto viejo de Apps Script en la cuenta alex88ruizc cuando lleve 2 o 3 semanas sin uso. Los activadores ya se borraron.
6. Opcional: agregar «Enviar correo como» `citas@tuagenda.vip` en el Gmail nuevo. Quedó con error de autenticación SMTP y se dejó para después.
7. Problema de estados de **Luisa (Epic)**: le llegan a solo 3 o 4 personas. Es del proyecto Epic, así que **no se toca** sin permiso explícito de Alex.

---

## 📜 Historial (lo más nuevo arriba)

### 2026-11-12 · agendador-ia-3.24 · ley /sinbot
- `atenderMensaje`: `esSinbot()` antes de todo: del dueño → `MEM.sinbot[k]` (mudo, persistente); otro /sinbot (dueño o cliente) lo
  quita. `mudo(k)` corta respuestas, recordatorios y citas dobles. /sinbot no cuenta como «el dueño escribió» y no se agrupa.
- Banco: 116 pruebas.

### 2026-11-12 · agendador-ia-3.23 · el panel manda (lectura directa de la base)
- Prueba real: Alex apagó todo en «WhatsApp Bot» y el asistente siguió respondiendo; el panel decía «No hay conexión con el servidor»
  (servidor de Google con problemas → el VPS nunca recibía la configuración nueva, que solo llegaba en respuestas de Google).
- `principal.js`: `botDesdeBase()` lee `businesses/<bid>/settings/general` (maryBot, maryReminderMinutes) por REST con la llave web
  (es lectura pública, igual que la página de clientes); `botAlDia()` antes de cada mensaje, recordatorios y estados (≤ 60 s);
  `botNormal()` = mismos defaults que `maryBotCfg_`. `gas()` ya no pisa lo leído de la base.
- PENDIENTE: averiguar por qué el panel no conecta con el servidor de Google (desvincular, guardar). Pedido a Alex: curl a GAS_URL.
- Banco: 113 pruebas (mutación hecha quitando la lectura directa).

### 2026-11-12 · agendador-ia-3.22 · fechas en palabras
- Prueba real: audios pidiendo otra fecha recibían «mañana a las 2:00» otra vez. Causa probable: el oído escribe números en palabras;
  `fechaPedida` no la entendía y la oferta reusaba `conv.date`. `conNumeros()` (palabras → números) en `fechaPedida`/`horaPedida`;
  orden nuevo: hoy/mañana/pasado → número de día (dd/mm, «15 de noviembre», «el 15», «lunes 17») → día de la semana.
- El panel mostró «No hay conexión con el servidor» en WhatsApp Bot (pendiente revisar con Alex).
- Banco: 110 pruebas.

### 2026-11-12 · página 2026-11-12h · 🗓️ sección «Cupos»
- `admin.js`: pestaña `cupos` («Cupos», `fa-table-cells`): `abrirCupos()` escucha en vivo `slotLocks` y `appointments` del día;
  `estadoCupos()` arma cada hora del horario (paso = `slotDurationMinutes`) como libre / ocupado / bloqueado / descanso / ya pasó;
  toques → `bloqueo()` (servidor 3.20). Vista previa hecha con las funciones reales del panel (`/home/user/cupos-vista.png`).

### 2026-11-12 · agendador-ia-3.20 · 🔒 bloquear cupos
- `mary.gs` `ACTIONS.bloquearCupo` {date, times[], accion}: crea `slotLocks` state `block` (+ `bloqueo` = hora del cupo) para cada
  profesional activo (o solo el propio si no es dueño), sin pisar lo ocupado; desbloquear borra los `block` de esas horas.
  Ninguna limpieza del servidor borra estos bloqueos. Página, asistente (GAS `maryLibres_`/`maryCupos_`) y estados ya los respetan.
- `admin.js` (Agenda › Cupos libres): botón «🔒 Bloquear» (modo), «Bloquear todo el día», sección «🔒 Bloqueados por ti» (toca para liberar).
- Banco: 108 pruebas (la nueva carga `mary.gs` real con Firestore simulado).

### 2026-11-12 · agendador-ia-3.19 · ✅ oído funcionando
- Prueba real: /registro «🎤 escuché: «Hola, tiene cita para mañana a las 2 de la tarde.»» → «Sí, tengo un cupo mañana a las 2:00 p. m.
  ¿Lo vas a apartar?» con Sí, apártalo / Otra hora. ~8 s desde que llegó el audio.
- Arreglo de texto: sin doble punto después de «p. m.». Banco: 107 pruebas.

### 2026-11-12 · agendador-ia-3.18 · /auditoria (Epic no tocado)
- Alex pidió verificar que el oído no afecta a Epic. Revisión: nada del agendador modifica Epic; único incidente fue el de 2.2–2.7
  (ya corregido). El oído comparte CPU/RAM del VPS (límite 2 núcleos / 1,5 GB).
- Verificado por Alex en el VPS: `agendador-red` = agendador-ia, waha-agendador, postgres-agendador, oido-agendador, evolution-agendador (nada de Epic).
- `cartero.py`: `/auditoria` (solo `docker network inspect / ps / inspect / port / stats`) + auditoría automática tras cada instalación.

### 2026-11-12 · agendador-ia-3.17 · arreglo del oído
- /registro real: «🎤 el oído no pudo: open() got an unexpected keyword argument 'metadata_errors'». Reproducido aquí: faster-whisper
  1.1.1 y 1.2.1 llaman `av.open(..., metadata_errors=...)`, que PyAV 19 ya no tiene. `vps/oido/Dockerfile`: faster-whisper 1.2.1 +
  av 15.1.0 (decodifica bien un ogg/opus de prueba); `oido.py` `parche_av()` quita la opción si PyAV no la acepta (probado con av 16).
- El audio venía del chat …6726 (= número de la tienda de Epic usado como cliente de prueba). No se tocó nada de Epic.

### 2026-11-12 · agendador-ia-3.16 · «ya tienes una cita activa» con cancelar
- `preguntarOtra`: 4 opciones (`otra:si`, `otra:cambiar`, `otra:cancelar`, `otra:no`). `T.cancelada` robusto si la respuesta no trae la cita.
- Banco: 106 pruebas.

### 2026-11-12 · agendador-ia-3.14 / 3.15 · citas dobles, otra cita, fecha en el panel
- 3.13 instalada: `/estado` → `"oido":"listo (small)"`. Una nota de voz real respondió «no puedo escuchar audios»: falta saber si WAHA
  entregó el archivo. 3.15 anota en /registro «🎤 no pude bajar el audio…» con la razón (`mediaError`).
- `admin.js` `aptCard`: fecha siempre visible.
- `mary.gs`: `maryDobles_` (mismo WhatsApp, citas que se cruzan, sin `maryDobleAvisado`) dentro de `proximas`; op `dobleAvisado`;
  `maryCancelar_` deja cancelar una doble sin el mínimo de horas.
- `asistente.js`: `elegirCualCancelar` (profesionales distintos → «¿con quién te quedas?», `dobq:i`; si no → «¿cancelar una?», `dob:i`),
  `preguntarOtra` (paso `otraCita`, `otraPersona`, `nombreOtra`). Arreglo: `lista()` no devuelve valor → la pregunta devuelve 'preguntado'.
- Banco: 105 pruebas.

### 2026-11-12 · agendador-ia-3.13 · 👂 oído
- `vps/oido/` (oido.py + Dockerfile, python:3.12-slim + faster-whisper 1.1.1): POST /transcribir (audio crudo) → {texto}; GET /salud.
  Modelo `small` (int8, CPU, 2 hilos) en el volumen `oido_modelos`; un audio a la vez; > 180 s no se transcribe. Probado aquí en modo
  prueba (OIDO_PRUEBA=1); el modelo real se baja en el VPS (huggingface.co está bloqueado en este entorno).
- `docker-compose.yml`: servicio `oido-agendador` (sin puertos). `actualizar.sh`: `docker compose up -d --build oido-agendador` en segundo plano.
- `principal.js`: `escuchar()` (baja el audio de WAHA/Evolution → oído) antes del freno; `/salud` muestra el estado del oído.
  `maryBot.audios` (panel «Escuchar notas de voz»). Regla N.º 1: `oido-agendador` agregado a los contenedores propios.
- Banco: 97 pruebas.

### 2026-11-12 · agendador-ia-3.12 · hora concreta dentro de otra lista
- Prueba real: con «Elegir día» abierta (2:58), «¿Tienes cupo para mañana a las 11am?» (3:18) devolvió la lista de mañana: en `seguir`,
  el bloque «vuelve a preguntar por cupos» atendía antes de mirar la hora. Ahora, si el texto trae `horaPedida`, va a `propuesta()`
  (salvo pasos de datos: nombre, correo, recordatorio, confirmar). Banco: 94 pruebas.

### 2026-11-12 · agendador-ia-3.11 · conversación natural
- `horaPedida()` (a las 3 = 15:00; 1–7 sin am/pm = tarde; franjas temprano/tarde/noche). `propuesta()`: hora exacta → oferta
  «¿Lo vas a apartar?» (paso `oferta`, filas `ap:si`/`ap:otra`/`ap:HH:MM`); si no hay → antes/después; si el día no tiene → el más cercano.
- `apartar()`: camino `directo` = servicio (lo de siempre si `loDeSiempre`, si no lista) → sin `pasoMas`, profesional automático,
  nombre/correo si faltan → `crearCita` sin paráfrasis. Mensaje final «¡Listo! Apartado» (+ «como siempre»).
- `menu()`: el saludo trae la lista de servicios por categorías + «🕐 Ver cupos de hoy»; texto invita a escribir día y hora.
- Banco: 93 pruebas (mutación hecha apagando la conversación natural).

### 2026-11-12 · agendador-ia-3.10 · cupos como lista de horas
- Prueba real: «Ver cupos» ya funciona desde el celular del cliente. Alex pidió otro diseño: las horas en la LISTA, no en el texto.
- `asistente.js`: `cupos()` → `horasCupos()` (paso `horaCupos`, filas `hc:HH:MM`, `hc:dia:<fecha>` = Mañana, `hc:otro`, `hc:mas`)
  y `diasCupos()`. Elegir hora → `agendar` con `date` + `time` → al tener el servicio, `pasoDia` valida esa hora con `horas`
  (si alcanza → `pasoProfesional`; si no → horas que sí sirven).
- Banco: 86 pruebas (se reescribieron las de cupos del diseño anterior).

### 2026-11-12 · agendador-ia-3.9 · toque del negocio reconocido por el título
- Prueba real con 3.8 instalada (2:51 p. m.): el toque de las 2:53 desde el 318 no hizo nada. Hipótesis: WAHA (GOWS) manda el
  toque propio sin `selectedRowID`. Ahora `deMi` + texto cuya 1.ª línea = título de una opción de la última lista de ese chat → esa opción.
- Banco: 84 pruebas. Falta confirmar con /registro en el celular real.

### 2026-11-12 · agendador-ia-3.8 · opción tocada desde el celular del negocio
- Prueba real: Alex (modo todos) tocó «Ver cupos» en la lista DESDE el 318 (negocio) → llegaba como mensaje del negocio (fromMe)
  → «el dueño escribió» → no pasaba nada; y luego el mensaje de Marianna recibía el menú otra vez (lo que se veía como «el mismo menú»).
- `atenderMensaje`: `deMi && rowId` → el asistente ejecuta esa opción para el cliente del chat, sin pausar. Banco: 83 pruebas.

### 2026-11-12 · agendador-ia-3.7 · cita rápida sin WhatsApp
- `mary.gs`: envuelve `ACTIONS.createManualAppointment`: con WhatsApp (≥10 dígitos) usa la ORIGINAL; sin WhatsApp usa
  `maryCitaManualSinWa_` (exige nombre, guarda `whatsapp: ''` → sin recordatorios ni mensajes).
- `admin.js` (cita rápida): WhatsApp opcional, nombre obligatorio si no hay WhatsApp, botón «Agendar», selector «Otra fecha».
- Banco: 82 pruebas (la nueva carga `mary.gs` real con un Google simulado).

### 2026-11-12 · agendador-ia-3.6 · agrupar mensajes y no repetir
- Prueba real (captura de Alex): las LISTAS ya salen («Ver opciones» ✅). Pero 3 mensajes seguidos dieron 2 respuestas y
  «Hoy hicimos la inauguración» volvió a recibir el link.
- `alMensaje`: agrupa los textos seguidos del mismo chat (`AGRUPAR_MS`, 7 s por defecto) y responde una vez; opciones de lista,
  fotos y audios van al instante. `yaLoDije()`: no manda el mismo texto (o la misma lista) al mismo chat en 15 min.
- Banco: 81 pruebas (en el banco `AGRUPAR_MS=0` salvo en las pruebas de agrupar; mutación hecha apagando la agrupación).

### 2026-11-12 · agendador-ia-3.5 · freno anti-bots
- `frenoRobot()` (pura) en `principal.js`: pausa si el mensaje trae listas/botones, repite uno de las últimas 12 h (≥ 4 letras; en el
  agendamiento ≥ 12), es publicidad (`PUBLICIDAD` o link + precio) o es un texto ≥ 40 letras que llega < 3 s después de nuestra respuesta.
  Pausado: mensaje distinto → responde; el mismo → sigue pausado. Memoria por chat en `MEM.robot`.
- Cambio de regla: «hola» repetido el mismo día ya no se responde 2 veces (pausa al segundo, como pidió Alex).
- Banco: 76 pruebas (mutación hecha apagando el freno).

### 2026-11-12 · agendador-ia-3.4 · categorías
- Prueba real: la lista mostraba todo junto en «Servicios» porque los servicios de El Barba no tenían categoría (error mío: dije que
  las categorías «ya existían» sin revisar los datos del negocio).
- `common.js` `categoriaAuto(nombre)` = `mary.gs` `maryCatAuto_` (la misma regla; una prueba compara las dos).
- `maryCatalogo_`: servicio sin categoría → categoría automática. Panel › Servicios: botón «Organizar por categorías» (las guarda).
  Asistente de inicio (`admin.js`): los servicios nuevos se crean con su categoría.
- Banco: 71 pruebas (la de categorías se salta dentro de la imagen, donde no está `gs/`).

### 2026-11-12 · agendador-ia-3.3 · listas de WhatsApp
- Probado en el celular real: la lista salía como texto con números. Causa (leída en el código de WAHA, `chatting.list.dto.ts`):
  `message.title`, `button` y el título de cada sección son obligatorios; mandábamos `title: ''` → 400 → plan B.
- `escribirLista`: título = primera línea (sin `*`, si cabe en 60) o el nombre del negocio; cuerpo = el resto. Evolution igual.
- Banco: el WAHA simulado valida como el real. 70 pruebas, 0 fallas (mutación hecha con el título vacío).

### 2026-11-12 · agendador-ia-3.2 · modo por Telegram
- 3.1 instalada y verificada en el panel real: «WhatsApp Bot» muestra El Barba ✅ vinculado (+57 318…), sincronizado solo.
- `cartero.py`: `/modo` (ver), `/modo prueba|apagado`, `/modo todos confirmo` (pide confirmar), `/prueba <números>`.
  Editan `agendador-ia.env` y reinician solo `agendador-ia` (`docker compose up -d agendador-ia --force-recreate`).

### 2026-11-12 · agendador-ia-3.1 · 💬 Panel «WhatsApp Bot» + 📸 estados + recordatorio con respuesta
- Panel (`admin.js`): pestaña nueva `wabot` («WhatsApp Bot»): tarjeta de vincular (código visible + botón «Prefiero escanear un QR»),
  desvincular (espera la confirmación del VPS), opciones guardadas en `settings.maryBot` (ver `BOT_DEF`) y sección de estados
  (`maryBot.estados`: activo, horas[≤2], manana, semanal). Se quitó el campo de recordatorio de Configuración (3.0) y la sección vieja de Mary.
- Servidor (`mary.gs`): `maryBotCfg_` (valores por defecto), `bot` en cada respuesta de info/chat/catalogo, ops `asistencia`
  (Telegram con datos + .vcf), `cancelar`, `reagendar` (mismas reglas que la página: horas mínimas, máximo de cambios), `contactos`.
  `crear` y `asistencia` guardan al cliente en `customers/wa<10 dígitos>`. `conectar` falla si ya hay un WhatsApp vinculado.
- VPS (`principal.js`): `BOT` (config por negocio que llega en las respuestas), pausa del dueño = `pausaMin`, asistente apagado,
  `estadosQueTocan` (pura), estado de mañana si hoy no hay, estados a los `contactos` del negocio, vincular/desvincular por WAHA con la
  sesión del negocio (`sesionBid`), `renovarQr` (cada 15 s mientras vincula), `sincronizarConectados` (cada 30 min).
- Asistente: respeta las opciones del panel; tras el recordatorio entiende sí/cancelar/modificar (5 h); «quiero cancelar mi cita» pregunta
  si está seguro; «modificar» → días → horas → paráfrasis → `reagendar`.
- Arreglo encontrado por el banco: «cancelar» tras el recordatorio se tomaba como «salir» y no cancelaba.
- Banco: 69 pruebas, 0 fallas (mutación hecha con la pausa del dueño).

### 2026-11-12 · agendador-ia-3.0 · 🤖 El asistente (agendar por WhatsApp)
- Saludo «Soy el asistente de {negocio}» (sin «Mary»), una vez al día por cliente (`MEM.clientes[bid:tel].saludo`).
- Cupos con fechas pedidas (hoy/mañana/viernes/el 20…), siempre con link + lista de días.
- Agendar con listas de WhatsApp: `vps/asistente.js` (pasos cat → svc → mas → dia → hora → pro → nombre → correo → confirmar).
  Varios servicios en una cita (se suman). Si la lista no se puede mandar, va como texto con números.
- Servidor (`vps/gs/mary.gs`): ops `catalogo`, `dias`, `horas`, `crear` (abono = `depositAmountCOP` del dueño). `proximas` usa
  `settings.maryReminderMinutes` (panel). `cupos` hasta 14 días.
- Correo (`vps/gs/correo.gs`): invitación `.ics` (REQUEST al confirmar/reagendar con el mismo UID y SEQUENCE; CANCEL al cancelar,
  también si cancela el cliente: se envuelve `ACTIONS.cancelAppointment`). Campos nuevos en la cita: `icsSeq`, `icsCancelada`.
- Panel (`admin.js`): «Recordatorio al cliente por WhatsApp» (0/30/60/120/180/1440 min) → `maryReminderMinutes`.
- Aprende nombre, correo y combos (`combos`) → «¿Lo de siempre?».
- Audios: responde que por ahora no los escucha.
- Banco: 55 pruebas, 0 fallas (prueba de mutación hecha con el saludo).

### 2026-11-12 · agendador-ia-2.9 · ✅ Mary responde por WAHA
- Tu 318 quedó vinculado como «El Barba» (`elbarba`) en `waha-agendador` (código de 8 letras). Primera prueba: Mary mandó el link para agendar.
- Arreglo: el aviso de conexión de WAHA creaba un negocio falso «default». Ahora se ignora si no es un negocio registrado
  ni pedido desde el panel. `actualizar.sh` borra el que quedó. Escenario nuevo (19 escenarios, 37 pruebas).

### 2026-11-12 · agendador-ia-2.8
- Regla N.º 1 «Epic no se toca: solo copiar, jamás modificar» reforzada en `CLAUDE.md`, `vps/LEEME.txt` y aquí.
- Banco nuevo `vps/banco/reglas.js`: revisa todos los scripts y falla si alguno actúa sobre un contenedor ajeno. `actualizar.sh` no instala si falla.
  (Comprobado: detecta la línea que causó el incidente.)
- `configurar-waha.sh`: solo avisa, nunca toca contenedores ajenos.
- `LEEME-REGLA-UNIVERSAL.txt` (raíz y `vps/`, viaja en el zip al VPS): «no se puede modificar ningún contenedor fuera del agendador, solo copiar».

### 2026-11-12 · ⚠️ Incidente con Epic (error de Claude)
- `configurar-waha.sh` (2.6/2.7) sacó `epic-waha` de la red del agendador «para deshacer» lo de la 2.2. Eso **tocó un contenedor de Epic**
  y coincidió con el aviso «se desconectó WAHA de la tienda». Rompe la regla universal: **ni para deshacer se toca otro proyecto**.
- Corregido en el código (va en la 2.8): el script ya solo avisa, nunca toca contenedores ajenos. Ya no se repite (epic-waha ya no está en la red).

### 2026-11-12 · agendador-ia-2.7
- **Banco de escenarios** al estilo de Epic (`vps/banco/escenarios.js`, 18 casos).
  - Cubre: WAHA y Evolution, número oculto @lid, modos, sesión no registrada, duplicados, cita confirmada, no repetir, dueño escribe, eco, agenda suspendida, Google sin cupo, foto del pago, grupos y estados.
  - Se comprobó que detecta fallas rompiendo una regla a propósito.
- **Banco de la página** (`vps/banco/web.js`). El cartero no sube la página si no pasa.
- El código de Mary ahora se guarda en `vps/` de este repo. Antes solo existía en zips.
- **Graphify** instalado: `graphify-out/` con el mapa del código (763 nodos), y la skill del proyecto en `.claude/`.
- Se creó esta bitácora.

### 2026-11-12 · agendador-ia-2.6
- **Regla universal** escrita en `CLAUDE.md` y `LEEME.txt`.
- **WAHA propio** (`waha-agendador`). `configurar-waha.sh`:
  - deja de usar el `epic-waha` y lo saca de la red del agendador, sin reiniciarlo (eso deshace un error de la 2.2);
  - vincula el WhatsApp del negocio con un código de 8 letras.
- Mary anota en `/registro` por qué se calla.
- Mary busca el número real cuando WhatsApp lo oculta (@lid).

### 2026-11-10 · Mudanza del servidor de Google
- El servidor (Apps Script) pasó de alex88ruizc a **tuagenda.servidor@gmail.com**, que tiene su propio cupo, con `mudar-google.sh`.
- `config.js` ahora apunta a la nueva `/exec`.
- Se borraron los activadores viejos. El proyecto viejo queda de respaldo.

### 2026-11-07 → 11-10 · agendador-ia 2.0 a 2.5 y página 07a a 07n
- **2.5:** Mary gasta mucho menos cupo de Google.
- **2.4:** arreglo de «Project settings not found».
- **2.3:** arreglo de archivos duplicados .gs/.js.
- **2.2:** soporte para WAHA.
- **2.1:** arreglo de «Conflicting files».
- **2.0:** se creó `mudar-google.sh`.
- **Página:**
  - landing premium de venta;
  - login con Google en todas partes;
  - cupos libres en el panel;
  - APK/PWA;
  - se quitaron MacroDroid y Meta y solo queda «WhatsApp con Mary»;
  - correos premium;
  - arreglo al guardar el perfil (07n).

### Antes · agendador-ia 1.1 a 1.9
- **1.9:** `/apk`.
- **1.8:** silencios de 15 min.
- **1.7:** se borra la conexión si no se vincula en 15 min.
- **1.6:** correos sin «����».
- **1.5:** conectar WhatsApp desde el panel.
- **1.4:** el cartero sube APK, sw.js y assetlinks.
- **1.3:** se sube cualquier `.css`.
- **1.2:** puerto 3070.
- **1.1:** 13 arreglos de una revisión independiente.
