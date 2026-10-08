// Página pública: ver cupos, registrarse, apartar, pagar con screenshot, mis cupos
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, getDocs, collection, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  db, auth, bpath, api, setBusiness, businessFromUrl, bogNow, addDays, dow, hora12, fechaLarga, fechaCorta, toMillis, cop, esc,
  normalizePhone, waLink, statusBadge, fillTemplate, DEFAULT_WA_CONFIRM, computeSlots, dayCapacityUnits,
  toast, openModal, closeModal, setBusy, copyText, tmin, mstr, UNIT
} from "./common.js";

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
  $("unTitle").textContent = title; $("unText").textContent = text;
  $("unavailable").classList.remove("hidden");
  $("mainContent").classList.add("hidden");
  $("bookBar").classList.add("hidden");
}
if (!/^[a-z0-9][a-z0-9-]{1,29}$/.test(BIZ_ID)) {
  showUnavailable("Falta el enlace del negocio", "Abre la página con el enlace que te compartieron.");
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
  renderBiz(); renderStaff(); renderAll();
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
  renderNav(); renderSummary();
});

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
function renderBiz() {
  const s = S.settings || {};
  $("bizName").textContent = s.businessName || "Reserva tu cita";
  $("bizAddress").textContent = [s.address, s.city].filter(Boolean).join(", ");
  document.title = (s.businessName ? s.businessName + " · " : "") + "Reserva tu cita";
  if (s.habeasDataText) $("habeasText").textContent = s.habeasDataText;
}

function renderNav() {
  const nav = $("nav");
  if (S.user) {
    const active = S.mine.filter((a) => ["pending_payment", "pending_verification", "confirmed"].includes(a.status)).length;
    nav.innerHTML = `
      <button id="btnMine" class="btn-light text-sm">Mis cupos${active ? ` <span class="ml-1 rounded-full bg-pole-red px-1.5 text-xs text-white">${active}</span>` : ""}</button>
      <button id="btnLogout" class="btn-ghost text-sm text-white/80">Salir</button>`;
    $("btnMine").onclick = () => { renderMine(); openModal("mineModal"); };
    $("btnLogout").onclick = () => signOut(auth);
  } else {
    nav.innerHTML = `
      <button id="btnReg" class="btn-primary text-sm">Regístrate aquí y aparta tus cupos</button>
      <button id="btnLogin" class="btn-ghost text-sm text-white/80">Ingresar</button>`;
    $("btnReg").onclick = () => openAuth("register");
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
  $("staffStatus").innerHTML = S.staff.map((s) => staffIsBusy(s)
    ? `<span class="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"><i class="dot bg-pole-red"></i><b>${esc(s.name)}</b> en descanso, vuelve a las ${busyUntilLabel(s)}</span>`
    : `<span class="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"><i class="dot bg-emerald-500"></i><b>${esc(s.name)}</b> disponible</span>`
  ).join("");
  if (S.staffId && !S.staff.some((s) => s.id === S.staffId)) S.staffId = "";
  $("staffPick").classList.toggle("hidden", S.staff.length < 2);
  $("staffPick").innerHTML = `<span class="self-center text-sm text-ink/70">${esc(staffLabel())}:</span>` +
    [`<button class="chip" data-staff="" aria-pressed="${!S.staffId}">Cualquiera</button>`]
      .concat(S.staff.map((s) => `<button class="chip" data-staff="${esc(s.id)}" aria-pressed="${S.staffId === s.id}">${esc(s.name)}</button>`)).join("");
}
$("staffPick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-staff]"); if (!b) return;
  S.staffId = b.dataset.staff; S.time = null;
  renderStaff(); renderAll();
});

