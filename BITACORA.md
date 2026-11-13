# 📒 Bitácora de Tu Agenda (tuagenda.vip)

> **Regla:** cada cambio al proyecto se anota aquí, en «Historial», el mismo día. Esto se hace antes de entregar el zip.
> Aquí se guarda todo lo que hay que saber para retomar el proyecto sin perder nada.
> Última actualización: **2026-11-13** · Mary **agendador-ia-3.50** · Página **2026-11-13p** · Servidor de Google **2026-10-10n** (cuenta nueva)

---

## 🚫 REGLA UNIVERSAL N.º 1 — EPIC NO SE TOCA (manda sobre todo lo demás)
**Epic** (Mary de Epic, Luisa, la tienda, epic-waha, epic-tiendas, Epic Channels y todo lo que sea de Epic) y **cualquier otro proyecto**:
- ✅ **Solo se puede COPIAR**: leer su código o su versión y hacer una copia propia del agendador, aparte y con su propio nombre.
- ❌ **JAMÁS se modifica**: ni sus contenedores, ni sus redes, ni sus webhooks, ni sus sesiones de WhatsApp, ni sus archivos, ni su base de datos, ni sus repositorios. Ni reiniciarlo, ni detenerlo, ni conectarlo o desconectarlo de nada.
- ❌ **Ni siquiera para «deshacer», «arreglar» o «limpiar»**. (El 2026-11-12 sacar `epic-waha` de una red «para deshacer» le cortó la conexión a la tienda de Epic.)
- ❌ Ningún script del agendador ejecuta comandos sobre contenedores o archivos que no sean del agendador (`agendador-ia`, `evolution-agendador`, `postgres-agendador`, `waha-agendador`, `oido-agendador`, `~/agendador`).
- 🛑 Si algún paso pudiera afectar a Epic, **se para y se le pregunta a Alex**. Solo Alex, con palabras explícitas, puede autorizar algo sobre Epic.
Ver también `CLAUDE.md` y `vps/LEEME.txt`.

## 🖥️ REGLAS DEL SERVIDOR (VPS compartido con Epic Streaming) — obligatorias (orden de Alex, 2026-11-12)
1. **Contenedores con nombre, siempre.**
   - Nunca «docker run» sin --name. Se usa docker compose dentro de la carpeta del agendador (proyecto `agendador-ia`).
   - Tarea de una sola vez: `docker compose run --rm --name agendador-tarea-<algo> <servicio> …` (el --rm es obligatorio).
   - Al terminar cada trabajo: «docker ps -a» y confirmar que no quedó ningún contenedor del agendador sin nombre ni detenido. Si quedó uno, se borra y se dice.
2. **Solo lo del agendador.**
   - Nuestros: agendador-ia, evolution-agendador, waha-agendador, oido-agendador, postgres-agendador (y las tareas agendador-tarea-…).
   - No se toca, reinicia, detiene ni borra nada que empiece por epic-, ni evolution, evolution-estados, evo_postgres, evo_redis, luisa-fotos, mary-oido, n8n_db, epic-n8n ni tunel-pc.
   - Nunca «docker system prune», «docker volume prune», «docker image prune» ni «docker rm» sobre algo que no sea nuestro.
3. **WhatsApp.**
   - El agendador solo se vincula con su propio número, nunca con el de la tienda Epic Streaming.
   - Nunca se cierra, desvincula ni reinicia una sesión de WhatsApp que no sea del agendador.
   - Antes de vincular un número, se le pregunta a Alex cuál es y se espera su confirmación.
4. **Recursos.**
   - El servidor tiene 2 núcleos y lo comparte con Mary (Epic), que atiende clientes.
   - Construcciones pesadas, de una en una y con `nice -n 19`.
   - Si algo va a ocupar más de 5 GB de disco, se avisa antes.
5. **Antes de terminar**, decir en una línea: qué contenedores se crearon, cuáles se borraron y que «docker ps -a» quedó limpio.

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
0. Planes parte 2: con los interruptores del bot ya se puede apagar en general; falta por PLAN (Básico con candado «Desbloquéalo con Gold») y el panel de ingresos bloqueado en prueba y Básico. Segundo WhatsApp +$20.000 (Gold).
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

### 2026-11-13 · agendador-ia-3.50 · 🔎 estados: saber a quién se mandaron
- **Alex:** «los estados de El Barba no me llegaron a mí, y yo puedo ver sus estados». El registro decía «publicado», pero eso solo prueba que se le entregó a WhatsApp.
- **Cómo funciona (no cambió):** por WAHA el estado se manda a la lista de **Clientes** del negocio (`maryContactos_`: clientes con WhatsApp y no bloqueados). Quien no está en esa lista no lo recibe, aunque tenga el contacto guardado.
- **Cambios:** el registro ahora dice «publicado · a N contactos» y avisa si WhatsApp tardó en confirmar. Los **números de prueba de Alex** (`MARY_PRUEBA`) se agregan siempre a los destinatarios, para que pueda revisar los estados de cualquier tienda.
  Comando nuevo del cartero: **`/guia <tienda>`** publica ya «Cómo agendar» (para probar sin esperar los días).
- **Epic (solo lectura):** se miró el repositorio `epic-channels` para ver cómo maneja los números ocultos. Ahí solo está la página web de la tienda; el código del bot de Epic no está en ese repositorio ni tiene mapa. No se tocó nada.
- Pendiente: confirmar con `/registro` cuántos contactos tiene El Barba y si a Alex le llega con `/guia elbarba`. Si la lista está bien y no llega, es entrega de WhatsApp (el mismo síntoma del pendiente 7 de Luisa).
- Banco: 170 pasan; como el VPS: 148 pasan, 16 saltadas, 0 fallas.

### 2026-11-13 · agendador-ia-3.49 · 🕵️ clientes con número oculto: ya no se quedan sin respuesta
- **Lo que vio Alex en /registro (El Barba):** 5 mensajes en 2 horas con «sin número visible (LID): no respondo». WhatsApp no mandó el número del cliente, solo un código (…@lid), y el bot se callaba.
- **Arreglo en dos niveles:**
  1. `telDeLid`: le pregunta a WAHA el número real de ese código (`GET /api/<sesión>/lids/<código>`). Si lo sabe, el cliente se atiende NORMAL (agenda por chat) y queda guardado (`MEM.lids`).
  2. Si WAHA no lo sabe (o esa versión no trae la consulta): `responderSinNumero` le escribe EN ESE MISMO CHAT el link de la agenda (`T.sinNumero`), una vez cada 12 h.
     Respeta: asistente apagado, /sinbot, dueño escribiendo. En modo prueba no responde (no se puede saber si es un número de prueba).
