// Página pública: ver cupos, registrarse, apartar, pagar con screenshot, mis cupos
import { BIZ_TYPES, PLAN_KEYS, plansOf, planOfBiz, planBenefits, planBenefitsIntro } from "./common.js?v=2026-10-10h";
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, getDocs, updateDoc, collection, query, where, onSnapshot, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  startUpdateWatcher, applyBrandColors, warmServer, uiConfirm, setDialogBrand, viewImage, pushOverlay, dropOverlay, db, auth, bpath, api, setBusiness, businessFromUrl, bogNow, addDays, dow, hora12, fechaLarga, fechaCorta, toMillis, cop, esc,
  normalizePhone, waLink, statusBadge, fillTemplate, DEFAULT_WA_CONFIRM, computeSlots, dayCapacityUnits, staffHours, mapLinks, headerBgCss,
  toast, openModal, closeModal, setBusy, copyText, tmin, mstr, UNIT
} from "./common.js?v=2026-10-10h";

const $ = (id) => document.getElementById(id);
const S = {
  settings: null, services: [], staff: [], user: null, profile: null, mine: [],
  mainId: null, extras: new Set(), staffId: "", date: null, time: null, slotStaff: [],
  month: bogNow().date.slice(0, 7), monthAvail: {}, dayLocks: [],
  pendingBooking: false, registering: false, payApt: null, payTimer: null, resched: null,
  biz: null, cust: null, consentOk: false
};
const onErr = (e) => { console.error(e); toast("No se pudo cargar la información. Revisa la configuración de Firebase.", "error"); };

// ================= Barbería del enlace =================
const BIZ_ID = businessFromUrl();
function showUnavailable(title, text) {
  S.dead = true; $("gate").classList.add("hidden"); $("bizLogoWrap").classList.add("hidden");
  $("unTitle").textContent = title; $("unText").textContent = text;
  $("unavailable").classList.remove("hidden");
  $("mainContent").classList.add("hidden");
  $("bookBar").classList.add("hidden");
}
if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(BIZ_ID)) {
  showUnavailable("Agenda tus citas en línea", "Si buscas un negocio, abre el enlace que te compartieron. Si tienes un negocio, crea tu propia agenda aquí abajo.");
} else {
  setBusiness(BIZ_ID);
}

// ================= Datos en tiempo real =================
function boot() {
onSnapshot(doc(db, "businesses", BIZ_ID), (s) => {
  if (!s.exists()) { showUnavailable("No encontramos este negocio", "Revisa que el enlace esté completo."); return; }
  S.biz = s.data();
  const off = S.biz.status !== "active";
  $("closedBanner").classList.toggle("hidden", !off);
  $("btnBook").classList.toggle("hidden", off);
  if (off) $("summary").innerHTML = `<span class="font-semibold text-pole-red">Las reservas en línea no están disponibles por ahora.</span>`;
}, onErr);

onSnapshot(doc(db, bpath("settings", "general")), (s) => {
  S.settings = s.data() || null;
  if (!S.date) { S.date = bogNow().date; S.month = S.date.slice(0, 7); }
  subscribeAvail(); subscribeDay(S.date);
  renderBiz(); renderStaff(); renderAll(); updateGate();
}, onErr);

onSnapshot(collection(db, bpath("services")), (q) => {
  S.services = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  renderServices(); renderSummary();
}, onErr);

onSnapshot(collection(db, bpath("staff")), (q) => {
  S.staff = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  renderStaff(); renderAll();
}, onErr);

setInterval(() => { renderStaff(); renderSlots(); }, 60000); // refresca horas y estados cada minuto
renderNav(); renderSummary();
}

let unsubAvail = null, availKey = "", unsubDay = null, dayKey = "", unsubMine = null, unsubCust = null;
// Ocupación de todos los días que se pueden reservar (para la tira de días y el mes)
function subscribeAvail() {
  const from = bogNow().date, to = maxDate();
  if (availKey === from + to) return;
  availKey = from + to; unsubAvail?.();
  unsubAvail = onSnapshot(query(collection(db, bpath("dayAvailability")), where("date", ">=", from), where("date", "<=", to)), (q) => {
    S.monthAvail = {};
    q.forEach((d) => { S.monthAvail[d.id] = d.data(); });
    renderCalendar(); renderSlots();
  }, onErr);
}
function subscribeDay(date) {
  if (!date || dayKey === date) return;
  dayKey = date; unsubDay?.(); S.dayLocks = [];
  unsubDay = onSnapshot(query(collection(db, bpath("slotLocks")), where("date", "==", date)), (q) => {
    S.dayLocks = q.docs.map((d) => d.data());
    renderSlots(); renderServices(); renderSummary();
  }, onErr);
}

// ================= Sesión =================
onAuthStateChanged(auth, async (u) => {
  S.user = u;
  if (u && /^[a-z0-9][a-z0-9-]{1,29}$/.test(BIZ_ID)) {
    if (!S.registering) await loadProfile();
    subscribeMine();
    unsubCust?.();
    unsubCust = onSnapshot(doc(db, bpath("customers", u.uid)), (s) => { S.cust = s.exists() ? s.data() : null; renderSummary(); }, () => { S.cust = null; });
  } else {
    S.profile = null; S.cust = null; S.mine = []; unsubMine?.(); unsubCust?.();
  }
  S.authReady = true;
  updateGate(); renderNav(); renderSummary();
});

// Registro previo: sin cuenta (o sin datos completos) se muestra el registro en lugar de la agenda
function updateGate() {
  if (S.dead) return;
  if (S.user && S.profile) warmServer();
  const need = S.authReady && (!S.user || !S.profile);
  // agenda abierta: se ve sin registrarse; el registro se pide solo al apartar
  const open = S.settings?.agendaMode === "open";
  const showGate = need && (!open || S.wantBook);
  if (S.authReady) presence(showGate ? "register" : (S.time ? "service" : "hours"));
  $("gate").classList.toggle("hidden", !showGate);
  $("mainContent").classList.toggle("hidden", (need && !open) || !S.authReady);
  $("bookBar").classList.toggle("hidden", (need && !open) || !S.authReady);
  if (!need && S.wantBook) { S.wantBook = false; setTimeout(() => { $("bookBar").scrollIntoView({ behavior: "smooth", block: "center" }); if (S.mainId && S.time) $("btnBook").click(); }, 500); }
  if (need && S.user && !S.profile) { // tiene cuenta pero le faltan datos
    setAuthTab("register");
    const f = $("registerForm");
    f.email.value = S.user.email || ""; f.email.readOnly = true;
    f.password.closest("label").classList.add("hidden"); f.password.required = false;
    $("authTitle").textContent = "Completa tus datos";
  }
}

async function loadProfile() {
  try {
    const snap = await getDoc(doc(db, "users", S.user.uid));
    S.profile = snap.exists() ? snap.data() : null;
  } catch (e) { console.error(e); S.profile = null; }
}

function subscribeMine() {
  unsubMine?.();
  unsubMine = onSnapshot(query(collection(db, bpath("appointments")), where("customerUid", "==", S.user.uid)), (q) => {
    S.mine = q.docs.map((d) => d.data()).sort((a, b) => toMillis(b.startAt) - toMillis(a.startAt));
    renderMine(); renderNav();
  }, (e) => console.error(e));
}

