// Panel de administración: agenda, pagos, descansos, clientes, servicios y configuración
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  startUpdateWatcher, applyBrandColors, uiConfirm, uiPrompt, setDialogBrand, viewImage, db, auth, bpath, api, setBusiness, businessFromUrl, bogNow, addDays, hora12, fechaLarga, fechaCorta, toMillis, cop, esc, normalizePhone,
  waLink, statusBadge, fillTemplate, DEFAULT_WA_CONFIRM, DEFAULT_WA_RESCHEDULE, computeSlots, onColor, darken,
  toast, openModal, closeModal, setBusy, copyText
} from "./common.js?v=2026-10-08j";

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
  show("loginView", !u);
  if (!u) { $("linkCard").classList.add("hidden"); $("btnAccount").classList.add("hidden"); $("hdrTitle").textContent = "Panel de tu negocio"; }
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
  $("linkOpen").href = "index.html?b=" + encodeURIComponent(bid);
  $("linkUrl").textContent = new URL("index.html?b=" + encodeURIComponent(bid), location.href).href;
  $("btnAccount").textContent = (u.email || "?").slice(0, 1).toUpperCase();
  $("btnAccount").classList.remove("hidden");
  $("acctMenuEmail").textContent = u.email;
  $("acctMenuRole").textContent = isSuper ? "Superusuario" : (A.me?.role === "owner" ? "Dueño del negocio" : "Equipo");
  $("acctSuper").classList.toggle("hidden", !isSuper);
  const bizSnap = await getDoc(doc(db, "businesses", bid)).catch(() => null);
  A.biz = bizSnap?.data() || { name: bid, status: "active" };
  setDialogBrand(A.biz.name);
  $("who").textContent = `${A.biz.name} · ${u.email} (${isSuper ? "superusuario" : isOwner() ? "dueño" : "equipo"})`;
  $("hdrTitle").textContent = TABS[A.tab][0];
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
$("btnLogout").onclick = () => { closeMenus(); signOut(auth); };
// Menús del encabezado (link de clientes y cuenta)
function closeMenus() { $("acctMenu").classList.add("hidden"); $("btnAccount").setAttribute("aria-expanded", "false"); }
function toggleMenu(btn, menu) {
  const open = $(menu).classList.contains("hidden");
  closeMenus();
  if (open) { $(menu).classList.remove("hidden"); $(btn).setAttribute("aria-expanded", "true"); }
}
$("btnAccount").onclick = (e) => { e.stopPropagation(); toggleMenu("btnAccount", "acctMenu"); };
document.addEventListener("click", (e) => { if (!e.target.closest(".hdr-menu")) closeMenus(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenus(); });
$("linkCard").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-link]"); if (!b) return;
  const url = $("linkUrl").textContent, name = A.settings?.businessName || A.biz?.name || "";
  const msg = (panelPrefs().shareMsg || PANEL_DEFAULT.shareMsg).replace(/\{negocio\}/g, name).replace(/\{link\}/g, url);
  if (b.dataset.link === "copy") copyText(url);
  if (b.dataset.link === "wa") window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
  if (b.dataset.link === "share") {
    if (navigator.share) { try { await navigator.share({ title: name, text: msg, url }); } catch { /* canceló */ } } else copyText(url);
  }
  if (b.dataset.link === "qr") {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js").catch(() => {});
    if (!window.QRious) return toast("No se pudo generar el QR. Revisa tu conexión.", "error");
    const q = new window.QRious({ value: url, size: 700, level: "M" });
    viewImage(q.toDataURL(), `${name}: escanéalo para agendar`);
  }
  closeMenus();
});
$("btnLogoutDenied").onclick = () => signOut(auth);
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
    setDialogBrand(A.settings.businessName || A.biz?.name, A.settings.appearance?.logo);
    applyPanelBrand(); if (A.me) renderTabs();
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
// Secciones del menú: [nombre, ícono, color del ícono]
const TABS = {
  agenda: ["Agenda", "fa-calendar-days", "#2563eb"], staff: ["Equipo y descansos", "fa-users", "#7c3aed"],
  clients: ["Clientes", "fa-address-book", "#db2777"], services: ["Servicios", "fa-scissors", "#ea580c"],
  appearance: ["Apariencia", "fa-palette", "#c026d3"], images: ["Imágenes", "fa-image", "#0891b2"],
  settings: ["Configuración", "fa-gear", "#475569"]
};
const ALL_TABS = ["agenda", "staff", "clients", "services", "appearance", "images", "settings"];
const LOCKED_TABS = ["appearance", "settings"]; // siempre visibles para poder deshacer cambios
const PANEL_DEFAULT = { useBrand: true, linkLabel: "Link clientes", shareMsg: "Agenda tu cita en {negocio} aquí: {link}", columns: 3, style: "cards", colorIcons: true, order: ALL_TABS, hidden: [] };
function panelPrefs() {
  const p = { ...PANEL_DEFAULT, ...(A.settings?.panel || {}) };
  p.order = [...(p.order || []).filter((t) => ALL_TABS.includes(t)), ...ALL_TABS.filter((t) => !(p.order || []).includes(t))];
  p.hidden = (p.hidden || []).filter((t) => !LOCKED_TABS.includes(t));
  return p;
}
function renderTabs() {
  const P = panelPrefs();
  const allowed = ["agenda", "staff"].concat(isOwner() ? ["clients", "services", "appearance", "images", "settings"] : []);
  const ids = P.order.filter((id) => allowed.includes(id) && (!P.hidden.includes(id) || A.tab === id));
  const t = $("tabs");
  t.className = `grid gap-1.5 lg:grid-cols-1 ${({ 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" })[P.columns] || "grid-cols-3"} ${P.style === "list" ? "tabs-list" : ""} ${P.colorIcons ? "" : "tabs-mono"}`;
  t.innerHTML = ids.map((id) => `<button class="admin-tab" data-tab="${id}" aria-current="${A.tab === id ? "page" : "false"}"><i class="fa-solid ${TABS[id][1]}" style="color:${TABS[id][2]}"></i><span>${TABS[id][0]}</span></button>`).join("");
  $("linkCard").classList.remove("hidden");
  $("linkTitle").textContent = P.linkLabel || PANEL_DEFAULT.linkLabel;
}
// Aplica la marca del negocio (logo y colores) al panel, si el dueño lo eligió
function applyPanelBrand() {
  const P = panelPrefs(), ap = A.settings?.appearance || {};
  applyBrandColors(P.useBrand ? ap : {});
  const logo = $("hdrLogo"), show = P.useBrand && (ap.logo || (ap.colors && ap.colors.header));
  logo.classList.toggle("hidden", !show); logo.classList.toggle("grid", !!show);
  const name = A.settings?.businessName || A.biz?.name || "";
  logo.innerHTML = ap.logo ? `<img src="${ap.logo}" alt="" class="h-full w-full object-cover">` : esc(name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase());
}
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]"); if (!b) return;
  A.tab = b.dataset.tab;
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  show("tab-" + A.tab, true);
  renderTabs();
  $("hdrTitle").textContent = TABS[A.tab][0];
  if (window.innerWidth < 1024) $("adminContent").scrollIntoView({ behavior: "smooth", block: "start" });
  if (A.tab === "clients") loadUsers();
  if (A.tab === "settings") renderSettings();
  if (A.tab === "services") renderServices();
  if (A.tab === "appearance") renderAppearance();
  if (A.tab === "images") renderImages();
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
      const reason = await uiPrompt("Rechazar pago", `¿Por qué rechazas el pago de ${custName(a)}? Se lo enviamos por correo y Telegram.`, "No encontramos la transferencia", { okText: "Rechazar", danger: true });
      if (reason === null) return;
      setBusy(b, true, "Rechazando…"); await api("reviewPayment", { code: a.code, approve: false, reason }); toast("Pago rechazado. El cupo quedó libre.");
    }
    if (act === "attended") { setBusy(b, true, "Guardando…"); await api("setAttendance", { code: a.code, attended: true }); toast("Marcada como atendida."); }
    if (act === "noshow") {
      if (!(await uiConfirm("¿No asistió?", `Se marca la inasistencia de ${custName(a)} (${a.code}).`, { okText: "Sí, no asistió", danger: true }))) return;
      setBusy(b, true, "Guardando…"); await api("setAttendance", { code: a.code, attended: false }); toast("Marcada como inasistencia.");
    }
    if (act === "cancel") {
      const reason = await uiPrompt("Cancelar cita", `Motivo de la cancelación de ${a.code}. El cliente lo recibe en el aviso.`, "Cancelada por el negocio", { okText: "Cancelar cita", cancelText: "Volver", danger: true });
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
function openAptModal(mode, apt, prefill) {
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
      <label class="field"><span>Profesional</span><select id="mStaff">${staffOptions(firstStaff, onlyMine)}</select></label>
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
  if (mode === "new" && prefill) {
    $("mFirst").value = prefill.firstName || ""; $("mLast").value = prefill.lastName || "";
    $("mPhone").value = prefill.whatsapp || ""; $("mEmail").value = prefill.email || "";
  }
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
    if ($("sfRevoke")) $("sfRevoke").onclick = async () => { if (await uiConfirm("¿Quitar acceso?", "Esta persona ya no podrá entrar al panel.", { okText: "Quitar acceso", danger: true })) access(""); };
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
    <div class="mb-3 flex flex-wrap gap-2">
      <input id="clientQ" value="${esc(A.clientQ)}" placeholder="Buscar por nombre, correo o WhatsApp" class="min-w-0 flex-1 rounded-lg border border-line px-3 py-2">
      <button id="clientReload" class="btn-sm">Actualizar</button>
    </div>
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div id="clientFilters" class="flex flex-wrap gap-2"></div>
      <button id="btnNews" class="btn-dark text-sm"><i class="fa-brands fa-telegram"></i> Enviar novedad</button>
    </div>
    <div id="clientRows"><p class="text-sm text-ink/60">Cargando clientes…</p></div>`;
  $("clientQ").oninput = (e) => { A.clientQ = e.target.value; renderClients(); };
  $("clientReload").onclick = loadUsers;
  $("btnNews").onclick = openNews;
  $("clientFilters").onclick = (e) => { const b = e.target.closest("[data-cf]"); if (b) { A.clientF = b.dataset.cf; renderClients(); } };
  try {
    const q = await getDocs(collection(db, bpath("customers")));
    A.users = q.docs.map((d) => ({ uid: d.id, ...d.data() })).sort((a, b) => (a.firstName || "").localeCompare(b.firstName || ""));
    renderClients();
  } catch (err) { onErr(err); }
}
const MODE_LABEL = { deposit: "Normal (paga abono)", preferential: "⭐ Preferencial (sin pago previo)", full: "Paga el total por adelantado" };
const CLIENT_FILTERS = {
  all: ["Todos", () => true],
  pref: ["⭐ Preferenciales", (u) => u.paymentMode === "preferential"],
  blocked: ["Bloqueados", (u) => !!u.blocked],
  noshow: ["Con faltas", (u) => Number(u.noShowCount || 0) > 0]
};
function renderClients() {
  const f = A.clientF || "all";
  $("clientFilters").innerHTML = Object.entries(CLIENT_FILTERS).map(([k, [t, fn]]) =>
    `<button class="chip" data-cf="${k}" aria-pressed="${f === k}">${t} <span class="opacity-60">${A.users.filter(fn).length}</span></button>`).join("");
  const q = A.clientQ.trim().toLowerCase();
  const list = A.users.filter(CLIENT_FILTERS[f][1]).filter((u) => !q || [u.firstName, u.lastName, u.email, u.whatsapp].join(" ").toLowerCase().includes(q));
  $("clientRows").innerHTML = list.length ? `<div class="grid gap-2 md:grid-cols-2">${list.map((u) => `
    <article class="rounded-xl border border-line bg-white p-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="truncate font-semibold">${esc(u.firstName)} ${esc(u.lastName)}${u.paymentMode === "preferential" ? " ⭐" : ""}${u.blocked ? ` <span class="ml-1 rounded bg-rose-100 px-1.5 text-xs text-rose-900">Bloqueado</span>` : ""}</p>
          <p class="truncate text-sm text-ink/70">${esc(u.whatsapp)} · ${esc(u.email)}</p>
          <p class="text-xs text-ink/60">${u.totalAppointments || 0} visita(s) · ${u.noShowCount || 0} falta(s) · ${MODE_LABEL[u.paymentMode] || MODE_LABEL.deposit}</p>
        </div>
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <button class="btn-sm" data-uid="${u.uid}" data-ca="open">Ver y editar</button>
        ${u.whatsapp ? `<a class="btn-sm" target="_blank" rel="noopener" href="${waLink(u.whatsapp, "Hola " + (u.firstName || "") + ", te escribimos de " + (A.settings.businessName || "la barbería") + ".")}"><i class="fa-brands fa-whatsapp text-emerald-600"></i> WhatsApp</a>` : ""}
        <button class="btn-sm" data-uid="${u.uid}" data-ca="book"><i class="fa-regular fa-calendar-plus"></i> Agendar cita</button>
      </div>
    </article>`).join("")}</div>` : `<p class="text-sm text-ink/60">No hay clientes con ese filtro.</p>`;
}
$("tab-clients").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ca]"); if (!b) return;
  const u = A.users.find((x) => x.uid === b.dataset.uid); if (!u) return;
  if (b.dataset.ca === "open") openClient(u);
  if (b.dataset.ca === "book") openAptModal("new", null, u);
});

// Citas del cliente: las que reservó con su cuenta y las agendadas desde el panel con su WhatsApp
async function clientHistory(u) {
  const col = collection(db, bpath("appointments"));
  const [a, b] = await Promise.all([
    getDocs(query(col, where("customerUid", "==", u.uid))),
    u.whatsapp ? getDocs(query(col, where("customer.whatsapp", "==", u.whatsapp))) : Promise.resolve({ docs: [] })
  ]);
  const map = new Map();
  [...a.docs, ...b.docs].forEach((d) => map.set(d.id, d.data()));
  return [...map.values()].sort((x, y) => toMillis(y.startAt) - toMillis(x.startAt));
}

async function openClient(u) {
  let notes = "";
  try { const s = await getDoc(doc(db, bpath("customers", u.uid, "private", "admin"))); notes = s.data()?.notes || ""; } catch { /* sin notas */ }
  openM(`${u.firstName} ${u.lastName}`, `
    <div class="mb-4 flex flex-wrap gap-2">
      ${u.whatsapp ? `<a class="btn-sm" target="_blank" rel="noopener" href="${waLink(u.whatsapp, "Hola " + (u.firstName || "") + ", te escribimos de " + (A.settings.businessName || "la barbería") + ".")}"><i class="fa-brands fa-whatsapp text-emerald-600"></i> Escribir por WhatsApp</a>` : ""}
      <button id="cBook" class="btn-sm"><i class="fa-regular fa-calendar-plus"></i> Agendar cita</button>
    </div>
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
    <button id="cSave" class="btn-primary w-full">Guardar cambios</button>
    <h4 class="mb-2 mt-6 font-narrow text-lg font-bold">Historial de citas</h4>
    <div id="cHist" class="space-y-2 text-sm"><p class="text-ink/60">Cargando…</p></div>`);
  $("cBook").onclick = () => openAptModal("new", null, u);
  clientHistory(u).then((list) => {
    if (!$("cHist")) return;
    const done = list.filter((a) => a.status === "attended");
    const spent = done.reduce((s, a) => s + Number(a.totalCOP || 0), 0);
    $("cHist").innerHTML = list.length ? `
      <p class="mb-1 text-xs text-ink/60">${list.length} cita(s) · ${done.length} atendida(s) · ${list.filter((a) => a.status === "no_show").length} falta(s) · Total atendido ${cop(spent)}</p>
      ${list.map((a) => `<div class="flex items-start justify-between gap-2 rounded-lg border border-line p-2">
        <div class="min-w-0"><p class="font-semibold capitalize">${fechaCorta(a.date)} · ${hora12(a.startTime)}</p>
        <p class="truncate text-xs text-ink/70">${(a.items || []).map((i) => esc(i.name)).join(" + ")} · ${esc(a.staffName)} · ${cop(a.totalCOP)}</p>
        <p class="text-[11px] text-ink/50">${esc(a.code)}${a.source === "manual" ? " · agendada en el local" : ""}</p></div>
        ${statusBadge(a.status)}</div>`).join("")}`
      : `<p class="text-ink/60">Todavía no tiene citas.</p>`;
  }).catch((err) => { if ($("cHist")) $("cHist").innerHTML = `<p class="text-rose-800">No se pudo cargar el historial: ${esc(err.message)}</p>`; });
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
const TYPE_STYLE = { base: "bg-sky-100 text-sky-900", addon: "bg-amber-100 text-amber-900", special: "bg-fuchsia-100 text-fuchsia-900" };
function renderServices() {
  if (!isOwner()) return;
  const list = A.services.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  const hidden = list.filter((s) => s.active === false).length;
  const groups = [];
  list.forEach((s) => { const c = (s.category || "").trim() || "Sin categoría"; let g = groups.find((x) => x.c === c); if (!g) groups.push(g = { c, items: [] }); g.items.push(s); });
  const card = (s) => `
    <article class="rounded-xl border border-line bg-white p-3 ${s.active === false ? "opacity-60" : ""}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="font-semibold leading-snug">${esc(s.name)}</p>
          ${s.description ? `<p class="text-xs text-ink/60">${esc(s.description)}</p>` : ""}
        </div>
        <p class="shrink-0 font-narrow text-xl font-bold">${s.type === "addon" ? "+" : ""}${cop(s.priceCOP)}</p>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <span class="rounded-full px-2 py-0.5 ${TYPE_STYLE[s.type] || "bg-slate-200"}">${TYPE_LABEL[s.type] || s.type}</span>
        <span class="rounded-full bg-paper px-2 py-0.5 text-ink/70">⏱ ${s.type === "addon" ? "+" : ""}${Number(s.minutes || 0)} min</span>
        ${s.active === false ? `<span class="rounded-full bg-slate-200 px-2 py-0.5 text-ink/60">Oculto en la página</span>` : ""}
      </div>
      <div class="mt-3 flex flex-wrap gap-1.5">
        <button class="btn-sm" data-svc="${s.id}"><i class="fa-solid fa-pen"></i> Editar</button>
        <button class="btn-sm" data-svis="${s.id}">${s.active === false ? '<i class="fa-solid fa-eye"></i> Mostrar' : '<i class="fa-solid fa-eye-slash"></i> Ocultar'}</button>
        <button class="btn-sm" data-sdup="${s.id}"><i class="fa-regular fa-copy"></i> Duplicar</button>
        <button class="btn-sm" data-smove="-1" data-sid="${s.id}" aria-label="Subir">↑</button>
        <button class="btn-sm" data-smove="1" data-sid="${s.id}" aria-label="Bajar">↓</button>
      </div>
    </article>`;
  $("tab-services").innerHTML = `
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-ink/70"><b class="text-ink">${list.length}</b> servicio(s)${hidden ? ` · ${hidden} oculto(s)` : ""}</p>
      <div class="flex flex-wrap gap-2"><button class="btn-light text-sm" data-tpl="1">Cargar plantilla</button><button class="btn-primary text-sm" data-svc="">+ Nuevo servicio</button></div>
    </div>
    <details class="mb-4 rounded-xl border border-line bg-white p-3 text-sm">
      <summary class="cursor-pointer font-semibold">¿Qué es principal, agregado y especial?</summary>
      <p class="mt-2 text-ink/70"><b>Principal:</b> el cliente elige uno (corte, manicure…). <b>Agregado:</b> solo se suma a un principal (barba, cejas…). <b>Especial:</b> puede ser principal o agregado (color, keratina…). La <b>categoría</b> agrupa los servicios en la página del cliente.</p>
    </details>
    ${list.length ? groups.map((g) => `
      <h3 class="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-ink/60">${esc(g.c)} (${g.items.length})</h3>
      <div class="grid gap-2 sm:grid-cols-2">${g.items.map(card).join("")}</div>`).join("")
    : `<div class="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-ink/70">Aún no tienes servicios. Toca <b>Cargar plantilla</b> para empezar con una lista lista, o <b>+ Nuevo servicio</b>.</div>`}`;
}
$("tab-services").addEventListener("click", async (e) => {
  if (e.target.closest("[data-tpl]")) return openTemplates();
  const ed = e.target.closest("[data-svc]");
  if (ed) return openService(A.services.find((x) => x.id === ed.dataset.svc));
  const vis = e.target.closest("[data-svis]"), dup = e.target.closest("[data-sdup]"), mv = e.target.closest("[data-smove]");
  try {
    if (vis) {
      const s = A.services.find((x) => x.id === vis.dataset.svis);
      await setDoc(doc(db, bpath("services", s.id)), { active: s.active === false }, { merge: true });
      toast(s.active === false ? "Ahora se ve en la página." : "Oculto: ya no aparece en la página.");
    }
    if (dup) {
      const s = A.services.find((x) => x.id === dup.dataset.sdup);
      const { id, ...data } = s;
      const maxOrder = Math.max(0, ...A.services.map((x) => Number(x.order || 0)));
      await setDoc(doc(db, bpath("services", "s" + Date.now().toString(36))), { ...data, name: s.name + " (copia)", order: maxOrder + 1 });
      toast("Servicio duplicado. Edítalo para cambiar el nombre o el precio.");
    }
    if (mv) {
      const list = A.services.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      const i = list.findIndex((x) => x.id === mv.dataset.sid), j = i + Number(mv.dataset.smove);
      if (j < 0 || j >= list.length) return;
      // reordena todo para que el orden quede limpio (1, 2, 3…)
      [list[i], list[j]] = [list[j], list[i]];
      await Promise.all(list.map((x, k) => (x.order === k + 1 ? null : setDoc(doc(db, bpath("services", x.id)), { order: k + 1 }, { merge: true }))));
    }
  } catch (err) { toast("No se pudo guardar: " + err.message, "error"); }
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
    if (!(await uiConfirm(`¿Eliminar “${s.name}”?`, "Las citas ya agendadas no se afectan.", { okText: "Eliminar", danger: true }))) return;
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
    <input class="pmLabel rounded border border-line px-2 py-1.5" placeholder="Nequi, Daviplata, Llave Bre-B…" value="${esc(m.label)}">
    <input class="pmAcc rounded border border-line px-2 py-1.5" placeholder="Número o llave" value="${esc(m.account)}">
    <input class="pmHolder rounded border border-line px-2 py-1.5" placeholder="Titular" value="${esc(m.holder)}">
    <button type="button" class="btn-sm" data-rmpm="${i}">Quitar</button>
    <div class="flex flex-wrap items-center gap-2 sm:col-span-4">
      ${m.qr ? `<img src="${m.qr}" alt="QR" data-zoomsrc="1" class="h-14 w-14 cursor-zoom-in rounded border border-line bg-white object-contain">` : ""}
      <label class="btn-sm cursor-pointer">${m.qr ? "Cambiar QR" : "Subir imagen del QR (opcional)"}<input type="file" accept="image/*" class="hidden" data-qrpm="${i}"></label>
      ${m.qr ? `<button type="button" class="text-xs text-pole-red underline" data-rmqr="${i}">Quitar QR</button>` : ""}
    </div></div>`).join("") || `<p class="text-sm text-ink/60">Agrega al menos un medio de pago para que tus clientes sepan a dónde transferir.</p>`;
}
function readPM() {
  A.pmDraft = [...document.querySelectorAll("[data-pm]")].map((r) => ({
    label: r.querySelector(".pmLabel").value.trim(), account: r.querySelector(".pmAcc").value.trim(), holder: r.querySelector(".pmHolder").value.trim(),
    qr: A.pmDraft[Number(r.dataset.pm)]?.qr || ""
  }));
}
// Reduce la imagen del QR para guardarla dentro de la configuración
async function qrToDataUrl(file) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  const max = 480; let w = img.naturalWidth, h = img.naturalHeight;
  if (Math.max(w, h) > max) { const r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
  return c.toDataURL("image/jpeg", 0.85);
}
document.addEventListener("change", async (e) => {
  const inp = e.target.closest("[data-qrpm]"); if (!inp || !inp.files[0]) return;
  readPM();
  try { A.pmDraft[Number(inp.dataset.qrpm)].qr = await qrToDataUrl(inp.files[0]); renderPM(); toast("QR listo. Toca “Guardar configuración” para publicarlo."); }
  catch { toast("No se pudo leer la imagen.", "error"); }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-rmqr]"); if (!b) return;
  readPM(); A.pmDraft[Number(b.dataset.rmqr)].qr = ""; renderPM();
});
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
    paymentMethods: A.pmDraft.filter((m) => m.label && m.account).map((m) => ({ label: m.label, account: m.account, holder: m.holder || "", qr: m.qr || "" })), paymentInstructions: $("stPayInstr").value.trim(),
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
startUpdateWatcher();

