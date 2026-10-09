// Utilidades compartidas entre la página pública y el panel de administración
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, API_URL, DEFAULT_BUSINESS_ID } from "./config.js?v=2026-10-10m";

export const app = initializeApp(firebaseConfig);
// Caché en el dispositivo: muestra al instante lo último que se vio y luego actualiza en vivo
function makeDb() {
  try { return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }); }
  catch { return getFirestore(app); }
}
export const db = makeDb();
export const auth = getAuth(app);
// Barbería activa (viene del enlace: ?b=identificador)
export let BID = "";
export function setBusiness(id) { BID = String(id || "").trim().toLowerCase(); }
export function businessFromUrl() {
  return (new URLSearchParams(location.search).get("b") || DEFAULT_BUSINESS_ID || "").trim().toLowerCase();
}
export const bpath = (...parts) => ["businesses", BID, ...parts].join("/");

// Versión de la página: cámbiala en cada actualización para comprobar que se publicó
export const APP_VERSION = '2026-10-10m';
// Versiones que esta página espera del servidor y de las reglas de Firebase
export const SERVER_VERSION = '2026-10-10m';
export const RULES_VERSION = '2026-10-10l';

export const UNIT = 15;          // unidad interna de bloqueo (minutos)
const TZ = "America/Bogota";     // Colombia no usa horario de verano

// ---------- Llamadas al Apps Script ----------
export async function api(action, data = {}) {
  const body = { action, businessId: BID, ...data };
  if (auth.currentUser) body.idToken = await auth.currentUser.getIdToken();
  let res;
  try {
    // text/plain evita el "preflight" CORS que Apps Script no soporta
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error("No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.");
  }
  const json = await res.json().catch(() => ({ ok: false, error: "Respuesta inválida del servidor" }));
  if (!json.ok) throw new Error(json.error || "Ocurrió un error");
  return json.data;
}