// ================= Render =================
// Textos que el dueño puede cambiar en Apariencia (si los deja vacíos se usan estos)
const TXT = {
  calendarTitle: "Selecciona día y horario", bookButton: "Apartar cupo", welcome: "",
  registerTitle: "Crea tu cuenta", registerSub: "Regístrate una sola vez para ver la agenda y apartar tus citas.",
  payNote: "En el mensaje de la transferencia escribe tu nombre. Tu número de reserva te llega al confirmar el pago.", confirmedTitle: "Tu turno fue confirmado"
};
const T = (k) => ((S.settings?.appearance?.texts || {})[k] || "").trim() || TXT[k];
function renderBiz() {
  const s = S.settings || {}, ap = s.appearance || {};
  const promoOn = s.promo?.text && s.promo.until >= bogNow().date;
  $("promoBar").classList.toggle("hidden", !promoOn);
  if (promoOn) $("promoBar").textContent = "🔥 " + s.promo.text;
  $("bizName").textContent = s.businessName || "Reserva tu cita";
  // redes sociales del negocio como íconos de marca
  const SOC = [["instagram", "fa-instagram", "Instagram"], ["facebook", "fa-facebook-f", "Facebook"], ["tiktok", "fa-tiktok", "TikTok"], ["youtube", "fa-youtube", "YouTube"]];
  const soc = s.showSocial === false ? [] : SOC.filter(([k]) => /^https?:\/\//.test(s.social?.[k] || ""));
  $("bizSocial").innerHTML = soc.map(([k, ic, t]) => `<a href="${esc(s.social[k])}" target="_blank" rel="noopener" aria-label="${t} de ${esc(s.businessName || "")}"><i class="fa-brands ${ic}"></i></a>`).join("");
  $("bizSocial").classList.toggle("hidden", !soc.length); $("bizSocial").classList.toggle("flex", !!soc.length);
  const ml = mapLinks(s);
  // la dirección sale aparte, en su propia franja con botones para llegar
  $("bizAddress").textContent = "";
  $("locBar").classList.toggle("hidden", !ml); $("locBar").classList.toggle("flex", !!ml);
  if (ml) {
    $("locAddr").textContent = s.address || "Ver en el mapa";
    $("locCity").textContent = [s.city, s.geo ? "Ubicación exacta" : ""].filter(Boolean).join(" · ");
    $("locWaze").href = ml.waze; $("locMaps").href = ml.gmaps;
    $("locWaze").setAttribute("aria-label", "Cómo llegar con Waze a " + (s.businessName || "el negocio"));
    $("locMaps").setAttribute("aria-label", "Cómo llegar con Google Maps a " + (s.businessName || "el negocio"));
  }
  $("bizSlogan").textContent = ap.slogan || "";
  $("bizSlogan").classList.toggle("hidden", !ap.slogan);
  const logo = $("bizLogo");
  logo.innerHTML = ap.logo ? `<img src="${ap.logo}" alt="Logo de ${esc(s.businessName || "")}" class="h-full w-full object-cover">`
    : esc((s.businessName || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase());
  document.title = (s.businessName ? s.businessName + " · " : "") + "Reserva tu cita";
  if (s.habeasDataText) $("habeasText").textContent = s.habeasDataText;
  applyBrandColors(ap);
  // imagen de fondo del encabezado (degradada)
  const hdr = document.querySelector("header"), bgCss = headerBgCss(ap.colors?.header, ap.headerBg);
  hdr.classList.toggle("no-pole", (s.businessType || "barberia") !== "barberia");
  hdr.style.background = bgCss || ""; hdr.classList.toggle("has-photo", !!bgCss);
  setDialogBrand(s.businessName, ap.logo);
  $("h-day").textContent = T("calendarTitle");
  if (!$("btnBook").dataset.label) $("btnBook").textContent = T("bookButton");
  $("welcomeMsg").textContent = T("welcome"); $("welcomeMsg").classList.toggle("hidden", !T("welcome"));
  $("authSub").textContent = T("registerSub");
  if (!$("registerForm").classList.contains("hidden") && !(S.user && !S.profile)) $("authTitle").textContent = T("registerTitle");
}

function renderNav() {
  const nav = $("nav");
  if (S.user) {
    const active = S.mine.filter((a) => ["pending_payment", "pending_verification", "confirmed"].includes(a.status)).length;
    nav.innerHTML = `<button id="btnLogout" class="logout-round" aria-label="Salir" title="Salir"><i class="fa-solid fa-power-off"></i></button>`;
    // "Mi cuenta" va en la línea de las redes sociales, a la izquierda
    $("btnMine").innerHTML = `<i class="fa-regular fa-user"></i>Mi cuenta${active ? ` <span class="rounded-full bg-pole-red px-1.5 text-[10px] text-white">${active}</span>` : ""}`;
    $("btnMine").classList.remove("hidden"); $("btnMine").classList.add("inline-flex");
    $("btnMine").onclick = () => openAccount("citas");
    $("btnLogout").onclick = () => signOut(auth);
  } else {
    $("btnMine").classList.add("hidden"); $("btnMine").classList.remove("inline-flex");
    nav.innerHTML = `
      <button id="btnLogin" class="btn-ghost text-sm text-white/80">Ingresar</button>`;
    $("btnLogin").onclick = () => openAuth("login");
  }
}

function staffIsBusy(s) { return s.status === "busy" && toMillis(s.busyUntil) > Date.now(); }
function busyUntilLabel(s) {
  const d = new Date(toMillis(s.busyUntil));
  return d.toLocaleTimeString("es-CO", { timeZone: "America/Bogota", hour: "numeric", minute: "2-digit" });
}
const staffLabel = () => S.settings?.staffLabel || "Profesional";

function renderStaff() {
  // Estado en vivo: solo si la barbería lo activó. Nunca dice si está en descanso o atendiendo, solo cuándo queda libre.
  const live = !!S.settings?.showLiveStatus && S.staff.length > 0;
  $("liveStatus").classList.toggle("hidden", !live);
  $("staffStatus").innerHTML = live ? S.staff.map((s) => staffIsBusy(s)
    ? `<span class="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"><i class="dot bg-pole-red"></i><b>${esc(s.name)}</b> libre a las ${busyUntilLabel(s)}</span>`
    : `<span class="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"><i class="dot bg-emerald-500"></i><b>${esc(s.name)}</b> libre ahora</span>`
  ).join("") : "";
  if (S.staffId && !S.staff.some((s) => s.id === S.staffId)) S.staffId = "";
  $("staffPick").classList.toggle("hidden", S.staff.length < 2);
  $("staffPick").innerHTML = `<span class="self-center text-sm text-ink/70">${esc(staffLabel())}:</span>` +
    [`<button class="chip" data-staff="" aria-pressed="${!S.staffId}">Cualquiera <span class="chip-n" data-cnt="">·</span></button>`]
      .concat(S.staff.map((s) => `<button class="chip" data-staff="${esc(s.id)}" aria-pressed="${S.staffId === s.id}">${esc(s.name)} <span class="chip-n" data-cnt="${esc(s.id)}">·</span></button>`)).join("");
  updateStaffCounts();
}
$("staffPick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-staff]"); if (!b) return;
  S.staffId = b.dataset.staff; S.time = null;
  renderStaff(); renderAll();
});

// ---------- Cálculo de cupos ----------
const slotLen = () => Number(S.settings?.slotDurationMinutes || 30);
// En prueba gratis la tienda solo recibe reservas hasta 5 días adelante
const maxDate = () => addDays(bogNow().date, Math.min(Number(plansOf(PLAT || {})[planOfBiz(S.biz || {})].daysAhead || 30), Number(S.settings?.bookingWindowDays || 30)));
const staffPool = () => S.staff.filter((s) => !S.staffId || s.id === S.staffId);
const hoursOfStaff = (s, date) => staffHours(S.settings, s, date);
// Cerrado si ningún profesional (del filtro) atiende ese día
const isClosed = (date) => !S.settings || (S.settings.closedDates || []).includes(date) || !staffPool().some((s) => hoursOfStaff(s, date).length);
function firstOpenDay() {
  const today = bogNow().date, end = maxDate();
  for (let d = today; d <= end; d = addDays(d, 1)) if (!isClosed(d)) return d;
  return today;
}
const takenSet = () => new Set(S.dayLocks.map((l) => `${l.staffId}_${l.time}`));
// Todos los cupos del día con los profesionales libres en cada uno
function dayGrid(all) {
  if (!S.settings || !S.date || (!all && isClosed(S.date))) return [];
  const now = bogNow(); if (S.date < now.date) return [];
  const slot = slotLen(), taken = takenSet();
  const minStart = S.date === now.date ? now.min + Number(S.settings.minAdvanceMinutes || 0) : -1;
  const map = new Map();
  for (const s of (all ? S.staff : staffPool())) {
    for (const h of hoursOfStaff(s, S.date)) {
      const o = tmin(h.open), c = tmin(h.close);
      for (let t = o; t + slot <= c; t += slot) {
        if (t < minStart) continue;
        let ok = true; for (let u = t; u < t + slot; u += UNIT) if (taken.has(`${s.id}_${mstr(u)}`)) { ok = false; break; }
        if (!map.has(t)) map.set(t, []);
        if (ok) map.get(t).push(s.id);
      }
    }
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([t, free]) => ({ time: mstr(t), free }));
}
// Minutos seguidos libres de un profesional desde una hora
function freeFrom(staffId, time) {
  const t = tmin(time), taken = takenSet();
  const s = S.staff.find((x) => x.id === staffId);
  const iv = hoursOfStaff(s, S.date).map((h) => [tmin(h.open), tmin(h.close)]).find(([o, c]) => t >= o && t < c);
  if (!iv) return 0;
  let u = t; while (u < iv[1] && !taken.has(`${staffId}_${mstr(u)}`)) u += UNIT;
  return u - t;
}
const occFor = (minutes) => Math.max(slotLen(), Math.ceil(minutes / slotLen()) * slotLen());
// Profesionales que pueden atender un servicio de X minutos en la hora elegida
function staffThatFit(mainId, minutes) {
  if (!S.time) return [];
  const need = occFor(minutes);
  return staffPool().filter((s) => (!mainId || !s.serviceIds?.length || s.serviceIds.includes(mainId)) && freeFrom(s.id, S.time) >= need).map((s) => s.id);
}

function renderAll() { renderCalendar(); renderSlots(); renderServices(); renderSummary(); }

// ---------- Calendario del mes ----------
function dayRatio(date) {
  const staffForCap = S.staffId ? S.staff.filter((s) => s.id === S.staffId) : S.staff;
  const cap = dayCapacityUnits(S.settings, staffForCap, date);
  const units = S.monthAvail[date]?.units || {};
  const booked = S.staffId ? Number(units[S.staffId] || 0) : Object.values(units).reduce((a, n) => a + Number(n || 0), 0);
  return cap ? booked / cap : null;
}
// ¿Se puede elegir ese día en el calendario?
function dayBookable(date) {
  const today = bogNow().date;
  if (date < today || date > maxDate() || isClosed(date)) return false;
  const r = dayRatio(date);
  if (r !== null && r >= 1) return false;
  if (date === today) { // hoy solo si queda tiempo antes del cierre
    const now = bogNow().min + Number(S.settings?.minAdvanceMinutes || 0);
    return staffPool().some((s) => hoursOfStaff(s, date).some((h) => tmin(h.close) - slotLen() >= now));
  }
  return true;
}
function nextBookableDay(from) {
  for (let d = addDays(from, 1); d <= maxDate(); d = addDays(d, 1)) if (dayBookable(d)) return d;
  return null;
}
function renderCalendar() {
  if (!S.settings) return;
  const [y, m] = S.month.split("-").map(Number);
  const first = `${S.month}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const today = bogNow().date, end = maxDate();
  $("monthLabel").textContent = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("es-CO", { timeZone: "UTC", month: "long", year: "numeric" });
  $("prevMonth").disabled = S.month <= today.slice(0, 7);
  $("nextMonth").disabled = S.month >= end.slice(0, 7);
  let html = "<span></span>".repeat(dow(first)); // la semana empieza en domingo
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${S.month}-${String(d).padStart(2, "0")}`;
    const ok = dayBookable(date);
    html += `<button class="cday" data-date="${date}" ${ok || date === today ? "" : "disabled"} aria-pressed="${S.date === date}" aria-label="${fechaLarga(date)}${ok ? "" : ", sin horarios"}">
      ${d}${date === today ? `<span class="hoy">HOY</span>` : ""}</button>`;
  }
  $("calendar").innerHTML = html;
}
function selectDate(d) {
  S.date = d; S.time = null; S.month = d.slice(0, 7);
  subscribeDay(d); renderAll();
}
$("calendar").addEventListener("click", (e) => {
  const b = e.target.closest("[data-date]"); if (!b || b.disabled) return;
  selectDate(b.dataset.date);
  if (window.innerWidth < 768) setTimeout(() => $("slotsTitle").scrollIntoView({ behavior: "smooth", block: "start" }), 50);
});
function shiftMonth(n) {
  const [y, m] = S.month.split("-").map(Number);
  S.month = new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
  renderCalendar();
}
$("prevMonth").onclick = () => shiftMonth(-1);
$("nextMonth").onclick = () => shiftMonth(1);