// ---------- Cálculo de cupos ----------
const slotLen = () => Number(S.settings?.slotDurationMinutes || 30);
const maxDate = () => addDays(bogNow().date, Math.min(90, Number(S.settings?.bookingWindowDays || 30)));
const staffPool = () => S.staff.filter((s) => !S.staffId || s.id === S.staffId);
const hoursOf = (date) => (S.settings?.businessHours || {})[String(dow(date))] || [];
const isClosed = (date) => !hoursOf(date).length || (S.settings?.closedDates || []).includes(date);
function firstOpenDay() {
  const today = bogNow().date, end = maxDate();
  for (let d = today; d <= end; d = addDays(d, 1)) if (!isClosed(d)) return d;
  return today;
}
const takenSet = () => new Set(S.dayLocks.map((l) => `${l.staffId}_${l.time}`));
// Todos los cupos del día con los profesionales libres en cada uno
function dayGrid() {
  if (!S.settings || !S.date || isClosed(S.date)) return [];
  const now = bogNow(); if (S.date < now.date) return [];
  const slot = slotLen(), taken = takenSet();
  const minStart = S.date === now.date ? now.min + Number(S.settings.minAdvanceMinutes || 0) : -1;
  const out = [];
  for (const h of hoursOf(S.date)) {
    const o = tmin(h.open), c = tmin(h.close);
    for (let t = o; t + slot <= c; t += slot) {
      if (t < minStart) continue;
      const free = staffPool().filter((s) => { for (let u = t; u < t + slot; u += UNIT) if (taken.has(`${s.id}_${mstr(u)}`)) return false; return true; }).map((s) => s.id);
      out.push({ time: mstr(t), free });
    }
  }
  return out;
}
// Minutos seguidos libres de un profesional desde una hora
function freeFrom(staffId, time) {
  const t = tmin(time), taken = takenSet();
  const iv = hoursOf(S.date).map((h) => [tmin(h.open), tmin(h.close)]).find(([o, c]) => t >= o && t < c);
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
    return hoursOf(date).some((h) => tmin(h.close) - slotLen() >= now);
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
  hint.textContent = `Cada cupo es de ${slotLen() < 60 ? slotLen() + " minutos" : slotLen() === 60 ? "1 hora" : slotLen() / 60 + " horas"}. Toca el que prefieras.`;
  box.innerHTML = free.map((g) => `<button class="tpill" data-time="${g.time}" aria-pressed="${S.time === g.time}">${hora12(g.time)}</button>`).join("");
}
$("btnNextDay").onclick = () => { const d = $("btnNextDay").dataset.date; if (d) selectDate(d); };
$("slots").addEventListener("click", (e) => {
  const b = e.target.closest("[data-time]"); if (!b) return;
  S.time = b.dataset.time;
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
  if (!S.user) { S.pendingBooking = true; openAuth("register"); return; }
  if (!S.profile) { S.pendingBooking = true; openAuth("register", true); return; }
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
  try {
    const staffId = bookingStaff();
    if (!staffId) throw new Error("Ese horario ya no alcanza para este servicio. Elige otra hora.");
    const r = await api("createHold", { mainId: S.mainId, extraIds: [...S.extras], staffId, date: S.date, time: S.time, consent: S.consentOk || !!S.cust });
    S.time = null;
    if (r.appointment.status === "confirmed") { toast("¡Cupo confirmado!"); showTicket(r.appointment); }
    else showPay(r.appointment);
  } catch (e) { toast(e.message, "error"); }
  finally { setBusy(btn, false); delete btn.dataset.label; renderSlots(); renderServices(); renderSummary(); }
}

// ================= Registro / ingreso =================
function openAuth(mode, completeProfile = false) {
  setAuthTab(mode);
  const pw = $("registerForm").password;
  pw.closest("label").classList.toggle("hidden", completeProfile);
  pw.required = !completeProfile;
  if (completeProfile) {
    $("registerForm").email.value = S.user?.email || "";
    toast("Completa tus datos para poder reservar.");
  }
  openModal("authModal");
}
function setAuthTab(mode) {
  const reg = mode === "register";
  $("registerForm").classList.toggle("hidden", !reg);
  $("loginForm").classList.toggle("hidden", reg);
  $("tabRegister").classList.toggle("tab-on", reg);
  $("tabLogin").classList.toggle("tab-on", !reg);
  $("authTitle").textContent = reg ? "Regístrate y aparta tus cupos" : "Ingresa a tu cuenta";
}
$("tabRegister").onclick = () => setAuthTab("register");
$("tabLogin").onclick = () => setAuthTab("login");

function authError(err) {
  const c = err?.code || "";
  if (c.includes("email-already-in-use")) return "Ese correo ya tiene cuenta. Usa la pestaña “Ya tengo cuenta”.";
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
  const fd = Object.fromEntries(new FormData(f));
  const phone = normalizePhone(fd.whatsapp);
  if (!fd.firstName?.trim() || !fd.lastName?.trim()) return toast("Escribe tu nombre y apellido.", "error");
  if (!phone) return toast("Escribe un número de WhatsApp válido, por ejemplo 300 123 4567.", "error");
  if (!/^\S+@\S+\.\S+$/.test(fd.email || "")) return toast("Escribe un correo válido.", "error");
  if (!f.consent.checked) return toast("Debes aceptar el tratamiento de datos para continuar.", "error");
  const btn = f.querySelector("button[type=submit]");
  setBusy(btn, true, "Creando cuenta…");
  try {
    S.registering = true;
    let uid = auth.currentUser?.uid;
    if (!uid) {
      if ((fd.password || "").length < 6) throw { code: "weak-password" };
      uid = (await createUserWithEmailAndPassword(auth, fd.email.trim(), fd.password)).user.uid;
    }
    const profile = {
      firstName: fd.firstName.trim(), lastName: fd.lastName.trim(),
      email: (auth.currentUser?.email || fd.email).trim().toLowerCase(), whatsapp: phone,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, "users", uid), profile);
    S.profile = profile;
    S.consentOk = true; // aceptó la autorización de esta barbería en el formulario
    closeModal("authModal"); f.reset();
    toast("¡Cuenta creada!");
    renderNav(); renderSummary(); afterAuth();
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
    closeModal("authModal"); f.reset();
    if (!S.profile) { openAuth("register", true); return; }
    toast("Hola, " + (S.profile.firstName || ""));
    renderSummary();
    if (S.pendingBooking && !S.cust && !S.consentOk) {
      try { const c = await getDoc(doc(db, bpath("customers", cred.user.uid))); S.cust = c.exists() ? c.data() : null; } catch { /* sin datos */ }
      if (!S.cust) { S.pendingBooking = false; openConsent(); return; }
    }
    afterAuth();
  } catch (err) { toast(authError(err), "error"); }
  finally { setBusy(btn, false); }
});

