// Utilidades compartidas entre la página pública y el panel de administración
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, API_URL, DEFAULT_BUSINESS_ID } from "./config.js?v=2026-10-08p";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Barbería activa (viene del enlace: ?b=identificador)
export let BID = "";
export function setBusiness(id) { BID = String(id || "").trim().toLowerCase(); }
export function businessFromUrl() {
  return (new URLSearchParams(location.search).get("b") || DEFAULT_BUSINESS_ID || "").trim().toLowerCase();
}
export const bpath = (...parts) => ["businesses", BID, ...parts].join("/");

// Versión de la página: cámbiala en cada actualización para comprobar que se publicó
export const APP_VERSION = '2026-10-08p';

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
Si necesitas cancelar o reprogramar, avísanos con al menos 2 horas de anticipación. ¡Te esperamos!`;

export const DEFAULT_WA_RESCHEDULE =
`Hola {nombre}, te escribimos de {negocio}. Por un imprevisto no podremos atenderte el {fecha} a las {hora}. ¿Te sirve otra hora? Tu abono queda guardado para la nueva cita. Reserva: {codigo}`;

export function fillTemplate(tpl, apt, settings) {
  const map = {
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
    direccion: [settings?.address, settings?.city].filter(Boolean).join(", ")
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
    const done = (v) => { wrap.remove(); document.removeEventListener("keydown", key); resolve(v); };
    const key = (e) => { if (e.key === "Escape") done(input !== undefined ? null : false); if (e.key === "Enter" && inp) done(inp.value.trim()); };
    wrap.querySelector(".dlg-ok").onclick = () => done(input !== undefined ? inp.value.trim() : true);
    const no = wrap.querySelector(".dlg-no"); if (no) no.onclick = () => done(input !== undefined ? null : false);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) done(input !== undefined ? null : false); });
    document.addEventListener("keydown", key);
    document.body.appendChild(wrap);
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
  const close = () => { wrap.remove(); document.removeEventListener("keydown", key); };
  const key = (e) => { if (e.key === "Escape") close(); };
  wrap.onclick = close; document.addEventListener("keydown", key);
  document.body.appendChild(wrap);
}

export function openModal(id) { const m = document.getElementById(id); m.classList.remove("hidden"); m.classList.add("flex"); }
export function closeModal(id) { const m = document.getElementById(id); m.classList.add("hidden"); m.classList.remove("flex"); }
export function setBusy(btn, busy, text) {
  if (!btn) return;
  if (busy) { btn.dataset.label = btn.textContent; btn.textContent = text || "Procesando…"; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast("Copiado: " + text); }
  catch { uiPrompt("Copia este texto", "Mantén presionado el texto para copiarlo.", text, { okText: "Listo", cancelText: "Cerrar" }); }
}