// ---------- Horarios del día elegido (solo los libres) ----------
function renderSlots() {
  const box = $("slots"), hint = $("slotsHint"), none = $("noSlots");
  if (!S.settings || !S.date) { box.innerHTML = ""; return; }
  const today = bogNow().date;
  const isToday = S.date === today;
  $("slotsTitle").innerHTML = isToday ? "Horarios disponibles hoy" : `Horarios disponibles el <span class="capitalize">${fechaLarga(S.date)}</span>`;
  const free = isClosed(S.date) ? [] : dayGrid().filter((g) => g.free.length);
  if (S.time && !free.some((g) => g.time === S.time)) S.time = null;
  if (!free.length) {
    box.innerHTML = ""; hint.textContent = "";
    $("noSlotsText").textContent = isClosed(S.date)
      ? (isToday ? "Hoy no atendemos." : "Ese día no atendemos.")
      : (isToday ? "Hoy ya no quedan horarios disponibles." : "Ese día ya no quedan horarios disponibles.");
    const next = nextBookableDay(S.date);
    $("btnNextDay").classList.toggle("hidden", !next);
    $("btnNextDay").textContent = next ? `Ver ${fechaCorta(next)}` : "";
    $("btnNextDay").dataset.date = next || "";
    none.classList.remove("hidden");
    return;
  }
  none.classList.add("hidden");
  const multi = !S.staffId && S.staff.length > 1;
  hint.textContent = `Cada cupo es de ${slotLen() < 60 ? slotLen() + " minutos" : slotLen() === 60 ? "1 hora" : slotLen() / 60 + " horas"}. Toca el que prefieras.${multi ? " Debajo de cada hora ves cuántos lugares quedan." : ""}`;
  box.innerHTML = free.map((g) => `<button class="tpill ${multi ? "tpill-n" : ""}" data-time="${g.time}" aria-pressed="${S.time === g.time}">${hora12(g.time)}${multi ? `<small>${g.free.length} ${g.free.length === 1 ? "cupo" : "cupos"}</small>` : ""}</button>`).join("");
  updateStaffCounts();
}
// cuántas horas libres le quedan hoy (o ese día) a cada profesional y en total
function updateStaffCounts() {
  if (S.staff.length < 2 || !S.settings || !S.date) return;
  const grid = dayGrid(true);
  const per = {}; let any = 0;
  grid.forEach((g) => { if (g.free.length) any++; g.free.forEach((id) => { per[id] = (per[id] || 0) + 1; }); });
  document.querySelectorAll("#staffPick [data-cnt]").forEach((el) => {
    const n = el.dataset.cnt ? (per[el.dataset.cnt] || 0) : any;
    el.textContent = n ? `· ${n}` : "· sin cupos";
    el.closest(".chip").classList.toggle("chip-empty", !n);
  });
}
$("btnNextDay").onclick = () => { const d = $("btnNextDay").dataset.date; if (d) selectDate(d); };
$("slots").addEventListener("click", (e) => {
  const b = e.target.closest("[data-time]"); if (!b) return;
  S.time = b.dataset.time; presence("service");
  warmServer();
  renderSlots(); renderServices(); renderSummary();
  setTimeout(() => $("servSection").scrollIntoView({ behavior: "smooth", block: "start" }), 50);
});

// ---------- Paso 2: servicios ----------
function selection() {
  const byId = Object.fromEntries(S.services.map((s) => [s.id, s]));
  const items = [byId[S.mainId], ...[...S.extras].map((id) => byId[id])].filter(Boolean);
  return {
    items,
    totalMinutes: items.reduce((a, s) => a + Number(s.minutes || 0), 0),
    totalCOP: items.reduce((a, s) => a + Number(s.priceCOP || 0), 0)
  };
}
function expectedDeposit(total) {
  const mode = S.cust?.paymentMode || "deposit";
  if (mode === "preferential") return 0;
  if (mode === "full") return total;
  return Math.min(Number(S.settings?.depositAmountCOP || 0), total);
}
function serviceButton(s, pressed, kind, fits) {
  const meta = s.type === "addon" ? `+${s.minutes} min` : `${s.minutes} min`;
  return `<button class="choice" data-${kind}="${esc(s.id)}" aria-pressed="${pressed}" ${fits ? "" : "disabled"}>
    <span><span class="block font-semibold">${esc(s.name)}</span><span class="text-xs text-ink/60">${meta}${s.description ? " · " + esc(s.description) : ""}</span></span>
    <span class="shrink-0 text-right font-bold">${fits ? (s.type === "addon" ? "+" : "") + cop(s.priceCOP) : `<span class="text-xs font-semibold text-ink/50">No alcanza</span>`}</span></button>`;
}
function renderServices() {
  const sec = $("servSection");
  sec.classList.toggle("hidden", !S.time);
  if (!S.time) return;
  const maxFree = Math.max(0, ...staffPool().map((s) => freeFrom(s.id, S.time)));
  $("servHint").textContent = `${fechaLarga(S.date)}, ${hora12(S.time)}. Tiempo libre desde esa hora: ${maxFree >= 120 ? Math.floor(maxFree / 60) + " h" + (maxFree % 60 ? " " + (maxFree % 60) + " min" : "") : maxFree + " min"}.`;
  const mains = S.services.filter((s) => s.type !== "addon");
  const fitsMain = (s) => staffThatFit(s.id, Number(s.minutes || 0)).length > 0;
  if (S.mainId && !mains.some((s) => s.id === S.mainId && fitsMain(s))) { S.mainId = null; S.extras.clear(); }
  const groups = [];
  mains.forEach((s) => { const c = (s.category || "").trim() || "Servicios"; let g = groups.find((x) => x.c === c); if (!g) groups.push(g = { c, list: [] }); g.list.push(s); });
  $("mainServices").innerHTML = mains.length ? groups.map((g) => `
    <div>${groups.length > 1 ? `<p class="mb-2 text-xs font-bold uppercase tracking-wide text-ink/60">${esc(g.c)}</p>` : ""}
    <div class="grid gap-2 sm:grid-cols-2">${g.list.map((s) => serviceButton(s, S.mainId === s.id, "main", fitsMain(s))).join("")}</div></div>`).join("")
    : `<p class="text-sm text-ink/60">Aún no hay servicios publicados.</p>`;
  const extras = S.services.filter((s) => s.type !== "base" && s.id !== S.mainId);
  [...S.extras].forEach((id) => { if (!extras.some((s) => s.id === id)) S.extras.delete(id); });
  const base = selection().totalMinutes;
  const fitsExtra = (s) => S.extras.has(s.id) || staffThatFit(S.mainId, base + Number(s.minutes || 0)).length > 0;
  $("extrasWrap").classList.toggle("hidden", !S.mainId || !extras.length);
  $("extraServices").innerHTML = extras.map((s) => serviceButton(s, S.extras.has(s.id), "extra", fitsExtra(s))).join("");
}
$("mainServices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-main]"); if (!b || b.disabled) return;
  S.mainId = b.dataset.main; S.extras.delete(S.mainId);
  renderServices(); renderSummary();
  // lleva al cliente a los agregados (si hay) o directo al botón de apartar
  setTimeout(() => (($("extrasWrap").classList.contains("hidden") ? $("bookBar") : $("extrasWrap"))).scrollIntoView({ behavior: "smooth", block: "center" }), 60);
});
$("extraServices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-extra]"); if (!b || b.disabled) return;
  const id = b.dataset.extra;
  S.extras.has(id) ? S.extras.delete(id) : S.extras.add(id);
  renderServices(); renderSummary();
});

function bookingStaff() {
  const { totalMinutes } = selection();
  return S.staffId && staffThatFit(S.mainId, totalMinutes).includes(S.staffId) ? S.staffId : staffThatFit(S.mainId, totalMinutes)[0];
}
function renderSummary() {
  const { items, totalMinutes, totalCOP } = selection();
  const btn = $("btnBook");
  if (!S.time) { $("summary").innerHTML = `<span class="text-ink/60">Elige un día y una hora para empezar.</span>`; if (!btn.dataset.label) btn.disabled = true; return; }
  if (!items.length) { $("summary").innerHTML = `<p class="font-semibold capitalize">${fechaCorta(S.date)} · ${hora12(S.time)}</p><p class="text-ink/60">Ahora elige el servicio.</p>`; if (!btn.dataset.label) btn.disabled = true; return; }
  const dep = expectedDeposit(totalCOP);
  const depText = S.cust?.paymentMode === "preferential" ? "Cliente preferencial: sin abono" : `Abono para apartar ${cop(dep)}`;
  const who = S.staff.length > 1 ? S.staff.find((s) => s.id === bookingStaff())?.name : "";
  $("summary").innerHTML = `
    <p class="truncate font-semibold">${items.map((i) => esc(i.name)).join(" + ")} · ${cop(totalCOP)}</p>
    <p class="truncate text-ink/70"><span class="capitalize">${fechaCorta(S.date)}</span> · ${hora12(S.time)}${who ? " · " + esc(who) : ""} · ${totalMinutes} min · ${depText}</p>`;
  if (!btn.dataset.label) btn.disabled = !(S.mainId && S.time && bookingStaff()) || S.biz?.status !== "active";
}

// ================= Reservar =================
$("btnBook").onclick = () => {
  if (!(S.mainId && S.date && S.time)) return;
  if (!S.user || !S.profile) {
    // con agenda abierta, se registra ahora y su elección queda guardada
    S.wantBook = true; updateGate();
    $("gate").scrollIntoView({ behavior: "smooth", block: "start" });
    toast("Crea tu cuenta en 1 minuto para apartar tu cupo. Tu hora queda guardada.");
    return;
  }
  if (!S.cust && !S.consentOk) { openConsent(); return; }
  doHold();
};

// Autorización de datos para ESTA barbería (la primera vez que el cliente reserva aquí)
function openConsent() {
  $("consentText").textContent = S.settings?.habeasDataText || "Autorizo el tratamiento de mis datos personales para gestionar mis citas.";
  $("consentBiz").textContent = S.settings?.businessName || S.biz?.name || "este negocio";
  openModal("consentModal");
}
$("btnConsent").onclick = () => { S.consentOk = true; closeModal("consentModal"); doHold(); };

async function doHold() {
  const btn = $("btnBook");
  setBusy(btn, true, "Apartando…");
  const { items, totalCOP } = selection();
  const dep = expectedDeposit(totalCOP);
  // Si hay que pagar abono, la pantalla de pago se abre de una vez (sin esperar al servidor)
  const draft = dep > 0 ? {
    code: "", depositCOP: dep, totalCOP, balanceDueCOP: totalCOP - dep, date: S.date, startTime: S.time,
    items: items.map((i) => ({ name: i.name })), holdExpiresAt: Date.now() + Number(S.settings?.holdMinutes || 30) * 60000
  } : null;
  if (draft) showPay(draft);
  try {
    const staffId = bookingStaff();
    if (!staffId) throw new Error("Ese horario ya no alcanza para este servicio. Elige otra hora.");
    const r = await api("createHold", { mainId: S.mainId, extraIds: [...S.extras], staffId, date: S.date, time: S.time, consent: S.consentOk || !!S.cust });
    S.time = null;
    if (r.appointment.status === "confirmed") { clearInterval(S.payTimer); closeModal("payModal"); toast("¡Cupo confirmado!"); showTicket(r.appointment); watchTicket(r.appointment.code); }
    else if (!$("payModal").classList.contains("hidden") || !draft) showPay(r.appointment, true);
    else toast(`Cupo apartado: ${r.appointment.code}. Lo encuentras en "Mi cuenta" para pagarlo.`);
  } catch (e) {
    if (draft) { clearInterval(S.payTimer); closeModal("payModal"); }
    toast(e.message, "error");
  }
  finally { setBusy(btn, false); delete btn.dataset.label; renderBiz(); renderSlots(); renderServices(); renderSummary(); }
}