// ---------- Fechas y horas (hora de Colombia) ----------
export function bogNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, min: Number(g("hour")) * 60 + Number(g("minute")) };
}
export const tmin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const mstr = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export function dow(date) { const [y, mo, d] = date.split("-").map(Number); return new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); }
export function addDays(date, n) { const [y, mo, d] = date.split("-").map(Number); return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10); }
export function hora12(t) {
  if (!t) return "";
  let [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "p. m." : "a. m.";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}
export function fechaLarga(date) {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("es-CO", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
}
export function fechaCorta(date) {
  const [y, mo, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("es-CO", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "2-digit" });
}
export const toMillis = (v) => (!v ? 0 : typeof v.toMillis === "function" ? v.toMillis() : new Date(v).getTime());

// ---------- Formatos ----------
export const cop = (n) => "$" + Number(n || 0).toLocaleString("es-CO");
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 10 && d.startsWith("3")) d = "57" + d;
  if (d.length < 10) return null;
  return "+" + d;
}
export const waLink = (phone, text) => `https://wa.me/${String(phone || "").replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

export const STATUS = {
  pending_payment: ["Esperando pago", "bg-amber-100 text-amber-900"],
  pending_verification: ["Pago en revisión", "bg-sky-100 text-sky-900"],
  confirmed: ["Confirmada", "bg-emerald-100 text-emerald-900"],
  attended: ["Atendida", "bg-slate-200 text-slate-800"],
  no_show: ["No asistió", "bg-rose-100 text-rose-900"],
  cancelled: ["Cancelada", "bg-slate-200 text-slate-600"],
  rejected: ["Pago rechazado", "bg-rose-100 text-rose-900"],
  expired: ["Vencida", "bg-slate-200 text-slate-600"]
};
export const statusBadge = (s) => {
  const [t, c] = STATUS[s] || [s, "bg-slate-200"];
  return `<span class="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}">${t}</span>`;
};

export const DEFAULT_WA_CONFIRM =
`¡Hola, {nombre}! 💈
Tu cita en {negocio} quedó registrada con éxito.
• Reserva: {codigo}
• Fecha: {fecha}
• Hora: {hora}
• Barbero: {barbero}
• Servicio: {servicio}
• Valor: {valor} (abono {abono}, saldo {saldo})
📍 Dirección: {direccion}
🚗 Cómo llegar: {waze}
Si necesitas cancelar o reprogramar, avísanos con al menos 2 horas de anticipación. ¡Te esperamos!`;

export const DEFAULT_WA_RESCHEDULE =
`Hola {nombre}, te escribimos de {negocio}. Por un imprevisto no podremos atenderte el {fecha} a las {hora}. ¿Te sirve otra hora? Tu abono queda guardado para la nueva cita. Reserva: {codigo}`;

// Imagen de fondo del encabezado con degradado para que el texto siempre se lea
export function headerBgCss(headerColor, hb) {
  if (!hb || !hb.img) return "";
  const hex = /^#[0-9a-f]{6}$/i.test(headerColor || "") ? headerColor : "#17222E";
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const show = Math.min(90, Math.max(10, Number(hb.show ?? 45))) / 100;
  const end = Math.max(0.12, 1 - show), mid = (0.94 + end) / 2;
  const c = hb.style === "brand" ? [r, g, b] : [15, 22, 32];
  const rgba = (a) => `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(2)})`;
  const grad = hb.style === "brand"
    ? `linear-gradient(180deg, ${rgba(end)} 0%, ${rgba(mid)} 62%, ${rgba(0.96)} 100%)`
    : `linear-gradient(90deg, ${rgba(0.95)} 0%, ${rgba(mid)} 48%, ${rgba(end)} 100%)`;
  const posY = Math.min(100, Math.max(0, Number(hb.posY ?? 50)));
  return `${grad}, center ${posY}% / cover no-repeat url('${hb.img}')`;
}
// Botones para llegar al negocio: con el punto exacto (si se guardó) o con la dirección
export function mapLinks(st = {}) {
  if (st.showLocation === false) return null;
  const g = st.geo && Number.isFinite(st.geo.lat) && Number.isFinite(st.geo.lng) ? `${st.geo.lat},${st.geo.lng}` : "";
  const addr = [st.address, st.city, "Colombia"].filter(Boolean).join(", ");
  if (!g && !st.address) return null;
  return {
    waze: g ? `https://waze.com/ul?ll=${g}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`,
    gmaps: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(g || addr)}`
  };
}
export function fillTemplate(tpl, apt, settings) {
  const ml = mapLinks(settings || {});
  const map = {
    waze: ml?.waze || "", mapa: ml?.gmaps || "",
    nombre: apt.customer?.firstName || "",
    negocio: settings?.businessName || "la barbería",
    codigo: apt.code,
    fecha: fechaLarga(apt.date),
    hora: hora12(apt.startTime),
    barbero: apt.staffName || "",
    servicio: (apt.items || []).map((i) => i.name).join(" + "),
    valor: cop(apt.totalCOP),
    abono: cop(apt.depositCOP),
    saldo: cop(apt.balanceDueCOP),
    direccion: settings?.showLocation === false ? "" : [settings?.address, settings?.city].filter(Boolean).join(", ")
  };
  return String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => (k in map ? map[k] : `{${k}}`));
}

// ---------- Disponibilidad ----------
// Devuelve [{time:"HH:mm", staffIds:[...]}] con las horas en que cabe el servicio.
// Horario de un profesional en una fecha: su horario propio o el del negocio, sin sus días libres
export function staffHours(settings, staff, date) {
  if (!settings || (settings.closedDates || []).includes(date)) return [];
  if (staff && (staff.offDates || []).includes(date)) return [];
  const d = String(dow(date));
  if (staff && staff.ownHours && staff.hours) return staff.hours[d] || [];
  return (settings.businessHours || {})[d] || [];
}
export function computeSlots({ settings, staffList, locks, date, totalMinutes, occupied, mainId, staffFilter, ignoreAptCode, forAdmin = false, ignoreBreaks = false }) {
  if (!settings || !date) return [];
  const now = bogNow();
  if (date < now.date) return [];
  if ((settings.closedDates || []).includes(date)) return [];
  if (!forAdmin && date > addDays(now.date, Number(settings.bookingWindowDays || 30))) return [];
  const slot = Number(settings.slotDurationMinutes || 30);
  const occ = occupied || Math.max(slot, Math.ceil(totalMinutes / slot) * slot);
  const minStart = date === now.date ? now.min + (forAdmin ? 0 : Number(settings.minAdvanceMinutes || 0)) : -1;
  const taken = new Set(
    locks.filter((l) => !(ignoreAptCode && l.appointmentId === ignoreAptCode) && !(ignoreBreaks && l.state === "break"))
      .map((l) => `${l.staffId}_${l.time}`)
  );
  const capable = staffList.filter((s) => s.active !== false
    && (!mainId || !s.serviceIds?.length || s.serviceIds.includes(mainId))
    && (!staffFilter || s.id === staffFilter));
  const result = new Map();
  for (const s of capable) {
    for (const h of staffHours(settings, s, date)) {
      const o = tmin(h.open), c = tmin(h.close);
      for (let t = o; t + occ <= c; t += slot) {
        if (t < minStart) continue;
        let free = true;
        for (let u = t; u < t + occ; u += UNIT) { if (taken.has(`${s.id}_${mstr(u)}`)) { free = false; break; } }
        if (free) { if (!result.has(t)) result.set(t, []); result.get(t).push(s.id); }
      }
    }
  }
  return [...result.entries()].sort((a, b) => a[0] - b[0]).map(([t, ids]) => ({ time: mstr(t), staffIds: ids }));
}

// Capacidad total del día en unidades de 15 min (para colorear el calendario mensual)
export function dayCapacityUnits(settings, staffList, date) {
  return staffList.filter((s) => s.active !== false).reduce((sum, s) =>
    sum + staffHours(settings, s, date).reduce((a, h) => a + Math.max(0, (tmin(h.close) - tmin(h.open)) / UNIT), 0), 0);
}

// ---------- Interfaz ----------
export function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.setAttribute("role", "status");
  el.className = `fixed left-1/2 bottom-6 z-[100] -translate-x-1/2 max-w-[92vw] rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${type === "error" ? "bg-pole-red text-white" : "bg-ink text-white"}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), type === "error" ? 6000 : 3500);
}
// ---------- Colores de la marca de cada tienda ----------
function hexRgb(h) { h = String(h || "").replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h || "000000", 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function lum(h) { const [r, g, b] = hexRgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }
export const onColor = (h) => (lum(h) > 0.45 ? "#111111" : "#ffffff");
export function darken(h, f) { return "#" + hexRgb(h).map((v) => Math.round(v * (1 - f)).toString(16).padStart(2, "0")).join(""); }
// Aplica los colores de la tienda (si los configuró) como variables CSS
export function applyBrandColors(ap) {
  const c = (ap && ap.colors) || {};
  const on = !!(c.header || c.primary || c.bg);
  document.body.classList.toggle("branded", on);
  if (!on) return;
  const header = c.header || "#17222E", primary = c.primary || "#24508A", bg = c.bg || "#EEF1EF";
  const st = document.body.style;
  st.setProperty("--b-header", header); st.setProperty("--b-on-header", onColor(header));
  st.setProperty("--b-primary", primary); st.setProperty("--b-on-primary", onColor(primary));
  st.setProperty("--b-primary-text", lum(primary) > 0.35 ? darken(primary, 0.45) : primary);
  st.setProperty("--b-bg", bg);
  const [r, g, b] = hexRgb(primary);
  st.setProperty("--b-primary-soft", `rgba(${r},${g},${b},.12)`);
  st.setProperty("--b-primary-line", `rgba(${r},${g},${b},.45)`);
}
// Despierta el servidor (Apps Script) antes de que el cliente aparte, para que responda más rápido
let warmAt = 0;
export function warmServer() {
  if (Date.now() - warmAt < 120000) return;
  warmAt = Date.now();
  fetch(API_URL, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}

// ---------- Versión de la página (como en Epic) ----------
// Lee la versión publicada en GitHub, sin usar la copia guardada del navegador
export async function readPublishedVersion() {
  const r = await fetch(new URL("common.js", location.href).href + "?comprobar=" + Date.now(), { cache: "no-store" });
  if (!r.ok) throw new Error("No se pudo revisar (" + r.status + ").");
  const m = (await r.text()).match(/APP_VERSION = '([^']+)'/);
  return m ? m[1] : null;
}
// Recarga sin usar la copia guardada (conserva ?b= del negocio)
export async function reloadFresh() {
  // Descarga de nuevo todos los archivos (sin la copia guardada) y luego recarga la página
  const files = ["index.html", "admin.html", "super.html", "common.js", "app.js", "admin.js", "super.js", "config.js", "theme.js", "styles.css"];
  await Promise.all(files.map((f) => fetch(new URL(f, location.href).href, { cache: "reload" }).catch(() => null)));
  location.reload();
}
// Al abrir y cada 30 minutos: si hay una versión nueva publicada, muestra el aviso para actualizar
export function startUpdateWatcher() {
  const check = async () => {
    try {
      const pub = await readPublishedVersion();
      if (!pub || !(pub > APP_VERSION) || document.getElementById("avisoVersionNueva")) return;
      try { if (sessionStorage.getItem("verCerrada") === pub) return; } catch { /* sin almacenamiento */ }
      const el = document.createElement("div");
      el.id = "avisoVersionNueva";
      el.className = "fixed bottom-24 left-1/2 z-[95] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2";
      el.innerHTML = `<div class="flex items-center gap-3 rounded-2xl bg-sky-600 p-3 text-white shadow-2xl">
        <p class="min-w-0 flex-grow text-xs font-bold leading-snug">Hay una versión nueva de la página con mejoras.</p>
        <button type="button" class="shrink-0 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-sky-700">Actualizar</button>
        <button type="button" aria-label="Cerrar" class="shrink-0 px-1 text-white/80">✕</button></div>`;
      el.querySelectorAll("button")[0].onclick = (e) => { e.target.textContent = "Actualizando…"; reloadFresh(); };
      el.querySelectorAll("button")[1].onclick = () => { try { sessionStorage.setItem("verCerrada", pub); } catch { /* nada */ } el.remove(); };
      document.body.appendChild(el);
    } catch { /* sin conexión: se revisa después */ }
  };
  setTimeout(check, 4000);
  setInterval(check, 30 * 60000);
}
// ---------- Ventanas propias (reemplazan los avisos del navegador) ----------
let BRAND = { name: "", logo: "" };
export function setDialogBrand(name, logo) { BRAND = { name: name || "", logo: logo || "" }; }
function brandRow() {
  if (!BRAND.name) return "";
  const ini = BRAND.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return `<div class="mb-3 flex items-center gap-2 border-b border-line pb-3">
    <span class="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-ink text-xs font-bold text-white">${BRAND.logo ? `<img src="${BRAND.logo}" alt="" class="h-full w-full object-cover">` : esc(ini)}</span>
    <span class="truncate text-sm font-semibold text-ink/70">${esc(BRAND.name)}</span></div>`;
}
function dialog({ title, message, input, okText = "Aceptar", cancelText = "Cancelar", danger = false, alertOnly = false }) {
  return new Promise((resolve) => {
    const wrap = document.createElement("div");
    wrap.className = "modal flex";
    wrap.style.zIndex = "120";
    wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true");
    wrap.innerHTML = `<div class="modal-card max-w-sm">
      ${brandRow()}
      ${title ? `<h3 class="mb-1 font-narrow text-xl font-bold">${esc(title)}</h3>` : ""}
      ${message ? `<p class="text-sm text-ink/75">${esc(message)}</p>` : ""}
      ${input !== undefined ? `<input class="dlg-in mt-3 w-full rounded-lg border border-line px-3 py-2.5" value="${esc(input)}">` : ""}
      <div class="mt-5 flex justify-end gap-2">
        ${alertOnly ? "" : `<button type="button" class="dlg-no btn-light text-sm">${esc(cancelText)}</button>`}
        <button type="button" class="dlg-ok ${danger ? "btn-primary !bg-pole-red" : "btn-primary"} text-sm">${esc(okText)}</button>
      </div></div>`;
    const inp = wrap.querySelector(".dlg-in");
    const okey = "dlg" + Date.now() + Math.random();
    let closed = false;
    const finish = (v) => { if (closed) return; closed = true; wrap.remove(); document.removeEventListener("keydown", key); resolve(v); };
    const done = (v) => { finish(v); dropOverlay(okey); };
    const key = (e) => { if (e.key === "Escape") done(input !== undefined ? null : false); if (e.key === "Enter" && inp) done(inp.value.trim()); };
    wrap.querySelector(".dlg-ok").onclick = () => done(input !== undefined ? inp.value.trim() : true);
    const no = wrap.querySelector(".dlg-no"); if (no) no.onclick = () => done(input !== undefined ? null : false);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) done(input !== undefined ? null : false); });
    document.addEventListener("keydown", key);
    document.body.appendChild(wrap);
    pushOverlay(okey, () => finish(input !== undefined ? null : false)); // atrás = cancelar
    (inp || wrap.querySelector(".dlg-ok")).focus();
    if (inp) inp.select();
  });
}
export const uiConfirm = (title, message, opts = {}) => dialog({ title, message, ...opts });
export const uiPrompt = (title, message, value = "", opts = {}) => dialog({ title, message, input: value, ...opts });
export const uiAlert = (title, message) => dialog({ title, message, alertOnly: true, okText: "Entendido" });

