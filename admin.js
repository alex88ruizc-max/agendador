// Panel de administración: agenda, pagos, descansos, clientes, servicios y configuración
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  db, auth, bpath, api, setBusiness, businessFromUrl, bogNow, addDays, hora12, fechaLarga, fechaCorta, toMillis, cop, esc, normalizePhone,
  waLink, statusBadge, fillTemplate, DEFAULT_WA_CONFIRM, DEFAULT_WA_RESCHEDULE, computeSlots,
  toast, openModal, closeModal, setBusy, copyText
} from "./common.js";

const $ = (id) => document.getElementById(id);
const ACTIVE = ["pending_payment", "pending_verification", "confirmed"];
const A = {
  me: null, settings: {}, services: [], staff: [], tg: {}, date: bogNow().date,
  dayApts: [], pending: [], index: {}, users: [], clientQ: "", tab: "agenda", unsubs: [], unsubDay: null, m: null
};
const isOwner = () => A.me?.role === "owner";
const show = (id, on) => $(id).classList.toggle("hidden", !on);
const onErr = (e) => { console.error(e); toast("Error leyendo datos: " + (e.code || e.message), "error"); };

// ================= Sesión =================
onAuthStateChanged(auth, async (u) => {
  A.unsubs.forEach((f) => f()); A.unsubs = []; A.unsubDay?.();
  show("loginView", !u); $("btnLogout").classList.toggle("hidden", !u);
  if (!u) { show("appView", false); show("deniedView", false); $("who").textContent = ""; return; }
  const [sup, snap] = await Promise.all([
    getDoc(doc(db, "superusers", u.uid)).catch(() => null),
    getDoc(doc(db, "admins", u.uid)).catch(() => null)
  ]);
  const isSuper = !!sup?.exists();
  let bid = "";
  if (snap?.exists()) { A.me = { uid: u.uid, ...snap.data() }; bid = A.me.businessId; }
  if (isSuper) {
    bid = businessFromUrl() || bid;
    A.me = { uid: u.uid, role: "owner", staffId: A.me?.businessId === bid ? A.me.staffId : "", isSuper: true };
    if (!bid) { location.href = "super.html"; return; }
  }
  if (!bid) { show("deniedView", true); show("appView", false); $("who").textContent = u.email; return; }
  setBusiness(bid);
  $("publicLink").href = "index.html?b=" + encodeURIComponent(bid);
  const bizSnap = await getDoc(doc(db, "businesses", bid)).catch(() => null);
  A.biz = bizSnap?.data() || { name: bid, status: "active" };
  $("who").textContent = `${A.biz.name}. ${u.email} (${isSuper ? "superusuario" : isOwner() ? "dueño" : "equipo"})`;
  show("deniedView", false); show("appView", true);
  renderPlanBanner();
  start();
});
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector("button");
  setBusy(btn, true, "Ingresando…");
  try { await signInWithEmailAndPassword(auth, f.email.value.trim(), f.password.value); }
  catch { toast("Correo o contraseña incorrectos.", "error"); }
  finally { setBusy(btn, false); }
});
$("btnLogout").onclick = () => signOut(auth);
$("btnForgotAdmin").onclick = async () => {
  const email = $("loginForm").email.value.trim();
  if (!email) return toast("Escribe tu correo y vuelve a tocar “Olvidé mi contraseña”.", "error");
  try { await sendPasswordResetEmail(auth, email); toast("Te enviamos un correo para cambiar la contraseña."); }
  catch { toast("No se pudo enviar el correo. Revisa que esté bien escrito.", "error"); }
};

function start() {
  renderTabs();
  A.unsubs.push(onSnapshot(doc(db, bpath("settings", "general")), (s) => {
    A.settings = s.data() || {};
    renderAgenda(); renderStaffTab();
  }, onErr));
  A.unsubs.push(onSnapshot(collection(db, bpath("services")), (q) => {
    A.services = q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    renderServices();
  }, onErr));
  A.unsubs.push(onSnapshot(collection(db, bpath("staff")), (q) => {
    A.staff = q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    renderStaffTab(); renderAgenda();
  }, onErr));
  A.unsubs.push(onSnapshot(query(collection(db, bpath("appointments")), where("payment.status", "==", "submitted")), (q) => {
    A.pending = q.docs.map((d) => d.data()).sort((a, b) => toMillis(a.startAt) - toMillis(b.startAt));
    renderAgenda();
  }, onErr));
  if (isOwner()) {
    A.unsubs.push(onSnapshot(doc(db, bpath("private", "telegram")), (s) => { A.tg = s.data() || {}; renderStaffTab(); }, onErr));
  }
  subscribeDay();
  setInterval(renderStaffTab, 60000);
}

async function renderPlanBanner() {
  const el = $("planBanner"); el.classList.add("hidden");
  const msgs = [];
  if (A.me.isSuper) msgs.push(`Estás viendo el panel de ${esc(A.biz.name)} como superusuario. <a class="underline" href="super.html">Volver a mis negocios</a>`);
  if (A.biz.status !== "active") msgs.push("⛔ Tu agenda en línea está suspendida: tus clientes no pueden reservar desde la página. Comunícate con soporte para reactivarla.");
  if (isOwner()) {
    try {
      const b = (await getDoc(doc(db, bpath("private", "billing")))).data();
      if (b?.mode === "monthly" && b.paidUntil) {
        const days = Math.round((Date.parse(b.paidUntil + "T00:00:00-05:00") - Date.parse(bogNow().date + "T00:00:00-05:00")) / 86400000);
        if (days < 0) msgs.push(`⚠️ Tu plan venció el ${fechaLarga(b.paidUntil)}. Renuévalo para no perder tu agenda en línea.`);
        else if (days <= 7) msgs.push(`🔔 Tu plan vence ${days === 0 ? "hoy" : `en ${days} día(s)`} (${fechaLarga(b.paidUntil)}). Valor: ${cop(b.priceCOP)}.`);
      }
    } catch { /* sin datos de plan */ }
  }
  if (msgs.length) { el.innerHTML = msgs.map((m) => `<p>${m}</p>`).join(""); el.classList.remove("hidden"); }
}

function subscribeDay() {
  A.unsubDay?.();
  A.unsubDay = onSnapshot(query(collection(db, bpath("appointments")), where("date", "==", A.date)), (q) => {
    A.dayApts = q.docs.map((d) => d.data());
    renderAgenda();
  }, onErr);
}

// ================= Pestañas =================
function renderTabs() {
  const tabs = [["agenda", "Agenda"], ["staff", "Equipo y descansos"]];
  if (isOwner()) tabs.push(["clients", "Clientes"], ["services", "Servicios"], ["settings", "Configuración"]);
  $("tabs").innerHTML = tabs.map(([id, t]) => `<button class="tab whitespace-nowrap px-4 ${A.tab === id ? "tab-on" : ""}" data-tab="${id}">${t}</button>`).join("");
}
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]"); if (!b) return;
  A.tab = b.dataset.tab;
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  show("tab-" + A.tab, true);
  renderTabs();
  if (A.tab === "clients") loadUsers();
  if (A.tab === "settings") renderSettings();
  if (A.tab === "services") renderServices();
});

// ================= Modal genérico =================
function openM(title, html) { $("modalTitle").textContent = title; $("modalBody").innerHTML = html; openModal("modal"); }
function closeM() { closeModal("modal"); A.m?.unsub?.(); A.m = null; }
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-copy]"); if (c) copyText(c.dataset.copy);
  const x = e.target.closest("[data-close]"); if (x) closeM();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("modal").classList.contains("hidden")) closeM(); });

