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
  toast, openModal, closeModal, setBusy, copyText, tmin
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
  showUnavailable("Falta el enlace de la barbería", "Abre la página con el enlace que te compartió tu barbería.");
} else {
  setBusiness(BIZ_ID);
}

// ================= Datos en tiempo real =================
function boot() {
onSnapshot(doc(db, "businesses", BIZ_ID), (s) => {
  if (!s.exists()) { showUnavailable("No encontramos esta barbería", "Revisa que el enlace esté completo."); return; }
  S.biz = s.data();
  const off = S.biz.status !== "active";
  $("closedBanner").classList.toggle("hidden", !off);
  $("btnBook").classList.toggle("hidden", off);
  if (off) $("summary").innerHTML = `<span class="font-semibold text-pole-red">Las reservas en línea no están disponibles por ahora.</span>`;
}, onErr);

onSnapshot(doc(db, bpath("settings", "general")), (s) => {
  S.settings = s.data() || null;
  renderBiz(); renderCalendar(); renderSlots(); renderSummary();
}, onErr);

onSnapshot(collection(db, bpath("services")), (q) => {
  S.services = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  renderServices(); renderSummary();
}, onErr);

onSnapshot(collection(db, bpath("staff")), (q) => {
  S.staff = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.active !== false)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  renderStaff(); renderCalendar(); renderSlots();
}, onErr);

subscribeMonth();
setInterval(() => { renderStaff(); renderSlots(); }, 60000); // refresca horas y estados cada minuto
renderNav(); renderSummary();
}

let unsubMonth = null, unsubDay = null, unsubMine = null, unsubCust = null;
function subscribeMonth() {
  unsubMonth?.();
  const m = S.month;
  unsubMonth = onSnapshot(query(collection(db, bpath("dayAvailability")), where("date", ">=", m + "-01"), where("date", "<=", m + "-31")), (q) => {
    S.monthAvail = {};
    q.forEach((d) => { S.monthAvail[d.id] = d.data(); });
    renderCalendar();
  }, onErr);
}
function subscribeDay(date) {
  unsubDay?.();
  unsubDay = onSnapshot(query(collection(db, bpath("slotLocks")), where("date", "==", date)), (q) => {
    S.dayLocks = q.docs.map((d) => d.data());
    renderSlots();
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
  $("bizName").textContent = s.businessName || "Reserva tu cupo";
  $("bizAddress").textContent = [s.address, s.city].filter(Boolean).join(", ");
  document.title = (s.businessName ? s.businessName + " · " : "") + "Reserva tu cupo";
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

function renderStaff() {
  $("staffStatus").innerHTML = S.staff.map((s) => staffIsBusy(s)
    ? `<span class="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"><i class="dot bg-pole-red"></i><b>${esc(s.name)}</b> en descanso, vuelve a las ${busyUntilLabel(s)}</span>`
    : `<span class="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-sm"><i class="dot bg-emerald-500"></i><b>${esc(s.name)}</b> disponible</span>`
  ).join("");

  const capable = S.staff.filter((s) => !S.mainId || !s.serviceIds?.length || s.serviceIds.includes(S.mainId));
  if (S.staffId && !capable.some((s) => s.id === S.staffId)) S.staffId = "";
  $("staffPick").innerHTML = [`<button class="chip" data-staff="" aria-pressed="${!S.staffId}">El primero disponible</button>`]
    .concat(capable.map((s) => `<button class="chip" data-staff="${esc(s.id)}" aria-pressed="${S.staffId === s.id}">${esc(s.name)}</button>`)).join("");
}
$("staffPick").addEventListener("click", (e) => {
  const b = e.target.closest("[data-staff]"); if (!b) return;
  S.staffId = b.dataset.staff; S.time = null;
  renderStaff(); renderCalendar(); renderSlots(); renderSummary();
});

function serviceButton(s, pressed, kind) {
  const meta = s.type === "addon" ? `+${s.minutes} min` : `${s.minutes} min`;
  return `<button class="choice" data-${kind}="${esc(s.id)}" aria-pressed="${pressed}">
    <span><span class="block font-semibold">${esc(s.name)}</span><span class="text-xs text-ink/60">${meta}${s.description ? " · " + esc(s.description) : ""}</span></span>
    <span class="font-bold">${s.type === "addon" ? "+" : ""}${cop(s.priceCOP)}</span></button>`;
}
function renderServices() {
  const mains = S.services.filter((s) => s.type !== "addon");
  if (S.mainId && !mains.some((s) => s.id === S.mainId)) S.mainId = null;
  $("mainServices").innerHTML = mains.length ? mains.map((s) => serviceButton(s, S.mainId === s.id, "main")).join("")
    : `<p class="text-sm text-ink/60">Aún no hay servicios publicados.</p>`;
  const extras = S.services.filter((s) => s.type !== "base" && s.id !== S.mainId);
  [...S.extras].forEach((id) => { if (!extras.some((s) => s.id === id)) S.extras.delete(id); });
  $("extrasWrap").classList.toggle("hidden", !S.mainId || !extras.length);
  $("extraServices").innerHTML = extras.map((s) => serviceButton(s, S.extras.has(s.id), "extra")).join("");
}
$("mainServices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-main]"); if (!b) return;
  S.mainId = b.dataset.main; S.extras.delete(S.mainId); S.time = null;
  renderServices(); renderStaff(); renderSlots(); renderSummary();
});
$("extraServices").addEventListener("click", (e) => {
  const b = e.target.closest("[data-extra]"); if (!b) return;
  const id = b.dataset.extra;
  S.extras.has(id) ? S.extras.delete(id) : S.extras.add(id);
  S.time = null;
  renderServices(); renderSlots(); renderSummary();
});

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

function renderCalendar() {
  const [y, m] = S.month.split("-").map(Number);
  const first = `${S.month}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const today = bogNow().date;
  const maxDate = addDays(today, Number(S.settings?.bookingWindowDays || 30));
  $("monthLabel").textContent = new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("es-CO", { timeZone: "UTC", month: "long", year: "numeric" });
  $("prevMonth").disabled = S.month <= today.slice(0, 7);
  $("nextMonth").disabled = S.month >= maxDate.slice(0, 7);

  const offset = (dow(first) + 6) % 7;
  let html = "<span></span>".repeat(offset);
  const staffForCap = S.staffId ? S.staff.filter((s) => s.id === S.staffId) : S.staff;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${S.month}-${String(d).padStart(2, "0")}`;
    const cap = dayCapacityUnits(S.settings, staffForCap, date);
    const units = S.monthAvail[date]?.units || {};
    const booked = S.staffId ? Number(units[S.staffId] || 0) : Object.values(units).reduce((a, n) => a + Number(n || 0), 0);
    const ratio = cap ? booked / cap : 1;
    let dot = "bg-emerald-500", disabled = false, label = "hay cupos";
    if (date < today || date > maxDate) { disabled = true; dot = ""; label = "no disponible"; }
    else if (!cap) { disabled = true; dot = "bg-slate-300"; label = "cerrado"; }
    else if (ratio >= 1) { disabled = true; dot = "bg-pole-red"; label = "lleno"; }
    else if (ratio >= 0.7) { dot = "bg-amber-500"; label = "quedan pocos cupos"; }
    html += `<button class="day ${disabled ? "" : "bg-paper"}" data-date="${date}" ${disabled ? "disabled" : ""} aria-pressed="${S.date === date}" aria-label="${fechaLarga(date)}, ${label}">
      ${d}${dot ? `<i class="dot ${dot}"></i>` : ""}</button>`;
  }
  $("calendar").innerHTML = html;
}
$("calendar").addEventListener("click", (e) => {
  const b = e.target.closest("[data-date]"); if (!b || b.disabled) return;
  S.date = b.dataset.date; S.time = null; S.dayLocks = [];
  subscribeDay(S.date); renderCalendar(); renderSlots(); renderSummary();
});
function shiftMonth(n) {
  const [y, m] = S.month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  S.month = d.toISOString().slice(0, 7);
  subscribeMonth(); renderCalendar();
}
$("prevMonth").onclick = () => shiftMonth(-1);
$("nextMonth").onclick = () => shiftMonth(1);

