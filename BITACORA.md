# 📒 Bitácora de Tu Agenda (tuagenda.vip)

> **Regla:** cada cambio al proyecto se anota aquí, en «Historial», el mismo día. Esto se hace antes de entregar el zip.
> Aquí se guarda todo lo que hay que saber para retomar el proyecto sin perder nada.
> Última actualización: **2026-11-12** · Mary **agendador-ia-2.7** · Página **2026-11-07n** · Servidor de Google **2026-10-10n** (cuenta nueva)

---

## 🚫 Regla universal
El agendador **no modifica ningún otro proyecto**: Epic, Mary de Epic, Luisa, epic-tiendas ni ningún otro.
- Sí puede **copiar** de otros proyectos, siempre aparte y con nombre propio.
- **Nunca** debe tocarlos: ni contenedores, ni redes, ni webhooks, ni sesiones, ni archivos, ni bases de datos, ni repositorios.

Ver `CLAUDE.md` y `vps/LEEME.txt`.

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
cd vps && node --test banco/pruebas.js banco/escenarios.js     # Mary
node vps/banco/web.js <carpeta con los archivos de la página>  # página
```

---

## ⏳ Pendientes
1. Instalar **2.7** por Telegram y correr `bash ~/agendador/configurar-waha.sh`, que vincula el WhatsApp del negocio al WAHA propio.
2. Probar con «hola» desde 573187920386 y mirar `/registro`. Luego pasar a `MARY_MODO=todos`.
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