// Visor a pantalla completa (QR, comprobantes, logos): tocar para cerrar
export function viewImage(src, caption) {
  const wrap = document.createElement("div");
  wrap.className = "fixed inset-0 z-[130] flex flex-col items-center justify-center bg-black/90 p-4";
  wrap.innerHTML = `<button type="button" class="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-lg text-white" aria-label="Cerrar">✕</button>
    <img src="${src}" alt="${esc(caption || "Imagen")}" class="max-h-[85vh] max-w-full rounded-xl bg-white object-contain p-2">
    ${caption ? `<p class="mt-3 text-center text-sm text-white/80">${esc(caption)}</p>` : ""}`;
  const vkey = "img" + Date.now();
  let gone = false;
  const hide = () => { if (gone) return; gone = true; wrap.remove(); document.removeEventListener("keydown", key); };
  const close = () => { hide(); dropOverlay(vkey); };
  const key = (e) => { if (e.key === "Escape") close(); };
  wrap.onclick = close; document.addEventListener("keydown", key);
  document.body.appendChild(wrap);
  pushOverlay(vkey, hide);
}

// ---------- Botón "atrás": cada ventana abierta es un paso del historial ----------
// Atrás (del celular o del navegador) cierra la ventana de encima; si no hay ventanas, vuelve a la sección anterior.
const OVERLAYS = [];
let skipPops = 0, navHandler = null;
export function pushOverlay(key, close) {
  OVERLAYS.push({ key, close });
  try { history.pushState({ ...(history.state || {}), ov: key, n: OVERLAYS.length }, ""); } catch { /* sin historial */ }
}
export function dropOverlay(key) {
  for (let i = OVERLAYS.length - 1; i >= 0; i--) {
    if (OVERLAYS[i].key === key) { OVERLAYS.splice(i, 1); skipPops++; try { history.back(); } catch { skipPops--; } return; }
  }
}
export function setNavHandler(fn) { navHandler = fn; }
export function pushNav(state) { try { history.pushState(state, ""); } catch { /* sin historial */ } }
export function replaceNav(state) { try { history.replaceState(state, ""); } catch { /* sin historial */ } }
addEventListener("popstate", (e) => {
  if (skipPops > 0) { skipPops--; return; }
  const top = OVERLAYS.pop();
  if (top) { try { top.close(); } catch { /* nada */ } return; }
  if (navHandler) navHandler(e.state || {});
});
function hideModal(id) { const m = document.getElementById(id); if (!m) return; m.classList.add("hidden"); m.classList.remove("flex"); }
export function openModal(id) {
  const m = document.getElementById(id); if (!m) return;
  const wasOpen = !m.classList.contains("hidden");
  m.classList.remove("hidden"); m.classList.add("flex");
  if (!wasOpen) pushOverlay("modal:" + id, () => hideModal(id));
}
export function closeModal(id) {
  const m = document.getElementById(id); if (!m) return;
  const wasOpen = !m.classList.contains("hidden");
  hideModal(id);
  if (wasOpen) dropOverlay("modal:" + id);
}
export function setBusy(btn, busy, text) {
  if (!btn) return;
  if (busy) { btn.dataset.label = btn.textContent; btn.textContent = text || "Procesando…"; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast("Copiado: " + text); }
  catch { uiPrompt("Copia este texto", "Mantén presionado el texto para copiarlo.", text, { okText: "Listo", cancelText: "Cerrar" }); }
}