- El registro ahora dice «🕵️ número oculto: le respondí con el link de la agenda» (o por qué no).
- Sin verificar en el servidor real: si la consulta `/lids/` existe en la versión de WAHA instalada. Si no existe, funciona el nivel 2.
- Banco: 170 pasan aquí; como el VPS: 148 pasan, 16 saltadas, 0 fallas. Escenario nuevo + el viejo («no responde») actualizado al comportamiento nuevo.

### 2026-11-13 · página 2026-11-13p · 🧸 explicaciones «para cualquiera» (Telegram y avisos)
- Alex: «la explicación debe ser full intuitiva, para dummies». Regla de estilo desde ahora: frases cortas, palabras de todos los días, un ejemplo, y preguntas con respuesta de una línea.
- **Telegram** (guía y Configuración): «¿Qué es esto? · Mira un ejemplo · ¿Qué te avisa? · Preguntas (¿Y mi WhatsApp? ¿Cuesta plata? ¿Es difícil?)».
- **Avisos por WhatsApp:** «Pon aquí TU número. El tuyo, no el del negocio» con ejemplo, y «¿Cómo apruebo un pago?» en 3 pasos (respondes 1).
- **«¿Cuál uso: WhatsApp o Telegram?»** según el caso del dueño: tengo 2 números → WhatsApp; tengo 1 → Telegram; quiero ver la foto del pago → Telegram.
- Banco de la página: 0 fallas. Mary no cambia (3.48).

### 2026-11-13 · página 2026-11-13o · 👀 «Mira cómo funciona» en los planes y beneficios de conectar Telegram
- **«👀 Mira cómo funciona»** debajo de la tabla de planes del panel (`planEjemplos()` en common.js): la misma lista de beneficios con un ejemplo de cómo se ve cada cosa
  (página de citas, chat del bot, aviso con Aprobar/Rechazar, recordatorio, «que vuelvan», estados y reporte). Sale según lo que trae el plan elegido y con el servicio y el profesional reales del negocio.
- **Beneficios de conectar Telegram** (guía y Configuración): foto del comprobante con botones, cada reserva al instante, cada profesional recibe sus citas, aviso antes de la cita, sirve con un solo número, gratis.
- **WhatsApp Bot › Avisos:** tarjeta «¿WhatsApp o Telegram? Puedes usar los dos» con la diferencia entre ambos y el botón «Conectar mi Telegram».
- Tabla de planes: «Avisos en Telegram» ya no dice «8»; dice «Todos» (o «N tipos»).
- Banco de la página: 0 fallas. Mary no cambia (sigue 3.48).

### 2026-11-13 · agendador-ia-3.48 · la 3.47 no se instaló: el banco fallaba SOLO en el VPS
- **Qué pasó:** el cartero respondió «La versión nueva NO pasó el banco de pruebas» con la 3.47. El bot estaba bien; la que fallaba era una prueba (la de «días para reservar», de la 3.44)
  que leía `gs/mary.gs` sin revisar que existiera. Aquí pasa porque el repositorio trae `gs/`; dentro de la imagen del VPS no está. Por lo mismo, 3.44, 3.45 y 3.46 tampoco habrían instalado.
- **Error de proceso (mío):** entregué el zip corriendo el banco solo en el repositorio, no como lo corre el VPS.
- **Arreglo:** la prueba ya revisa que `gs/` exista. **Candados nuevos:** `banco/como-vps.sh` (corre el banco solo con los archivos de la imagen; obligatorio antes de cada zip, en CLAUDE.md)
  y una regla en `banco/reglas.js` que falla si alguna prueba lee `gs/` sin revisar.
- Banco aquí: 169 pasan. Como el VPS: 147 pasan, 16 saltadas (las del servidor de Google), 0 fallas.

### 2026-11-13 · página 2026-11-13n · 🔁 los primeros pasos se muestran una vez más a todas las tiendas
- Alex: «el tutorial de primeros pasos se debe activar una vez más». Al entrar al panel, cada dueño ve UNA vez los primeros pasos nuevos (4 pasos), aunque ya los hubiera hecho (`settings.tutorial2`).
- En las tiendas ya configuradas es un **repaso**: sale el aviso «Ya tienes esto configurado» y cada paso SOLO se guarda si el dueño cambia algo (no se pisa su horario ni sus servicios).
  Tampoco se les desmarcan los pasos que ya tenían hechos en la guía (`W.ver2`).

### 2026-11-13 · agendador-ia-3.47 · página 2026-11-13m · 🚀 activar el negocio más fácil y la página más rápida (auditoría aprobada por Alex: «hazlo todo»)
1. **Asistente de inicio en 4 pasos** (antes 10): negocio → horario → servicios → «¡listo, este es tu link!». Redes, equipo, abono, ubicación y Telegram quedan en la guía.
   `setupVer: 2` distingue a quien hizo el asistente nuevo (para no dar por hechos los pasos que ya no pregunta).
2. **«Deja tu agenda lista» con el WhatsApp de PRIMERO:** «🤖 Vincula tu WhatsApp (2 min)» (antes no salía en ningún lado del camino de activación).
3. **«Probar gratis» entra directo** a una sola pantalla (sin elegir plan). Los planes quedan en «Ver planes».
4. **🔔 Avisos al dueño por WhatsApp** (WhatsApp Bot › «Avisos a tu WhatsApp»): pone su número PERSONAL (distinto al del negocio) y el asistente le escribe cada aviso
   que hoy va a Telegram. Un comprobante se aprueba respondiendo **1** (2 = rechazar). Servidor: `tgNotify`/`tgPhoto` envueltos → cola `private/maryAvisos` + bandera pública
   `platform/public.maryAvisoPend` (el VPS llama a Google SOLO cuando hay avisos). Siguen las reglas de avisos del plan. El superusuario puede apagarlo para todos («avisosWa»).
   Límite conocido: la captura del pago no se manda por WhatsApp (se ve en el panel). Con un solo número, se sigue usando Telegram.