// ================= Agenda =================
function custName(a) { return `${a.customer?.firstName || ""} ${a.customer?.lastName || ""}`.trim() || "Cliente"; }
function payLine(a) {
  const p = a.payment || {};
  if (p.mode === "preferential") return "⭐ Cliente preferencial, paga en el local";
  if (p.status === "submitted") return a.status === "confirmed" ? "Comprobante recibido, confirmada automáticamente: revisa que el dinero llegó" : "Comprobante por revisar";
  if (p.status === "approved") return p.mode === "manual" ? `Abono recibido (${p.method})` : "Abono verificado";
  if (p.status === "awaiting") return "Esperando comprobante del cliente";
  if (p.status === "rejected") return "Pago rechazado" + (p.rejectReason ? ": " + p.rejectReason : "");
  if (p.mode === "manual") return "Paga todo en el local";
  return "";
}
function aptCard(a) {
  A.index[a.code] = a;
  const p = a.payment || {};
  const acts = [];
  if (p.status === "submitted") {
    if (p.proofUrl) acts.push(`<a class="btn-sm" href="${esc(p.proofUrl)}" target="_blank" rel="noopener">Ver comprobante</a>`);
    acts.push(`<button class="btn-sm !border-emerald-600 text-emerald-800" data-act="approve" data-code="${a.code}">Aprobar pago</button>`);
    acts.push(`<button class="btn-sm !border-rose-600 text-rose-800" data-act="reject" data-code="${a.code}">Rechazar</button>`);
  }
  if (a.status === "confirmed") {
    acts.push(`<button class="btn-sm" data-act="attended" data-code="${a.code}">Llegó</button>`);
    acts.push(`<button class="btn-sm" data-act="noshow" data-code="${a.code}">No asistió</button>`);
  }
  if (ACTIVE.includes(a.status)) {
    acts.push(`<button class="btn-sm" data-act="resched" data-code="${a.code}">Reagendar</button>`);
    acts.push(`<button class="btn-sm" data-act="cancel" data-code="${a.code}">Cancelar</button>`);
  }
  if (a.customer?.whatsapp) {
    acts.push(`<a class="btn-sm" target="_blank" rel="noopener" href="${waLink(a.customer.whatsapp, fillTemplate(A.settings.waConfirmTemplate || DEFAULT_WA_CONFIRM, a, A.settings))}">WhatsApp: confirmar</a>`);
    if (ACTIVE.includes(a.status)) acts.push(`<a class="btn-sm" target="_blank" rel="noopener" href="${waLink(a.customer.whatsapp, fillTemplate(A.settings.waRescheduleTemplate || DEFAULT_WA_RESCHEDULE, a, A.settings))}">WhatsApp: reagendar</a>`);
  }
  return `<article class="rounded-xl border border-line bg-white p-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="font-narrow text-2xl font-bold">${hora12(a.startTime)}<span class="ml-2 text-sm font-normal text-ink/60">a ${hora12(a.endTime)}</span></p>
      ${statusBadge(a.status)}
    </div>
    <p class="font-semibold">${esc(custName(a))} <span class="font-normal text-ink/60">${esc(a.code)}</span></p>
    <p class="text-sm">${(a.items || []).map((i) => esc(i.name)).join(" + ")}, con ${esc(a.staffName)}${a.date !== A.date ? `, <span class="capitalize">${fechaCorta(a.date)}</span>` : ""}</p>
    <p class="text-sm text-ink/70">Total ${cop(a.totalCOP)}, abono ${cop(a.depositCOP)}, saldo ${cop(a.balanceDueCOP)}</p>
    <p class="text-sm text-ink/70">${payLine(a)}${a.source === "manual" ? ". Agendada desde el panel" : ""}${a.rescheduleCount ? `. Reagendada ${a.rescheduleCount} vez/veces` : ""}</p>
    ${a.customer?.whatsapp ? `<p class="text-sm text-ink/70">WhatsApp ${esc(a.customer.whatsapp)}</p>` : ""}
    <div class="mt-3 flex flex-wrap gap-2">${acts.join("")}</div>
  </article>`;
}

function renderAgenda() {
  if (!A.me) return;
  const el = $("tab-agenda");
  const mine = A.me.role === "owner" ? (x) => true : (x) => x.staffId === A.me.staffId;
  const list = A.dayApts.filter(mine).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const live = list.filter((a) => !["cancelled", "expired", "rejected"].includes(a.status));
  const dead = list.filter((a) => ["cancelled", "expired", "rejected"].includes(a.status));
  const pending = A.pending.filter(mine);
  const caja = live.filter((a) => ["confirmed", "attended", "pending_verification"].includes(a.status)).reduce((s, a) => s + Number(a.balanceDueCOP || 0), 0);
  const q = $("searchCode")?.value || "";
  el.innerHTML = `
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <button class="btn-sm" data-day="-1" aria-label="Día anterior">‹</button>
      <input id="agDate" type="date" value="${A.date}" class="rounded-lg border border-line px-3 py-1.5">
      <button class="btn-sm" data-day="1" aria-label="Día siguiente">›</button>
      <button class="btn-sm" data-day="0">Hoy</button>
      <button id="btnNewApt" class="btn-primary ml-auto">+ Nueva cita</button>
    </div>
    <form id="searchForm" class="mb-6 flex gap-2">
      <input id="searchCode" value="${esc(q)}" placeholder="Buscar por número de reserva, ej. R-K7Q4M9" class="min-w-0 flex-1 rounded-lg border border-line px-3 py-2">
      <button class="btn-dark">Buscar</button>
    </form>
    ${pending.length ? `<h2 class="step-title">Pagos por revisar (${pending.length})</h2>
      <div class="mb-8 grid gap-3 md:grid-cols-2">${pending.map(aptCard).join("")}</div>` : ""}
    <h2 class="step-title capitalize">${fechaLarga(A.date)}</h2>
    <p class="mb-3 text-sm text-ink/70">${live.length} cita(s). Saldo por cobrar en el local: <b>${cop(caja)}</b></p>
    <div class="grid gap-3 md:grid-cols-2">${live.map(aptCard).join("") || `<p class="text-sm text-ink/60">No hay citas este día. Usa “+ Nueva cita” para agendar a alguien que llamó o llegó al local.</p>`}</div>
    ${dead.length ? `<details class="mt-6"><summary class="cursor-pointer text-sm font-semibold">Canceladas, vencidas y rechazadas (${dead.length})</summary>
      <div class="mt-3 grid gap-3 md:grid-cols-2">${dead.map(aptCard).join("")}</div></details>` : ""}`;
}
function setAgendaDate(d) { A.date = d; A.dayApts = []; subscribeDay(); renderAgenda(); }

$("tab-agenda").addEventListener("click", (e) => {
  const d = e.target.closest("[data-day]");
  if (d) { const n = Number(d.dataset.day); setAgendaDate(n === 0 ? bogNow().date : addDays(A.date, n)); return; }
  if (e.target.closest("#btnNewApt")) { openAptModal("new"); return; }
  const b = e.target.closest("[data-act]"); if (b) aptAction(b);
});
$("tab-agenda").addEventListener("change", (e) => { if (e.target.id === "agDate" && e.target.value) setAgendaDate(e.target.value); });
$("tab-agenda").addEventListener("submit", async (e) => {
  e.preventDefault();
  let s = $("searchCode").value.trim().toUpperCase().replace(/[\s-]/g, "");
  if (s.length === 7 && s.startsWith("R")) s = s.slice(1);
  if (s.length !== 6) return toast("El número de reserva tiene 6 caracteres, por ejemplo R-K7Q4M9.", "error");
  const code = "R-" + s;
  const snap = await getDoc(doc(db, bpath("appointments", code))).catch(() => null);
  if (!snap?.exists()) return toast("No existe una reserva con el número " + code, "error");
  openM("Reserva " + code, `<div id="searchResult">${aptCard(snap.data())}</div>`);
});
$("modalBody").addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (b && ["approve", "reject", "attended", "noshow", "resched", "cancel"].includes(b.dataset.act)) aptAction(b);
});

async function aptAction(b) {
  const a = A.index[b.dataset.code]; if (!a) return;
  const act = b.dataset.act;
  try {
    if (act === "resched") return openAptModal("resched", a);
    if (act === "approve") { setBusy(b, true, "Aprobando…"); await api("reviewPayment", { code: a.code, approve: true }); toast("Pago aprobado."); }
    if (act === "reject") {
      const reason = prompt("¿Por qué rechazas el pago? El cliente lo verá en el correo.", "No encontramos la transferencia");
      if (reason === null) return;
      setBusy(b, true, "Rechazando…"); await api("reviewPayment", { code: a.code, approve: false, reason }); toast("Pago rechazado. El cupo quedó libre.");
    }
    if (act === "attended") { setBusy(b, true, "Guardando…"); await api("setAttendance", { code: a.code, attended: true }); toast("Marcada como atendida."); }
    if (act === "noshow") {
      if (!confirm(`¿Marcar que ${custName(a)} no asistió?`)) return;
      setBusy(b, true, "Guardando…"); await api("setAttendance", { code: a.code, attended: false }); toast("Marcada como inasistencia.");
    }
    if (act === "cancel") {
      const reason = prompt(`Motivo de la cancelación de ${a.code}:`, "Cancelada por el negocio");
      if (reason === null) return;
      setBusy(b, true, "Cancelando…"); await api("cancelAppointment", { code: a.code, reason }); toast("Cita cancelada. El cupo quedó libre.");
    }
    if (!$("modal").classList.contains("hidden") && $("searchResult")) closeM();
  } catch (err) { toast(err.message, "error"); setBusy(b, false); }
}