function currentSlots() {
  if (!S.mainId || !S.date) return [];
  return computeSlots({
    settings: S.settings, staffList: S.staff, locks: S.dayLocks, date: S.date,
    totalMinutes: selection().totalMinutes, mainId: S.mainId, staffFilter: S.staffId
  });
}
function renderSlots() {
  const box = $("slots"), hint = $("slotsHint");
  if (!S.mainId || !S.date) { box.innerHTML = ""; hint.textContent = "Primero elige un servicio y un día."; return; }
  const slots = currentSlots();
  if (S.time && !slots.some((s) => s.time === S.time)) { S.time = null; renderSummary(); }
  hint.textContent = slots.length ? `Horas libres para el ${fechaLarga(S.date)}:` : "No quedan horas libres ese día para este servicio. Prueba otro día u otro barbero.";
  box.innerHTML = slots.map((s) => `<button class="slot" data-time="${s.time}" aria-pressed="${S.time === s.time}">${hora12(s.time)}</button>`).join("");
}
$("slots").addEventListener("click", (e) => {
  const b = e.target.closest("[data-time]"); if (!b) return;
  S.time = b.dataset.time;
  S.slotStaff = currentSlots().find((s) => s.time === S.time)?.staffIds || [];
  renderSlots(); renderSummary();
});

function renderSummary() {
  const { items, totalMinutes, totalCOP } = selection();
  const btn = $("btnBook");
  if (!items.length) { $("summary").innerHTML = `<span class="text-ink/60">Elige un servicio para empezar.</span>`; btn.disabled = true; return; }
  const dep = expectedDeposit(totalCOP);
  const depText = S.cust?.paymentMode === "preferential" ? "Cliente preferencial: sin abono" : `Abono para apartar ${cop(dep)}`;
  $("summary").innerHTML = `
    <p class="truncate font-semibold">${items.map((i) => esc(i.name)).join(" + ")} · ${cop(totalCOP)}</p>
    <p class="truncate text-ink/70">${S.date ? fechaCorta(S.date) : "Sin día"}${S.time ? " · " + hora12(S.time) : ""} · ${totalMinutes} min · ${depText}</p>`;
  if (!btn.dataset.label) btn.disabled = !(S.mainId && S.date && S.time) || S.biz?.status !== "active";
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
  $("consentBiz").textContent = S.settings?.businessName || S.biz?.name || "esta barbería";
  openModal("consentModal");
}
$("btnConsent").onclick = () => { S.consentOk = true; closeModal("consentModal"); doHold(); };

async function doHold() {
  const btn = $("btnBook");
  setBusy(btn, true, "Apartando…");
  try {
    const staffId = S.staffId || S.slotStaff[0];
    const r = await api("createHold", { mainId: S.mainId, extraIds: [...S.extras], staffId, date: S.date, time: S.time, consent: S.consentOk || !!S.cust });
    S.time = null;
    if (r.appointment.status === "confirmed") { toast("¡Cupo confirmado!"); showTicket(r.appointment); }
    else showPay(r.appointment);
  } catch (e) { toast(e.message, "error"); }
  finally { setBusy(btn, false); delete btn.dataset.label; renderSlots(); renderSummary(); }
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