5. **Telegram bien explicado** (guía, Configuración): para qué sirve, ejemplo del aviso con Aprobar/Rechazar, por qué Telegram y la alternativa por WhatsApp.
6. **Textos según el negocio:** «Hoy en la silla» → «Hoy en tu agenda»; «Reglas de la silla» → «Reglas de las citas»; «barbero» → la palabra de cada negocio.
7. **Velocidad:** los estilos van ARMADOS en `tailwind.css` (26 KB) en vez de calcularse en el celular con cdn.tailwindcss.com; y solo 2 letras (Inter y Sora) en vez de 6
   (Archivo, Archivo Narrow, Bricolage y Figtree se cargaban pero el diseño premium las tapaba). El banco de la página revisa que ninguna página vuelva al CDN y que no falten clases.
- Reseña de planes y página de venta al día: «🔔 Avisos de cada reserva a tu WhatsApp o Telegram».
- Banco: 168 pasan (2 pruebas nuevas). Página: 0 fallas. NO se pudo abrir la página real desde aquí (sin acceso a Firebase): Alex la revisa al instalar.

### 2026-11-13 · página 2026-11-13l · 🏷️ el nombre del negocio se ve completo
- Alex: «ESTÉTICA MAR…» se cortaba arriba en la página de reservas y en el panel. Ahora el nombre sale completo: si es largo, baja de tamaño y pasa a 2 renglones (`nombreCompleto()` en common.js, clase `.nombre-completo` en styles.css). Nunca «…».

### 2026-11-13 · agendador-ia-3.46 · página 2026-11-13k · ⌛ «Vencida» se entiende y se puede reactivar
- Alex: «¿Por qué sale vencida si la cita aún no se concreta?». Era el APARTADO: no subió el comprobante del abono en los minutos de Configuración y el cupo se liberó.
- **1.** La etiqueta «Vencida» ahora dice «⌛ No pagó a tiempo» y la tarjeta explica: «No subió el comprobante del abono a tiempo: el apartado se venció y el cupo quedó libre para otros».
- **2.** En esas citas, «WhatsApp: confirmar» cambia por «WhatsApp: ¿aún quieres la cita?», con un mensaje listo (si ya pagó, que mande la captura; o el link para apartar de nuevo).
- **3.** Botón «🔄 Reactivar» (solo si la hora no ha pasado): «✅ Ya pagó: confirmar la cita» o «⏳ Darle N minutos más para pagar». Servidor `ACTIONS.maryReactivar` (gs/mary.gs):
  revisa que la hora SIGA LIBRE (si alguien la tomó, avisa), vuelve a apartar los cupos y deja la historia de quién la reactivó.
- Banco: 166 pasan (prueba nueva). Página: 0 fallas.

### 2026-11-13 · agendador-ia-3.45 · página 2026-11-13j · 🤖 bot general en el súper panel · 🔥 súper oferta · 📖 guía para vincular WhatsApp
- **Súper panel › Planes › «🤖 Opciones del bot de WhatsApp (todas las tiendas)»:** un interruptor por opción
  (asistente, listas, cupos, audios, saludo, nombre, correo, «lo de siempre», recordatorio, confirmación, cambios, estados, «Cómo agendar», «que vuelvan»).
  Apagada = desaparece del panel de cada tienda y el bot no la hace (VPS `apagarGlobal`/`botOffAlDia` y servidor `maryBotCfg_`). Se guarda en `platform/public.botOff`.
  Al prenderla, cada tienda queda como la tenía. «Si escribes tú, se calla» no se apaga (protege los chats).
- **«🔥 Súper oferta de lanzamiento»** en las tarjetas de Básico y Gold (registro y «Mi plan»). En el súper panel, cada plan tiene la casilla para ponerla o quitarla (`plans.<plan>.oferta`). Sin precio tachado (Alex).
- **Guía paso a paso para vincular WhatsApp** en «WhatsApp Bot», visible ANTES de tocar «Vincular»: 7 pasos (Android e iPhone, «Vincular con el número de teléfono», los 3 minutos) y qué hacer si algo no sale.
- Banco: 165 pasan (2 pruebas nuevas). Página: 0 fallas.

### 2026-11-13 · agendador-ia-3.44 · página 2026-11-13i · 📅 los días para reservar los manda el súper panel
- **Problema (Alex):** en el súper panel puso más días, pero las tiendas de prueba seguían dejando agendar solo 5 días.
- **Causa:** al crear la tienda de prueba, el servidor principal guarda en su configuración `bookingWindowDays` = los días del plan en ESE momento (5).
  Después la página, el servidor y el bot tomaban siempre el MENOR entre el plan y ese número guardado, así que se quedaba en 5,
  aunque el súper panel diera más o la tienda subiera a Gold. Además el bot tenía un tope escondido de 21 días.
- **Arreglo (regla nueva, orden de Alex: «el súper panel toma la última decisión»):**
  - Los días son los del plan del súper panel. El dueño solo puede poner MENOS si él mismo lo elige en Configuración (`bookingWindowOwner`). Nunca más que el plan.
  - Página: `ventanaReserva()` en common.js (calendario, reagendar y cupos). Panel: Configuración muestra los días del plan y guarda si el dueño eligió menos.
  - Servidor de Google: `loadSettings` envuelto en gs/mary.gs con la misma regla (así también valida bien al crear la cita). Sin el tope de 21 días en `maryVentana_`.
  - Bot del VPS (cuposLocal): la misma regla leyendo el plan del negocio y el súper panel; sin el tope de 21.
- No se tocó el código principal del servidor. La línea que guarda el 5 al crear la tienda sigue ahí, pero ya no limita nada.
- Banco: 163 pasan (prueba nueva de la regla). Página: 0 fallas.

### 2026-11-13 · página 2026-11-13h · 📝 reseña de los planes y página de venta al día
- **Reseña de los planes** (`DEFAULT_BENEFITS` en common.js) con lo nuevo que ya está hecho:
  - Gold: bot de WhatsApp 24/7 (listas, cupos, audios), recordatorio con confirmación, estados automáticos (cupos y «Cómo agendar»), «vuelven solos», reporte de ingresos.
  - Prueba: correo con calendario, horario por profesional y bloqueo de horas.
  - Básico: Telegram también a cada profesional.
  - Las listas viejas guardadas sin cambios en el súper panel se cambian solas (`BENEFITS_VIEJOS`). La frase «Todo lo del plan Gratis» pasó a «Todo lo de la prueba».