$("btnForgot").onclick = async () => {
  const email = $("loginForm").email.value.trim();
  if (!email) return toast("Escribe tu correo arriba y vuelve a tocar “Olvidé mi contraseña”.", "error");
  try { await sendPasswordResetEmail(auth, email); toast("Te enviamos un correo para cambiar la contraseña."); }
  catch (err) { toast(authError(err), "error"); }
};

function afterAuth() {
  if (S.pendingBooking && S.mainId && S.date && S.time) {
    S.pendingBooking = false;
    if (!S.cust && !S.consentOk) openConsent(); else doHold();
  }
  else S.pendingBooking = false;
}

// ================= Pago con screenshot =================
function showPay(apt) {
  S.payApt = apt;
  const st = S.settings || {};
  const methods = (st.paymentMethods || []).map((m) => `
    <li class="rounded-lg border border-line p-3">
      <p class="font-semibold">${esc(m.label)}</p>
      <p class="flex items-center justify-between gap-2 text-sm"><span>${esc(m.account)}${m.holder ? " · " + esc(m.holder) : ""}</span>
        <button type="button" class="btn-sm" data-copy="${esc(m.account)}">Copiar</button></p>
    </li>`).join("") || `<li class="text-sm text-ink/60">La barbería aún no ha configurado sus medios de pago.</li>`;
  $("payBody").innerHTML = `
    <p class="mb-3 text-sm text-ink/75">Tu cupo está apartado por unos minutos. Transfiere el abono y sube el screenshot.</p>
    <div class="mb-3 rounded-xl bg-paper p-4">
      <div class="flex items-end justify-between gap-3">
        <div><p class="text-xs text-ink/60">Número de reservación</p><p class="font-narrow text-3xl font-bold tracking-wider">${esc(apt.code)}</p></div>
        <button type="button" class="btn-sm" data-copy="${esc(apt.code)}">Copiar</button>
      </div>
      <p class="mt-2 text-sm">Escríbelo en el concepto o descripción de la transferencia.</p>
    </div>
    <dl class="mb-3 text-sm">
      <div class="ticket-row"><dt>Abono a transferir</dt><dd class="text-lg">${cop(apt.depositCOP)}</dd></div>
      <div class="ticket-row"><dt>Cita</dt><dd>${fechaCorta(apt.date)} · ${hora12(apt.startTime)}</dd></div>
      <div class="ticket-row"><dt>Saldo en el local</dt><dd>${cop(apt.balanceDueCOP)}</dd></div>
    </dl>
    <ul class="space-y-2">${methods}</ul>
    ${st.paymentInstructions ? `<p class="mt-3 text-sm text-ink/75">${esc(st.paymentInstructions)}</p>` : ""}
    <p id="payCountdown" class="mt-3 rounded-lg bg-amber-50 p-2 text-center text-sm font-semibold text-amber-900"></p>`;
  $("proofForm").reset();
  $("proofPreview").classList.add("hidden");
  closeModal("mineModal");
  openModal("payModal");
  clearInterval(S.payTimer);
  const tick = () => {
    const left = toMillis(apt.holdExpiresAt) - Date.now();
    const el = $("payCountdown"); if (!el) return;
    const submit = $("proofForm").querySelector("button[type=submit]");
    if (left <= 0) {
      el.textContent = "El tiempo para pagar venció. Aparta el cupo de nuevo.";
      submit.disabled = true; clearInterval(S.payTimer); return;
    }
    submit.disabled = false;
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    el.textContent = `Tu cupo queda apartado ${m}:${String(s).padStart(2, "0")} minutos más`;
  };
  tick(); S.payTimer = setInterval(tick, 1000);
}
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-copy]"); if (c) copyText(c.dataset.copy);
  const x = e.target.closest("[data-close]"); if (x) { closeModal(x.dataset.close); if (x.dataset.close === "payModal") clearInterval(S.payTimer); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal.flex").forEach((m) => closeModal(m.id));
});