// ================= Nueva cita / reagendar =================
function staffOptions(selected, onlyMine) {
  return A.staff.filter((s) => s.active !== false && (!onlyMine || s.id === A.me.staffId))
    .map((s) => `<option value="${esc(s.id)}" ${s.id === selected ? "selected" : ""}>${esc(s.name)}</option>`).join("");
}
function openAptModal(mode, apt) {
  const onlyMine = !isOwner();
  const firstStaff = apt?.staffId || (onlyMine ? A.me.staffId : A.staff.find((s) => s.active !== false)?.id);
  const mains = A.services.filter((s) => s.active !== false && s.type !== "addon");
  A.m = { mode, apt, mainId: mains[0]?.id, extras: new Set(), staffId: firstStaff, date: apt ? bogNow().date : A.date, time: null, locks: [], force: false };
  const html = `
    ${mode === "new" ? `
      <label class="field mb-3"><span>Servicio principal</span><select id="mMain">${mains.map((s) => `<option value="${s.id}">${esc(s.name)} (${cop(s.priceCOP)}, ${s.minutes} min)</option>`).join("")}</select></label>
      <div class="mb-3"><p class="mb-1 text-sm font-semibold">Agregados</p><div id="mExtras" class="flex flex-wrap gap-2"></div></div>` : `
      <p class="mb-3 text-sm text-ink/75">${esc(custName(apt))}, ${(apt.items || []).map((i) => esc(i.name)).join(" + ")}. Actualmente: <span class="capitalize">${fechaLarga(apt.date)}</span> a las ${hora12(apt.startTime)} con ${esc(apt.staffName)}.</p>`}
    <div class="mb-3 grid grid-cols-2 gap-3">
      <label class="field"><span>Barbero</span><select id="mStaff">${staffOptions(firstStaff, onlyMine)}</select></label>
      <label class="field"><span>Fecha</span><input id="mDate" type="date" value="${A.m.date}" min="${bogNow().date}"></label>
    </div>
    <label class="mb-2 flex items-center gap-2 text-sm"><input id="mForce" type="checkbox" class="h-4 w-4"> Permitir agendar dentro de un descanso</label>
    <div id="mSlots" class="mb-4 grid grid-cols-4 gap-2"></div>
    ${mode === "new" ? `
      <div class="mb-3 grid grid-cols-2 gap-3">
        <label class="field"><span>Nombre</span><input id="mFirst"></label>
        <label class="field"><span>Apellido</span><input id="mLast"></label>
        <label class="field"><span>WhatsApp</span><input id="mPhone" type="tel" placeholder="300 123 4567"></label>
        <label class="field"><span>Correo (opcional)</span><input id="mEmail" type="email"></label>
        <label class="field"><span>Pago</span><select id="mPay">
          <option value="local">Paga todo en el local</option><option value="efectivo">Abono en efectivo</option>
          <option value="transferencia">Abono por transferencia</option><option value="nequi">Abono por Nequi / Daviplata</option></select></label>
        <label class="field"><span>Abono recibido</span><input id="mPaid" type="number" min="0" step="1000" value="0" disabled></label>
      </div>` : ""}
    <button id="mSave" class="btn-primary w-full" disabled>${mode === "new" ? "Crear cita" : "Confirmar nuevo horario"}</button>`;
  openM(mode === "new" ? "Nueva cita" : "Reagendar " + apt.code, html);

  if (mode === "new") {
    $("mMain").onchange = (e) => { A.m.mainId = e.target.value; A.m.extras.clear(); renderExtras(); renderModalSlots(); };
    $("mPay").onchange = (e) => { const local = e.target.value === "local"; $("mPaid").disabled = local; if (local) $("mPaid").value = 0; };
    renderExtras();
  }
  $("mStaff").onchange = (e) => { A.m.staffId = e.target.value; renderModalSlots(); };
  $("mDate").onchange = (e) => { A.m.date = e.target.value; loadModalLocks(); };
  $("mForce").onchange = (e) => { A.m.force = e.target.checked; renderModalSlots(); };
  $("mSlots").onclick = (e) => {
    const b = e.target.closest("[data-time]"); if (!b) return;
    A.m.time = b.dataset.time;
    $("mSlots").querySelectorAll("[data-time]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    $("mSave").disabled = false;
  };
  $("mSave").onclick = saveAptModal;
  loadModalLocks();
}
function renderExtras() {
  const ex = A.services.filter((s) => s.active !== false && s.type !== "base" && s.id !== A.m.mainId);
  $("mExtras").innerHTML = ex.map((s) => `<button type="button" class="chip" data-ex="${s.id}" aria-pressed="${A.m.extras.has(s.id)}">${esc(s.name)} +${cop(s.priceCOP)}</button>`).join("") || `<span class="text-sm text-ink/60">No hay agregados.</span>`;
  $("mExtras").onclick = (e) => {
    const b = e.target.closest("[data-ex]"); if (!b) return;
    const id = b.dataset.ex; A.m.extras.has(id) ? A.m.extras.delete(id) : A.m.extras.add(id);
    renderExtras(); renderModalSlots();
  };
}
function loadModalLocks() {
  A.m.unsub?.();
  const m = A.m;
  m.unsub = onSnapshot(query(collection(db, bpath("slotLocks")), where("date", "==", m.date)), (q) => {
    if (A.m !== m) return;
    m.locks = q.docs.map((d) => d.data()); renderModalSlots();
  }, onErr);
}
function renderModalSlots() {
  const m = A.m; if (!m || !$("mSlots")) return;
  const byId = Object.fromEntries(A.services.map((s) => [s.id, s]));
  const total = m.mode === "new" ? [m.mainId, ...m.extras].reduce((s, id) => s + Number(byId[id]?.minutes || 0), 0) : 0;
  const slots = computeSlots({
    settings: A.settings, staffList: A.staff, locks: m.locks, date: m.date,
    totalMinutes: total, occupied: m.mode === "resched" ? m.apt.occupiedMinutes : undefined,
    mainId: m.mode === "new" ? m.mainId : undefined, staffFilter: m.staffId,
    ignoreAptCode: m.apt?.code, forAdmin: true, ignoreBreaks: m.force
  });
  if (!slots.some((s) => s.time === m.time)) { m.time = null; $("mSave").disabled = true; }
  $("mSlots").innerHTML = slots.map((s) => `<button type="button" class="slot" data-time="${s.time}" aria-pressed="${s.time === m.time}">${hora12(s.time)}</button>`).join("")
    || `<p class="col-span-4 text-sm text-ink/60">No hay horas libres ese día para esta persona.</p>`;
}
async function saveAptModal() {
  const m = A.m, btn = $("mSave");
  if (!m.time) return toast("Elige una hora.", "error");
  try {
    if (m.mode === "resched") {
      setBusy(btn, true, "Reagendando…");
      await api("rescheduleAppointment", { code: m.apt.code, date: m.date, time: m.time, staffId: m.staffId, force: m.force });
      const updated = { ...m.apt, date: m.date, startTime: m.time };
      closeM();
      openM("Cita reagendada", `<p class="mb-4">La reserva ${esc(updated.code)} quedó para el <b>${fechaLarga(m.date)}</b> a las <b>${hora12(m.time)}</b>.</p>
        ${updated.customer?.whatsapp ? `<a class="btn-primary inline-block" target="_blank" rel="noopener" href="${waLink(updated.customer.whatsapp, `Hola ${updated.customer.firstName}, tu cita ${updated.code} quedó reprogramada para el ${fechaLarga(m.date)} a las ${hora12(m.time)}. ¡Te esperamos!`)}">Avisar al cliente por WhatsApp</a>` : ""}`);
      return;
    }
    const phone = normalizePhone($("mPhone").value);
    if (!$("mFirst").value.trim()) return toast("Escribe el nombre del cliente.", "error");
    if (!phone) return toast("Escribe un WhatsApp válido.", "error");
    setBusy(btn, true, "Creando…");
    const r = await api("createManualAppointment", {
      mainId: m.mainId, extraIds: [...m.extras], staffId: m.staffId, date: m.date, time: m.time, force: m.force,
      customer: { firstName: $("mFirst").value.trim(), lastName: $("mLast").value.trim(), whatsapp: phone, email: $("mEmail").value.trim() },
      paymentMethod: $("mPay").value, depositPaidCOP: Number($("mPaid").value || 0)
    });
    const apt = r.appointment;
    closeM();
    openM("Cita creada", `<p class="mb-1">Número de reserva</p><p class="ticket-code mb-4">${esc(apt.code)}</p>
      <p class="mb-4"><span class="capitalize">${fechaLarga(apt.date)}</span> a las ${hora12(apt.startTime)} con ${esc(apt.staffName)}.</p>
      <a class="btn-primary inline-block" target="_blank" rel="noopener" href="${waLink(apt.customer.whatsapp, fillTemplate(A.settings.waConfirmTemplate || DEFAULT_WA_CONFIRM, apt, A.settings))}">Enviar confirmación por WhatsApp</a>`);
  } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
}

// ================= Barberos y descansos =================
const isBusy = (s) => s.status === "busy" && toMillis(s.busyUntil) > Date.now();
const timeOf = (v) => new Date(toMillis(v)).toLocaleTimeString("es-CO", { timeZone: "America/Bogota", hour: "numeric", minute: "2-digit" });

function renderStaffTab() {
  if (!A.me) return;
  const el = $("tab-staff");
  const list = isOwner() ? A.staff : A.staff.filter((s) => s.id === A.me.staffId);
  const ownerTg = A.tg?.owner;
  el.innerHTML = `
    ${isOwner() ? `<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-ink/70">${ownerTg ? "Tu Telegram de dueño está conectado." : "Conecta tu Telegram de dueño en Configuración para recibir todos los avisos."}</p>
      <button class="btn-primary" data-sact="new">+ Agregar al equipo</button></div>` : ""}
    <div class="grid gap-3 md:grid-cols-2">
    ${list.map((s) => {
      const busy = isBusy(s);
      const canBreak = isOwner() || s.id === A.me.staffId;
      const tgOn = A.tg?.staff?.[s.id];
      return `<article class="rounded-xl border border-line bg-white p-4 ${s.active === false ? "opacity-60" : ""}">
        <div class="flex items-center justify-between gap-2">
          <p class="font-narrow text-2xl font-bold">${esc(s.name)}</p>
          <span class="flex items-center gap-2 text-sm font-semibold"><i class="dot ${busy ? "bg-pole-red" : "bg-emerald-500"}"></i>${busy ? "Ocupado hasta " + timeOf(s.busyUntil) : "Disponible"}</span>
        </div>
        ${busy && s.busyReason ? `<p class="text-sm text-ink/70">${esc(s.busyReason)}</p>` : ""}
        ${s.active === false ? `<p class="text-sm text-ink/70">Inactivo: no aparece en la página.</p>` : ""}
        <div class="mt-3 flex flex-wrap gap-2">
          ${canBreak ? (busy ? `<button class="btn-primary !bg-emerald-700" data-sact="end" data-id="${s.id}">Ya estoy disponible</button>`
                              : `<button class="btn-dark" data-sact="break" data-id="${s.id}">Tomar descanso</button>`) : ""}
          ${!isOwner() && s.id === A.me.staffId ? `<button class="btn-sm" data-sact="mysvc" data-id="${s.id}">Mis servicios</button>` : ""}
          ${isOwner() ? `<button class="btn-sm" data-sact="edit" data-id="${s.id}">Editar</button>
            <button class="btn-sm" data-sact="tg" data-id="${s.id}">${tgOn ? "Telegram conectado ✓ (reconectar)" : "Conectar Telegram"}</button>` : ""}
        </div>
        <p class="mt-2 text-xs text-ink/50">ID: ${esc(s.id)}</p>
      </article>`;
    }).join("")}
    </div>`;
}
$("tab-staff").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-sact]"); if (!b) return;
  const s = A.staff.find((x) => x.id === b.dataset.id);
  const act = b.dataset.sact;
  if (act === "break") openBreak(s);
  if (act === "end") {
    setBusy(b, true, "Abriendo cupos…");
    try { await api("endBreak", { staffId: s.id }); toast("Listo, tus cupos volvieron a estar disponibles."); }
    catch (err) { toast(err.message, "error"); setBusy(b, false); }
  }
  if (act === "edit" || act === "new") openStaffEdit(s);
  if (act === "mysvc") openMyServices(s);
  if (act === "tg") tgLink(s.id);
});