// ================= Registro / ingreso =================
function openAuth(mode) { setAuthTab(mode); $("gate").scrollIntoView({ behavior: "smooth", block: "start" }); }
function setAuthTab(mode) {
  const reg = mode === "register";
  $("registerForm").classList.toggle("hidden", !reg);
  $("loginForm").classList.toggle("hidden", reg);
  $("tabRegister").classList.toggle("tab-on", reg);
  $("tabLogin").classList.toggle("tab-on", !reg);
  $("authTitle").textContent = reg ? T("registerTitle") : "Ingresa a tu cuenta";
}
$("tabRegister").onclick = () => setAuthTab("register");
$("tabLogin").onclick = () => setAuthTab("login");
document.querySelectorAll(".pwEye").forEach((b) => b.addEventListener("click", () => {
  const inp = b.parentElement.querySelector("input");
  const show = inp.type === "password";
  inp.type = show ? "text" : "password";
  b.innerHTML = show ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
  b.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
}));

// ---------- WhatsApp con indicativo de país ----------
// code = indicativo, len = dígitos del celular, start = con qué empieza, wa = prefijo que usa WhatsApp
const COUNTRIES = [
  { id: "CO", flag: "🇨🇴", name: "Colombia", code: "57", len: [10], start: /^3/, startTxt: "3", group: [3, 3, 4] },
  { id: "VE", flag: "🇻🇪", name: "Venezuela", code: "58", len: [10], start: /^4/, startTxt: "4", group: [3, 3, 4] },
  { id: "EC", flag: "🇪🇨", name: "Ecuador", code: "593", len: [9], start: /^9/, startTxt: "9", group: [2, 3, 4] },
  { id: "PE", flag: "🇵🇪", name: "Perú", code: "51", len: [9], start: /^9/, startTxt: "9", group: [3, 3, 3] },
  { id: "PA", flag: "🇵🇦", name: "Panamá", code: "507", len: [8], start: /^6/, startTxt: "6", group: [4, 4] },
  { id: "MX", flag: "🇲🇽", name: "México", code: "52", len: [10], start: /^\d/, group: [3, 3, 4] },
  { id: "CL", flag: "🇨🇱", name: "Chile", code: "56", len: [9], start: /^9/, startTxt: "9", group: [1, 4, 4] },
  { id: "AR", flag: "🇦🇷", name: "Argentina", code: "54", wa: "549", len: [10], start: /^\d/, group: [2, 4, 4] },
  { id: "ES", flag: "🇪🇸", name: "España", code: "34", len: [9], start: /^[67]/, startTxt: "6 o 7", group: [3, 3, 3] },
  { id: "US", flag: "🇺🇸", name: "Estados Unidos", code: "1", len: [10], start: /^[2-9]/, group: [3, 3, 4] }
];
$("phoneCountry").innerHTML = COUNTRIES.map((c) => `<option value="${c.id}">${c.flag} +${c.code}</option>`).join("");
const country = () => COUNTRIES.find((c) => c.id === $("phoneCountry").value) || COUNTRIES[0];
function groupDigits(d, g) { const out = []; let i = 0; for (const n of g) { if (i >= d.length) break; out.push(d.slice(i, i + n)); i += n; } if (i < d.length) out.push(d.slice(i)); return out.join(" "); }
// Revisa el número; devuelve el número internacional (+57...) o null con el mensaje del error
function checkPhone(showOk = true) {
  const c = country(), inp = $("phoneNumber"), msg = $("phoneMsg");
  const d = inp.value.replace(/\D/g, "").slice(0, Math.max(...c.len));
  let err = "";
  if (!d) err = "Escribe tu número de WhatsApp.";
  else if (!c.start.test(d)) err = `En ${c.name} el celular debe empezar por ${c.startTxt || "un número válido"}.`;
  else if (!c.len.includes(d.length)) err = `En ${c.name} el celular tiene ${c.len.join(" o ")} dígitos (llevas ${d.length}).`;
  inp.classList.toggle("bad", !!err && d.length > 0);
  inp.classList.toggle("good", !err);
  msg.className = "mt-1 text-xs font-normal " + (err ? (d.length ? "text-pole-red" : "text-ink/60") : "text-emerald-700");
  msg.textContent = err ? (d.length ? err : `${c.flag} ${c.name}: ${c.len.join(" o ")} dígitos${c.startTxt ? ", empieza por " + c.startTxt : ""}.`) : (showOk ? "✓ Número válido" : "");
  return err ? null : "+" + (c.wa || c.code) + d;
}
$("phoneNumber").addEventListener("input", () => {
  const c = country();
  let d = $("phoneNumber").value.replace(/\D/g, "");
  if (d.startsWith(c.code) && d.length > Math.max(...c.len)) d = d.slice(c.code.length); // pegó el número con +57
  d = d.slice(0, Math.max(...c.len));
  $("phoneNumber").value = groupDigits(d, c.group);
  checkPhone();
});
$("phoneCountry").addEventListener("change", () => {
  const c = country();
  $("phoneNumber").placeholder = groupDigits((c.startTxt || "3").slice(0, 1) + "001234567890".slice(0, Math.max(...c.len) - 1), c.group);
  $("phoneNumber").dispatchEvent(new Event("input"));
});
$("phoneCountry").value = "CO"; $("phoneCountry").dispatchEvent(new Event("change"));

function authError(err) {
  const c = err?.code || "";
  if (c.includes("email-already-in-use")) return "Ese correo ya tiene cuenta. Usa la pestaña “Ingresar”.";
  if (c.includes("invalid-email")) return "El correo no es válido.";
  if (c.includes("weak-password")) return "La contraseña debe tener al menos 6 caracteres.";
  if (c.includes("invalid-credential") || c.includes("wrong-password") || c.includes("user-not-found")) return "Correo o contraseña incorrectos.";
  if (c.includes("too-many-requests")) return "Demasiados intentos. Espera unos minutos.";
  if (c.includes("network")) return "Sin conexión. Revisa tu internet.";
  return err?.message || "No se pudo completar. Intenta de nuevo.";
}

$("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const fullName = f.fullName.value.trim().replace(/\s+/g, " ");
  if (fullName.length < 2) { f.fullName.focus(); return toast("Escribe tu nombre.", "error"); }
  const phone = checkPhone();
  if (!phone) { $("phoneNumber").focus(); return toast($("phoneMsg").textContent || "Revisa tu número de WhatsApp.", "error"); }
  const email = (auth.currentUser?.email || f.email.value).trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) { f.email.focus(); return toast("Escribe un correo válido.", "error"); }
  if (!auth.currentUser && f.password.value.length < 6) { f.password.focus(); return toast("La contraseña debe tener al menos 6 caracteres.", "error"); }
  if (!f.consent.checked) return toast("Debes aceptar el tratamiento de datos para continuar.", "error");
  const btn = f.querySelector("button[type=submit]");
  setBusy(btn, true, "Creando cuenta…");
  try {
    S.registering = true;
    let uid = auth.currentUser?.uid;
    if (!uid) uid = (await createUserWithEmailAndPassword(auth, email, f.password.value)).user.uid;
    const [first, ...rest] = fullName.split(" ");
    const profile = { firstName: first, lastName: rest.join(" "), email: email.toLowerCase(), whatsapp: phone, createdAt: serverTimestamp() };
    await setDoc(doc(db, "users", uid), profile);
    S.user = auth.currentUser; S.profile = profile;
    S.consentOk = true; // aceptó la autorización de este negocio en el formulario
    f.reset(); f.email.readOnly = false; f.password.closest("label").classList.remove("hidden");
    $("phoneCountry").value = "CO"; $("phoneCountry").dispatchEvent(new Event("change"));
    toast("¡Bienvenido, " + first + "! Ya puedes apartar tu cita.");
    if (!unsubMine) subscribeMine();
    updateGate(); renderNav(); renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) { toast(authError(err), "error"); }
  finally { S.registering = false; setBusy(btn, false); }
});

$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const btn = f.querySelector("button[type=submit]");
  setBusy(btn, true, "Ingresando…");
  try {
    const cred = await signInWithEmailAndPassword(auth, f.email.value.trim(), f.password.value);
    S.user = cred.user;
    await loadProfile();
    f.reset();
    updateGate();
    if (S.profile) { toast("Hola, " + (S.profile.firstName || "")); renderAll(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  } catch (err) { toast(authError(err), "error"); }
  finally { setBusy(btn, false); }
});

$("btnForgot").onclick = async () => {
  const email = $("loginForm").email.value.trim();
  if (!email) return toast("Escribe tu correo arriba y vuelve a tocar “Olvidé mi contraseña”.", "error");
  try { await sendPasswordResetEmail(auth, email); toast("Te enviamos un correo para cambiar la contraseña."); }
  catch (err) { toast(authError(err), "error"); }
};