$("proofForm").proof.addEventListener("change", (e) => {
  const file = e.target.files[0]; if (!file) return;
  const img = $("proofPreview"); img.src = URL.createObjectURL(file); img.classList.remove("hidden");
});

async function compressImage(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 1280;
  let w = img.naturalWidth, h = img.naturalHeight;
  if (Math.max(w, h) > max) { const r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.75);
}

$("proofForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const file = f.proof.files[0];
  if (!file) return toast("Selecciona el screenshot de la transferencia.", "error");
  if (!file.type.startsWith("image/")) return toast("El comprobante debe ser una imagen.", "error");
  const btn = f.querySelector("button[type=submit]");
  setBusy(btn, true, "Enviando comprobante…");
  try {
    const image = await compressImage(file);
    const r = await api("submitProof", { code: S.payApt.code, image, reference: f.reference.value });
    clearInterval(S.payTimer);
    closeModal("payModal");
    showTicket(r.appointment);
  } catch (err) { toast(err.message || "No se pudo enviar el comprobante.", "error"); }
  finally { setBusy(btn, false); }
});

// ================= Ticket =================
function showTicket(apt) {
  const st = S.settings || {};
  const note = {
    confirmed: "Cupo confirmado. Presenta este número al llegar.",
    pending_verification: "Recibimos tu comprobante. Te avisamos por correo cuando lo revisemos.",
    pending_payment: "Falta subir el comprobante del abono."
  }[apt.status] || "";
  $("ticket").innerHTML = `
    <article class="ticket">
      <div class="ticket-head">
        ${apt.status === "confirmed" ? `<div class="ticket-ok" aria-hidden="true">✓</div><p class="mb-2 text-center font-narrow text-xl font-bold uppercase tracking-wide">Tu turno fue confirmado</p>` : ""}
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
        <p class="mt-1">Tolerancia de espera: ${Number(st.toleranceMinutes || 10)} minutos. ${[st.address, st.city].filter(Boolean).map(esc).join(", ")}</p>
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
function renderMine() {
  const box = $("mineList");
  if (!S.mine.length) { box.innerHTML = `<p class="text-sm text-ink/70">Aún no tienes cupos. Elige un servicio, un día y una hora para apartar el primero.</p>`; return; }
  const maxR = Number(S.settings?.maxReschedules ?? 2);
  box.innerHTML = S.mine.map((a) => {
    const acts = [];
    if (a.status === "pending_payment") {
      acts.push(`<button class="btn-dark text-sm" data-act="pay" data-code="${a.code}">Pagar abono</button>`);
      acts.push(`<button class="btn-sm" data-act="cancel" data-code="${a.code}">Cancelar</button>`);
    } else if (["confirmed", "pending_verification"].includes(a.status)) {
      acts.push(`<button class="btn-dark text-sm" data-act="ticket" data-code="${a.code}">Ver ticket</button>`);
      if (canChange(a) && (a.rescheduleCount || 0) < maxR) acts.push(`<button class="btn-sm" data-act="resched" data-code="${a.code}">Cambiar hora</button>`);
      if (canChange(a)) acts.push(`<button class="btn-sm" data-act="cancel" data-code="${a.code}">Cancelar</button>`);
      if (!canChange(a) && S.settings?.whatsapp) acts.push(`<a class="btn-sm" target="_blank" rel="noopener" href="${waLink(S.settings.whatsapp, "Hola, necesito ayuda con mi reserva " + a.code)}">Escribir por WhatsApp</a>`);
    } else acts.push(`<button class="btn-sm" data-act="ticket" data-code="${a.code}">Ver detalle</button>`);
    return `<article class="rounded-xl border border-line p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="font-narrow text-xl font-bold tracking-wide">${esc(a.code)}</p>${statusBadge(a.status)}
      </div>
      <p class="mt-1 text-sm capitalize">${fechaLarga(a.date)} · ${hora12(a.startTime)} · ${esc(a.staffName)}</p>
      <p class="text-sm text-ink/70">${(a.items || []).map((i) => esc(i.name)).join(" + ")} · ${cop(a.totalCOP)}</p>
      <div class="mt-3 flex flex-wrap gap-2">${acts.join("")}</div>
    </article>`;
  }).join("");
}
$("mineList").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const apt = S.mine.find((a) => a.code === b.dataset.code); if (!apt) return;
  const act = b.dataset.act;
  if (act === "pay") showPay(apt);
  if (act === "ticket") { closeModal("mineModal"); showTicket(apt); }
  if (act === "resched") openResched(apt);
  if (act === "cancel") {
    if (!confirm(`¿Cancelar la reserva ${apt.code}?`)) return;
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