// ================= Novedades por Telegram a los clientes =================
function openNews() {
  const n = A.users.filter((u) => u.telegram).length;
  openM("Enviar novedad por Telegram", `
    <p class="mb-3 text-sm text-ink/75">${n ? `Le llega a <b>${n}</b> cliente(s) que conectaron su Telegram desde "Mi cuenta".` : "Todavía ningún cliente ha conectado su Telegram. Ellos lo hacen desde “Mi cuenta” en tu página."}</p>
    <label class="field mb-3"><span>Mensaje</span><textarea id="newsText" rows="5" maxlength="1500" placeholder="Ej: ¡Este sábado 2x1 en arreglo de barba! Aparta tu cupo en la página."></textarea></label>
    <button id="newsSend" class="btn-primary w-full" ${n ? "" : "disabled"}>Enviar a ${n} cliente(s)</button>`);
  $("newsSend").onclick = async () => {
    const text = $("newsText").value.trim();
    if (text.length < 3) return toast("Escribe el mensaje.", "error");
    const btn = $("newsSend"); setBusy(btn, true, "Enviando…");
    try { const r = await api("broadcastNews", { text }); closeM(); toast(`Novedad enviada a ${r.sent} cliente(s).`); }
    catch (err) { toast(err.message, "error"); setBusy(btn, false); }
  };
}