- **Tabla de planes:** ahora trae los nombres de cada columna (Prueba · Básico · Gold) y la fila «Bot de WhatsApp 24/7» (según lo marcado en el súper panel).
- **Precios por defecto del código** al día con los del súper panel: Básico $30.000 y Gold $40.000 (antes decía $20.000 y $35.000). Los precios que se cobran siguen saliendo del súper panel.
- **Página de venta:** ya no dice «Mary les pasa tu link». Ahora dice «Bot de WhatsApp 24/7 · agenda, dice tus cupos y escucha audios», trae el orden correcto (día, hora y servicio), «Cómo agendar» en los estados y 2 tarjetas nuevas: «Vuelven solos» y «Reporte».
- **Regla nueva (Alex):** cada mejora que vean las tiendas se agrega a la reseña y a la página de venta en el mismo cambio (CLAUDE.md).

### 2026-11-13 · agendador-ia-3.43 · página 2026-11-13g · 📲 estado «Cómo agendar»
- `vps/guia.js`: 2 imágenes 1080×1920 (pasos 1-2 «Entra · Día y hora» y 3-4 «Servicio · Aparta y ¡listo!») con nombre, tipo, servicios, equipo y horas reales del negocio. Diseño blanco de Tu Agenda.
- Datos directo de la base (`cuposLocal.guia`): no gasta Google. Sale en todos los planes. 8:00 a. m. cada 3 días por defecto (`maryBot.guia`), se cambia en el panel (WhatsApp Bot).
- Se publican en orden con 20 s entre una y otra. Banco: 162 pasan. Página: 0 fallas. Alex aprobó las 2 imágenes. Panel: «WhatsApp Bot › 📲 Estado «Cómo agendar»» (prender, hora, cada cuántos días).

### 2026-11-13 · agendador-ia-3.42 · página 2026-11-13f · 🚀 «Probar gratis» solo DESPUÉS de agendar (página blanca, colores de Tu Agenda)
- Idea de Alex: si el «Probar gratis» está mientras el cliente agenda, se puede perder la cita. Ahora:
  - **Página del negocio:** se quitaron el botón amarillo de arriba y la tarjeta punteada. Solo queda el sello chiquito «⚡ Hecho con tuagenda.vip» abajo.
  - **«Cita confirmada»** (el ticket y la pantalla del link de pago del bot): tarjeta azul clarita «✨ ¿Te gustó lo fácil que fue?» + «Probar gratis N días →».
  - **«Mis citas»:** tarjeta pequeña al FINAL, debajo de las citas: «💼 ¿Tienes un negocio? Crea tu agenda gratis».
  - **Correo de la cita** (gs/correo.gs): pie «Agenda creada con tuagenda.vip · Crea la tuya gratis».
  - **WhatsApp:** sigue solo en «Cita confirmada» (PIE_GRATIS); nada en recordatorios.