// ================= Pago con screenshot =================
function showPay(apt, keepForm = false) {
  S.payApt = apt; presence("pay"); warmServer(); // el servidor se despierta mientras el cliente paga
  const st = S.settings || {};
  const methods = (st.paymentMethods || []);
  const fullName = `${S.profile?.firstName || ""} ${S.profile?.lastName || ""}`.trim();
  // El número de reserva se entrega después de pagar: en la transferencia basta con el nombre
  let note = (st.paymentInstructions || "").trim();
  if (!note || /n[uú]mero de reserva/i.test(note)) note = T("payNote");
  $("payBody").innerHTML = `
    <p class="mb-2 text-xs capitalize text-ink/70">${(apt.items || []).map((i) => esc(i.name)).join(" + ")} · ${fechaCorta(apt.date)} · ${hora12(apt.startTime)}</p>
    <div class="pay-amount mb-2">
      <div><p class="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Envía exactamente</p>
        <p class="font-narrow text-3xl font-bold leading-none">${cop(apt.depositCOP)}</p>
        <p class="mt-1 text-[11px] text-ink/60">Total ${cop(apt.totalCOP)} · Saldo en el local ${cop(apt.balanceDueCOP)}</p></div>
      <button type="button" class="pay-ibtn" data-copy="${Number(apt.depositCOP || 0)}" aria-label="Copiar monto"><i class="fa-regular fa-copy"></i></button>
    </div>
    <div class="space-y-1.5">${methods.length ? methods.map((m, i) => `
      <div class="pay-row">
        <div class="min-w-0 flex-1">
          <p class="text-[10px] font-bold uppercase tracking-wider text-ink/55">${esc(m.label)}${m.holder ? ` · <span class="normal-case tracking-normal">${esc(m.holder)}</span>` : ""}</p>
          <p class="truncate font-mono text-[15px] font-bold">${esc(m.account)}</p>
        </div>
        ${m.qr ? `<button type="button" class="pay-ibtn" data-qrview="${i}" aria-label="Ver código QR"><i class="fa-solid fa-qrcode"></i></button>` : ""}
        <button type="button" class="pay-ibtn main" data-copy="${esc(m.account)}" aria-label="Copiar ${esc(m.label)}"><i class="fa-regular fa-copy"></i></button>
      </div>`).join("") : `<p class="rounded-lg border border-line p-3 text-center text-sm text-ink/60">El negocio aún no ha configurado sus medios de pago.</p>`}</div>
    <p class="mt-2 text-xs leading-snug text-ink/65">💬 ${esc(note)}${fullName ? ` <button type="button" class="font-semibold text-pole-blue underline" data-copy="${esc(fullName)}">Copiar mi nombre</button>` : ""}</p>`;
  if (!keepForm) {
    $("proofForm").reset(); S.proofData = null;
    $("proofPreview").classList.add("hidden");
    $("proofLabel").innerHTML = `<b>Sube el comprobante</b><br><span class="text-xs text-ink/60">Toca para elegir la captura del pago</span>`;
  }
  closeModal("mineModal");
  openModal("payModal");
  clearInterval(S.payTimer);
  const tick = () => {
    const left = toMillis(apt.holdExpiresAt) - Date.now();
    const el = $("payCountdown"); if (!el) return;
    const submit = $("proofForm").querySelector("button[type=submit]");
    if (left <= 0) {
      el.textContent = "Tiempo vencido";
      submit.disabled = true; clearInterval(S.payTimer); return;
    }
    const ready = !!S.payApt?.code; // el servidor ya apartó el cupo
    submit.disabled = !ready;
    if (!submit.dataset.label) submit.textContent = ready ? "Ya pagué" : "Apartando tu cupo…";
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    el.textContent = `⏱ ${m}:${String(s).padStart(2, "0")}`;
  };
  tick(); S.payTimer = setInterval(tick, 1000);
}
$("payBody").addEventListener("click", (e) => {
  const qv = e.target.closest("[data-qrview]");
  if (qv) { const m = (S.settings?.paymentMethods || [])[Number(qv.dataset.qrview)]; if (m) viewImage(m.qr, `${m.label}: ${m.account}${m.holder ? " · " + m.holder : ""}`); return; }
  const z = e.target.closest("[data-zoom]");
  if (z) { const m = (S.settings?.paymentMethods || [])[Number(z.dataset.zoom)]; viewImage(z.src, m ? `${m.label}: ${m.account}${m.holder ? " · " + m.holder : ""}` : ""); return; }
  const q = e.target.closest("[data-qr]"); if (!q) return;
  const box = $("qr" + q.dataset.qr); if (!box) return;
  const open = box.classList.toggle("hidden") === false;
  box.classList.toggle("flex", open);
  q.textContent = open ? "Ocultar QR" : "Ver QR";
});
$("btnCancelHold").onclick = async () => {
  const apt = S.payApt; if (!apt) return;
  if (!(await uiConfirm("¿Cancelar la reserva?", `La reserva ${apt.code} se cancela y el horario queda libre para otra persona.`, { okText: "Sí, cancelar", cancelText: "No", danger: true }))) return;
  const btn = $("btnCancelHold"); setBusy(btn, true, "Cancelando…");
  try { await api("cancelAppointment", { code: apt.code, reason: "Cancelada por el cliente antes de pagar" }); clearInterval(S.payTimer); closeModal("payModal"); toast("Reserva cancelada."); }
  catch (err) { toast(err.message, "error"); }
  finally { setBusy(btn, false); }
};
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-copy]"); if (c) copyText(c.dataset.copy);
  const x = e.target.closest("[data-close]"); if (x) { closeModal(x.dataset.close); if (x.dataset.close === "payModal") clearInterval(S.payTimer); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal.flex").forEach((m) => closeModal(m.id));
});

$("proofFile").addEventListener("change", (e) => {
  const file = e.target.files[0]; if (!file) return;
  const img = $("proofPreview"); img.src = URL.createObjectURL(file); img.classList.remove("hidden");
  $("proofLabel").innerHTML = `<b class="text-emerald-700">✓ Comprobante listo</b><br><span class="text-xs text-ink/60">Toca para cambiarlo</span>`;
  S.proofData = compressImage(file); // se prepara de una vez para que "Ya pagué" sea inmediato
});

async function compressImage(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 1000; // suficiente para leer el comprobante y 4 veces más liviano que la foto original
  let w = img.naturalWidth, h = img.naturalHeight;
  if (Math.max(w, h) > max) { const r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.62);
}

$("proofForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const file = $("proofFile").files[0];
  if (!file) return toast("Selecciona el screenshot de la transferencia.", "error");
  if (!file.type.startsWith("image/")) return toast("El comprobante debe ser una imagen.", "error");
  const btn = f.querySelector("button[type=submit]");
  if (!S.payApt?.code) return toast("Espera un segundo, estamos apartando tu cupo.", "error");
  setBusy(btn, true, "Preparando…");
  let image;
  try { image = await (S.proofData || compressImage(file)); }
  catch { setBusy(btn, false); return toast("No se pudo leer la imagen. Intenta con otra captura.", "error"); }
  // se pasa al ticket de una vez; el comprobante termina de enviarse por detrás
  const apt = { ...S.payApt, status: "pending_verification" };
  clearInterval(S.payTimer);
  closeModal("payModal"); setBusy(btn, false);
  showTicket(apt); watchTicket(apt.code);
  toast("✓ ¡Recibido! Estamos enviando tu comprobante…");
  api("submitProof", { code: apt.code, image, reference: f.reference.value })
    .then(() => toast("✓ Comprobante enviado. Te avisamos cuando lo aprueben."))
    .catch((err) => { toast((err.message || "No se pudo enviar el comprobante.") + " Intenta de nuevo.", "error"); closeModal("ticketModal"); showPay(S.payApt, true); });
});

// ================= Ticket =================
// Escucha la reserva: cuando el negocio aprueba el pago (desde Telegram) el ticket cambia solo
let unsubTicket = null;
function watchTicket(code) {
  unsubTicket?.();
  unsubTicket = onSnapshot(doc(db, bpath("appointments", code)), (s) => {
    const a = s.data(); if (!a || $("ticketModal").classList.contains("hidden")) return;
    if (S.ticketStatus && S.ticketStatus !== a.status) {
      if (a.status === "confirmed") toast("¡Tu pago fue verificado! Turno confirmado.");
      if (a.status === "rejected") toast("No pudimos verificar tu pago. Revisa tu correo o escríbenos.", "error");
    }
    showTicket(a);
  }, () => {});
}
function showTicket(apt) {
  presence("done");
  const st = S.settings || {};
  const note = {
    confirmed: "Cupo confirmado. Presenta este número al llegar.",
    pending_verification: `<span class="spin mr-1"></span> Recibimos tu comprobante. El negocio está verificando el pago; esta pantalla se actualiza sola.`,
    pending_payment: "Falta subir el comprobante del abono."
  }[apt.status] || "";
  S.ticketStatus = apt.status;
  $("ticket").innerHTML = `
    <article class="ticket">
      <div class="ticket-head">
        ${apt.status === "confirmed" ? `<div class="ticket-ok" aria-hidden="true">✓</div><p class="mb-2 text-center font-narrow text-xl font-bold uppercase tracking-wide">${esc(T("confirmedTitle"))}</p>` : ""}
        <p class="text-sm text-white/70">${esc(st.businessName || "Tu reserva")}</p>
        <p class="ticket-code mt-1">${esc(apt.code)}</p>
        <p class="mt-3">${statusBadge(apt.status)}</p>
      </div>
      <dl class="px-5 pb-4 pt-5">
        <div class="ticket-row"><dt>Fecha</dt><dd class="capitalize">${fechaLarga(apt.date)}</dd></div>
        <div class="ticket-row"><dt>Hora</dt><dd>${hora12(apt.startTime)}</dd></div>
        <div class="ticket-row"><dt>Barbero</dt><dd>${esc(apt.staffName)}</dd></div>
        <div class="ticket-row"><dt>Servicio</dt><dd>${(apt.items || []).map((i) => esc(i.name)).join(" + ")}</dd></div>
        <div class="ticket-row"><dt>Total</dt><dd>${cop(apt.totalCOP)}</dd></div>
        <div class="ticket-row"><dt>${apt.payment?.mode === "preferential" ? "Abono" : "Abono pagado"}</dt><dd>${apt.payment?.mode === "preferential" ? "No requiere" : cop(apt.depositCOP)}</dd></div>
        <div class="ticket-row"><dt>Saldo en el local</dt><dd>${cop(apt.balanceDueCOP)}</dd></div>
      </dl>
      <div class="ticket-cut"></div>
      <div class="px-5 py-4 text-sm text-ink/75">
        <p class="font-semibold text-ink">${note}</p>
        <p class="mt-1">Tolerancia de espera: ${Number(st.toleranceMinutes || 10)} minutos. ${st.showLocation === false ? "" : [st.address, st.city].filter(Boolean).map(esc).join(", ")}</p>
        ${mapLinks(st) ? `<div class="mt-3 grid grid-cols-2 gap-2">
          <a class="btn-light text-center text-sm" style="background:#33ccff;border-color:#33ccff;color:#0b2540" href="${mapLinks(st).waze}" target="_blank" rel="noopener"><i class="fa-brands fa-waze"></i> Ir con Waze</a>
          <a class="btn-light text-center text-sm" href="${mapLinks(st).gmaps}" target="_blank" rel="noopener"><i class="fa-solid fa-map-location-dot"></i> Google Maps</a></div>` : ""}
      </div>
    </article>`;
  $("tkCopy").onclick = () => copyText(apt.code);
  const wa = $("tkWa");
  if (st.whatsapp) { wa.href = waLink(st.whatsapp, fillTemplate(st.waConfirmTemplate || DEFAULT_WA_CONFIRM, apt, st)); wa.classList.remove("hidden"); }
  else wa.classList.add("hidden");
  openModal("ticketModal");
}