function openBreak(staff) {
  A.m = { mode: "break", staff, minutes: 30, timer: null };
  const chips = [15, 30, 45, 60, 90, 120, 180];
  openM("Tomar descanso: " + staff.name, `
    <p class="mb-2 text-sm font-semibold">¿Cuánto tiempo?</p>
    <div id="brChips" class="mb-3 flex flex-wrap gap-2">${chips.map((m) => `<button type="button" class="chip" data-min="${m}" aria-pressed="${m === 30}">${m < 60 ? m + " min" : m / 60 + " h"}</button>`).join("")}</div>
    <div class="mb-3 grid grid-cols-2 gap-2">
      <label class="field"><span>Otro tiempo</span><input id="brCustom" type="number" min="1" step="1" placeholder="Ej. 40"></label>
      <label class="field"><span>Unidad</span><select id="brUnit"><option value="1">minutos</option><option value="60">horas</option></select></label>
    </div>
    <label class="field mb-3"><span>Motivo (opcional)</span><input id="brReason" maxlength="60" placeholder="Almuerzo, diligencia…"></label>
    <div id="brInfo" class="mb-4 space-y-2 text-sm"></div>
    <button id="brConfirm" class="btn-primary w-full">Confirmar descanso</button>`);
  const setMin = (m) => {
    A.m.minutes = m;
    $("brChips").querySelectorAll("[data-min]").forEach((x) => x.setAttribute("aria-pressed", Number(x.dataset.min) === m));
    clearTimeout(A.m.timer); A.m.timer = setTimeout(brPreview, 350);
  };
  $("brChips").onclick = (e) => { const b = e.target.closest("[data-min]"); if (b) { $("brCustom").value = ""; setMin(Number(b.dataset.min)); } };
  const custom = () => { const v = Number($("brCustom").value); if (v > 0) setMin(Math.round(v * Number($("brUnit").value))); };
  $("brCustom").oninput = custom; $("brUnit").onchange = custom;
  $("brInfo").onclick = (e) => {
    const u = e.target.closest("[data-until]"); if (u) { $("brCustom").value = u.dataset.until; $("brUnit").value = "1"; setMin(Number(u.dataset.until)); }
    const r = e.target.closest("[data-resched]"); if (r) { const apt = A.m.conflicts.find((c) => c.code === r.dataset.resched); A.index[apt.code] = apt; openAptModal("resched", apt); }
  };
  $("brConfirm").onclick = async () => {
    const btn = $("brConfirm");
    setBusy(btn, true, "Activando descanso…");
    try {
      const r = await api("startBreak", { staffId: staff.id, minutes: A.m.minutes, reason: $("brReason").value.trim(), preview: false });
      closeM(); toast(`Descanso activo hasta las ${hora12(r.endTime)}. Tus cupos de ese rango ya no se ven en la página.`);
    } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
  };
  brPreview();
}
async function brPreview() {
  const m = A.m; if (!m || m.mode !== "break") return;
  const info = $("brInfo");
  info.innerHTML = `<p class="text-ink/60">Revisando tu agenda…</p>`;
  try {
    const r = await api("startBreak", { staffId: m.staff.id, minutes: m.minutes, preview: true });
    if (A.m !== m) return;
    m.conflicts = r.conflicts || [];
    const parts = [];
    parts.push(r.next
      ? `<p class="rounded-lg bg-amber-50 p-3 text-amber-900">⏰ Tu próxima cita es a las <b>${hora12(r.next.startTime)}</b>${r.untilNext > 0 ? ` (en ${r.untilNext} min)` : " (ya empezó)"}: ${esc(custName(r.next))}, ${(r.next.items || []).map((i) => esc(i.name)).join(" + ")}.</p>`
      : `<p class="rounded-lg bg-paper p-3">No tienes más citas hoy.</p>`);
    parts.push(`<p>Volverás a estar disponible a las <b>${hora12(r.endTime)}</b>. Si regresas antes, toca “Ya estoy disponible”.</p>`);
    if (r.next && r.untilNext >= 5 && m.minutes > r.untilNext) {
      parts.push(`<button type="button" class="btn-light w-full" data-until="${r.untilNext}">Descansar hasta mi próxima cita (${r.untilNext} min)</button>`);
    }
    if (m.conflicts.length) {
      parts.push(`<div class="rounded-lg border border-rose-300 bg-rose-50 p-3"><p class="mb-2 font-semibold text-rose-900">Este descanso choca con ${m.conflicts.length} cita(s). Las citas no se cancelan: decide qué hacer con cada una.</p>
        ${m.conflicts.map((c) => `<div class="mb-2 rounded-md bg-white p-2"><p><b>${hora12(c.startTime)}</b> ${esc(custName(c))} (${esc(c.code)})</p>
          <div class="mt-1 flex flex-wrap gap-2">
            ${c.customer?.whatsapp ? `<a class="btn-sm" target="_blank" rel="noopener" href="${waLink(c.customer.whatsapp, fillTemplate(A.settings.waRescheduleTemplate || DEFAULT_WA_RESCHEDULE, c, A.settings))}">Escribir por WhatsApp</a>` : ""}
            <button type="button" class="btn-sm" data-resched="${c.code}">Reagendar aquí</button>
          </div></div>`).join("")}</div>`);
    }
    info.innerHTML = parts.join("");
  } catch (err) { info.innerHTML = `<p class="text-rose-800">${esc(err.message)}</p>`; }
}

// Cada profesional marca qué servicios realiza
function openMyServices(s) {
  const mains = A.services.filter((x) => x.type !== "addon" && x.active !== false);
  openM("Mis servicios", `
    <p class="mb-3 text-sm text-ink/75">Marca los servicios que realizas. En la página solo te podrán agendar esos. Si no marcas ninguno, apareces en todos.</p>
    <div id="msList" class="mb-4 grid gap-1">${mains.map((x) => `<label class="flex items-center gap-2 text-sm"><input type="checkbox" value="${x.id}" class="h-4 w-4" ${s.serviceIds?.includes(x.id) ? "checked" : ""}> ${esc(x.name)}${x.category ? ` <span class="text-ink/50">(${esc(x.category)})</span>` : ""}</label>`).join("")}</div>
    <button id="msSave" class="btn-primary w-full">Guardar</button>`);
  $("msSave").onclick = async () => {
    try {
      await updateDoc(doc(db, bpath("staff", s.id)), { serviceIds: [...$("msList").querySelectorAll("input:checked")].map((i) => i.value) });
      closeM(); toast("Listo, tus servicios quedaron actualizados.");
    } catch (err) { toast("No se pudo guardar: " + err.message, "error"); }
  };
}