// ================= Apariencia de la tienda =================
const THEMES = [
  ["Clásico", "#17222E", "#24508A", "#EEF1EF"], ["Dorado", "#111111", "#C9A227", "#F7F3EA"], ["Rosado", "#831843", "#EC4899", "#FDF2F8"],
  ["Verde", "#064E3B", "#10B981", "#ECFDF5"], ["Azul", "#1E3A8A", "#3B82F6", "#EFF6FF"], ["Morado", "#3B0764", "#A855F7", "#FAF5FF"]
];
const TEXT_FIELDS = [
  ["welcome", "Mensaje de bienvenida", "(vacío: no se muestra)"], ["calendarTitle", "Título del calendario", "Selecciona día y horario"],
  ["bookButton", "Botón principal", "Apartar cupo"], ["registerTitle", "Título del registro", "Crea tu cuenta"],
  ["registerSub", "Texto del registro", "Regístrate una sola vez para ver la agenda y apartar tus citas."],
  ["payNote", "Aviso en la pantalla de pago", "Escribe tu número de reserva en el mensaje o concepto de la transferencia."],
  ["confirmedTitle", "Título al confirmar", "Tu turno fue confirmado"]
];
async function imgToDataUrl(file, max, type) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
  let w = img.naturalWidth, h = img.naturalHeight;
  if (Math.max(w, h) > max) { const r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c.toDataURL(type || "image/png");
}
function renderPanelOrder() {
  $("pnOrder").innerHTML = A.pn.order.map((id, i) => `<div class="flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5 text-sm">
    <i class="fa-solid ${TABS[id][1]} w-5 text-center" style="color:${TABS[id][2]}"></i><span class="flex-1">${TABS[id][0]}</span>
    ${LOCKED_TABS.includes(id) ? `<span class="text-xs text-ink/50">siempre</span>` : `<label class="flex items-center gap-1 text-xs"><input type="checkbox" data-pnshow="${id}" class="h-4 w-4" ${A.pn.hidden.includes(id) ? "" : "checked"}>Ver</label>`}
    <button type="button" class="btn-sm px-2" data-pnmove="-1" data-pnid="${i}" aria-label="Subir">↑</button>
    <button type="button" class="btn-sm px-2" data-pnmove="1" data-pnid="${i}" aria-label="Bajar">↓</button></div>`).join("");
}
function renderAppearance() {
  A.pn = JSON.parse(JSON.stringify(panelPrefs()));
  const ap = JSON.parse(JSON.stringify(A.settings.appearance || {}));
  ap.colors = ap.colors || {}; ap.texts = ap.texts || {};
  A.ap = ap;
  const col = (k, label, def) => `<label class="text-center text-xs font-semibold"><input type="color" id="apc_${k}" value="${ap.colors[k] || def}" class="h-10 w-full cursor-pointer rounded-lg border border-line bg-white p-1"><span class="mt-1 block">${label}</span></label>`;
  $("tab-appearance").innerHTML = `
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="space-y-4">
      <div class="rounded-xl border border-line bg-white p-4">
        <h3 class="mb-3 font-narrow text-xl font-bold">Logo, nombre y eslogan</h3>
        <div class="mb-3 flex items-center gap-3">
          <div id="apLogoPrev" class="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-paper font-narrow text-xl font-bold"></div>
          <div class="flex flex-wrap gap-2">
            <label class="btn-sm cursor-pointer">Subir logo<input id="apLogoFile" type="file" accept="image/*" class="hidden"></label>
            <button id="apLogoDel" type="button" class="btn-sm">Quitar</button>
          </div>
        </div>
        <label class="field mb-3"><span>Nombre del negocio</span><input id="apName" value="${esc(A.settings.businessName || "")}"></label>
        <label class="field"><span>Eslogan (opcional)</span><input id="apSlogan" maxlength="60" value="${esc(ap.slogan || "")}" placeholder="Ej. Estilo clásico desde 1998"></label>
      </div>
      <div class="rounded-xl border border-line bg-white p-4">
        <h3 class="mb-3 font-narrow text-xl font-bold">Colores</h3>
        <div class="mb-3 grid grid-cols-3 gap-2">${col("header", "Encabezado", "#17222E")}${col("primary", "Principal", "#24508A")}${col("bg", "Fondo", "#EEF1EF")}</div>
        <p class="mb-2 text-xs text-ink/60">Temas listos:</p>
        <div class="flex flex-wrap gap-2">${THEMES.map(([n, h, p, b], i) => `<button type="button" class="chip flex items-center gap-1.5" data-theme="${i}"><span class="inline-block h-4 w-4 rounded-full" style="background:linear-gradient(135deg,${h} 50%,${p} 50%)"></span>${n}</button>`).join("")}</div>
        <button type="button" id="apReset" class="mt-3 text-xs text-pole-blue underline">Volver a los colores originales</button>
      </div>
      <div class="rounded-xl border border-line bg-white p-4">
        <h3 class="mb-1 font-narrow text-xl font-bold">Textos de la página</h3>
        <p class="mb-3 text-xs text-ink/60">Si dejas un campo vacío se usa el texto original (el que ves en gris).</p>
        <div class="space-y-3">${TEXT_FIELDS.map(([k, l, d]) => `<label class="field"><span>${l}</span><input data-aptext="${k}" value="${esc(ap.texts[k] || "")}" placeholder="${esc(d)}"></label>`).join("")}</div>
      </div>
      <div class="rounded-xl border border-line bg-white p-4">
        <h3 class="mb-1 font-narrow text-xl font-bold">Tu panel</h3>
        <p class="mb-3 text-xs text-ink/60">Cómo se ve el panel donde manejas los turnos (tú y tu equipo).</p>
        <label class="mb-3 flex items-center gap-2 text-sm"><input id="pnBrand" type="checkbox" class="h-4 w-4" ${A.pn.useBrand ? "checked" : ""}> Usar mi logo y mis colores también en el panel</label>
        <div class="mb-3 grid grid-cols-2 gap-3">
          <label class="field"><span>Cuadros por fila (celular)</span><select id="pnCols">${[2, 3, 4].map((n) => `<option value="${n}" ${A.pn.columns === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>
          <label class="field"><span>Estilo del menú</span><select id="pnStyle"><option value="cards" ${A.pn.style === "cards" ? "selected" : ""}>Cuadros (ícono arriba)</option><option value="list" ${A.pn.style === "list" ? "selected" : ""}>Lista (ícono al lado)</option></select></label>
        </div>
        <label class="mb-3 flex items-center gap-2 text-sm"><input id="pnIcons" type="checkbox" class="h-4 w-4" ${A.pn.colorIcons ? "checked" : ""}> Íconos de colores</label>
        <p class="mb-1 text-sm font-semibold">Orden y secciones visibles</p>
        <div id="pnOrder" class="mb-3 space-y-1"></div>
        <label class="field mb-3"><span>Texto del botón del link</span><input id="pnLabel" maxlength="24" value="${esc(A.pn.linkLabel)}" placeholder="Link clientes"></label>
        <label class="field"><span>Mensaje al compartir el link</span><textarea id="pnShare" rows="2" maxlength="300" placeholder="${esc(PANEL_DEFAULT.shareMsg)}">${esc(A.pn.shareMsg)}</textarea>
          <span class="mt-1 block text-xs font-normal text-ink/60">Usa {negocio} y {link}.</span></label>
      </div>
      <button id="apSave" class="btn-primary sticky bottom-3 w-full shadow-lg">Guardar apariencia</button>
    </div>
    <div>
      <p class="mb-2 text-center text-xs font-bold uppercase tracking-wider text-ink/50">Vista previa en vivo</p>
      <div id="apPreview" class="lg:sticky lg:top-6"></div>
    </div>
  </div>`;
  const sync = () => {
    ap.slogan = $("apSlogan").value.trim();
    ["header", "primary", "bg"].forEach((k) => { ap.colors[k] = $("apc_" + k).value; });
    document.querySelectorAll("[data-aptext]").forEach((i) => { ap.texts[i.dataset.aptext] = i.value.trim(); });
    renderApPreview();
  };
  $("tab-appearance").oninput = sync;
  $("tab-appearance").querySelectorAll("[data-theme]").forEach((b) => b.onclick = () => {
    const [, h, p, bg] = THEMES[Number(b.dataset.theme)];
    $("apc_header").value = h; $("apc_primary").value = p; $("apc_bg").value = bg; sync();
  });
  $("apReset").onclick = () => { ap.colors = {}; $("apc_header").value = "#17222E"; $("apc_primary").value = "#24508A"; $("apc_bg").value = "#EEF1EF"; ap.resetColors = true; renderApPreview(); };
  $("apLogoFile").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { ap.logo = await imgToDataUrl(f, 320); renderApPreview(); toast("Logo listo. Toca “Guardar apariencia”."); } catch { toast("No se pudo leer la imagen.", "error"); }
  };
  $("apLogoDel").onclick = () => { ap.logo = ""; renderApPreview(); };
  $("apSave").onclick = async () => {
    sync();
    if (ap.resetColors) { ap.colors = {}; delete ap.resetColors; }
    const btn = $("apSave"); setBusy(btn, true, "Guardando…");
    try {
      const appearance = { logo: ap.logo || "", slogan: ap.slogan || "", colors: ap.colors, texts: ap.texts };
      const panel = {
        useBrand: $("pnBrand").checked, columns: Number($("pnCols").value), style: $("pnStyle").value, colorIcons: $("pnIcons").checked,
        order: A.pn.order, hidden: A.pn.hidden, linkLabel: $("pnLabel").value.trim() || PANEL_DEFAULT.linkLabel, shareMsg: $("pnShare").value.trim() || PANEL_DEFAULT.shareMsg
      };
      await updateDoc(doc(db, bpath("settings", "general")), { appearance, panel, businessName: $("apName").value.trim() || A.settings.businessName || "" });
      toast("Apariencia guardada. Tu página ya se ve así.");
    } catch (err) { toast("No se pudo guardar: " + err.message, "error"); }
    finally { setBusy(btn, false); }
  };
  renderPanelOrder();
  $("pnOrder").onclick = (e) => {
    const b = e.target.closest("[data-pnmove]"); if (!b) return;
    const i = Number(b.dataset.pnid), j = i + Number(b.dataset.pnmove);
    if (j < 0 || j >= A.pn.order.length) return;
    [A.pn.order[i], A.pn.order[j]] = [A.pn.order[j], A.pn.order[i]]; renderPanelOrder();
  };
  $("pnOrder").onchange = (e) => {
    const c = e.target.closest("[data-pnshow]"); if (!c) return;
    A.pn.hidden = c.checked ? A.pn.hidden.filter((t) => t !== c.dataset.pnshow) : [...A.pn.hidden, c.dataset.pnshow];
  };
  renderApPreview();
}
function apInitials() { return ($("apName")?.value || A.settings.businessName || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(); }
function renderApPreview() {
  const ap = A.ap, c = ap.colors || {};
  const header = c.header || "#17222E", primary = c.primary || "#24508A", bg = c.bg || "#EEF1EF";
  const oh = onColor(header), op = onColor(primary), pt = darkenIfLight(primary);
  const t = (k, d) => (ap.texts[k] || "").trim() || d;
  const logo = ap.logo ? `<img src="${ap.logo}" alt="" class="h-full w-full object-cover">` : esc(apInitials());
  $("apLogoPrev").innerHTML = logo;
  $("apPreview").innerHTML = `
    <div class="mx-auto max-w-sm overflow-hidden rounded-2xl border border-line shadow" style="background:${bg}">
      <div style="background:${header};color:${oh}" class="flex items-center gap-3 p-3">
        <div class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl font-bold" style="background:rgba(255,255,255,.12)">${logo}</div>
        <div class="min-w-0"><p class="truncate font-narrow text-lg font-bold">${esc($("apName").value || "Tu negocio")}</p>${ap.slogan ? `<p class="truncate text-xs" style="opacity:.8">${esc(ap.slogan)}</p>` : ""}</div>
      </div>
      <div style="height:5px;background:${primary}"></div>
      <div class="p-3">
        ${t("welcome", "") ? `<p class="mb-2 text-sm font-semibold">${esc(t("welcome", ""))}</p>` : ""}
        <div class="overflow-hidden rounded-xl bg-white">
          <p class="p-2.5 text-center font-narrow text-sm font-bold uppercase tracking-wide" style="background:${primary};color:${op}">${esc(t("calendarTitle", "Selecciona día y horario"))}</p>
          <div class="grid grid-cols-3 gap-1.5 p-2.5 text-center text-xs font-semibold">
            <span class="rounded-full border-2 py-1" style="border-color:${primary};color:${pt}">9:00 a. m.</span>
            <span class="rounded-full py-1" style="background:${primary};color:${op};border:2px solid ${primary}">10:00 a. m.</span>
            <span class="rounded-full border-2 py-1" style="border-color:${primary};color:${pt}">11:00 a. m.</span>
          </div>
        </div>
        <p class="mt-3 rounded-xl py-2.5 text-center text-sm font-bold" style="background:${primary};color:${op}">${esc(t("bookButton", "Apartar cupo"))}</p>
      </div>
    </div>`;
}
function darkenIfLight(h) { return onColor(h) === "#111111" ? darken(h, 0.45) : h; }

// ================= Imágenes para redes con los cupos disponibles =================
const IMG_STYLES = [["clasico", "Clásico"], ["moderno", "Moderno"], ["neon", "Neón"], ["minimal", "Minimal"]];
function loadScript(src) {
  return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) return res(); const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
const publicUrl = () => new URL("index.html?b=" + encodeURIComponent(bpath().split("/")[1]), location.href).href;
function renderImages() {
  A.img = A.img || { style: "clasico", format: "story", kind: "slots", day: bogNow().date, extra: "" };
  const I = A.img, today = bogNow().date;
  const seg = (name, opts, cur) => `<div class="flex flex-wrap gap-2">${opts.map(([v, l]) => `<button type="button" class="chip" data-img-${name}="${v}" aria-pressed="${cur === v}">${l}</button>`).join("")}</div>`;
  $("tab-images").innerHTML = `
  <div class="grid gap-4 lg:grid-cols-2">
    <div class="space-y-4 rounded-xl border border-line bg-white p-4">
      <h3 class="font-narrow text-xl font-bold">Crea imágenes para tus estados y redes</h3>
      <p class="text-sm text-ink/70">Con tu logo, tu eslogan, los horarios libres del día y abajo el código QR con el enlace directo para agendar.</p>
      <div><p class="mb-1 text-sm font-semibold">Qué mostrar</p>${seg("kind", [["slots", "Horarios disponibles"], ["promo", "Promoción general"]], I.kind)}</div>
      <div id="imgDayBox"><p class="mb-1 text-sm font-semibold">Día</p>
        <div class="flex flex-wrap items-center gap-2">${seg("day", [[today, "Hoy"], [addDays(today, 1), "Mañana"]], I.day)}<input id="imgDate" type="date" min="${today}" value="${I.day}" class="rounded-lg border border-line px-2 py-1.5 text-sm"></div></div>
      <div><p class="mb-1 text-sm font-semibold">Diseño</p>${seg("style", IMG_STYLES, I.style)}</div>
      <div><p class="mb-1 text-sm font-semibold">Formato</p>${seg("format", [["story", "Estado / historia (vertical)"], ["post", "Publicación (cuadrada)"]], I.format)}</div>
      <label class="field"><span>Texto extra (opcional)</span><input id="imgExtra" maxlength="70" value="${esc(I.extra)}" placeholder="Ej. ¡Hoy 2x1 en arreglo de barba!"></label>
      <div class="grid grid-cols-2 gap-2">
        <button id="imgShare" class="btn-primary"><i class="fa-solid fa-share-nodes"></i> Compartir</button>
        <button id="imgDown" class="btn-light"><i class="fa-solid fa-download"></i> Descargar</button>
      </div>
      <p class="break-all text-xs text-ink/60">Enlace: ${esc(publicUrl())}</p>
    </div>
    <div class="text-center"><canvas id="imgCanvas" class="mx-auto max-h-[75vh] w-auto max-w-full rounded-xl border border-line shadow"></canvas><p id="imgInfo" class="mt-2 text-xs text-ink/60"></p></div>
  </div>`;
  const tab = $("tab-images");
  tab.onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    for (const k of ["kind", "day", "style", "format"]) if (b.dataset["img" + k[0].toUpperCase() + k.slice(1)]) { I[k] = b.dataset["img" + k[0].toUpperCase() + k.slice(1)]; return renderImages(); }
  };
  $("imgDate").onchange = (e) => { if (e.target.value) { I.day = e.target.value; renderImages(); } };
  $("imgExtra").oninput = (e) => { I.extra = e.target.value; clearTimeout(A.imgT); A.imgT = setTimeout(drawImage, 300); };
  $("imgDayBox").classList.toggle("hidden", I.kind !== "slots");
  $("imgDown").onclick = async () => { const a = document.createElement("a"); a.href = $("imgCanvas").toDataURL("image/png"); a.download = `agenda-${I.day}.png`; a.click(); };
  $("imgShare").onclick = async () => {
    const blob = await new Promise((r) => $("imgCanvas").toBlob(r, "image/png"));
    const file = new File([blob], `agenda-${I.day}.png`, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], text: "Agenda tu cita aquí: " + publicUrl() }); } catch { /* canceló */ } }
    else { $("imgDown").click(); toast("Tu celular no permite compartir directo: la imagen se descargó."); }
  };
  drawImage();
}
async function freeSlotsFor(date) {
  const q = await getDocs(query(collection(db, bpath("slotLocks")), where("date", "==", date)));
  const slot = Number(A.settings.slotDurationMinutes || 30);
  return computeSlots({ settings: A.settings, staffList: A.staff.filter((s) => s.active !== false), locks: q.docs.map((d) => d.data()), date, occupied: slot }).map((s) => s.time);
}
function loadImg(src) { return new Promise((res) => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
function roundRect(x, c, y, w, h, r) { x.beginPath(); x.moveTo(c + r, y); x.arcTo(c + w, y, c + w, y + h, r); x.arcTo(c + w, y + h, c, y + h, r); x.arcTo(c, y + h, c, y, r); x.arcTo(c, y, c + w, y, r); x.closePath(); }
function fitText(ctx, text, maxW, size, weight, family) {
  let s = size; do { ctx.font = `${weight} ${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 20); return s + 2;
}
async function drawImage() {
  const I = A.img, cv = $("imgCanvas"); if (!cv) return;
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js").catch(() => {});
  try { await document.fonts.ready; } catch { /* nada */ }
  const W = 1080, H = I.format === "story" ? 1920 : 1080;
  cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  const ap = A.settings.appearance || {}, col = ap.colors || {};
  const header = col.header || "#17222E", primary = col.primary || "#24508A", bg = col.bg || "#EEF1EF";
  const name = A.settings.businessName || "Tu negocio", slogan = ap.slogan || "";
  const F = "'Archivo', system-ui, sans-serif", FN = "'Archivo Narrow', 'Archivo', system-ui, sans-serif";
  const S = {
    clasico: { bg: bg, card: "#ffffff", head: header, onHead: onColor(header), text: "#17222E", pill: primary, onPill: onColor(primary), accent: primary },
    moderno: { bg: primary, card: "rgba(255,255,255,.14)", head: primary, onHead: onColor(primary), text: onColor(primary), pill: "#ffffff", onPill: darkenIfLight(primary) === primary ? primary : darken(primary, .45), accent: "#ffffff" },
    neon: { bg: "#07090f", card: "#11151f", head: "#07090f", onHead: "#ffffff", text: "#ffffff", pill: primary, onPill: onColor(primary), accent: primary, glow: true },
    minimal: { bg: "#ffffff", card: "#ffffff", head: "#ffffff", onHead: "#17222E", text: "#17222E", pill: "#17222E", onPill: "#ffffff", accent: primary }
  }[I.style];
  // Fondo
  x.fillStyle = S.bg; x.fillRect(0, 0, W, H);
  if (I.style === "moderno") { x.fillStyle = "rgba(255,255,255,.08)"; x.beginPath(); x.arc(W * 0.9, H * 0.1, 380, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(W * 0.05, H * 0.85, 300, 0, Math.PI * 2); x.fill(); }
  if (I.style === "clasico") { x.fillStyle = S.head; x.fillRect(0, 0, W, H * (I.format === "story" ? 0.27 : 0.33)); x.fillStyle = primary; x.fillRect(0, H * (I.format === "story" ? 0.27 : 0.33), W, 14); }
  if (I.style === "minimal") { x.strokeStyle = primary; x.lineWidth = 10; x.strokeRect(40, 40, W - 80, H - 80); }
  // Logo + nombre + eslogan
  const story = I.format === "story";
  let y = story ? 120 : 70;
  const logo = await loadImg(ap.logo);
  const L = story ? 200 : 150;
  x.save(); roundRect(x, (W - L) / 2, y, L, L, 36); x.clip();
  if (logo) { x.fillStyle = "#fff"; x.fillRect((W - L) / 2, y, L, L); x.drawImage(logo, (W - L) / 2, y, L, L); }
  else { x.fillStyle = S.accent === "#ffffff" ? "rgba(255,255,255,.2)" : S.accent; x.fillRect((W - L) / 2, y, L, L); x.fillStyle = S.accent === "#ffffff" ? "#fff" : onColor(S.accent); x.font = `700 ${L * 0.42}px ${FN}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase(), W / 2, y + L / 2); }
  x.restore();
  y += L + (story ? 70 : 55);
  x.textAlign = "center"; x.textBaseline = "alphabetic";
  const headColor = I.style === "clasico" ? S.onHead : S.text;
  x.fillStyle = headColor; const ns = fitText(x, name, W - 140, story ? 92 : 76, 700, FN); x.font = `700 ${ns}px ${FN}`;
  if (S.glow) { x.shadowColor = primary; x.shadowBlur = 30; }
  x.fillText(name, W / 2, y); x.shadowBlur = 0;
  if (slogan) { y += story ? 60 : 48; x.globalAlpha = .8; x.font = `500 ${story ? 40 : 34}px ${F}`; x.fillText(slogan, W / 2, y); x.globalAlpha = 1; }
  y += story ? 150 : 95;
  // Contenido
  x.fillStyle = S.text;
  if (I.kind === "slots") {
    const times = await freeSlotsFor(I.day);
    const isToday = I.day === bogNow().date;
    x.font = `700 ${story ? 74 : 58}px ${FN}`;
    if (S.glow) { x.shadowColor = primary; x.shadowBlur = 25; }
    x.fillText(isToday ? "CUPOS DISPONIBLES HOY" : "CUPOS DISPONIBLES", W / 2, y); x.shadowBlur = 0;
    y += story ? 66 : 52; x.globalAlpha = .75; x.font = `600 ${story ? 42 : 34}px ${F}`;
    const dl = fechaLarga(I.day); x.fillText(dl.charAt(0).toUpperCase() + dl.slice(1), W / 2, y); x.globalAlpha = 1;
    y += story ? 70 : 50;
    const max = story ? 15 : 9, show = times.slice(0, max), cols = 3;
    const pw = story ? 290 : 280, ph = story ? 96 : 80, gap = 26, x0 = (W - (cols * pw + (cols - 1) * gap)) / 2;
    if (!show.length) { x.font = `600 ${story ? 48 : 40}px ${F}`; x.fillText("Agenda para otro día en el enlace 👇", W / 2, y + 80); y += 160; }
    show.forEach((t, i) => {
      const cx = x0 + (i % cols) * (pw + gap), cy = y + Math.floor(i / cols) * (ph + gap);
      roundRect(x, cx, cy, pw, ph, ph / 2);
      if (S.glow) { x.shadowColor = primary; x.shadowBlur = 22; }
      x.fillStyle = S.pill; x.fill(); x.shadowBlur = 0;
      x.fillStyle = S.onPill; x.font = `700 ${story ? 44 : 38}px ${F}`; x.textBaseline = "middle"; x.fillText(hora12(t), cx + pw / 2, cy + ph / 2 + 2); x.textBaseline = "alphabetic";
    });
    y += Math.ceil(show.length / cols) * (ph + gap) + (times.length > max ? 50 : 10);
    if (times.length > max) { x.fillStyle = S.text; x.font = `600 ${story ? 38 : 32}px ${F}`; x.fillText(`y ${times.length - max} horario(s) más`, W / 2, y); }
    $("imgInfo").textContent = `${times.length} horario(s) libre(s) ese día.`;
  } else {
    x.font = `700 ${story ? 100 : 80}px ${FN}`;
    if (S.glow) { x.shadowColor = primary; x.shadowBlur = 30; }
    x.fillText("AGENDA TU CITA", W / 2, y + (story ? 120 : 60)); x.shadowBlur = 0;
    x.globalAlpha = .8; x.font = `600 ${story ? 46 : 38}px ${F}`; x.fillText("Elige tu hora en línea, sin esperas", W / 2, y + (story ? 200 : 125)); x.globalAlpha = 1;
    y += story ? 300 : 180;
    $("imgInfo").textContent = "";
  }
  if (I.extra) { x.fillStyle = S.text; const es = fitText(x, I.extra, W - 140, story ? 50 : 42, 700, F); x.font = `700 ${es}px ${F}`; x.fillText(I.extra, W / 2, Math.min(y + 40, H - (story ? 560 : 330))); }
  // Pie: "Agenda aquí" + QR + enlace
  const qs = story ? 340 : 230, qy = H - qs - (story ? 160 : 90);
  x.fillStyle = S.text; x.font = `700 ${story ? 60 : 46}px ${FN}`;
  x.fillText("AGENDA AQUÍ 👇", W / 2, qy - (story ? 40 : 28));
  roundRect(x, (W - qs) / 2 - 20, qy - 20, qs + 40, qs + 40, 28); x.fillStyle = "#ffffff"; x.fill();
  if (window.QRious) { const q = new window.QRious({ value: publicUrl(), size: qs, level: "M" }); x.drawImage(q.canvas, (W - qs) / 2, qy, qs, qs); }
  x.fillStyle = S.text; x.globalAlpha = .75; const short = publicUrl().replace(/^https?:\/\//, "");
  const us = fitText(x, short, W - 120, story ? 34 : 28, 600, F); x.font = `600 ${us}px ${F}`; x.fillText(short, W / 2, H - (story ? 90 : 40)); x.globalAlpha = 1;
}

// Tocar cualquier imagen marcada para verla en grande
document.addEventListener("click", (e) => { const i = e.target.closest("img[data-zoomsrc]"); if (i) viewImage(i.src); });