// ================= Mis cupos =================
function canChange(apt) {
  const minH = Number(S.settings?.rescheduleMinHours ?? 2);
  return toMillis(apt.startAt) - Date.now() >= minH * 3600000;
}
function apptCard(a, i, list) {
  const maxR = Number(S.settings?.maxReschedules ?? 2);
  const sameDay = (list || []).filter((x) => x.date === a.date && ["confirmed", "pending_verification"].includes(x.status));
  const latestOfDay = sameDay.length > 1 && sameDay.every((x) => toMillis(x.startAt) <= toMillis(a.startAt));
  const soon = !canChange(a);
  const acts = [];
  if (a.status === "pending_payment") {
    acts.push(`<button class="btn-dark text-sm" data-act="pay" data-code="${a.code}">Pagar abono</button>`);
    acts.push(`<button class="btn-sm" data-act="cancel" data-code="${a.code}">Cancelar</button>`);
  } else if (["confirmed", "pending_verification"].includes(a.status)) {
    acts.push(`<button class="btn-dark text-sm" data-act="ticket" data-code="${a.code}">Ver ticket</button>`);
    // Cambiar hora y Cancelar salen siempre; si faltan menos de 2 horas, al tocarlos se explica y se ofrece WhatsApp
    if ((a.rescheduleCount || 0) < maxR) acts.push(`<button class="btn-sm" data-act="resched" data-code="${a.code}">Cambiar hora</button>`);
    acts.push(`<button class="btn-sm" data-act="cancel" data-code="${a.code}">Cancelar</button>`);
    if ((soon || latestOfDay) && S.settings?.whatsapp) acts.push(`<a class="btn-sm" target="_blank" rel="noopener" href="${waLink(S.settings.whatsapp, "Hola, necesito ayuda con mi reserva " + a.code)}"><i class="fa-brands fa-whatsapp"></i> Escribir por WhatsApp</a>`);
  } else acts.push(`<button class="btn-sm" data-act="ticket" data-code="${a.code}">Ver detalle</button>`);
  return `<article class="rounded-xl border border-line p-3">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="font-mono text-base font-bold">${esc(a.code)}</p>${statusBadge(a.status)}
    </div>
    <p class="mt-1 text-sm capitalize">${fechaLarga(a.date)} · ${hora12(a.startTime)} · ${esc(a.staffName)}</p>
    <p class="text-sm text-ink/70">${(a.items || []).map((i) => esc(i.name)).join(" + ")} · ${cop(a.totalCOP)}</p>
    ${soon && ["confirmed", "pending_verification"].includes(a.status) ? `<p class="mt-2 rounded-lg px-2.5 py-1.5 text-xs" style="background:#fff7e6;color:#7a4b00">⏰ Tu cita ya se acerca: faltan menos de ${Number(S.settings?.rescheduleMinHours ?? 2)} horas. Para cancelar o cambiar la hora, escríbele al negocio.</p>` : ""}
    <div class="mt-2 flex flex-wrap gap-2">${acts.join("")}</div>
  </article>`;
}
function renderMine() {
  const box = $("mineList");
  if (!S.mine.length) { box.innerHTML = `<p class="text-sm text-ink/70">Aún no tienes citas. Elige un día y una hora para apartar la primera.</p>`; return; }
  const live = ["pending_payment", "pending_verification", "confirmed"];
  const next = S.mine.filter((a) => live.includes(a.status)).sort((a, b) => toMillis(a.startAt) - toMillis(b.startAt));
  const past = S.mine.filter((a) => !live.includes(a.status));
  const done = past.filter((a) => a.status === "attended");
  box.innerHTML = `
    <p class="text-xs font-bold uppercase tracking-wider text-ink/60">Próximas (${next.length})</p>
    ${next.map(apptCard).join("") || `<p class="text-sm text-ink/60">No tienes citas próximas.</p>`}
    <p class="pt-2 text-xs font-bold uppercase tracking-wider text-ink/60">Historial (${past.length})</p>
    ${past.length ? `<p class="text-xs text-ink/60">${done.length} visita(s) · ${cop(done.reduce((t, a) => t + Number(a.totalCOP || 0), 0))} en servicios</p>` + past.map(apptCard).join("") : `<p class="text-sm text-ink/60">Aquí verás tus citas pasadas.</p>`}`;
}
function openAccount(tab) {
  const p = S.profile || {};
  $("acctAvatar").textContent = ((p.firstName || "?")[0] + (p.lastName || "")[0] || "").toUpperCase();
  $("mineTitle").textContent = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Mi cuenta";
  $("acctEmail").textContent = p.email || S.user?.email || "";
  const f = $("profileForm");
  f.firstName.value = p.firstName || ""; f.lastName.value = p.lastName || ""; f.whatsapp.value = p.whatsapp || ""; f.email.value = p.email || S.user?.email || "";
  renderMine(); renderTg(); setAcctTab(tab || "citas");
  openModal("mineModal");
}
function setAcctTab(t) {
  document.querySelectorAll("[data-acct]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.acct === t));
  ["citas", "perfil", "tg"].forEach((k) => $("acct-" + k).classList.toggle("hidden", k !== t));
}
document.querySelectorAll("[data-acct]").forEach((b) => b.addEventListener("click", () => setAcctTab(b.dataset.acct)));
$("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector("button[type=submit]");
  const phone = normalizePhone(f.whatsapp.value);
  if (!f.firstName.value.trim()) return toast("Escribe tu nombre.", "error");
  if (!phone) return toast("WhatsApp inválido. Escríbelo con el indicativo, por ejemplo +57 300 123 4567.", "error");
  setBusy(btn, true, "Guardando…");
  try {
    const data = { firstName: f.firstName.value.trim(), lastName: f.lastName.value.trim(), whatsapp: phone, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, "users", S.user.uid), data);
    Object.assign(S.profile, data);
    toast("Perfil actualizado. Tus próximas reservas usarán estos datos.");
  } catch (err) { toast(err.message, "error"); }
  finally { setBusy(btn, false); }
});
// ---- Telegram del cliente: avisos de sus citas y novedades del negocio
function renderTg() {
  const on = !!S.profile?.telegramChatId;
  $("tgBox").innerHTML = on ? `
    <div class="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
      <p class="font-semibold">✓ Tu Telegram está conectado</p>
      <p class="mt-1">Te llegan los avisos de tus citas (confirmación, cambios y recordatorio) y las novedades de ${esc(S.settings?.businessName || "este negocio")}.</p>
    </div>
    <button id="btnTgOff" class="btn-light mt-3 text-sm">Desconectar Telegram</button>` : `
    <p class="mb-3 text-sm text-ink/75">Conecta tu Telegram y recibe ahí la confirmación de tus citas, los cambios de horario, un recordatorio antes de cada cita y las novedades de ${esc(S.settings?.businessName || "este negocio")}.</p>
    <button id="btnTgOn" class="btn-primary text-sm">Conectar mi Telegram</button>
    <p id="tgHint" class="mt-2 text-xs text-ink/60"></p>`;
  if ($("btnTgOn")) $("btnTgOn").onclick = connectTg;
  if ($("btnTgOff")) $("btnTgOff").onclick = async () => {
    try { await updateDoc(doc(db, "users", S.user.uid), { telegramChatId: "" }); S.profile.telegramChatId = ""; renderTg(); toast("Telegram desconectado."); }
    catch (err) { toast(err.message, "error"); }
  };
}
async function connectTg() {
  let bot = "";
  try { bot = ((await getDoc(doc(db, "platform", "public"))).data()?.telegramBot || "").replace(/^@/, ""); } catch { /* sin bot */ }
  if (!bot) return toast("Los avisos por Telegram aún no están disponibles.", "error");
  const code = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  try { await setDoc(doc(db, "telegramLinks", code), { target: "client", uid: S.user.uid, businessId: BIZ_ID, createdAt: serverTimestamp() }); }
  catch (err) { return toast("No se pudo crear el enlace: " + err.message, "error"); }
  window.open(`https://t.me/${bot}?start=${code}`, "_blank");
  $("tgHint").textContent = "Se abrió Telegram: toca “Iniciar”. Vuelve aquí y verás tu Telegram conectado.";
  // revisa cada 3 segundos durante 2 minutos si ya quedó conectado
  let n = 0; clearInterval(S.tgPoll);
  S.tgPoll = setInterval(async () => {
    n++; if (n > 40) return clearInterval(S.tgPoll);
    try { const u = (await getDoc(doc(db, "users", S.user.uid))).data(); if (u?.telegramChatId) { S.profile.telegramChatId = u.telegramChatId; clearInterval(S.tgPoll); renderTg(); toast("¡Telegram conectado!"); } } catch { /* reintenta */ }
  }, 3000);
}
$("mineList").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const apt = S.mine.find((a) => a.code === b.dataset.code); if (!apt) return;
  const act = b.dataset.act;
  if (act === "pay") showPay(apt);
  if (act === "ticket") { closeModal("mineModal"); showTicket(apt); watchTicket(apt.code); }
  if ((act === "resched" || act === "cancel") && !canChange(apt) && apt.status !== "pending_payment") {
    const h = Number(S.settings?.rescheduleMinHours ?? 2);
    if (await uiConfirm("Tu cita ya se acerca", `Faltan menos de ${h} horas para tu cita, así que ya no se puede ${act === "cancel" ? "cancelar" : "cambiar"} desde aquí. Escríbele al negocio por WhatsApp y te ayudan.`, { okText: "Escribir por WhatsApp", cancelText: "Cerrar" }) && S.settings?.whatsapp) window.open(waLink(S.settings.whatsapp, `Hola, necesito ${act === "cancel" ? "cancelar" : "cambiar la hora de"} mi reserva ${apt.code}`), "_blank");
    return;
  }
  if (act === "resched") openResched(apt);
  if (act === "cancel") {
    if (!(await uiConfirm("¿Cancelar la reserva?", `La reserva ${apt.code} se cancela y el horario queda libre.`, { okText: "Sí, cancelar", cancelText: "No", danger: true }))) return;
    setBusy(b, true, "Cancelando…");
    try { await api("cancelAppointment", { code: apt.code, reason: "Cancelada por el cliente" }); toast("Reserva cancelada."); }
    catch (err) { toast(err.message, "error"); setBusy(b, false); }
  }
});