async function openStaffEdit(s) {
  const isNew = !s;
  let panelEmail = "";
  if (s) { try { panelEmail = (await getDoc(doc(db, bpath("private", "access")))).data()?.emails?.[s.id] || ""; } catch { /* sin acceso */ } }
  const mains = A.services.filter((x) => x.type !== "addon");
  openM(isNew ? "Agregar al equipo" : "Editar " + s.name, `
    <label class="field mb-3"><span>Nombre</span><input id="sfName" value="${esc(s?.name || "")}"></label>
    <label class="field mb-3"><span>Orden en la lista</span><input id="sfOrder" type="number" value="${s?.order ?? A.staff.length + 1}"></label>
    <label class="mb-3 flex items-center gap-2 text-sm"><input id="sfActive" type="checkbox" class="h-4 w-4" ${s?.active === false ? "" : "checked"}> Activo (aparece en la página)</label>
    <p class="mb-1 text-sm font-semibold">Servicios que realiza</p>
    <p class="mb-2 text-xs text-ink/60">Si no marcas ninguno, puede hacer todos.</p>
    <div id="sfServ" class="mb-4 grid gap-1">${mains.map((x) => `<label class="flex items-center gap-2 text-sm"><input type="checkbox" value="${x.id}" class="h-4 w-4" ${s?.serviceIds?.includes(x.id) ? "checked" : ""}> ${esc(x.name)}</label>`).join("")}</div>
    <button id="sfSave" class="btn-primary w-full">Guardar</button>
    ${s ? `<div class="mt-6 rounded-lg bg-paper p-3">
      <p class="mb-1 text-sm font-semibold">Acceso al panel para esta persona</p>
      <p class="mb-2 text-xs text-ink/60">Con acceso puede ver su agenda y tomar descansos. No ve clientes, servicios ni configuración.</p>
      <div class="flex gap-2"><input id="sfEmail" type="email" placeholder="correo de la persona" value="${esc(panelEmail)}" class="min-w-0 flex-1 rounded border border-line px-2 py-1.5">
      <button id="sfAccess" type="button" class="btn-dark">${panelEmail ? "Actualizar" : "Dar acceso"}</button></div>
      ${panelEmail ? `<button id="sfRevoke" type="button" class="mt-2 text-sm text-pole-red underline">Quitar acceso</button>` : ""}
      <div id="sfAccessMsg" class="mt-2 text-sm"></div></div>` : ""}`);
  if (s) {
    const access = async (email) => {
      const msg = $("sfAccessMsg");
      msg.textContent = "Guardando…";
      try {
        const r = await api("setBarberAccess", { staffId: s.id, email });
        if (r.removed) { msg.textContent = "Acceso quitado."; return; }
        msg.innerHTML = r.tempPassword
          ? `Listo. Envíale este acceso: entra a <b>${esc(location.origin + location.pathname)}</b> con <b>${esc(r.email)}</b> y la contraseña temporal <b>${esc(r.tempPassword)}</b> <button type="button" class="btn-sm" data-copy="${esc(`Panel: ${location.origin + location.pathname}\nCorreo: ${r.email}\nContraseña: ${r.tempPassword}`)}">Copiar</button>`
          : `Listo. ${esc(r.email)} ya tenía cuenta: entra con su contraseña de siempre.`;
      } catch (err) { msg.textContent = err.message; }
    };
    $("sfAccess").onclick = () => { const e = $("sfEmail").value.trim(); if (!e) return toast("Escribe el correo.", "error"); access(e); };
    if ($("sfRevoke")) $("sfRevoke").onclick = () => { if (confirm("¿Quitarle el acceso al panel?")) access(""); };
  }
  $("sfSave").onclick = async () => {
    const name = $("sfName").value.trim(); if (!name) return toast("Escribe el nombre.", "error");
    const id = s?.id || "b" + Date.now().toString(36);
    const data = {
      name, order: Number($("sfOrder").value || 0), active: $("sfActive").checked,
      serviceIds: [...$("sfServ").querySelectorAll("input:checked")].map((i) => i.value)
    };
    if (isNew) Object.assign(data, { status: "ready", busyUntil: null, busyReason: "", activeBreakId: null });
    try { await setDoc(doc(db, bpath("staff", id)), data, { merge: true }); closeM(); toast("Guardado."); }
    catch (err) { toast("No se pudo guardar: " + err.message, "error"); }
  };
}

async function tgLink(target) {
  let bot = "";
  try { bot = ((await getDoc(doc(db, "platform", "public"))).data()?.telegramBot || "").replace(/^@/, "").trim(); } catch { /* sin bot */ }
  if (!bot) return toast("El bot de Telegram de la plataforma aún no está configurado. Avísale a soporte.", "error");
  const code = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  try { await setDoc(doc(db, "telegramLinks", code), { businessId: bpath().split("/")[1], target, createdAt: serverTimestamp() }); }
  catch (err) { return toast("No se pudo crear el enlace: " + err.message, "error"); }
  const link = `https://t.me/${bot}?start=${code}`;
  openM("Conectar Telegram", `
    <p class="mb-3">Abre este enlace en el celular ${target === "owner" ? "donde quieres recibir los avisos" : "de esa persona"} y toca <b>Iniciar</b> en Telegram. Llegará un mensaje confirmando la conexión.</p>
    <p class="mb-4 break-all rounded-lg bg-paper p-3 text-sm">${link}</p>
    <div class="flex flex-wrap gap-2"><a class="btn-primary" href="${link}" target="_blank" rel="noopener">Abrir Telegram</a>
    <button class="btn-light" data-copy="${link}">Copiar enlace</button></div>`);
}

// ================= Clientes =================
async function loadUsers() {
  const el = $("tab-clients");
  el.innerHTML = `
    <div class="mb-4 flex flex-wrap gap-2">
      <input id="clientQ" value="${esc(A.clientQ)}" placeholder="Buscar por nombre, correo o WhatsApp" class="min-w-0 flex-1 rounded-lg border border-line px-3 py-2">
      <button id="clientReload" class="btn-sm">Actualizar</button>
    </div>
    <div id="clientRows"><p class="text-sm text-ink/60">Cargando clientes…</p></div>`;
  $("clientQ").oninput = (e) => { A.clientQ = e.target.value; renderClients(); };
  $("clientReload").onclick = loadUsers;
  try {
    const q = await getDocs(collection(db, bpath("customers")));
    A.users = q.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (a.firstName || "").localeCompare(b.firstName || ""));
    renderClients();
  } catch (err) { onErr(err); }
}
const MODE_LABEL = { deposit: "Normal (paga abono)", preferential: "⭐ Preferencial (sin pago previo)", full: "Paga el total por adelantado" };
function renderClients() {
  const q = A.clientQ.trim().toLowerCase();
  const list = A.users.filter((u) => !q || [u.firstName, u.lastName, u.email, u.whatsapp].join(" ").toLowerCase().includes(q));
  $("clientRows").innerHTML = `<p class="mb-2 text-sm text-ink/60">${list.length} cliente(s)</p>
    <div class="overflow-x-auto rounded-xl border border-line bg-white"><table class="w-full min-w-[640px] text-sm">
      <thead class="bg-paper text-left"><tr><th class="p-3">Cliente</th><th class="p-3">Contacto</th><th class="p-3">Modo de pago</th><th class="p-3">Visitas / faltas</th><th class="p-3"></th></tr></thead>
      <tbody>${list.map((u) => `<tr class="border-t border-line">
        <td class="p-3 font-semibold">${esc(u.firstName)} ${esc(u.lastName)}${u.blocked ? ` <span class="ml-1 rounded bg-rose-100 px-1.5 text-xs text-rose-900">Bloqueado</span>` : ""}</td>
        <td class="p-3">${esc(u.whatsapp)}<br><span class="text-ink/60">${esc(u.email)}</span></td>
        <td class="p-3">${MODE_LABEL[u.paymentMode] || MODE_LABEL.deposit}</td>
        <td class="p-3">${u.totalAppointments || 0} / ${u.noShowCount || 0}</td>
        <td class="p-3 text-right"><button class="btn-sm" data-uid="${u.uid}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
}
$("tab-clients").addEventListener("click", (e) => { const b = e.target.closest("[data-uid]"); if (b) openClient(A.users.find((u) => u.uid === b.dataset.uid)); });