// Número de cuenta de pago: Nequi, Daviplata, Bancolombia… solo números; la llave Bre-B sí admite letras
export const isKeyMethod = (label) => /bre-?b|llave/i.test(String(label || ""));
export function payAccountInput(input, label) {
  if (!input) return;
  const key = isKeyMethod(label);
  input.setAttribute("inputmode", key ? "text" : "numeric");
  input.setAttribute("autocomplete", "off");
  input.placeholder = key ? "@tullave, correo, cédula o celular" : "Solo números, ej. 3001234567";
  if (!key) { const d = input.value.replace(/\D/g, ""); if (d !== input.value) input.value = d; }
}

// Tipos de negocio (y cómo se llama su equipo). "otro" deja escribir el nombre propio.
export const BIZ_TYPES = [
  ["barberia", "Barbería", "Barbero", "💈"], ["peluqueria", "Peluquería", "Estilista", "✂️"], ["salon", "Salón de belleza", "Estilista", "💇"],
  ["unas", "Uñas", "Manicurista", "💅"], ["pestanas", "Cejas y pestañas", "Especialista", "👁️"], ["estetica", "Estética / facial", "Esteticista", "🧴"],
  ["spa", "Spa", "Terapeuta", "🧖"], ["masajes", "Masajes", "Masajista", "💆"], ["maquillaje", "Maquillaje", "Maquillador(a)", "💄"],
  ["tatuajes", "Tatuajes y piercing", "Tatuador(a)", "🖋️"], ["mascotas", "Peluquería de mascotas", "Groomer", "🐶"], ["otro", "Otro (escríbelo)", "Profesional", "➕"]
];
export const bizTypeName = (st = {}) => st.businessType === "otro" ? (st.businessTypeLabel || "Otro") : ((BIZ_TYPES.find((t) => t[0] === st.businessType) || BIZ_TYPES[0])[1]);
export const staffWord = (type) => (BIZ_TYPES.find((t) => t[0] === type) || BIZ_TYPES[0])[2];
// Guardar sin hacer esperar: si en medio segundo no ha respondido, sigue y avisa solo si falla
export function fastSave(promise, onLateError) {
  let failed = null, moved = false;
  Promise.resolve(promise).catch((e) => { failed = e; if (moved) onLateError?.(e); });
  return new Promise((resolve, reject) => {
    Promise.resolve(promise).then(resolve, reject);              // si responde rápido, se usa su respuesta
    setTimeout(() => { if (failed) return reject(failed); moved = true; resolve(); }, 500); // si tarda, se sigue y solo avisa si falla
  });
}