// ================= Reagendar =================
function openResched(apt) {
  S.resched = { apt, time: null, locks: [] };
  const today = bogNow().date;
  const inp = $("reschedDate");
  inp.min = today; inp.max = addDays(today, Number(S.settings?.bookingWindowDays || 30)); inp.value = "";
  $("reschedInfo").textContent = `Reserva ${apt.code}: actualmente el ${fechaLarga(apt.date)} a las ${hora12(apt.startTime)} con ${apt.staffName}. Tu abono se conserva.`;
  $("reschedSlots").innerHTML = ""; $("btnResched").disabled = true;
  closeModal("mineModal"); openModal("reschedModal");
}
$("reschedDate").addEventListener("change", async (e) => {
  const date = e.target.value; const R = S.resched; if (!date || !R) return;
  R.time = null; $("btnResched").disabled = true;
  $("reschedSlots").innerHTML = `<p class="col-span-3 text-sm text-ink/60">Buscando horas…</p>`;
  const q = await getDocs(query(collection(db, bpath("slotLocks")), where("date", "==", date)));
  R.locks = q.docs.map((d) => d.data()); R.date = date;
  const slots = computeSlots({
    settings: S.settings, staffList: S.staff, locks: R.locks, date,
    occupied: R.apt.occupiedMinutes, staffFilter: R.apt.staffId, ignoreAptCode: R.apt.code
  }).filter((s) => !(date === R.apt.date && s.time === R.apt.startTime));
  $("reschedSlots").innerHTML = slots.length
    ? slots.map((s) => `<button class="slot" data-time="${s.time}" aria-pressed="false">${hora12(s.time)}</button>`).join("")
    : `<p class="col-span-3 text-sm text-ink/60">No hay horas libres con ${esc(R.apt.staffName)} ese día.</p>`;
});
$("reschedSlots").addEventListener("click", (e) => {
  const b = e.target.closest("[data-time]"); if (!b) return;
  S.resched.time = b.dataset.time;
  $("reschedSlots").querySelectorAll("[data-time]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  $("btnResched").disabled = false;
});
$("btnResched").onclick = async () => {
  const R = S.resched; const btn = $("btnResched");
  setBusy(btn, true, "Cambiando…");
  try {
    await api("rescheduleAppointment", { code: R.apt.code, date: R.date, time: R.time });
    closeModal("reschedModal");
    toast(`Listo: tu cita quedó para el ${fechaCorta(R.date)} a las ${hora12(R.time)}.`);
  } catch (err) { toast(err.message, "error"); }
  finally { setBusy(btn, false); }
};

renderNav(); renderSummary();
if (/^[a-z0-9][a-z0-9-]{1,29}$/.test(BIZ_ID)) boot(); // arranca cuando todo está definido
startUpdateWatcher();

// ================= Probar gratis: crear la tienda de prueba =================
var PLAT = {}; // var: se usa desde maxDate antes de llegar a esta línea
getDoc(doc(db, "platform", "public")).then((d) => {
  PLAT = d.data() || {};
  if (S.settings) renderAll();
  const on = PLAT.trialEnabled !== false;
  $("trialCta").classList.toggle("hidden", !on);
  $("trialDaysTxt").textContent = `${Number(plansOf(PLAT).free.days || 30)} días gratis`;
}).catch(() => {});
const PSTYLE = { free: ["linear-gradient(140deg,#5B6782,#2b3446)", "#fff", "🎁"], basic: ["linear-gradient(140deg,#2B59C3,#14213D)", "#fff", "⭐"], gold: ["linear-gradient(140deg,#f5c542,#b8860b)", "#1a1200", "👑"] };
let T_PLAN = null;
function renderTrialPlans() {
  const P = plansOf(PLAT), rec = PLAT.recommendedPlan || "gold";
  if (!T_PLAN) T_PLAN = rec;
  const row = (label, f) => `<tr><td class="py-1.5 pr-1 text-left text-[11.5px] font-semibold text-ink/70">${label}</td>${PLAN_KEYS.map((k) => `<td class="py-1.5 text-center text-[12px] ${k === T_PLAN ? "bg-amber-50" : ""}">${f(k)}</td>`).join("")}</tr>`;
  const yes = (k, key) => ((P[k].features || []).includes(key) ? `<b class="text-emerald-600">✓</b>` : `<span class="text-ink/30">—</span>`);
  $("trialPlans").innerHTML = `<p class="text-[11px] font-extrabold tracking-wider text-ink/50">PASO 1 DE ${T_PLAN === "free" ? 2 : 3}</p>
    <p class="mb-3 font-narrow text-2xl font-bold leading-tight">Elige el plan para tu negocio</p>
    <div class="grid grid-cols-3 gap-2">${PLAN_KEYS.map((k) => `<button type="button" class="relative rounded-2xl px-1.5 py-3 text-center" style="background:${PSTYLE[k][0]};color:${PSTYLE[k][1]};outline:3px solid ${k === T_PLAN ? "#17222E" : "transparent"};outline-offset:2px" data-tplan="${k}" aria-pressed="${k === T_PLAN}">
      ${k === rec ? `<span class="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-pole-red px-1.5 text-[8.5px] font-extrabold text-white">RECOMENDADO</span>` : ""}
      ${k === T_PLAN ? `<span class="absolute -right-1.5 -top-2 grid h-5 w-5 place-items-center rounded-full bg-ink text-[11px] font-extrabold text-white">✓</span>` : ""}
      <b class="block text-[14px]">${PSTYLE[k][2]} ${esc(P[k].name)}</b><span class="block text-[11px] opacity-90">${k === "free" ? P.free.days + " días" : cop(P[k].priceCOP) + "/mes"}</span></button>`).join("")}</div>
    <div class="mt-3 rounded-2xl p-3" style="background:${T_PLAN === "gold" ? "linear-gradient(160deg,#fff6db,#fff)" : "#F2F5F8"};${T_PLAN === "gold" ? "border:1px solid #f5c542" : ""}">
      <p class="mb-1 text-sm font-extrabold">${PSTYLE[T_PLAN][2]} Con ${esc(P[T_PLAN].name)}${P[T_PLAN].tagline ? `: <span class="font-semibold text-ink/70">${esc(P[T_PLAN].tagline)}</span>` : ""}</p>
      ${planBenefitsIntro(P, T_PLAN) ? `<p class="mb-1 text-[12px] font-bold text-ink/60">${esc(planBenefitsIntro(P, T_PLAN))}</p>` : ""}
      <ul class="space-y-1 text-[13px]">${planBenefits(P, T_PLAN).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
    </div>
    <table class="mt-1 w-full border-collapse">
      ${row("Agenda y cita rápida", () => `<b class="text-emerald-600">✓</b>`)}
      ${row("Días para reservar", (k) => `<b>${P[k].daysAhead}</b>`)}
      ${row("Profesionales", (k) => `<b>${P[k].maxStaff || "Sin límite"}</b>`)}
      ${[["telegram", "Avisos en Telegram"], ["appearance", "Portada y colores"], ["clients", "Clientes"], ["images", "Imágenes"], ["marketing", "Marketing y estados"], ["activity", "Actividad"]].map(([key, l]) => row(l, (k) => yes(k, key))).join("")}
    </table>
    <button type="button" id="trialNext" class="btn-primary mt-3 w-full py-3">Siguiente</button>`;
  $("trialPlans").querySelectorAll("[data-tplan]").forEach((b) => b.onclick = () => { T_PLAN = b.dataset.tplan; renderTrialPlans(); });
  $("trialNext").onclick = () => showTrialForm();
}
function showTrialForm() {
  const P = plansOf(PLAT);
  $("trialPlans").classList.add("hidden"); $("trialForm").classList.remove("hidden");
  $("trialTitle").textContent = "Tus datos";
  $("trialSub").textContent = `Paso 2 de ${T_PLAN === "free" ? 2 : 3}`;
  $("trialPlanLine").innerHTML = `<span>Plan elegido: <b>${PSTYLE[T_PLAN][2]} ${esc(P[T_PLAN].name)}</b> · ${T_PLAN === "free" ? P.free.days + " días gratis" : cop(P[T_PLAN].priceCOP) + "/mes"}</span><button type="button" id="trialChange" class="font-bold underline">Cambiar</button>`;
  $("trialChange").onclick = () => { $("trialForm").classList.add("hidden"); $("trialPlans").classList.remove("hidden"); $("trialTitle").textContent = "Crea tu agenda"; $("trialSub").textContent = ""; renderTrialPlans(); };
  $("trialForm").querySelector("button[type=submit]").textContent = T_PLAN === "free" ? "Crear mi agenda gratis" : "Crear mi agenda y pagar";
  $("trialFoot").textContent = T_PLAN === "free" ? "Al terminar la prueba eliges un plan para seguir." : "En el siguiente paso pagas con Bre-B y tu plan se activa solo.";
}
$("btnTrial").onclick = () => {
  const logged = !!auth.currentUser;
  $("trialTitle").textContent = "Crea tu agenda";
  $("trialSub").textContent = "";
  $("trialPlans").classList.remove("hidden"); renderTrialPlans();
  $("trialAccount").classList.toggle("hidden", logged);
  $("trialLogged").classList.toggle("hidden", !logged);
  if (logged) $("trialLogged").textContent = `Se crea con tu cuenta ${auth.currentUser.email}. Con ella entras a tu panel.`;
  const f = $("trialForm");
  if (S.profile) { f.ownerName.value = `${S.profile.firstName || ""} ${S.profile.lastName || ""}`.trim(); f.whatsapp.value = S.profile.whatsapp || ""; }
  $("trialForm").classList.add("hidden"); $("trialDone").classList.add("hidden");
  openModal("trialModal");
};
$("trialForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector("button[type=submit]");
  const name = f.name.value.trim(), phone = normalizePhone(f.whatsapp.value);
  if (name.length < 2) return toast("Escribe el nombre de tu negocio.", "error");
  if (!f.ownerName.value.trim()) return toast("Escribe tu nombre.", "error");
  if (!phone) return toast("Escribe un WhatsApp válido.", "error");
  setBusy(btn, true, "Creando tu agenda…");
  try {
    if (!auth.currentUser) {
      const email = f.email.value.trim(), pass = f.password.value;
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Escribe un correo válido.");
      if (pass.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
      try { await createUserWithEmailAndPassword(auth, email, pass); }
      catch (err) {
        if (String(err.code || "").includes("email-already-in-use")) await signInWithEmailAndPassword(auth, email, pass).catch(() => { throw new Error("Ese correo ya tiene cuenta y la contraseña no coincide."); });
        else throw new Error(authError(err));
      }
    }
    if (f.type.value === "otro" && !f.typeLabel.value.trim()) throw new Error("Escribe qué tipo de negocio tienes.");
    const r = await api("trialSignup", { name, type: f.type.value, typeLabel: f.typeLabel.value.trim(), ownerName: f.ownerName.value.trim(), whatsapp: phone, ref: REF_CODE, plan: T_PLAN || "free" });
    const base = location.origin + location.pathname.replace(/index\.html$/, "");
    const panel = `${base}admin.html?b=${r.slug}`, page = `${base}index.html?b=${r.slug}`;
    // plan pago: paso 3, el pago se hace en su panel (si cierra, al volver a entrar llega ahí mismo)
    if (r.planWanted) { setBusy(btn, true, "Abriendo el pago…"); location.href = panel; return; }
    $("trialForm").classList.add("hidden");
    $("trialDone").classList.remove("hidden");
    $("trialTitle").textContent = "¡Listo!";
    $("trialSub").textContent = "";
    $("trialDone").innerHTML = `
      <p class="text-4xl">🎉</p>
      <p class="mt-1 font-narrow text-2xl font-bold">¡${esc(name)} ya tiene agenda!</p>
      <p class="mb-4 text-sm text-ink/70">Prueba gratis hasta el ${fechaLarga(r.until)}${r.bonus ? ` (incluye ${r.bonus} días extra por invitación 🎁)` : ""}.</p>
      <div class="mb-4 rounded-2xl bg-paper p-4 text-left">
        <p class="mb-2 text-sm font-bold">Tus primeros pasos</p>
        <ol class="space-y-2 text-sm">
          <li class="flex gap-2"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">1</span><span>Entra a tu <b>panel</b>: ahí manejas tu negocio.</span></li>
          <li class="flex gap-2"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">2</span><span>Pon tus <b>servicios, precios y horario</b>.</span></li>
          <li class="flex gap-2"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">3</span><span>Agrega <b>cómo te pagan el abono</b> (Nequi o Bre-B).</span></li>
          <li class="flex gap-2"><span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink text-xs font-bold text-white">4</span><span>Comparte tu <b>enlace de citas</b> con tus clientes.</span></li>
        </ol>
        <p class="mt-2 text-xs text-ink/60">En tu panel te guiamos paso a paso.</p>
      </div>
      <a class="btn-primary block w-full py-3" href="${panel}&guia=1">Empezar: primeros pasos →</a>
      <p class="mb-1 mt-4 text-xs font-semibold text-ink/60">Tu enlace de citas (el que usan tus clientes para reservar)</p>
      <p class="mb-2 truncate rounded-lg bg-paper px-3 py-2 font-mono text-xs">${esc(page)}</p>
      <div class="grid grid-cols-2 gap-2"><a class="btn-light text-sm" href="${page}&desde=panel">Ver cómo reservan</a><button class="btn-light text-sm" data-copy="${page}">Copiar enlace</button></div>`;
  } catch (err) { toast(err.message || "No se pudo crear la agenda.", "error"); }
  finally { setBusy(btn, false); }
});

// ================= Visitas en vivo: el negocio ve quién está en su página =================
const PSID = (() => {
  const mk = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  try { let v = sessionStorage.getItem("psid"); if (!v) { v = mk(); sessionStorage.setItem("psid", v); } return v; } catch { return mk(); }
})();
let PSTAGE = "visit", PLAST = 0, PBEST = 0, PSTARTED = false;
const STAGE_RANK = { visit: 0, register: 1, hours: 2, service: 3, pay: 4, done: 5 };
function presence(stage) {
  if (S.dead || !BIZ_ID) return;
  if (stage) { if (stage === PSTAGE && Date.now() - PLAST < 20000) return; PSTAGE = stage; PBEST = Math.max(PBEST, STAGE_RANK[stage] ?? 0); }
  PLAST = Date.now();
  const name = S.profile ? `${S.profile.firstName || ""} ${(S.profile.lastName || "").slice(0, 1)}${S.profile.lastName ? "." : ""}`.trim().slice(0, 40) : "";
  const data = { stage: PSTAGE, name, uid: S.user && S.profile ? S.user.uid : "", at: serverTimestamp(), best: PBEST };
  if (!PSTARTED) data.first = serverTimestamp(); // cuándo empezó la visita (para Actividad)
  setDoc(doc(db, bpath("presence", PSID)), data, { merge: true }).then(() => { PSTARTED = true; }).catch(() => {
    // la visita ya existía (recargó la página): se sigue sin volver a marcar el inicio
    if (!PSTARTED) { PSTARTED = true; delete data.first; setDoc(doc(db, bpath("presence", PSID)), data, { merge: true }).catch(() => {}); }
  });
}
if (!S.dead) {
  presence("visit");
  setInterval(() => { if (document.visibilityState === "visible") presence(); }, 30000);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") presence(); });
  addEventListener("pagehide", () => { PSTAGE = "left"; presence(); });
}

// ================= Estados del negocio (24 horas, como en WhatsApp) =================
let STORIES = [];
const seenKey = "vistos_" + BIZ_ID;
const seen = () => { try { return JSON.parse(localStorage.getItem(seenKey) || "[]"); } catch { return []; } };
if (!S.dead) onSnapshot(collection(db, bpath("stories")), (q) => {
  STORIES = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => toMillis(x.expiresAt) > Date.now()).sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt));
  renderStories();
}, () => {});
function renderStories() {
  // los estados viven en el logo: anillo de colores + "NUEVO" mientras haya alguno sin ver
  const wrap = $("bizLogoWrap"), sv = seen();
  const has = STORIES.length > 0, fresh = has && STORIES.some((x) => !sv.includes(x.id));
  wrap.classList.toggle("has-stories", has);
  wrap.classList.toggle("seen", has && !fresh);
  $("storyPill").classList.toggle("hidden", !fresh);
  $("storyHint").classList.toggle("hidden", !fresh);
  wrap.setAttribute("aria-label", has ? `Ver los estados de ${S.settings?.businessName || "el negocio"}` : "Logo del negocio");
}
$("bizLogoWrap").addEventListener("click", () => { if (STORIES.length) { const sv = seen(); const first = STORIES.findIndex((x) => !sv.includes(x.id)); openStoryViewer(first >= 0 ? first : 0); } });
$("storyHint").addEventListener("click", () => $("bizLogoWrap").click());
function openStoryViewer(start) {
  let i = start, t0 = 0, raf = 0, paused = false;
  const DUR = 5000;
  const wrap = document.createElement("div");
  wrap.className = "story-view"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-modal", "true"); wrap.setAttribute("aria-label", "Estados de " + (S.settings?.businessName || "el negocio"));
  document.body.appendChild(wrap);
  let gone = false;
  const hide = () => { if (gone) return; gone = true; cancelAnimationFrame(raf); wrap.remove(); document.removeEventListener("keydown", key); renderStories(); };
  const close = () => { hide(); dropOverlay("stories"); };
  pushOverlay("stories", hide);
  const key = (e) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
  document.addEventListener("keydown", key);
  const markSeen = (id) => { try { const v = seen(); if (!v.includes(id)) { v.push(id); localStorage.setItem(seenKey, JSON.stringify(v.slice(-60))); } } catch { /* sin almacenamiento */ } };
  function draw() {
    const x = STORIES[i]; if (!x) return close();
    markSeen(x.id);
    const hrs = Math.max(1, Math.round((Date.now() - toMillis(x.createdAt)) / 3600000));
    wrap.innerHTML = `<div class="story-bars">${STORIES.map((_, k) => `<span><i style="width:${k < i ? 100 : 0}%"></i></span>`).join("")}</div>
      <div class="flex items-center gap-2 px-3 pb-2"><span class="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-white/20 text-xs font-bold">${S.settings?.appearance?.logo ? `<img src="${S.settings.appearance.logo}" alt="" class="h-full w-full object-cover">` : esc((S.settings?.businessName || "").slice(0, 2).toUpperCase())}</span>
        <span class="text-sm font-bold">${esc(S.settings?.businessName || "")}</span><span class="text-xs opacity-70">hace ${hrs} h</span>
        <button class="ml-auto px-2 text-2xl leading-none" data-sx="close" aria-label="Cerrar">✕</button></div>
      <div class="story-stage" style="${x.img ? "" : `background:${x.bg || "#14213D"}`}">${x.img ? `<img src="${x.img}" alt="">` : ""}
        <p class="story-text" style="${x.img ? "" : "position:static;padding:24px;font-size:26px"}">${esc(x.text || "")}</p>
        <button class="absolute inset-y-0 left-0 w-1/3" data-sx="prev" aria-label="Anterior"></button><button class="absolute inset-y-0 right-0 w-2/3" data-sx="next" aria-label="Siguiente"></button></div>
      <div class="p-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))]"><button class="w-full rounded-2xl bg-white py-3 font-bold text-ink" data-sx="book">Agendar mi cita</button></div>`;
    t0 = performance.now(); cancelAnimationFrame(raf); tick();
  }
  function tick() {
    raf = requestAnimationFrame((now) => {
      if (paused) { t0 = now - (Number(wrap.dataset.el) || 0); return tick(); }
      const el = now - t0; wrap.dataset.el = el;
      const bar = wrap.querySelectorAll(".story-bars i")[i]; if (bar) bar.style.width = Math.min(100, (el / DUR) * 100) + "%";
      if (el >= DUR) go(1); else tick();
    });
  }
  function go(d) { i += d; if (i < 0) i = 0; if (i >= STORIES.length) return close(); draw(); }
  wrap.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sx]"); if (!b) return;
    if (b.dataset.sx === "close") close();
    if (b.dataset.sx === "prev") go(-1);
    if (b.dataset.sx === "next") go(1);
    if (b.dataset.sx === "book") { close(); ($("mainContent").classList.contains("hidden") ? $("gate") : $("slotsBox") || $("mainContent")).scrollIntoView({ behavior: "smooth" }); }
  });
  wrap.addEventListener("pointerdown", () => { paused = true; });
  wrap.addEventListener("pointerup", () => { paused = false; });
  draw();
}