async function openClient(u) {
  let notes = "";
  try { const s = await getDoc(doc(db, bpath("customers", u.uid, "private", "admin"))); notes = s.data()?.notes || ""; } catch { /* sin notas */ }
  openM(`${u.firstName} ${u.lastName}`, `
    <div class="mb-3 grid grid-cols-2 gap-3">
      <label class="field"><span>Nombre</span><input id="cFirst" value="${esc(u.firstName)}"></label>
      <label class="field"><span>Apellido</span><input id="cLast" value="${esc(u.lastName)}"></label>
      <label class="field"><span>WhatsApp</span><input id="cPhone" value="${esc(u.whatsapp)}"></label>
      <label class="field"><span>Correo</span><input id="cEmail" type="email" value="${esc(u.email)}" disabled></label>
    </div>
    <label class="field mb-3"><span>Modo de pago</span><select id="cMode">
      ${Object.entries(MODE_LABEL).map(([k, v]) => `<option value="${k}" ${(u.paymentMode || "deposit") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
    <div class="mb-3 grid grid-cols-2 gap-3">
      <label class="field"><span>Inasistencias seguidas</span><input id="cNoShow" type="number" min="0" value="${u.noShowCount || 0}"></label>
      <label class="mt-6 flex items-center gap-2 text-sm"><input id="cBlocked" type="checkbox" class="h-4 w-4" ${u.blocked ? "checked" : ""}> Bloquear reservas</label>
    </div>
    <label class="field mb-4"><span>Notas privadas (el cliente no las ve)</span><textarea id="cNotes" rows="3">${esc(notes)}</textarea></label>
    <button id="cSave" class="btn-primary w-full">Guardar cambios</button>`);
  $("cSave").onclick = async () => {
    const btn = $("cSave");
    const phone = normalizePhone($("cPhone").value);
    if (!phone) return toast("WhatsApp inválido.", "error");
    setBusy(btn, true, "Guardando…");
    try {
      const data = {
        firstName: $("cFirst").value.trim(), lastName: $("cLast").value.trim(), whatsapp: phone,
        paymentMode: $("cMode").value, noShowCount: Number($("cNoShow").value || 0), blocked: $("cBlocked").checked, updatedAt: serverTimestamp()
      };
      await updateDoc(doc(db, bpath("customers", u.uid)), data);
      await setDoc(doc(db, bpath("customers", u.uid, "private", "admin")), { notes: $("cNotes").value });
      Object.assign(u, data);
      renderClients(); closeM(); toast("Cliente actualizado.");
    } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
  };
}

// ================= Servicios =================
const TYPE_LABEL = { base: "Principal", addon: "Agregado", special: "Especial" };
// Plantillas para arrancar rápido según el tipo de negocio: [nombre, tipo, precio, minutos, categoría]
const TEMPLATES = {
  barberia: { label: "Barbería", items: [
    ["Corte clásico", "base", 20000, 30, "Cortes"], ["Corte moderno / degradado", "base", 25000, 45, "Cortes"], ["Corte niño", "base", 18000, 30, "Cortes"],
    ["Arreglo de barba", "special", 15000, 30, "Barba"], ["Barba con toalla caliente", "special", 20000, 30, "Barba"],
    ["Cejas", "addon", 5000, 10, "Agregados"], ["Diseño o línea", "addon", 5000, 10, "Agregados"], ["Mascarilla negra", "addon", 10000, 15, "Agregados"],
    ["Color / tinte", "special", 60000, 90, "Color"]] },
  salon: { label: "Salón de belleza", items: [
    ["Corte dama", "base", 35000, 45, "Cabello"], ["Cepillado", "base", 30000, 45, "Cabello"], ["Ondas / planchado", "base", 35000, 60, "Cabello"],
    ["Tinte completo", "special", 120000, 120, "Color"], ["Mechas / balayage", "special", 250000, 180, "Color"], ["Keratina", "special", 180000, 150, "Tratamientos"],
    ["Hidratación capilar", "addon", 25000, 30, "Tratamientos"], ["Manicure", "base", 20000, 45, "Uñas"], ["Pedicure", "base", 28000, 60, "Uñas"],
    ["Diseño de cejas", "base", 15000, 30, "Cejas y pestañas"], ["Lifting de pestañas", "base", 60000, 60, "Cejas y pestañas"], ["Maquillaje social", "base", 80000, 60, "Maquillaje"]] },
  unas: { label: "Uñas y spa", items: [
    ["Manicure tradicional", "base", 20000, 45, "Manos"], ["Manicure semipermanente", "base", 35000, 60, "Manos"], ["Uñas en acrílico", "base", 80000, 120, "Manos"],
    ["Retiro de acrílico", "addon", 15000, 30, "Manos"], ["Pedicure tradicional", "base", 28000, 60, "Pies"], ["Pedicure spa", "base", 45000, 75, "Pies"],
    ["Decoración / diseño", "addon", 10000, 15, "Extras"], ["Parafina", "addon", 15000, 15, "Extras"], ["Masaje relajante", "base", 90000, 60, "Spa"], ["Limpieza facial", "base", 80000, 60, "Spa"]] }
};
function renderServices() {
  if (!isOwner()) return;
  $("tab-services").innerHTML = `
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p class="max-w-xl text-sm text-ink/70">Principal: el cliente elige uno. Agregado: solo se suma a un principal. Especial: puede ser principal o agregado. La categoría agrupa los servicios en la página (Cabello, Uñas, Barba…).</p>
      <div class="flex flex-wrap gap-2"><button class="btn-light" data-tpl="1">Cargar plantilla</button><button class="btn-primary" data-svc="">+ Nuevo servicio</button></div>
    </div>
    <div class="overflow-x-auto rounded-xl border border-line bg-white"><table class="w-full min-w-[560px] text-sm">
      <thead class="bg-paper text-left"><tr><th class="p-3">Servicio</th><th class="p-3">Categoría</th><th class="p-3">Tipo</th><th class="p-3">Precio</th><th class="p-3">Minutos</th><th class="p-3"></th></tr></thead>
      <tbody>${A.services.map((s) => `<tr class="border-t border-line ${s.active === false ? "opacity-50" : ""}">
        <td class="p-3 font-semibold">${esc(s.name)}${s.active === false ? " (oculto)" : ""}</td><td class="p-3">${esc(s.category || "")}</td><td class="p-3">${TYPE_LABEL[s.type] || s.type}</td>
        <td class="p-3">${cop(s.priceCOP)}</td><td class="p-3">${s.type === "addon" ? "+" : ""}${s.minutes}</td>
        <td class="p-3 text-right"><button class="btn-sm" data-svc="${s.id}">Editar</button></td></tr>`).join("")}</tbody></table></div>`;
}
$("tab-services").addEventListener("click", (e) => {
  if (e.target.closest("[data-tpl]")) return openTemplates();
  const b = e.target.closest("[data-svc]"); if (!b) return;
  openService(A.services.find((s) => s.id === b.dataset.svc));
});
function openTemplates() {
  openM("Cargar plantilla de servicios", `
    <p class="mb-3 text-sm text-ink/75">Agrega servicios de ejemplo según tu tipo de negocio. No borra los que ya tienes. Después ajustas nombres, precios y tiempos.</p>
    <div class="mb-4 grid gap-2">${Object.entries(TEMPLATES).map(([k, t]) => `<label class="flex items-start gap-2 rounded-lg border border-line p-3 text-sm"><input type="radio" name="tpl" value="${k}" class="mt-0.5 h-4 w-4"><span><b>${t.label}</b><br><span class="text-ink/60">${t.items.slice(0, 4).map((i) => esc(i[0])).join(", ")}…</span></span></label>`).join("")}</div>
    <label class="mb-4 flex items-center gap-2 text-sm"><input id="tplHide" type="checkbox" class="h-4 w-4"> Ocultar los servicios que tengo ahora</label>
    <button id="tplSave" class="btn-primary w-full">Agregar servicios</button>`);
  $("tplSave").onclick = async () => {
    const k = document.querySelector("input[name=tpl]:checked")?.value;
    if (!k) return toast("Elige una plantilla.", "error");
    const btn = $("tplSave"); setBusy(btn, true, "Agregando…");
    try {
      if ($("tplHide").checked) for (const s of A.services) await setDoc(doc(db, bpath("services", s.id)), { active: false }, { merge: true });
      let order = A.services.length;
      for (const [name, type, priceCOP, minutes, category] of TEMPLATES[k].items) {
        const id = "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
        await setDoc(doc(db, bpath("services", id)), { name, type, priceCOP, minutes, category, description: "", active: true, order: ++order });
      }
      closeM(); toast("Servicios agregados. Ajusta precios y tiempos a tu gusto.");
    } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
  };
}
function openService(s) {
  const cats = [...new Set(A.services.map((x) => (x.category || "").trim()).filter(Boolean))];
  openM(s ? "Editar servicio" : "Nuevo servicio", `
    <label class="field mb-3"><span>Nombre</span><input id="svName" value="${esc(s?.name || "")}"></label>
    <label class="field mb-3"><span>Descripción corta (opcional)</span><input id="svDesc" value="${esc(s?.description || "")}"></label>
    <label class="field mb-3"><span>Categoría (agrupa en la página)</span><input id="svCat" list="svCats" value="${esc(s?.category || "")}" placeholder="Cabello, Uñas, Barba…">
      <datalist id="svCats">${cats.map((c) => `<option value="${esc(c)}">`).join("")}</datalist></label>
    <label class="field mb-3"><span>Tipo</span><select id="svType">
      ${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}" ${(s?.type || "base") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
    <div class="mb-3 grid grid-cols-3 gap-3">
      <label class="field"><span>Precio (COP)</span><input id="svPrice" type="number" min="0" step="1000" value="${s?.priceCOP ?? ""}"></label>
      <label class="field"><span>Minutos</span><input id="svMin" type="number" min="0" step="5" value="${s?.minutes ?? 30}"></label>
      <label class="field"><span>Orden</span><input id="svOrder" type="number" value="${s?.order ?? A.services.length + 1}"></label>
    </div>
    <p class="mb-3 text-xs text-ink/60">En los agregados, “minutos” es el tiempo extra que suman al servicio principal.</p>
    <label class="mb-4 flex items-center gap-2 text-sm"><input id="svActive" type="checkbox" class="h-4 w-4" ${s?.active === false ? "" : "checked"}> Visible en la página</label>
    <div class="flex gap-2"><button id="svSave" class="btn-primary flex-1">Guardar</button>${s ? `<button id="svDel" class="btn-light">Eliminar</button>` : ""}</div>`);
  $("svSave").onclick = async () => {
    const name = $("svName").value.trim(); if (!name) return toast("Escribe el nombre.", "error");
    const id = s?.id || "s" + Date.now().toString(36);
    const data = {
      name, description: $("svDesc").value.trim(), category: $("svCat").value.trim(), type: $("svType").value, priceCOP: Number($("svPrice").value || 0),
      minutes: Number($("svMin").value || 0), order: Number($("svOrder").value || 0), active: $("svActive").checked
    };
    try { await setDoc(doc(db, bpath("services", id)), data, { merge: true }); closeM(); toast("Servicio guardado."); }
    catch (err) { toast(err.message, "error"); }
  };
  if (s) $("svDel").onclick = async () => {
    if (!confirm(`¿Eliminar “${s.name}”? Las citas ya agendadas no se afectan.`)) return;
    try { await deleteDoc(doc(db, bpath("services", s.id))); closeM(); toast("Servicio eliminado."); }
    catch (err) { toast(err.message, "error"); }
  };
}

// ================= Configuración =================
const DAYS = [[1, "Lunes"], [2, "Martes"], [3, "Miércoles"], [4, "Jueves"], [5, "Viernes"], [6, "Sábado"], [0, "Domingo"]];
function renderSettings() {
  if (!isOwner()) return;
  const s = A.settings;
  A.closedDraft = [...(s.closedDates || [])].sort();
  A.pmDraft = (s.paymentMethods || []).map((m) => ({ ...m }));
  const num = (id, label, val, extra = "") => `<label class="field"><span>${label}</span><input id="${id}" type="number" value="${val ?? ""}" ${extra}></label>`;
  const txt = (id, label, val, extra = "") => `<label class="field"><span>${label}</span><input id="${id}" value="${esc(val ?? "")}" ${extra}></label>`;
  $("tab-settings").innerHTML = `
  <form id="setForm" class="space-y-8">
    <fieldset class="rounded-xl border border-line bg-white p-4"><legend class="px-1 font-narrow text-xl font-bold">Tu negocio</legend>
      <div class="grid gap-3 md:grid-cols-2">
        ${txt("stName", "Nombre del negocio", s.businessName)}
        ${txt("stPhone", "WhatsApp del negocio", s.whatsapp, 'placeholder="300 123 4567"')}
        ${txt("stAddress", "Dirección", s.address)}
        ${txt("stCity", "Ciudad", s.city)}
        <label class="field"><span>Tipo de negocio</span><select id="stType">
          ${[["barberia", "Barbería"], ["salon", "Salón de belleza"], ["unas", "Uñas"], ["spa", "Spa / estética"], ["otro", "Otro"]].map(([k, v]) => `<option value="${k}" ${(s.businessType || "barberia") === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        ${txt("stStaffLabel", "Cómo se llama tu equipo en la página", s.staffLabel || "", 'placeholder="Barbero, Estilista, Manicurista…"')}
      </div>
    </fieldset>

    <fieldset class="rounded-xl border border-line bg-white p-4"><legend class="px-1 font-narrow text-xl font-bold">Turnos y abono</legend>
      <div class="grid gap-3 md:grid-cols-3">
        <label class="field"><span>Duración de cada cupo</span><select id="stSlot">
          ${(() => { const cur = Number(s.slotDurationMinutes || 30); const opts = [15, 30, 45, 60, 90, 120]; return opts.map((m) => `<option value="${m}" ${cur === m ? "selected" : ""}>${m < 60 ? m + " minutos" : m === 60 ? "1 hora" : m === 90 ? "1 hora y media" : "2 horas"}</option>`).join("") + `<option value="custom" ${opts.includes(cur) ? "" : "selected"}>Otro…</option>`; })()}</select>
          <input id="stSlotCustom" type="number" min="15" step="15" class="mt-2 ${[15, 30, 45, 60, 90, 120].includes(Number(s.slotDurationMinutes || 30)) ? "hidden" : ""}" value="${Number(s.slotDurationMinutes || 30)}" placeholder="Minutos (múltiplo de 15)"></label>
        ${num("stDeposit", "Abono para apartar (COP)", s.depositAmountCOP, 'min="0" step="1000"')}
        ${num("stHold", "Minutos para subir el comprobante", s.holdMinutes ?? 30, 'min="5"')}
        ${num("stWindow", "Días hacia adelante que se puede reservar", s.bookingWindowDays ?? 30, 'min="1"')}
        ${num("stAdvance", "Anticipación mínima (minutos)", s.minAdvanceMinutes ?? 60, 'min="0"')}
        ${num("stTolerance", "Tolerancia de espera (minutos)", s.toleranceMinutes ?? 10, 'min="0"')}
      </div>
      <label class="mt-4 flex items-start gap-2 text-sm"><input id="stAuto" type="checkbox" class="mt-0.5 h-4 w-4" ${s.autoConfirmProof !== false ? "checked" : ""}>
        <span><b>Confirmar la cita apenas el cliente sube el comprobante.</b> Tú revisas después y puedes rechazarlo. Si lo desmarcas, la cita queda “en revisión” hasta que apruebes.</span></label>
    </fieldset>

    <fieldset class="rounded-xl border border-line bg-white p-4"><legend class="px-1 font-narrow text-xl font-bold">Horario de atención</legend>
      <p class="mb-3 text-sm text-ink/70">Si almuerzas todos los días a la misma hora, usa el segundo turno (por ejemplo 9:00 a 13:00 y 14:00 a 19:00).</p>
      <div class="space-y-2">${DAYS.map(([d, name]) => {
        const h = (s.businessHours || {})[String(d)] || [];
        return `<div class="grid grid-cols-[7rem_1fr] items-center gap-2 border-t border-line pt-2" data-dow="${d}">
          <label class="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" class="h-4 w-4 hOpen" ${h.length ? "checked" : ""}> ${name}</label>
          <div class="flex flex-wrap items-center gap-1 text-sm">
            <input type="time" step="900" class="h1o rounded border border-line px-1" value="${h[0]?.open || "09:00"}"> a <input type="time" step="900" class="h1c rounded border border-line px-1" value="${h[0]?.close || "19:00"}">
            <span class="mx-1 text-ink/50">y</span>
            <input type="time" step="900" class="h2o rounded border border-line px-1" value="${h[1]?.open || ""}"> a <input type="time" step="900" class="h2c rounded border border-line px-1" value="${h[1]?.close || ""}">
          </div></div>`;
      }).join("")}</div>
      <div class="mt-4"><p class="mb-1 text-sm font-semibold">Días cerrados (festivos, vacaciones)</p>
        <div class="flex flex-wrap items-center gap-2"><input id="stClosedNew" type="date" class="rounded border border-line px-2 py-1"><button type="button" id="stClosedAdd" class="btn-sm">Agregar</button></div>
        <div id="stClosedList" class="mt-2 flex flex-wrap gap-2"></div></div>
    </fieldset>

    <fieldset class="rounded-xl border border-line bg-white p-4"><legend class="px-1 font-narrow text-xl font-bold">Medios de pago</legend>
      <div id="pmList" class="space-y-2"></div>
      <button type="button" id="pmAdd" class="btn-sm mt-2">+ Agregar medio de pago</button>
      <label class="field mt-4"><span>Instrucciones para el cliente</span><textarea id="stPayInstr" rows="2">${esc(s.paymentInstructions || "")}</textarea></label>
    </fieldset>

    <fieldset class="rounded-xl border border-line bg-white p-4"><legend class="px-1 font-narrow text-xl font-bold">Reglas de la silla</legend>
      <div class="grid gap-3 md:grid-cols-2">
        ${num("stReschedH", "Horas mínimas para reagendar o cancelar", s.rescheduleMinHours ?? 2, 'min="0"')}
        ${num("stMaxResched", "Máximo de cambios por cita", s.maxReschedules ?? 2, 'min="0"')}
        ${num("stNoShow", "Faltas seguidas antes de exigir pago total", s.noShowThreshold ?? 2, 'min="1"')}
        ${num("stReminder", "Aviso de próxima cita por Telegram (minutos antes)", s.reminderMinutesBefore ?? 15, 'min="0"')}
      </div>
    </fieldset>

    <fieldset class="rounded-xl border border-line bg-white p-4"><legend class="px-1 font-narrow text-xl font-bold">Telegram</legend>
      <p class="text-sm text-ink/70">Recibe en tu Telegram las reservas, los comprobantes (con botones para aprobar), los reagendamientos y el resumen del día.</p>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" id="tgOwner" class="btn-dark">${A.tg?.owner ? "Reconectar mi Telegram de dueño" : "Conectar mi Telegram de dueño"}</button>
        <span class="text-sm text-ink/70">${A.tg?.owner ? "Conectado ✓" : "Sin conectar"}</span>
      </div>
    </fieldset>

    <fieldset class="rounded-xl border border-line bg-white p-4"><legend class="px-1 font-narrow text-xl font-bold">Mensajes</legend>
      <p class="mb-2 text-xs text-ink/60">Puedes usar: {nombre} {negocio} {codigo} {fecha} {hora} {barbero} {servicio} {valor} {abono} {saldo} {direccion}</p>
      <label class="field mb-3"><span>Confirmación por WhatsApp</span><textarea id="stWaConf" rows="7">${esc(s.waConfirmTemplate || DEFAULT_WA_CONFIRM)}</textarea></label>
      <label class="field mb-3"><span>Reagendar por WhatsApp</span><textarea id="stWaRes" rows="3">${esc(s.waRescheduleTemplate || DEFAULT_WA_RESCHEDULE)}</textarea></label>
      <label class="field"><span>Autorización de datos (Ley 1581 de 2012)</span><textarea id="stHabeas" rows="3">${esc(s.habeasDataText || "")}</textarea></label>
    </fieldset>

    <div class="sticky bottom-3"><button class="btn-primary w-full shadow-lg" type="submit">Guardar configuración</button></div>
  </form>`;
  renderClosed(); renderPM();
  $("stSlot").onchange = (e) => $("stSlotCustom").classList.toggle("hidden", e.target.value !== "custom");
  $("stType").onchange = (e) => {
    const lbl = { barberia: "Barbero", salon: "Estilista", unas: "Manicurista", spa: "Profesional", otro: "Profesional" }[e.target.value];
    if (!$("stStaffLabel").value.trim()) $("stStaffLabel").value = lbl;
  };
  $("stClosedAdd").onclick = () => {
    const v = $("stClosedNew").value; if (!v) return;
    if (!A.closedDraft.includes(v)) A.closedDraft.push(v);
    A.closedDraft.sort(); renderClosed();
  };
  $("stClosedList").onclick = (e) => { const b = e.target.closest("[data-rmdate]"); if (b) { A.closedDraft = A.closedDraft.filter((d) => d !== b.dataset.rmdate); renderClosed(); } };
  $("pmAdd").onclick = () => { readPM(); A.pmDraft.push({ label: "", account: "", holder: "" }); renderPM(); };
  $("pmList").onclick = (e) => { const b = e.target.closest("[data-rmpm]"); if (b) { readPM(); A.pmDraft.splice(Number(b.dataset.rmpm), 1); renderPM(); } };
  $("tgOwner").onclick = () => tgLink("owner");
  $("setForm").onsubmit = saveSettings;
}
function renderClosed() {
  const today = bogNow().date;
  $("stClosedList").innerHTML = A.closedDraft.filter((d) => d >= today).map((d) => `<span class="chip flex items-center gap-2"><span class="capitalize">${fechaCorta(d)}</span><button type="button" data-rmdate="${d}" aria-label="Quitar">✕</button></span>`).join("")
    || `<span class="text-sm text-ink/60">Ninguno.</span>`;
}
function renderPM() {
  $("pmList").innerHTML = A.pmDraft.map((m, i) => `<div class="grid gap-2 rounded-lg bg-paper p-2 sm:grid-cols-[1fr_1fr_1fr_auto]" data-pm="${i}">
    <input class="pmLabel rounded border border-line px-2 py-1.5" placeholder="Nequi, Daviplata, Bancolombia…" value="${esc(m.label)}">
    <input class="pmAcc rounded border border-line px-2 py-1.5" placeholder="Número o llave" value="${esc(m.account)}">
    <input class="pmHolder rounded border border-line px-2 py-1.5" placeholder="Titular" value="${esc(m.holder)}">
    <button type="button" class="btn-sm" data-rmpm="${i}">Quitar</button></div>`).join("") || `<p class="text-sm text-ink/60">Agrega al menos un medio de pago para que tus clientes sepan a dónde transferir.</p>`;
}
function readPM() {
  A.pmDraft = [...document.querySelectorAll("[data-pm]")].map((r) => ({
    label: r.querySelector(".pmLabel").value.trim(), account: r.querySelector(".pmAcc").value.trim(), holder: r.querySelector(".pmHolder").value.trim()
  }));
}
async function saveSettings(e) {
  e.preventDefault();
  const btn = e.target.querySelector("button[type=submit]");
  readPM();
  const hours = {};
  for (const row of document.querySelectorAll("[data-dow]")) {
    const d = row.dataset.dow, iv = [];
    if (row.querySelector(".hOpen").checked) {
      const o1 = row.querySelector(".h1o").value, c1 = row.querySelector(".h1c").value;
      const o2 = row.querySelector(".h2o").value, c2 = row.querySelector(".h2c").value;
      if (!o1 || !c1 || c1 <= o1) return toast("Revisa el horario: la hora de cierre debe ser después de la apertura.", "error");
      iv.push({ open: o1, close: c1 });
      if (o2 && c2) {
        if (c2 <= o2 || o2 < c1) return toast("Revisa el segundo turno: debe empezar después del primero.", "error");
        iv.push({ open: o2, close: c2 });
      }
    }
    hours[d] = iv;
  }
  const slotVal = $("stSlot").value === "custom" ? Number($("stSlotCustom").value) : Number($("stSlot").value);
  if (!(slotVal >= 15 && slotVal <= 480 && slotVal % 15 === 0)) return toast("La duración del cupo debe ser múltiplo de 15 minutos (15, 30, 45, 60…).", "error");
  for (const row of document.querySelectorAll("[data-dow]")) {
    for (const inp of row.querySelectorAll("input[type=time]")) {
      if (inp.value && Number(inp.value.split(":")[1]) % 15 !== 0) return toast("Las horas de apertura y cierre deben ser en punto, :15, :30 o :45.", "error");
    }
  }
  const phone = $("stPhone").value.trim() ? normalizePhone($("stPhone").value) : "";
  if ($("stPhone").value.trim() && !phone) return toast("WhatsApp del negocio inválido.", "error");
  const n = (id) => Number($(id).value || 0);
  const data = {
    businessName: $("stName").value.trim(), whatsapp: phone, address: $("stAddress").value.trim(), city: $("stCity").value.trim(),
    slotDurationMinutes: slotVal, businessType: $("stType").value, staffLabel: $("stStaffLabel").value.trim(), depositAmountCOP: n("stDeposit"), holdMinutes: Math.max(5, n("stHold")),
    bookingWindowDays: Math.max(1, n("stWindow")), minAdvanceMinutes: n("stAdvance"), toleranceMinutes: n("stTolerance"),
    autoConfirmProof: $("stAuto").checked, businessHours: hours, closedDates: A.closedDraft,
    paymentMethods: A.pmDraft.filter((m) => m.label && m.account), paymentInstructions: $("stPayInstr").value.trim(),
    rescheduleMinHours: n("stReschedH"), maxReschedules: n("stMaxResched"), noShowThreshold: Math.max(1, n("stNoShow")),
    reminderMinutesBefore: n("stReminder"),
    waConfirmTemplate: $("stWaConf").value, waRescheduleTemplate: $("stWaRes").value, habeasDataText: $("stHabeas").value.trim(),
    updatedAt: serverTimestamp(), updatedBy: A.me.uid
  };
  setBusy(btn, true, "Guardando…");
  try { await setDoc(doc(db, bpath("settings", "general")), data, { merge: true }); toast("Configuración guardada. La página pública ya se actualizó."); }
  catch (err) { toast("No se pudo guardar: " + err.message, "error"); }
  finally { setBusy(btn, false); }
}