// ---------- Planes (Gratis, Básico, Gold): los define el superusuario en su panel ----------
export const PLAN_KEYS = ["free", "basic", "gold"];
export const PLAN_FEATURES = [
  ["telegram", "Avisos en Telegram (reservas, abonos y recordatorios)"],
  ["appearance", "Portada, colores y apariencia de la página"],
  ["clients", "Clientes: historial, preferenciales y bloqueos"],
  ["images", "Imágenes con horarios para estados"],
  ["marketing", "Marketing: llenar huecos, estados en el logo y avisos"],
  ["activity", "Actividad de la página y recomendaciones"],
  ["whatsapp", "Citas por WhatsApp (bot en el celular de la tienda)"]
];
export const DEFAULT_PLANS = {
  free: { name: "Prueba gratis", priceCOP: 0, days: 15, daysAhead: 5, maxStaff: 1, features: [], tagline: "Para empezar a recibir citas", tgEvents: [], tgChoose: false },
  basic: { name: "Básico", priceCOP: 20000, daysAhead: 30, maxStaff: 3, features: ["telegram", "appearance", "clients", "images"], tagline: "Tu marca y tus clientes", tgEvents: ["newBooking"], tgChoose: false },
  gold: { name: "Gold", priceCOP: 35000, daysAhead: 90, maxStaff: 0, features: ["telegram", "appearance", "clients", "images", "marketing", "activity", "whatsapp"], tagline: "Todo para llenar tu agenda", tgEvents: ["newBooking", "proof", "cancel", "reschedule", "reminder", "panelApt", "breaks", "noShow"], tgChoose: true }
};
export function plansOf(plat = {}) {
  const out = {};
  PLAN_KEYS.forEach((k) => { out[k] = { ...DEFAULT_PLANS[k], ...((plat.plans || {})[k] || {}) }; });
  if (!plat.plans && plat.trialDays) out.free.days = Number(plat.trialDays);
  if (!out.free.name || out.free.name === "Gratis") out.free.name = "Prueba gratis";
  out.free.days = Math.min(365, Math.max(1, Number(out.free.days || 15))); // la define el superusuario (15 por defecto)
  return out;
}
// Lo que se les dice al suscribirse (una línea por beneficio); el superusuario lo edita en Cobros > Planes
export const DEFAULT_BENEFITS = {
  free: ["📅 Tu página para que te agenden en línea", "⚡ Cita rápida y atender ahora", "💳 Cobro de abonos con Nequi o Bre-B"],
  basic: ["🎨 Tu marca: portada, colores y logo", "🔔 Aviso en Telegram de cada reserva", "🗂️ Tus clientes: historial, preferenciales y bloqueos", "🖼️ Imágenes con tus horarios libres", "👥 Hasta 3 profesionales y reservas hasta 30 días"],
  gold: ["🎨 Estados PRO: 8 diseños con tu logo", "📲 Publícalos en tu estado de WhatsApp con un toque", "📣 Marketing para llenar tus huecos libres", "🔔 Tú eliges qué avisos de Telegram recibir", "👥 Equipo sin límite y reservas hasta 90 días"]
};
// frase antes de la lista: cada plan muestra solo lo que suma sobre el anterior
export const DEFAULT_BENEFITS_INTRO = { free: "", basic: "Todo lo del plan Gratis, y además:", gold: "Todo lo de Básico, y además:" };
const OLD_GOLD = "🎨 Estados PRO: 8 diseños con tu logo|📲 Publícalos en tu estado de WhatsApp con un toque|📣 Marketing para llenar tus huecos libres|🔔 Eliges qué avisos de Telegram recibir|📊 Actividad de tu página y recomendaciones|👥 Equipo sin límite · reservas hasta 90 días";
const OLD_BASIC_END = "👥 Hasta 3 profesionales · reservas hasta 30 días";
export function planBenefits(plans, k) {
  const b = plans[k]?.benefits;
  if (!Array.isArray(b) || !b.length) return DEFAULT_BENEFITS[k] || [];
  if (k === "gold" && b.join("|") === OLD_GOLD) return DEFAULT_BENEFITS.gold; // lista vieja guardada sin cambios
  if (k === "basic" && b[b.length - 1] === OLD_BASIC_END && b.length === 5) return DEFAULT_BENEFITS.basic;
  return b;
}
export const planBenefitsIntro = (plans, k) => (typeof plans[k]?.benefitsIntro === "string" ? plans[k].benefitsIntro : DEFAULT_BENEFITS_INTRO[k] || "");
// tiendas antiguas sin plan: en prueba = Gratis; las que ya pagaban = Gold
export const planOfBiz = (biz = {}) => (PLAN_KEYS.includes(biz.plan) ? biz.plan : biz.trial ? "free" : "gold");
export function planPriceOf(plat, plan, months) {
  const price = Number(plansOf(plat)[plan].priceCOP || 0), base = price * months;
  let off = Number((plat.planDiscounts || {})[months] || 0);
  if (!off && plat.planBundles?.[months] && plat.planPriceCOP) off = Math.max(0, Math.round((1 - plat.planBundles[months] / (plat.planPriceCOP * months)) * 100));
  return months === 1 || !off ? base : Math.round((base * (1 - off / 100)) / 100) * 100;
}
export const DEFAULT_PAY_WARNING = "Ni un peso más ni uno menos. Así tu pago se reconoce solo y tu plan se activa de inmediato. Si envías otro valor, tendremos que revisarlo a mano y puede tardar.";