// ================= Enlace de invitación (programa de referidos) =================
var REF_CODE = (() => {
  const sp = new URLSearchParams(location.search), q = sp.get("invita") || sp.get("ref");
  const clean = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);
  try { if (q) localStorage.setItem("refCode", clean(q)); return clean(q) || clean(localStorage.getItem("refCode")); } catch { return clean(q); }
})();
if (new URLSearchParams(location.search).get("invita") || new URLSearchParams(location.search).get("ref")) {
  // llegó con una invitación: se muestra la creación de tienda de una vez
  getDoc(doc(db, "businesses", REF_CODE)).then((d) => {
    const inviter = d.exists() ? d.data().name : "";
    const bonus = Number(PLAT?.referral?.bonusDays ?? 7);
    if (S.dead) {
      $("unTitle").textContent = inviter ? `${inviter} te invita a tener tu agenda en línea` : "Crea tu agenda en línea";
      $("unText").textContent = `Tus clientes apartan su cita solos y pagan el abono por adelantado.${bonus && inviter ? ` Por venir invitado tienes ${bonus} días extra de prueba gratis.` : ""}`;
    }
    setTimeout(() => $("btnTrial").click(), 600);
  }).catch(() => setTimeout(() => $("btnTrial").click(), 600));
}

// Probar gratis: lista completa de tipos y casilla para escribir el propio
(() => {
  const sel = document.querySelector('#trialForm select[name="type"]'); if (!sel) return;
  sel.innerHTML = BIZ_TYPES.map(([k, t, , e]) => `<option value="${k}">${e} ${t}</option>`).join("");
  sel.onchange = () => $("trialTypeOther").classList.toggle("hidden", sel.value !== "otro");
})();

// El dueño mirando su propia página (desde "Ver cómo reservan" o su panel): botón para volver
if (new URLSearchParams(location.search).get("desde") === "panel" && BIZ_ID) {
  const back = document.createElement("a");
  back.href = "admin.html?b=" + encodeURIComponent(BIZ_ID);
  back.className = "back-panel";
  back.innerHTML = "← Volver a mi panel";
  document.body.appendChild(back);
}
