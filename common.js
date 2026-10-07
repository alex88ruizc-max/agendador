// Utilidades compartidas entre la página pública y el panel de administración
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig, API_URL, DEFAULT_BUSINESS_ID } from "./config.js";

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
export function computeSlots({ settings, staffList, locks, date, totalMinutes, occupied, mainId, staffFilter, ignoreAptCode, forAdmin = false, ignoreBreaks = false }) {
  if (!settings || !date) return [];
  const now = bogNow();
  if (date < now.date) return [];
  if ((settings.closedDates || []).includes(date)) return [];
  if (!forAdmin && date > addDays(now.date, Number(settings.bookingWindowDays || 30))) return [];
  const slot = Number(settings.slotDurationMinutes || 30);
  const occ = occupied || Math.max(slot, Math.ceil(totalMinutes / slot) * slot);
  const hours = (settings.businessHours || {})[String(dow(date))] || [];
  const minStart = date === now.date ? now.min + (forAdmin ? 0 : Number(settings.minAdvanceMinutes || 0)) : -1;
  const taken = new Set(
    locks.filter((l) => !(ignoreAptCode && l.appointmentId === ignoreAptCode) && !(ignoreBreaks && l.state === "break"))
      .map((l) => `${l.staffId}_${l.time}`)
  );
  const capable = staffList.filter((s) => s.active !== false
    && (!mainId || !s.serviceIds?.length || s.serviceIds.includes(mainId))
    && (!staffFilter || s.id === staffFilter));
  const result = new Map();
  for (const h of hours) {
    const o = tmin(h.open), c = tmin(h.close);
    for (let t = o; t + occ <= c; t += slot) {
      if (t < minStart) continue;
      for (const s of capable) {
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
  if (!settings || (settings.closedDates || []).includes(date)) return 0;
  const hours = (settings.businessHours || {})[String(dow(date))] || [];
  const perStaff = hours.reduce((a, h) => a + Math.max(0, (tmin(h.close) - tmin(h.open)) / UNIT), 0);
  return perStaff * staffList.filter((s) => s.active !== false).length;
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
export function openModal(id) { const m = document.getElementById(id); m.classList.remove("hidden"); m.classList.add("flex"); }
export function closeModal(id) { const m = document.getElementById(id); m.classList.add("hidden"); m.classList.remove("flex"); }
export function setBusy(btn, busy, text) {
  if (!btn) return;
  if (busy) { btn.dataset.label = btn.textContent; btn.textContent = text || "Procesando…"; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast("Copiado: " + text); }
  catch { prompt("Copia este texto:", text); }
}