// Categorías de avisos de Telegram (qué trae cada plan lo decide el superusuario)
export const TG_EVENTS = [
  ["newBooking", "📅", "Nueva reserva"], ["proof", "💳", "Abono por revisar (con botón Aprobar)"], ["cancel", "🚫", "Cancelaciones"],
  ["reschedule", "🔁", "Cambios de hora"], ["reminder", "⏰", "Recordatorio antes de cada cita"], ["panelApt", "📝", "Citas agendadas desde el panel"],
  ["breaks", "☕", "Descansos del equipo"], ["noShow", "⚠️", "Clientes que no llegan"]
];

// ---------- Correo: completar el dominio y avisar errores comunes (en todos los campos de correo) ----------
const MAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "live.com"];
const MAIL_TYPOS = { "gmial.com": "gmail.com", "gmal.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com", "hotmal.com": "hotmail.com", "hotmial.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com", "outlok.com": "outlook.com", "yaho.com": "yahoo.com", "yahoo.co": "yahoo.com", "icloud.co": "icloud.com" };
function mailBox(input) {
  let box = input.parentElement.querySelector(".mail-sug");
  if (!box) { box = document.createElement("div"); box.className = "mail-sug"; input.insertAdjacentElement("afterend", box); }
  return box;
}
if (typeof document !== "undefined") {
  document.addEventListener("input", (e) => {
    const t = e.target; if (!(t instanceof HTMLInputElement) || t.type !== "email") return;
    t.setAttribute("inputmode", "email"); t.setAttribute("autocapitalize", "off"); t.setAttribute("spellcheck", "false");
    const v = t.value.trim().toLowerCase(), at = v.indexOf("@"), box = mailBox(t);
    if (at < 1) { box.innerHTML = ""; return; }
    const user = v.slice(0, at), dom = v.slice(at + 1);
    const opts = MAIL_DOMAINS.filter((d) => d.startsWith(dom) && d !== dom).slice(0, 4);
    box.innerHTML = opts.map((d) => `<button type="button" data-mail="${user}@${d}">@${d}</button>`).join("");
  });
  // tocar una sugerencia no le quita el foco al campo (si no, el aviso la reemplazaría antes del toque)
  document.addEventListener("mousedown", (e) => { if (e.target.closest?.("[data-mail]")) e.preventDefault(); });
  document.addEventListener("click", (e) => {
    const b = e.target.closest?.("[data-mail]"); if (!b) return;
    const input = b.closest(".mail-sug")?.previousElementSibling; if (!input) return;
    input.value = b.dataset.mail; b.parentElement.innerHTML = ""; input.dispatchEvent(new Event("change", { bubbles: true })); input.focus();
  });
  document.addEventListener("focusout", (e) => {
    const t = e.target; if (!(t instanceof HTMLInputElement) || t.type !== "email") return;
    const v = t.value.trim().toLowerCase(), at = v.indexOf("@"); if (at < 1) return;
    const dom = v.slice(at + 1), fix = MAIL_TYPOS[dom], box = mailBox(t);
    if (fix) box.innerHTML = `<button type="button" class="fix" data-mail="${v.slice(0, at)}@${fix}">¿Quisiste decir <b>${v.slice(0, at)}@${fix}</b>?</button>`;
    else if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(v)) box.innerHTML = `<span class="bad">Revisa tu correo: parece incompleto.</span>`;
    else setTimeout(() => { if (document.activeElement !== t) box.innerHTML = ""; }, 200);
  });
}