- Todo abre en **otra pestaña** `tuagenda.vip/?probar=1`, que abre «Probar gratis» de una vez. El cliente no pierde su cita.
- Con el adicional **«sin marca»** (`businesses.addons.sinMarca`) no sale nada de esto. Si la plataforma apaga la prueba (`trialEnabled:false`), tampoco.
- Diseño propio de Tu Agenda (blanco, azul #24508A, rojo, latón). Nada del verde oscuro de Epic.
- Banco: 159 pasan (escenario nuevo del pie del correo). Página: 0 fallas.

### 2026-11-13 · página 2026-11-13e · 👑 el dueño en «Equipo»: ¿también atiendes?, sin ID y enlace de Telegram por WhatsApp
- **Pregunta de una sola vez** en «Equipo»: «👤 ¿Tú también atiendes clientes?» → «✂️ Sí, también atiendo» / «💼 No, solo administro».
  Se guarda en `settings.ownerAttends` y prende o apaga al trabajador del dueño (`A.me.staffId`, normalmente `barbero1`).
  Si solo administra y no hay más gente, se abre «Agregar al equipo». No se le pregunta al súper.
- **Tarjeta del dueño:** «👑 Tú · dueño». Ya no tiene «Conectar Telegram» (sus avisos llegan al Telegram de dueño); dice si está conectado o que lo conecte en Configuración.
  Si solo administra: «💼 Solo administras · no recibes citas» + botón «✂️ Empezar a atender».
- **Se quitaron los «ID: …»** de las tarjetas (confundían).
- **Telegram de cada trabajador:** el botón dice «📲 Conectar su Telegram»; la ventana trae «📲 Enviar por WhatsApp» con el mensaje listo
  («Hola <nombre> 👋 Toca este enlace para que te lleguen tus citas a Telegram: …») y una pista en la tarjeta.
- Banco de la página: 0 fallas. Zip: `agendador-web-2026-11-13e.zip` (solo página; Mary sigue en 3.41).

### 2026-11-13 · agendador-ia-3.41 · página 2026-11-13d · 💳 pago automático de la suscripción por Bre-B o por el link de Nequi Negocios
- Con el código que mandó /servidor se vio que el servidor YA tiene el cobro automático copiado de Epic:
  - `createPlanOrder`: pedido con monto único (+$0, +$1…), dura 30 min + 3 h de gracia;
  - `revisarPagosBreb`: lee cada minuto el Gmail de la cuenta del servidor y activa el plan.
  Se usó eso mismo sin tocar el código principal (envolturas en mary.gs).
- **mary.gs 3.41:**
  - `ACTIONS.createPlanOrder` acepta `metodo`:
    - `breb`: sin comisión;
    - `nequi`: link pagando desde Nequi o Bancolombia, +1,5 % + IVA;
    - `banco`: link pagando desde otro banco, +2,69 % + IVA.
    Gold: $35.000 / $35.640 / $36.160, con monto único. Probado: siempre llega el precio completo.
  - `revisarPagosBreb` (copia del principal): además entiende «Transacción APROBADA · Venta exitosa por $35,640» de Nequi Negocios/Wompi y descarta los RECHAZADOS.
- **Panel › Mi plan:** «¿Cómo quieres pagar?» con las 3 formas y su precio, y la explicación de la comisión. Con link: «1️⃣ copia el valor exacto · 2️⃣ abre el link y pégalo · 3️⃣ se activa solo».
- **Super panel › Pago automático:** campo «Link de pago de Nequi Negocios» (solo acepta links de wompi.co / nequi.com.co).
- **Correo:** el lector solo ve el Gmail de **tuagenda.servidor**. Alex pone en su Gmail un filtro que solo REENVÍA una copia de notificaciones@nequi.com.co (sin archivar ni marcar como leído), así Epic sigue igual. Los pagos de Epic que lleguen se ignoran: solo cuenta el monto exacto de un pedido pendiente (probado).
- Correo de la llave Bre-B (otro formato, enviado por Alex): «Detalle de tu venta por Bre-B · Venta exitosa por $ 35.000 · Pagador…». Probado: se reconoce. ⚠️ El filtro de Gmail debe ser SOLO por remitente (notificaciones@nequi.com.co), no por asunto, porque los asuntos del link y de Bre-B son distintos.
- Banco: 158 pruebas, 0 fallas.

### 2026-11-13 · agendador-ia-3.40 · /servidor (código del servidor de Google sin claves) · plan de pagos de suscripción por Nequi Negocios
- **Pagos de la suscripción de las tiendas (acordado con Alex, en construcción).** Solo para que las tiendas le paguen su plan a Alex; nada de los cobros de cada tienda a sus clientes.
  - Un solo link de Nequi Negocios (valor abierto) + su llave de negocios (Bre-B). Tarifas confirmadas con sus pantallas y una prueba real de $1.500 desde Nequi → $1.473:
    - llave / QR: gratis, al instante;
    - link desde Nequi o Bancolombia: 1,5 % + IVA;
    - link desde otros bancos: 2,69 % + IVA;
    - tarjetas: 1,99 % + IVA + retención → no se usan.
  - Gold $35.000: llave $35.000 · link Nequi/Bancolombia $35.640 · link otros bancos $36.160, + unos pesos únicos por pedido para saber qué tienda pagó.
  - Cada pago manda el correo «Transacción APROBADA» (de notificaciones@nequi.com.co) a alex88ruizc@gmail.com.
  - ⚠️ A ese MISMO Nequi y Gmail llegan los pagos de **Epic**. Regla N.º 1: el agendador NUNCA entra a ese Gmail (Epic puede depender de él). Alex hará un filtro que solo REENVÍA una copia a tuagenda.servidor@gmail.com, y el agendador lee solo ese.
  - Activa un plan únicamente si el monto coincide exacto con un pedido pendiente (48 h, referencia usada una sola vez). Los pagos de Epic se ignoran.
- **/servidor** (cartero): manda por Telegram la copia del código del servidor de Google que el VPS baja en cada actualización (~/agendador/google). Quita llaves privadas, tokens, llaves de Wompi, contraseñas y la clave de Mary. Sirve para conectar la activación automática con la MISMA función con la que hoy se aprueban los planes (no está en el repositorio). Probado con un servidor falso lleno de secretos de ejemplo (`reglas.js`).
- Banco: 156 pruebas, 0 fallas.

### 2026-11-13 · agendador-ia-3.39 · página 2026-11-13c · la marca de agua ARRIBA y bien visible
- Alex: «arriba debe salir tuagenda.vip, que se vea; abajo queda escondida».
- La marca pasó a la esquina superior derecha, grande (380 × 72, letra de 36) y con fondo sólido: blanca sobre fondo oscuro y negra sobre fondo claro. En «subir mi diseño» con logo arriba a la derecha, va justo debajo del logo.
- Revisada en los estados del bot (hoy y semana) y en los diseños Dorado, Cupón, Tarjeta y Cine.
- Alex confirma que nunca cambió las funciones de los planes en el super panel (para la parte 2).

### 2026-11-13 · agendador-ia-3.38 · página 2026-11-13b · 🏷️ marca de agua + «Regístrate gratis» en la prueba (parte 1 de los planes)
- Pedidos de Alex:
  - todo estado que salga del agendador lleva la marca de agua de la página (tuagenda.vip), pegada en la imagen;
  - quitarla es un adicional de +$20.000/mes;
  - en la prueba gratis no se publica ninguna imagen de Tu Agenda, pero un estado al día dice «Regístrate gratis y crea tu agenda aquí».
- **Marca de agua** (cápsula pequeña abajo al centro, con ícono de calendario + «tuagenda.vip»):
  - Estados automáticos del VPS (cupos de hoy y semana): `estado.js` → `marcaAgua()`.
  - Panel: todo «Nuevo estado» (8 diseños y «subir mi diseño») y el generador de imágenes con horarios. Elige blanco o negro según el fondo. Revisado en diseños oscuros, claros y con marco.
- **Adicional «sin marca de agua»** (+$20.000/mes): super panel › Editar negocio › casilla «🏷️ Sin marca de agua». Se guarda en `businesses/<id>.addons.sinMarca` envolviendo `superUpdateBusiness` (la acción original sigue revisando que sea el superusuario). El panel y el servidor (`info.marca`) la respetan.
- **Prueba gratis** (`BIZ.trial`): el primer estado automático del día lleva en el texto «🚀 Regístrate gratis y crea tu agenda aquí: https://tuagenda.vip/». En un plan de pago, nunca.
- Banco: 155 pruebas, 0 fallas.
- **Pendiente (parte 2, ya conversada con Alex):** planes con bloqueos del bot.
  - Prueba: todo menos 💰 Ingresos.
  - Básico: bot que responde, cupos con link y recordatorio; el resto 🔒.
  - Gold: todo.
  - Después: segundo WhatsApp +$20.000 (solo Gold).
  - Ojo: los planes guardados en el super panel mandan sobre los valores por defecto. Las funciones nuevas necesitan cuidado para no quitárselas a un Gold.

### 2026-11-13 · agendador-ia-3.37 · página 2026-11-13a · 📊 reporte del bot, del link y de los ingresos
- Pedido de Alex: en el WhatsApp Bot, un reporte por día, mes, año y fechas libres, con:
  - interacciones con clientes, inicios de conversación (cuando eligen de la lista) y citas confirmadas;
  - lo mismo para el link;
  - ingresos = citas confirmadas − citas canceladas.
- **Panel › WhatsApp Bot › 📊 Reporte** (Hoy / Este mes / Este año / 📅 Fechas):
  - 💬 Bot: personas que escribieron (sin repetir), interacciones, iniciaron (eligieron de la lista), citas por WhatsApp (y canceladas), recordatorio de servicio (enviados / volvieron a agendar), «¿Seguimos?» (enviados / terminaron agendando).
  - 🔗 Link y panel: visitas al link (la «Actividad»), citas por el link, citas hechas en el panel.
  - 💰 Ingresos: citas confirmadas (confirmada, atendida, no asistió y las que luego se cancelaron) − canceladas = ingresos. Por fecha de la cita. Vencidas y sin pago no cuentan.
- **Cómo se cuenta:**
  - El VPS cuenta por día y lo guarda en Google UNA vez por hora (op `estadisticas` → businesses/<bid>/stats/<fecha>).
  - De las personas solo se guarda una huella corta (sha256), nunca el número.
  - El panel lee con `maryReporte` (solo el dueño). Citas y visitas salen de lo que ya existe.
  - Lo del bot cuenta desde que se instala la 3.37. Las citas y los ingresos también hacia atrás.
- Banco: 152 pruebas, 0 fallas (VPS cuenta y manda una vez, sin números; servidor guarda y suma un rango sin repetir personas; solo el dueño). Cálculo de ingresos revisado con datos de prueba.

### 2026-11-12 · agendador-ia-3.36 · si ya va a cerrar, el «¿Seguimos?» ofrece OTRO día
- Pedido de Alex (súper importante): si ya es hora de cerrar, el recordatorio debe ponerle una fecha nueva; ese día ya no hay horas.
- **«¿Seguimos con tu cita?»:** si el cliente se quedó eligiendo una hora de HOY y ya no quedan horas, o la hora que había escogido ya pasó, ahora dice: «Hoy ya no quedan horas (ya vamos a cerrar), así que te la busco para *otro día* 📅» con la opción «📅 Elegir otro día».
  - Al tocarla, salen los días con cupo SIN hoy, con el servicio que ya eligió. Si venía de «¿hay cupos?», salen los cupos de mañana.
  - También se revisa al tocar «Seguir», por si cerró entre el aviso y la respuesta.
- Cuando un día ya no tiene horas, decía «Ese día ya se llenó». Si es hoy, ahora dice «Hoy ya no quedan horas (ya vamos a cerrar). Elige otro día».
- El recordatorio de servicio ya mostraba solo días con cupo (hoy no sale si no quedan horas).
- Banco: 149 pruebas, 0 fallas. Probado con mutación.

### 2026-11-12 · agendador-ia-3.35 · cumplir las REGLAS DEL SERVIDOR (orden de Alex)
- Reglas guardadas en CLAUDE.md, LEEME-REGLA-UNIVERSAL.txt (raíz y vps/) y aquí arriba.
- **Tareas de una sola vez:**
  - Ya no hay ningún «docker run». El banco, las reglas y clasp van con `docker compose run --rm -T --no-deps --name agendador-tarea-… <servicio>` y `timeout`.
  - Servicios nuevos `tarea-banco` (sin red, sin ./datos) y `tarea-clasp` en el perfil `tareas`: `docker compose up` nunca los enciende.
- **Construcciones** con `nice -n 19` (agendador-ia y oído).
- **Al terminar `actualizar.sh`:** revisa `docker ps -a` y dice «limpio» o qué quedó del agendador. Al empezar quita las tareas `agendador-tarea-`/`agendador-tmp-` que hayan quedado colgadas (solo nuestras).
- **Bot:** `/auditoria` dice si `docker ps -a` quedó limpio o qué hay detenido; `/limpiar` también reconoce las tareas `agendador-tarea-` del proyecto agendador-ia.
- **Banco `reglas.js`:** falla si hay un «docker run», si un `docker compose run` no tiene --rm, --name agendador-tarea- o timeout, si aparece algún prune, o si algo actúa sobre Epic, evolution, evo_postgres, evo_redis, luisa-fotos, mary-oido, n8n_db, epic-n8n o tunel-pc. Probado con mutaciones.
- Banco: 146 pruebas, 0 fallas. `docker compose config` válido.

### 2026-11-12 · agendador-ia-3.34 · el «¿Seguimos con tu cita?» saluda por el nombre
- Reporte de Alex: «Hola 👋 ¿Seguimos con tu cita?» salió sin el nombre de Oscar.
- Causa: el mensaje solo usaba el nombre guardado al agendar antes por WhatsApp, y Oscar nunca había agendado.
- **Ahora:**
  - El nombre de WhatsApp de cada mensaje queda guardado (`nombreWa`) y se usa en el saludo, en el «¿Seguimos?» y en el recordatorio de servicio.
  - Si no hay ninguno, el «¿Seguimos?» lo busca UNA vez al día en los clientes del negocio.
- Banco: 145 pruebas, 0 fallas.

### 2026-11-12 · agendador-ia-3.33 · ⏰ retomar al cliente que dejó el agendamiento a medias
- Pedido de Alex: si el cliente empezó a agendar y no eligió nada en 30 min, retomarlo.
- A los 30 min sin elegir: «Hola Nicolás 👋 ¿Seguimos con tu cita? Te quedaste en *elegir el día*» → ✅ Seguir (vuelve la MISMA lista donde quedó, con lo ya elegido) / 🙅 Ya no.
  - Sirve para servicio, «agregar otro», día, hora, con quién, nombre y correo. Si en vez de tocar responde directo («mañana»), sigue donde quedó.
- **Una sola vez.** No retoma:
  - el saludo que nunca tocó, ni los reagendamientos;
  - si el dueño está hablando en el chat (pausa) o hay /sinbot;
  - de noche (9:00 p. m. a 7:00 a. m.): sale a las 7:00 si sigue pendiente (hasta 12 h).
- El recordatorio de servicio (3.32) está en el panel › WhatsApp Bot, al final (sección «🔁 Recordatorio de servicio»).
- **Contenedor sin nombre «vigorous_burnell»** (lo vio Alex desde Epic; Epic no se tocó):
  - Era un `docker run --rm` del agendador que quedó colgado cuando el proceso que lo lanzó se cortó (banco o clasp). Así se llenó el disco el 6 de noviembre.
  - Ahora TODOS los `docker run` de los scripts se llaman `agendador-tmp-…` y tienen tiempo límite (`timeout 600`).
  - `actualizar.sh` quita al empezar los `agendador-tmp-…` que hayan quedado. SOLO esos, nunca otro contenedor.
  - Banco `reglas.js`: falla si un `docker run` no tiene nombre o tiempo límite.
  - **/limpiar** (autorizado por Alex) en el cartero quita los contenedores SUELTOS del agendador. Solo los que se prueban nuestros: imagen del agendador o una carpeta montada dentro de ~/agendador. Nunca los fijos, nada con «epic» y nada de un docker compose. /auditoria los muestra.
  - Probado con contenedores simulados: borra solo los 2 nuestros. `reglas.js` revisa que el cartero borre solo ahí.
- Banco: 141 pruebas, 0 fallas. Probado con mutaciones (una sola vez, 30 min).

### 2026-11-12 · agendador-ia-3.32 · página 2026-11-12q · 🔁 recordatorio de servicio
- Pedido de Alex: escribirle al cliente que ya vino para que vuelva: «¿quieres hacerte lo mismo o cambiarlo?». Si dice sí, solo elige fecha y queda confirmada.
- **Panel › WhatsApp Bot › 🔁 Recordatorio de servicio** (apagado por defecto). **Cada cuánto lo elige el dueño** (7, 15, 21, 30, 45 o 60 días); mientras no lo elija, no sale nada.
- **A quién:**
  - A los clientes cuya **última** visita (atendida o confirmada) fue hace esos días, con 6 de margen.
  - No a quien tenga una cita próxima, esté en /sinbot o esté agendando. Una sola vez por visita (`maryVolver` en la cita).
- **Cuándo:** una vez al día desde las 10:00 a. m., **máximo 20**, con 3 minutos entre uno y otro (`VOLVER_ESPACIO_MS`), para que WhatsApp no vea mensajes masivos.
- **Mensaje:** «Hola Nicolás 👋 Te escribe el asistente de *Barba*. Ya van 3 semanas desde tu último *Corte* con Gabriel. ¿Te agendo de nuevo?» con tres opciones:
  - ✅ Sí, lo mismo → día → hora → «✅ Cita confirmada», con el mismo barbero y sin pedir el correo.
  - ✂️ Otro servicio → agendamiento normal.
  - 🙅 No, gracias → se despide y no insiste.
- Servidor (mary.gs 3.32): ops `volver` y `volverAvisado`. Lee los días por fecha (sin índices nuevos), una vez al día.
- Banco: 138 pruebas, 0 fallas (servidor: a quién sí y a quién no; escenarios: sí / no / otro / sin días elegidos). Probado con mutaciones.

### 2026-11-12 · agendador-ia-3.31 · página 2026-11-12p · bloquear UNA hora y a UN barbero · saludo con el nombre
- Pedido de Alex: «no me permite bloquear individual, sino completo».
  - **Página 12p · Agenda:** tocar una hora libre abre «🔒 Bloquear esta hora» o «➕ Agendar una cita». Antes había que activar «Bloquear» primero y no se notaba.
  - **¿A quién?:** Todo el equipo, o un solo barbero (Gabriel, Yeferson…). Está en la Agenda y en la pestaña Cupos (ahí el tablero muestra los cupos de esa persona). El servidor ya lo permitía; ahora hay prueba de que bloquear a uno deja libre al otro.
- **El saludo no decía el nombre del cliente:**
  - Con WAHA (GOWS) el nombre de WhatsApp viene en `Info.PushName`; ahora también se lee de ahí.
  - Si no lo sabemos, Google lo busca UNA vez al día en los clientes del negocio (customers/wa…, o registrado en la página con +57…). Queda guardado y no se vuelve a pedir.
- Banco: 134 pruebas, 0 fallas.

### 2026-11-12 · agendador-ia-3.30 · 💰 ahorro de Google (auditoría, puntos 1 y 2) · «WhatsApp vinculado» solo cuando cambia
- **Auditoría de cupo de Google** (solo lectura; de Epic solo se leyó su página, sin tocar nada): por cada agendamiento por WhatsApp se hacían 4-5 llamadas a Google (catálogo, días, horas, crear). Recordatorios: 1 llamada cada 15 min. Panel vinculando: 1 cada 3 s.
- **Ahorro 1 (como Epic: leer directo lo público):** nuevo `vps/cuposLocal.js`. Días, horas y «¿hay cupos?» se calculan en el VPS leyendo la base directo, lo mismo que ya lee la página del cliente sin cuenta (configuración, equipo, servicios, cupos ocupados).
  - Misma regla que el servidor y la página: probado contra `computeSlots` de la página en 63 casos (servicios, días, profesionales, días libres, cerrados, bloqueos) → mismas horas.
  - Lo leído se guarda 1 min (cupos ocupados 15 s). Google queda para crear, cancelar, reagendar, pagos y lo privado.
- **Ahorro 2 (VPS primero, Google de respaldo):** si la base no deja leer o algo falla, se usa Google como antes. Se apaga con `LEER_DIRECTO=no` en agendador-ia.env.
- **«✅ WhatsApp vinculado» en Telegram salía en cada reinicio del VPS** (cada vez que se instala un zip): los dueños creían que los hackeaban. Ahora solo sale si de verdad se vincula un número nuevo o distinto (mary.gs 3.30).
- El recordatorio de la cita R-RZP6UR NO fue error: en Telegram, la cancelación aparece después del recordatorio de las 4:54.
- **Pedidos de Alex en esta misma versión:**
  - Al pie del mensaje de cita confirmada (o apartada): «💼 ¿Tienes un negocio con citas? Regístrate gratis en https://tuagenda.vip/».
  - **Página 2026-11-12o:** «🚀 Probar gratis» también ARRIBA, en el encabezado de la página del cliente (además del de abajo). Se oculta si la prueba gratis está apagada.
- Revisado antes de entregar: `cuposLocal.js` estaba fuera de las listas del Dockerfile y de actualizar.sh. Se agregó y se probó el banco con solo los archivos de la imagen (0 fallas).
- Banco: 131 pruebas, 0 fallas (unidad + escenario completo sin Google en días/horas + respaldo). Probado con mutaciones.
- Pendiente de la auditoría: puntos 3-5 (memoria, recordatorios cada 30 min, panel vinculando sin Google).

### 2026-11-12 · agendador-ia-3.29 · página 2026-11-12n · sin «¿Lo confirmo?» · link que falla
- Se probó «primero la hora, después el servicio» y Alex pidió dejarlo como estaba: **primero el servicio, luego el día y la hora**. Ese cambio se deshizo; no se entregó.
- **Sin «¿Lo confirmo?»** (pedido de Alex): la respuesta al correo (o «no») ya es la confirmación. Se aparta de una y llega «✅ ¡Cita confirmada!» con el resumen (servicio, precio y duración, día y hora, con quién, a nombre de, reserva, link). Reagendar sí sigue preguntando.
- **«Presenta problemas tu aplicativo», «el link no me abre»…** → «😕 Qué pena que el link te esté fallando. Tranquilo, te agendo por aquí mismo 👇» + lista de servicios. Queda en /registro.
- **Arreglos que encontró el banco:**
  - «Ver más horas» volvía a la primera página.
  - El número de categoría podía no coincidir con el catálogo.
  - «Otro día» volvía a preguntar «¿ya tienes una cita?».
  - «Lo de siempre» marca «como siempre».
- **Página 12n:** con una sesión abierta sin datos de cliente (por ejemplo, la del dueño en el mismo celular), «Ingresar» quedaba sin el botón de Google. Ahora cierra esa sesión y sale «Continuar con Google».
- Pendiente de revisar con Alex: un recordatorio de una cita que él dice que ya estaba cancelada (R-RZP6UR, avisos a las 4:54 p. m.). El servidor solo avisa citas «confirmadas» al momento: falta saber a qué hora se canceló.
- Banco: 125 pruebas, 0 fallas. Probado con mutaciones.

### 2026-11-12 · agendador-ia-3.28 · el bot se quedaba mudo después de «No, solo eso»
- Reporte de Alex: Combos → Corte + barba → «No, solo eso» y el bot no volvió a responder (debía preguntar el día).
- **Causa principal (servidor de Google):** para buscar los días con cupo leía otra vez los servicios y el equipo por CADA día (hasta 21 días = decenas de lecturas). Tardaba tanto que la respuesta no llegaba a tiempo.
  - Arreglo (mary.gs 3.28): servicios y equipo se leen UNA vez; los días que nadie atiende ni se consultan; tope de 20 s.
  - Prueba nueva en `pruebas.js`: con la versión anterior leía 11 veces los servicios y ahora 1.
- **Causa de que no avisara nada:** si fallaba Google en medio del agendamiento, el VPS no le decía nada al cliente porque «ya le había respondido hace poco».
  - Ahora siempre avisa: «😅 Se me demoró el sistema. Escríbeme *agendar*… o aparta aquí: link», sin depender de Google. El error queda en /registro («❌ falló el asistente: …»).
- **Otros frenos que podían callarlo:**
  - El anti-robot pausaba a una persona que repetía «hola» o «quiero agendar» en el mismo día. Ahora solo pausa textos largos repetidos o lo mismo en menos de 3 min. Tocar NUESTRA lista nunca se pausa.
  - Las listas solo se frenan si son idénticas en 30 s (antes 15 min).
  - «quiero agendar» escrito en medio de las listas empieza de nuevo (antes: «No te entendí»).
- Banco: 4 escenarios nuevos + reglas del freno. 122 pruebas, 0 fallas. Probado con mutaciones.

### 2026-11-12 · página 2026-11-12m · Estado de cupos con las horas grandes
- Pedido de Alex: arreglar el formato del estado «Cupos libres» y que los cupos se vean más grandes.
- Las horas libres salen en **botones grandes de 2 columnas** (hasta 8; si hay más, dice «y N más»). Se pueden editar en el campo «Horas libres».
- El nombre del negocio con emojis ya no sale con «◆◆» (se separan las letras sin partir los emojis). Las iniciales del logo ignoran los emojis.
- En «Tarjeta» y «Cristal» el recuadro baja hasta el botón cuando hay horas, para que no se salgan.
- Revisado dibujando los 8 diseños en Chromium.

### 2026-11-12 · página 2026-11-12l · Clientes con fecha y hora de sus citas
- Pedido de Alex: en **Clientes** deben salir las fechas y horas de las citas.
- Cada cliente muestra sus citas próximas activas: «📅 Hoy/Mañana/viernes 14 de noviembre · 3:00 p. m. · servicio con profesional», y si falta el abono o revisan el pago. Si no tiene próximas: «Sin citas próximas · última: …».
- Las citas se buscan por su cuenta y por su WhatsApp (últimos 10 dígitos), del último año, con una sola consulta.
- Probado con datos de muestra (próxima, pendiente de abono, solo pasada, sin citas, cargando).

### 2026-11-12 · agendador-ia-3.27 · página 2026-11-12k · vincular con cuenta regresiva de 3 minutos
- Pedido de Alex: si toca «Vincular» y no vincula, que haya un contador y que al terminar se borre el puente de WAHA para que no quede gastando.
- **VPS:** la conexión sin vincular se borra a los **3 minutos** (antes 15). Se hace logout y DELETE de la sesión, solo en `waha-agendador`. El VPS le manda al panel la hora exacta en que vence.
- **Panel:** muestra «⏳ Te quedan 2:59 para vincular», con un botón **Cancelar** que borra la conexión al instante. Al llegar a 0 dice «Se acabó el tiempo» y luego «⏱️ El código venció…».
- Al cancelar ya no queda un «venció» pendiente que llegue tarde.
- Servidor de Google (mary.gs 3.27): guarda `vence` para que el panel lo lea.
- Banco: 2 escenarios nuevos (vence a los 3 min y borra la sesión una sola vez; cancelar borra ya y no deja nada por vencer). Probados con mutaciones: volver a 15 min o no limpiar al cancelar hace fallar el banco.
- No se probó en el celular real: el contador del panel no tiene prueba automática.

### 2026-11-12 · agendador-ia-3.26 · página 2026-11-12j · arreglo del arreglo
- **Falla de la 3.25:** el escudo de config.js conservaba la dirección que hubiera en GitHub, y en GitHub había quedado la del servidor **viejo** (alex88ruizc). Por eso el escudo dejó la mala y el «No hay conexión» siguió al desvincular.
- **Ahora:** el cartero conoce las dos direcciones. La vieja **nunca** vuelve: si llega en el zip o está en GitHub, se pone la nueva (tuagenda.servidor). La nueva no se cambia por un zip de la página; solo la mudanza la cambia.
- Probado con un GitHub simulado en los 5 casos (viejo/nuevo en GitHub × viejo/nuevo/otro en el zip): siempre queda la nueva.
- Página 2026-11-12j: mismo código, solo cambia la versión, para que el celular cargue todo de nuevo.
- Instalar: primero agendador-ia-3.26, después agendador-web-2026-11-12j. El bot debe responder «✅ La página vuelve al servidor de Google nuevo».

### 2026-11-12 · agendador-ia-3.25 · ⚠️ incidente: la página volvió al servidor viejo
- Causa del «No hay conexión con el servidor» (desvincular, panel): `config.js` del repositorio tenía la dirección VIEJA
  (AKfycbyRSqns…, cuenta alex88ruizc) y viajó en TODOS los zips de la página 12a…12h → al subirlos se deshizo la mudanza del 10-nov.
  El VPS (Mary) seguía en el servidor nuevo. Desde ~2:11 p. m. el panel y la página usaron el servidor viejo (gastando el cupo de esa cuenta).
- Arreglo: `config.js` = AKfycbwkfrob… (tuagenda.servidor). `cartero.py subir_web`: si un zip trae otra `API_URL`, se conserva la de
  GitHub (salvo la mudanza, que sube «config.js (servidor nuevo)»). Probado con GitHub simulado.

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
