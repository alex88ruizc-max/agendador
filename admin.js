// Panel de administración: agenda, pagos, descansos, clientes, servicios y configuración
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, serverTimestamp, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  startUpdateWatcher, applyBrandColors, uiConfirm, uiPrompt, setDialogBrand, viewImage, db, auth, bpath, api, setBusiness, businessFromUrl, bogNow, addDays, hora12, fechaLarga, fechaCorta, toMillis, cop, esc, normalizePhone,
  waLink, statusBadge, fillTemplate, DEFAULT_WA_CONFIRM, DEFAULT_WA_RESCHEDULE, computeSlots, staffHours, mapLinks, headerBgCss, onColor, darken,
  toast, openModal, closeModal, setBusy, copyText
} from "./common.js?v=2026-10-09k";

const $ = (id) => document.getElementById(id);
const ACTIVE = ["pending_payment", "pending_verification", "confirmed"];
const A = {
  me: null, settings: {}, services: [], staff: [], tg: {}, date: bogNow().date,
  dayApts: [], pending: [], index: {}, users: [], clientQ: "", tab: "home", unsubs: [], unsubDay: null, m: null
};
const isOwner = () => A.me?.role === "owner";
const show = (id, on) => $(id).classList.toggle("hidden", !on);
const onErr = (e) => { console.error(e); toast("Error leyendo datos: " + (e.code || e.message), "error"); };

// ================= Sesión =================
onAuthStateChanged(auth, async (u) => {
  A.unsubs.forEach((f) => f()); A.unsubs = []; A.unsubDay?.();
  show("loginView", !u);
  if (!u) { $("linkCard").classList.add("hidden"); $("btnAccount").classList.add("hidden"); $("hdrTitle").textContent = "Panel de tu negocio"; $("hdrSub").textContent = ""; show("spNav", false); }
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
  $("hdrTitle").textContent = A.biz.name;
  show("deniedView", false); show("appView", true); show("spNav", true); $("btnQuickSide").classList.remove("hidden");
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
document.addEventListener("click", async (e) => {
  if (!e.target.closest("[data-link]")) return;
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
    // recién creada desde "Probar gratis": abre la guía de primeros pasos
    // asistente de inicio: la primera vez (o al llegar desde "Probar gratis")
    if (!A.wizAuto && isOwner() && !A.me?.isSuper && (!A.settings.setupDone || new URLSearchParams(location.search).get("guia") === "1")) {
      A.wizAuto = true; A.geoAsked = true;
      setTimeout(() => { if (new URLSearchParams(location.search).get("guia")) history.replaceState(null, "", location.pathname + "?b=" + encodeURIComponent(bpath().split("/")[1])); openWizard(); }, 700);
    } else if (!A.geoAsked && isOwner() && !A.me?.isSuper && !A.settings.geo) { A.geoAsked = true; setTimeout(() => requestGeo(false), 2500); }
    renderAgenda(); renderStaffTab(); if (typeof renderHome === "function" && A.tab === "home") renderHome();
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
    A.unsubs.push(onSnapshot(doc(db, bpath("private", "telegram")), (s) => { A.tg = s.data() || {}; renderStaffTab(); if (A.tab === "home") renderHome(); }, onErr));
  }
  subscribeDay();
  startHome();
  setInterval(renderStaffTab, 60000);
}

async function renderPlanBanner() {
  const el = $("planBanner"); el.classList.add("hidden");
  const msgs = [];
  if (A.me.isSuper) msgs.push(`Estás viendo el panel de ${esc(A.biz.name)} como superusuario. <a class="underline" href="super.html">Volver a mis negocios</a>`);
  if (A.biz.status !== "active") msgs.push("⛔ Tu agenda en línea está suspendida: tus clientes no pueden reservar desde la página. Comunícate con soporte para reactivarla.");
  if (isTrial()) msgs.push(`🎁 Estás en prueba gratis: tus clientes agendan hasta ${trialDays()} días adelante y algunas funciones están bloqueadas 🔒. <a href="#" class="underline" data-goplan="1">Activar mi plan</a>`);
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
  home: ["Inicio", "fa-house", "#2B59C3"], marketing: ["Marketing", "fa-bullhorn", "#D7263D"], activity: ["Actividad", "fa-chart-line", "#0891b2"], referrals: ["Referidos", "fa-gift", "#D7263D"],
  agenda: ["Agenda", "fa-calendar-days", "#2563eb"], staff: ["Equipo y descansos", "fa-users", "#7c3aed"],
  clients: ["Clientes", "fa-address-book", "#db2777"], services: ["Servicios", "fa-scissors", "#ea580c"],
  appearance: ["Apariencia", "fa-palette", "#c026d3"], images: ["Imágenes", "fa-image", "#0891b2"], plan: ["Mi plan", "fa-crown", "#ca8a04"],
  settings: ["Configuración", "fa-gear", "#475569"]
};
// Lo que se bloquea en la prueba gratis lo define el superusuario en su panel (Cobros)
const TRIAL_DEFAULT = { daysAhead: 5, locked: ["clients", "marketing", "appearance", "images", "team"] };
const trialRules = () => ({ ...TRIAL_DEFAULT, ...(A.plat?.trialRules || {}) });
const trialLocked = () => trialRules().locked || [];
const trialDays = () => Math.max(1, Number(trialRules().daysAhead || 5));
const lockedNow = (f) => isTrial() && trialLocked().includes(f);
const isTrial = () => !!A.biz?.trial && !A.me?.isSuper;
function goTab(id) { switchTab(id); }
function lockCard(id) {
  $("tab-" + id).innerHTML = `<div class="rounded-2xl border border-line bg-white p-6 text-center">
    <p class="text-4xl">🔒</p><p class="mt-2 font-narrow text-2xl font-bold">${TABS[id][0]} es una función Pro</p>
    <p class="mx-auto mt-1 max-w-sm text-sm text-ink/70">Durante la prueba gratis está bloqueada. Activa tu plan y se desbloquea al instante, junto con agendar más de ${trialDays()} días adelante, varios profesionales y avisos por Telegram al equipo.</p>
    <button class="btn-primary mt-4" data-goplan="1">👑 Activar mi plan</button></div>`;
}
document.addEventListener("click", (e) => { if (e.target.closest("[data-goplan]")) { e.preventDefault(); goTab("plan"); } });
const ALL_TABS = ["home", "activity", "referrals", "agenda", "staff", "clients", "services", "marketing", "appearance", "images", "plan", "settings"];
const LOCKED_TABS = ["home", "appearance", "settings", "plan"]; // siempre visibles para poder deshacer cambios
const PANEL_DEFAULT = { useBrand: true, linkLabel: "Link clientes", shareMsg: "Agenda tu cita en {negocio} aquí: {link}", columns: 3, style: "cards", colorIcons: true, order: ALL_TABS, hidden: [] };
function panelPrefs() {
  const p = { ...PANEL_DEFAULT, ...(A.settings?.panel || {}) };
  p.order = [...(p.order || []).filter((t) => ALL_TABS.includes(t)), ...ALL_TABS.filter((t) => !(p.order || []).includes(t))];
  p.hidden = (p.hidden || []).filter((t) => !LOCKED_TABS.includes(t));
  return p;
}
function renderTabs() {
  const P = panelPrefs();
  const allowed = ["home", "agenda", "staff"].concat(isOwner() ? ["activity", "referrals", "clients", "services", "marketing", "appearance", "images", "plan", "settings"] : []);
  const ids = P.order.filter((id) => allowed.includes(id) && (!P.hidden.includes(id) || A.tab === id));
  const t = $("tabs");
  t.className = `grid gap-1.5 lg:grid-cols-1 ${({ 2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4" })[P.columns] || "grid-cols-3"} ${P.style === "list" ? "tabs-list" : ""} ${P.colorIcons ? "" : "tabs-mono"}`;
  t.innerHTML = ids.map((id) => `<button class="admin-tab relative" data-tab="${id}" aria-current="${A.tab === id ? "page" : "false"}"><i class="fa-solid ${TABS[id][1]}" style="color:${TABS[id][2]}"></i><span>${TABS[id][0]}</span>${lockedNow(id) ? `<span class="absolute right-1.5 top-1 text-[11px]" aria-label="Bloqueada">🔒</span>` : ""}</button>`).join("");
  $("linkCard").classList.remove("hidden");
  $("linkTitle").textContent = P.linkLabel || PANEL_DEFAULT.linkLabel;
}
// Aplica la marca del negocio (logo y colores) al panel, si el dueño lo eligió
function applyPanelBrand() {
  const P = panelPrefs(), ap = A.settings?.appearance || {};
  applyBrandColors(P.useBrand ? ap : {});
  const logo = $("hdrLogo");
  logo.classList.remove("hidden"); logo.classList.add("grid");
  logo.style.background = (P.useBrand && ap.colors?.primary) || "var(--sink)";
  const name = A.settings?.businessName || A.biz?.name || "";
  if (name) $("hdrTitle").textContent = name;
  logo.innerHTML = ap.logo ? `<img src="${ap.logo}" alt="" class="h-full w-full object-cover">` : esc(name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase());
}
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]"); if (!b) return;
  switchTab(b.dataset.tab);
});
function switchTab(id) {
  if (!TABS[id]) return;
  A.tab = id;
  document.body.classList.remove("show-more");
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.add("hidden"));
  show("tab-" + A.tab, true);
  renderTabs(); syncBottomNav();
  if (A.tab !== "home") $("hdrSub").textContent = TABS[A.tab][0];
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (A.tab === "home") renderHome();
  if (lockedNow(A.tab)) return lockCard(A.tab);
  if (A.tab === "clients") loadUsers();
  if (A.tab === "settings") renderSettings();
  if (A.tab === "services") renderServices();
  if (A.tab === "appearance") renderAppearance();
  if (A.tab === "images") renderImages();
  if (A.tab === "plan") renderPlan();
  if (A.tab === "marketing") renderMarketing();
  if (A.tab === "activity") renderActivity();
  if (A.tab === "referrals") renderReferrals();
}

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
  renderMyStatus();
  const el = $("tab-staff");
  const list = isOwner() ? A.staff : A.staff.filter((s) => s.id === A.me.staffId);
  const ownerTg = A.tg?.owner;
  el.innerHTML = `
    ${isOwner() ? `<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-ink/70">${ownerTg ? "Tu Telegram de dueño está conectado." : "Conecta tu Telegram de dueño en Configuración para recibir todos los avisos."}</p>
      ${lockedNow("team") ? `<button class="btn-light" data-goplan="1">🔒 Agregar al equipo (Pro)</button>` : `<button class="btn-primary" data-sact="new">+ Agregar al equipo</button>`}</div>` : ""}
    <section class="mb-4 rounded-xl border border-line bg-white p-4">
      <div class="mb-2 flex items-center gap-2"><i class="fa-regular fa-clock text-pole-blue"></i><h3 class="font-narrow text-xl font-bold">Disponibilidad ${list.length > 1 ? "del equipo" : ""}</h3></div>
      <p class="mb-3 text-xs text-ink/60">${list.length > 1
        ? "Cada persona puede tener su propio horario y sus días libres. Si alguien usa el horario del negocio, atiende igual que el local. El cliente ve los cupos de todos juntos o puede elegir con quién."
        : "Define en qué días y horas atiendes y tus días libres. Si usas el horario del negocio, se toma el de Configuración."}</p>
      <div class="space-y-2">${list.filter((x) => x.active !== false).map((x) => `
        <div class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2.5">
          <div class="min-w-0"><p class="font-semibold">${esc(x.name)}</p><p class="text-xs text-ink/60">${esc(hoursSummary(x))}</p></div>
          <button class="btn-sm" data-sact="hours" data-id="${x.id}"><i class="fa-regular fa-calendar"></i> Editar horario</button>
        </div>`).join("")}</div>
    </section>
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
  if (act === "hours") openStaffHours(s);
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
    <div id="cHist" class="space-y-2 text-sm"><p class="text-ink/60">Cargando…</p></div>
    <div class="mt-6 border-t border-line pt-4">
      <button id="cDelete" class="w-full rounded-lg border border-rose-300 py-2.5 text-sm font-semibold text-rose-800"><i class="fa-regular fa-trash-can"></i> Eliminar cliente</button>
      <p class="mt-1 text-center text-xs text-ink/50">Se borra de tu lista. Sus citas pasadas quedan en la agenda.</p>
    </div>`);
  $("cBook").onclick = () => openAptModal("new", null, u);
  $("cDelete").onclick = () => deleteClient(u);
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
        <div id="geoBox" class="rounded-xl p-3 md:col-span-2" style="background:var(--canvas)">
          <p class="text-sm font-bold">Cómo llegar (Waze y Google Maps)</p>
          <p class="soft mb-2 text-xs">${s.geo ? "✓ El punto exacto de tu local está guardado. Tus clientes llegan directo." : "Ahora se usa tu dirección. Para que lleguen exacto, toca el botón estando dentro de tu local."}</p>
          <div class="flex flex-wrap gap-2"><button type="button" id="geoSet" class="btn-sm"><i class="fa-solid fa-location-crosshairs"></i> ${s.geo ? "Actualizar" : "Guardar"} la ubicación de mi local</button>
            ${mapLinks(s) ? `<a class="btn-sm" href="${mapLinks(s).waze}" target="_blank" rel="noopener"><i class="fa-brands fa-waze"></i> Probar en Waze</a>` : ""}</div>
        </div>
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
        ${num("stWindow", isTrial() ? `Días hacia adelante (máx. ${trialDays()} en prueba gratis)` : "Días hacia adelante que se puede reservar", isTrial() ? Math.min(trialDays(), s.bookingWindowDays ?? trialDays()) : (s.bookingWindowDays ?? 30), isTrial() ? `min="1" max="${trialDays()}"` : 'min="1"')}
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
  $("geoSet").onclick = () => requestGeo(true);
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
    bookingWindowDays: isTrial() ? Math.min(trialDays(), Math.max(1, n("stWindow"))) : Math.max(1, n("stWindow")), minAdvanceMinutes: n("stAdvance"), toleranceMinutes: n("stTolerance"),
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
  ["payNote", "Aviso en la pantalla de pago", "En el mensaje de la transferencia escribe tu nombre. Tu número de reserva te llega al confirmar el pago."],
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
        <h3 class="mb-1 font-narrow text-xl font-bold">Imagen de fondo del encabezado</h3>
        <p class="mb-3 text-xs text-ink/60">Una foto de tu local, tu silla o un corte. Se degrada sola para que tu nombre y tus botones se lean bien.</p>
        <div class="mb-3 flex items-center gap-3">
          <div id="apBgPrev" class="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-paper bg-cover bg-center text-xl"></div>
          <div class="flex flex-wrap gap-2"><label class="btn-sm cursor-pointer">📷 ${ap.headerBg?.img ? "Cambiar" : "Subir"} imagen<input id="apBgFile" type="file" accept="image/*" class="hidden"></label><button id="apBgDel" type="button" class="btn-sm">Quitar</button></div>
        </div>
        <p class="mb-1.5 text-xs font-semibold text-ink/60">Estilo del degradado</p>
        <div class="mb-3 flex flex-wrap gap-2"><button type="button" class="chip" data-apbg="dark" aria-pressed="${(ap.headerBg?.style || "dark") === "dark"}">Oscuro</button><button type="button" class="chip" data-apbg="brand" aria-pressed="${ap.headerBg?.style === "brand"}">Color de mi marca</button></div>
        <label class="block text-xs font-semibold text-ink/60">¿Cuánto se ve la foto?
          <span class="mt-1 flex items-center gap-2 font-normal">Poco<input id="apBgShow" type="range" min="10" max="90" step="5" value="${Number(ap.headerBg?.show ?? 45)}" class="flex-1">Mucho</span></label>
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
  ap.headerBg = ap.headerBg || { img: "", style: "dark", show: 45 };
  $("apBgFile").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { ap.headerBg.img = await imgToDataUrl(f, 1100, "image/jpeg"); renderApPreview(); toast("Imagen lista. Toca “Guardar apariencia”."); } catch { toast("No se pudo leer la imagen.", "error"); }
  };
  $("apBgDel").onclick = () => { ap.headerBg.img = ""; renderApPreview(); };
  $("tab-appearance").querySelectorAll("[data-apbg]").forEach((b) => b.onclick = () => {
    ap.headerBg.style = b.dataset.apbg;
    $("tab-appearance").querySelectorAll("[data-apbg]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
    renderApPreview();
  });
  $("apBgShow").oninput = (e) => { ap.headerBg.show = Number(e.target.value); renderApPreview(); };
  $("apSave").onclick = async () => {
    sync();
    if (ap.resetColors) { ap.colors = {}; delete ap.resetColors; }
    const btn = $("apSave"); setBusy(btn, true, "Guardando…");
    try {
      const appearance = { logo: ap.logo || "", slogan: ap.slogan || "", colors: ap.colors, texts: ap.texts, headerBg: ap.headerBg || { img: "", style: "dark", show: 45 } };
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
  const bgCss = headerBgCss(header, ap.headerBg);
  if ($("apBgPrev")) { $("apBgPrev").style.background = bgCss || ""; $("apBgPrev").textContent = ap.headerBg?.img ? "" : "🖼️"; }
  $("apPreview").innerHTML = `
    <div class="mx-auto max-w-sm overflow-hidden rounded-2xl border border-line shadow" style="background:${bg}">
      <div style="background:${bgCss ? bgCss.replace(/'/g, "&#39;") : header};color:${bgCss ? "#fff" : oh}" class="flex items-center gap-3 p-3">
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

// ================= Horario de cada profesional =================
const DAY_SHORT = { 1: "Lun", 2: "Mar", 3: "Mié", 4: "Jue", 5: "Vie", 6: "Sáb", 0: "Dom" };
const h12s = (t) => hora12(t).replace(":00", "").replace(" a. m.", "am").replace(" p. m.", "pm");
function hoursSummary(x) {
  const today = bogNow().date;
  const off = (x.offDates || []).filter((d) => d >= today).sort();
  const offTxt = off.length ? ` · Días libres: ${off.slice(0, 3).map((d) => fechaCorta(d)).join(", ")}${off.length > 3 ? "…" : ""}` : "";
  if (!x.ownHours) return "Horario del negocio" + offTxt;
  const parts = [1, 2, 3, 4, 5, 6, 0].map((d) => { const iv = (x.hours || {})[String(d)] || []; return iv.length ? `${DAY_SHORT[d]} ${iv.map((h) => h12s(h.open) + "-" + h12s(h.close)).join(" y ")}` : null; }).filter(Boolean);
  return (parts.length ? "Horario propio: " + parts.join(" · ") : "Horario propio: sin días de atención") + offTxt;
}
function openStaffHours(x) {
  const base = x.ownHours && x.hours ? x.hours : (A.settings.businessHours || {});
  A.sh = { own: !!x.ownHours, off: [...(x.offDates || [])].filter((d) => d >= bogNow().date).sort() };
  openM("Horario de " + x.name, `
    <div class="mb-3 grid grid-cols-2 rounded-lg bg-paper p-1 text-sm font-semibold">
      <button type="button" class="tab ${A.sh.own ? "" : "tab-on"}" data-shmode="biz">Horario del negocio</button>
      <button type="button" class="tab ${A.sh.own ? "tab-on" : ""}" data-shmode="own">Horario propio</button>
    </div>
    <p id="shBizNote" class="mb-3 text-sm text-ink/70 ${A.sh.own ? "hidden" : ""}">Atiende en el mismo horario del local (lo cambias en Configuración).</p>
    <div id="shDays" class="mb-4 space-y-2 ${A.sh.own ? "" : "hidden"}">${DAYS.map(([d, name]) => {
      const h = base[String(d)] || [];
      return `<div class="grid grid-cols-[6.5rem_1fr] items-center gap-2 border-t border-line pt-2" data-shdow="${d}">
        <label class="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" class="h-4 w-4 shOn" ${h.length ? "checked" : ""}> ${name}</label>
        <div class="flex flex-wrap items-center gap-1 text-sm">
          <input type="time" step="900" class="sh1o rounded border border-line px-1" value="${h[0]?.open || "09:00"}"> a <input type="time" step="900" class="sh1c rounded border border-line px-1" value="${h[0]?.close || "19:00"}">
          <span class="mx-1 text-ink/50">y</span>
          <input type="time" step="900" class="sh2o rounded border border-line px-1" value="${h[1]?.open || ""}"> a <input type="time" step="900" class="sh2c rounded border border-line px-1" value="${h[1]?.close || ""}">
        </div></div>`;
    }).join("")}</div>
    <p class="mb-1 text-sm font-semibold">Días libres (vacaciones, permisos)</p>
    <div class="mb-2 flex flex-wrap items-center gap-2"><input id="shOffNew" type="date" min="${bogNow().date}" class="rounded border border-line px-2 py-1"><button type="button" id="shOffAdd" class="btn-sm">Agregar</button></div>
    <div id="shOffList" class="mb-4 flex flex-wrap gap-2"></div>
    <p class="mb-3 text-xs text-ink/60">Las citas que ya estén agendadas no se cancelan; revisa la Agenda si cambias días con citas.</p>
    <button id="shSave" class="btn-primary w-full">Guardar horario</button>`);
  const renderOff = () => { $("shOffList").innerHTML = A.sh.off.map((d) => `<span class="chip flex items-center gap-2"><span class="capitalize">${fechaCorta(d)}</span><button type="button" data-shrm="${d}" aria-label="Quitar">✕</button></span>`).join("") || `<span class="text-sm text-ink/60">Ninguno.</span>`; };
  renderOff();
  $("modalBody").querySelectorAll("[data-shmode]").forEach((b) => b.onclick = () => {
    A.sh.own = b.dataset.shmode === "own";
    $("modalBody").querySelectorAll("[data-shmode]").forEach((x2) => x2.classList.toggle("tab-on", x2 === b));
    $("shDays").classList.toggle("hidden", !A.sh.own); $("shBizNote").classList.toggle("hidden", A.sh.own);
  });
  $("shOffAdd").onclick = () => { const v = $("shOffNew").value; if (!v) return; if (!A.sh.off.includes(v)) A.sh.off.push(v); A.sh.off.sort(); renderOff(); };
  $("shOffList").onclick = (e) => { const b = e.target.closest("[data-shrm]"); if (b) { A.sh.off = A.sh.off.filter((d) => d !== b.dataset.shrm); renderOff(); } };
  $("shSave").onclick = async () => {
    const hours = {};
    if (A.sh.own) {
      for (const row of document.querySelectorAll("[data-shdow]")) {
        const d = row.dataset.shdow, iv = [];
        if (row.querySelector(".shOn").checked) {
          const o1 = row.querySelector(".sh1o").value, c1 = row.querySelector(".sh1c").value, o2 = row.querySelector(".sh2o").value, c2 = row.querySelector(".sh2c").value;
          for (const v of [o1, c1, o2, c2]) if (v && Number(v.split(":")[1]) % 15 !== 0) return toast("Usa horas en punto, :15, :30 o :45.", "error");
          if (!o1 || !c1 || c1 <= o1) return toast("Revisa el horario: el cierre debe ser después de la apertura.", "error");
          iv.push({ open: o1, close: c1 });
          if (o2 && c2) { if (c2 <= o2 || o2 < c1) return toast("El segundo turno debe empezar después del primero.", "error"); iv.push({ open: o2, close: c2 }); }
        }
        hours[d] = iv;
      }
    }
    const btn = $("shSave"); setBusy(btn, true, "Guardando…");
    try {
      const data = { ownHours: A.sh.own, offDates: A.sh.off };
      if (A.sh.own) data.hours = hours;
      await updateDoc(doc(db, bpath("staff", x.id)), data);
      closeM(); toast("Horario guardado. La página de clientes ya muestra los cupos nuevos.");
    } catch (err) { toast("No se pudo guardar: " + err.message, "error"); setBusy(btn, false); }
  };
}

// ================= Eliminar cliente =================
async function deleteClient(u) {
  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "este cliente";
  let upcoming = [];
  try { upcoming = (await clientHistory(u)).filter((a) => ACTIVE.includes(a.status)); } catch { /* sin historial */ }
  const ok = await uiConfirm(`¿Eliminar a ${name}?`,
    `Se borra de tu lista de clientes con sus notas privadas y su modo de pago.${upcoming.length ? ` Tiene ${upcoming.length} cita(s) próxima(s): esas no se cancelan, cancélalas desde la Agenda si es necesario.` : ""} Si vuelve a reservar, aparecerá como cliente nuevo. Para impedir que reserve, mejor usa “Bloquear reservas”.`,
    { okText: "Eliminar", danger: true });
  if (!ok) return;
  try {
    await deleteDoc(doc(db, bpath("customers", u.uid, "private", "admin"))).catch(() => {});
    await deleteDoc(doc(db, bpath("customers", u.uid)));
    A.users = A.users.filter((x) => x.uid !== u.uid);
    closeM(); renderClients(); toast(`${name} fue eliminado de tus clientes.`);
  } catch (err) { toast("No se pudo eliminar: " + err.message, "error"); }
}

// ================= Mi plan (lo que la tienda le paga a la plataforma) =================
let unsubPlan = null;
function renderPlan() {
  const el = $("tab-plan");
  el.innerHTML = `<p class="text-sm text-ink/60">Cargando tu plan…</p>`;
  unsubPlan?.();
  let pp = {};
  getDoc(doc(db, "platform", "public")).then((s) => { pp = s.data() || {}; draw(); }).catch(() => {});
  let bl = null;
  unsubPlan = onSnapshot(doc(db, bpath("private", "billing")), (s) => {
    bl = s.data() || {};
    if (A.biz?.trial && bl.trial === false) { // el pago llegó: se desbloquea todo
      A.biz.trial = false; renderTabs(); renderPlanBanner();
      toast("🎉 ¡Pago recibido! Tu plan está activo y todas las funciones quedaron desbloqueadas.");
    }
    draw();
  }, onErr);
  A.unsubs.push(() => unsubPlan?.());
  A.planMonths = A.planMonths || 1;
  // Precio de un paquete de meses: usa el descuento que define el superusuario (Cobros > Paquetes)
  function planTotal(m) {
    const price = Number(bl.priceCOP || 0), base = Number(pp.planPriceCOP || 0), pack = Number((pp.planBundles || {})[m] || 0);
    if (m === 1 || !pack || !base) return price * m;
    return Math.round((price * m * (pack / (base * m))) / 100) * 100;
  }
  const credit = () => Number(bl.creditCOP || 0);
  const netOf = (m) => Math.max(0, planTotal(m) - credit());
  function monthsPicker(sel) {
    const price = Number(bl.priceCOP || 0);
    const chips = [1, 3, 6, 12].map((m) => {
      const tot = planTotal(m), off = price * m > tot ? Math.round((1 - tot / (price * m)) * 100) : 0;
      return `<button class="relative rounded-2xl border px-3 py-2 text-left ${sel === m ? "text-white" : "bg-white"}" style="${sel === m ? "background:var(--sink);border-color:var(--sink)" : "border-color:var(--hair)"}" data-pm="${m}" aria-pressed="${sel === m}">
        ${off ? `<span class="absolute -right-1.5 -top-2 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold text-white" style="background:var(--sred)">-${off}%</span>` : ""}
        <span class="block text-sm font-bold">${m === 1 ? "1 mes" : m + " meses"}</span><span class="block text-xs ${sel === m ? "text-white/75" : "soft"}">${cop(tot)}</span></button>`;
    }).join("");
    const tot = planTotal(sel), save = price * sel - tot;
    return `<div class="mb-2 grid grid-cols-4 gap-2">${chips}</div>
      ${credit() > 0 ? `<p class="mb-2 rounded-xl px-3 py-2 text-sm font-semibold" style="background:#fff7e0;color:#8a5a00">🎁 Descuento por referidos: −${cop(Math.min(credit(), tot))}${netOf(sel) === 0 ? ". ¡Este pago te sale gratis!" : `. Pagas ${cop(netOf(sel))}.`}</p>` : ""}
      ${save > 0 ? `<p class="q-pop mb-3 rounded-xl px-3 py-2 text-sm font-semibold" style="background:#e9f7f0;color:#16774b">🎉 Ahorras ${cop(save)}: te sale a ${cop(Math.round(tot / sel / 100) * 100)} al mes en vez de ${cop(price)}.</p>` : `<div class="mb-3"></div>`}`;
  }
  // Bloque del pago automático por Bre-B (monto único que el sistema reconoce solo)
  function brebBlock() {
    const o = bl.pendingOrder && bl.pendingOrder.status === "pending" && toMillis(bl.pendingOrder.expiresAt) > Date.now() ? bl.pendingOrder : null;
    const months = bl.mode === "monthly" ? A.planMonths : 1;
    if (!o) return `<section class="rounded-xl border-2 border-emerald-500 bg-white p-4">
      <div class="mb-1 flex items-center gap-2"><span class="text-xl">⚡</span><h3 class="font-narrow text-xl font-bold">Pago automático Bre-B</h3></div>
      <p class="mb-3 text-sm text-ink/70">Pagas desde Nequi, Bancolombia o cualquier banco con la llave Bre-B y tu plan se activa solo en pocos minutos. Sin comprobante.</p>
      ${bl.mode === "monthly" ? monthsPicker(months) : ""}
      <button id="brebGo" class="btn-primary w-full py-3 !bg-emerald-600">${netOf(months) === 0 ? "🎁 Activar gratis con mis referidos" : `Pagar ${cop(netOf(months))} con Bre-B`}</button></section>`;
    return `<section class="rounded-xl border-2 border-emerald-500 bg-white p-4">
      <div class="mb-2 flex items-center justify-between gap-2"><div class="flex items-center gap-2"><span class="text-xl">⚡</span><h3 class="font-narrow text-xl font-bold">Paga con Bre-B</h3></div>
        <span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">⏱ <span id="brebLeft">--:--</span></span></div>
      <div class="pay-amount mb-2"><div><p class="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Envía exactamente</p>
        <p class="font-narrow text-3xl font-bold leading-none">${cop(o.amountCOP)}</p>
        <p class="mt-1 text-[11px] text-ink/60">${o.months} mes(es).${o.amountCOP > o.baseCOP ? ` Incluye ${cop(o.amountCOP - o.baseCOP)} para reconocer tu pago, porque otra tienda está pagando al mismo tiempo.` : " Valor exacto de tu plan, sin recargo."}</p></div>
        <button type="button" class="pay-ibtn" data-copy="${o.amountCOP}" aria-label="Copiar monto"><i class="fa-regular fa-copy"></i></button></div>
      <div class="pay-row"><div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-wider text-ink/55">Llave Bre-B${pp.brebHolder ? ` · <span class="normal-case tracking-normal">${esc(pp.brebHolder)}</span>` : ""}</p>
        <p class="truncate font-mono text-[15px] font-bold">${esc(pp.brebKey)}</p></div>
        ${pp.brebQr ? `<button type="button" class="pay-ibtn" id="brebQr" aria-label="Ver QR"><i class="fa-solid fa-qrcode"></i></button>` : ""}
        <button type="button" class="pay-ibtn main" data-copy="${esc(pp.brebKey)}" aria-label="Copiar llave"><i class="fa-regular fa-copy"></i></button></div>
      <p class="mt-2 text-xs leading-snug text-ink/65">⚠️ Envía <b>exactamente ${cop(o.amountCOP)}</b> antes de que termine el tiempo. Tu plan se activa solo entre 5 y 10 minutos después de pagar; esta pantalla se actualiza sola.</p>
      <div class="mt-3 rounded-2xl border border-dashed p-3" style="border-color:var(--hair)">
        <button id="brebOtherBtn" class="w-full text-left text-sm font-bold">💬 ¿Pagaste otro valor?</button>
        <p class="soft mt-0.5 text-xs">Adjunta la captura de tu pago aquí y te ayudamos. Te avisamos cuando se active tu plan.</p>
        <div id="brebOther" class="mt-2 hidden space-y-2">
          <label class="field"><span>¿Cuánto enviaste? (opcional)</span><input id="brebOtherAmt" type="number" inputmode="numeric" min="0" placeholder="Ej. 20000"></label>
          <label class="pay-drop" for="brebOtherFile"><span class="pay-drop-ico"><i class="fa-solid fa-camera"></i></span>
            <span id="brebOtherLbl" class="min-w-0 flex-1 text-sm"><b>Adjunta la captura del pago</b><br><span class="soft text-xs">Toca para elegir la imagen</span></span>
            <img id="brebOtherPrev" class="hidden h-12 w-12 rounded-md object-cover" alt=""></label>
          <input id="brebOtherFile" type="file" accept="image/*" class="hidden">
          <button id="brebOtherSend" class="btn-primary w-full">Enviar captura</button>
        </div>
      </div>
      <button id="brebCancel" class="mt-2 w-full py-1 text-center text-xs text-ink/50 underline">Cancelar este pago</button>
    </section>`;
  }
  function draw() {
    if (!bl) return;
    const today = bogNow().date;
    const days = bl.paidUntil ? Math.round((Date.parse(bl.paidUntil + "T00:00:00-05:00") - Date.parse(today + "T00:00:00-05:00")) / 86400000) : null;
    const suspended = A.biz?.status !== "active";
    const status = suspended ? ["Pausada", "bg-rose-100 text-rose-900"]
      : bl.mode === "monthly" && days !== null && days < 0 ? ["Vencido", "bg-rose-100 text-rose-900"]
      : bl.trial ? ["Prueba gratis", "bg-sky-100 text-sky-900"] : ["Activo", "bg-emerald-100 text-emerald-900"];
    const price = Number(bl.priceCOP || 0);
    const planName = pp.planName || "Plan mensual";
    let duration = "";
    if (bl.mode === "monthly" && bl.paidUntil) duration = (bl.trial ? "Prueba gratis hasta el " : "Pagado hasta el ") + fechaLarga(bl.paidUntil) +
      (days > 0 ? ` (faltan ${days} día${days === 1 ? "" : "s"})` : days === 0 ? " (vence hoy)" : ` (venció hace ${-days} día${days === -1 ? "" : "s"}; tienes ${Math.max(0, Number(bl.graceDays || 0) + days)} día(s) de gracia)`);
    if (bl.mode === "one_time") duration = bl.paidOnce ? "Pago único: pagado. Tu agenda no vence." : "Pago único pendiente.";
    if (bl.mode === "manual") duration = "Plan acordado directamente con soporte.";
    const methods = pp.payMethods || [];
    const canPay = bl.mode === "monthly" || (bl.mode === "one_time" && !bl.paidOnce);
    const months = bl.mode === "monthly" ? A.planMonths : 1;
    const total = netOf(months);
    el.innerHTML = `
      <div class="space-y-3">
        <section class="rounded-xl border border-line bg-white p-4">
          <div class="mb-2 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2"><i class="fa-solid fa-crown text-amber-500"></i><h3 class="font-narrow text-xl font-bold">${esc(planName)}</h3></div>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold ${status[1]}">${status[0]}</span>
          </div>
          <p class="font-narrow text-3xl font-bold">${cop(price)}<span class="text-base font-semibold text-ink/60"> / mes</span></p>
          <p class="mt-1 text-sm">${esc(duration)}</p>
          ${bl.trial ? `<p class="mt-3 rounded-lg bg-sky-50 p-3 text-sm text-sky-900">🎁 Estás en tu periodo gratis. Cuando termine, pagas la mensualidad para seguir recibiendo reservas. El pago es <b>mes vencido</b>: pagas al final de cada mes que usaste.</p>` : ""}
          ${suspended ? `<p class="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-900">Tu agenda en línea está pausada: tus clientes no pueden reservar. Paga tu plan abajo y se reactiva apenas lo aprobemos.</p>` : ""}
        </section>
        ${bl.pendingProof ? `<section class="rounded-xl border border-sky-300 bg-sky-50 p-4 text-sm text-sky-900"><b><span class="spin mr-1"></span> Comprobante en revisión</b><br>Lo enviaste el ${new Date(toMillis(bl.pendingProof.at)).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })} por ${cop(bl.pendingProof.amountCOP)}. Esta pantalla se actualiza sola cuando lo aprobemos.</section>` : ""}
        ${canPay && pp.brebEnabled && pp.brebKey ? brebBlock() : ""}
        ${canPay ? `<${pp.brebEnabled && pp.brebKey ? "details" : "section"} class="rounded-xl border border-line bg-white p-4">
          ${pp.brebEnabled && pp.brebKey ? `<summary class="cursor-pointer font-semibold">¿Pagaste por otro medio? Sube el comprobante</summary><div class="mt-3"></div>` : ""}
          <h3 class="mb-2 font-narrow text-xl font-bold">${bl.trial ? "Pagar mi plan" : "Renovar mi plan"}</h3>
          ${bl.mode === "monthly" ? monthsPicker(months) : ""}
          <div class="pay-amount mb-2"><div><p class="text-[11px] font-semibold uppercase tracking-wider text-ink/60">Envía exactamente</p><p class="font-narrow text-3xl font-bold leading-none">${cop(total)}</p></div>
            <button type="button" class="pay-ibtn" data-copy="${total}" aria-label="Copiar monto"><i class="fa-regular fa-copy"></i></button></div>
          <div class="space-y-1.5">${methods.length ? methods.map((m, i) => `
            <div class="pay-row"><div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-wider text-ink/55">${esc(m.label)}${m.holder ? ` · <span class="normal-case tracking-normal">${esc(m.holder)}</span>` : ""}</p>
              <p class="truncate font-mono text-[15px] font-bold">${esc(m.account)}</p></div>
              ${m.qr ? `<button type="button" class="pay-ibtn" data-planqr="${i}" aria-label="Ver QR"><i class="fa-solid fa-qrcode"></i></button>` : ""}
              <button type="button" class="pay-ibtn main" data-copy="${esc(m.account)}" aria-label="Copiar"><i class="fa-regular fa-copy"></i></button></div>`).join("")
            : `<p class="rounded-lg border border-line p-3 text-sm text-ink/60">Los medios de pago aún no están configurados. Escríbele a soporte.</p>`}</div>
          <p class="mt-2 text-xs text-ink/60">💬 En el mensaje de la transferencia escribe <b>${esc(A.biz?.name || "")}</b>.</p>
          <label class="pay-drop mt-3" for="planFile"><span class="pay-drop-ico"><i class="fa-solid fa-camera"></i></span>
            <span id="planLabel" class="min-w-0 flex-1 text-sm"><b>Sube el comprobante</b><br><span class="text-xs text-ink/60">Toca para elegir la captura del pago</span></span>
            <img id="planPrev" class="hidden h-12 w-12 rounded-md object-cover" alt=""></label>
          <input id="planFile" type="file" accept="image/*" class="hidden">
          <button id="planSend" class="btn-primary mt-2 w-full py-3">Enviar comprobante</button>
        </${pp.brebEnabled && pp.brebKey ? "details" : "section"}>` : ""}
      </div>`;
    el.querySelectorAll("[data-pm]").forEach((b) => b.onclick = () => { A.planMonths = Number(b.dataset.pm); draw(); });
    if ($("brebGo")) $("brebGo").onclick = async () => {
      const btn = $("brebGo"); setBusy(btn, true, "Generando tu pago…");
      try {
        const r = await api("createPlanOrder", { months: A.planMonths });
        if (r?.free) { toast(`🎉 ¡Listo! Tu plan quedó activo${r.paidUntil ? " hasta el " + fechaLarga(r.paidUntil) : ""} gracias a tus referidos.`); setBusy(btn, false); }
      } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
    };
    if ($("brebQr")) $("brebQr").onclick = () => viewImage(pp.brebQr, `Bre-B: ${pp.brebKey}`);
    if ($("brebOtherBtn")) {
      $("brebOtherBtn").onclick = () => $("brebOther").classList.toggle("hidden");
      $("brebOtherFile").onchange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        $("brebOtherPrev").src = URL.createObjectURL(f); $("brebOtherPrev").classList.remove("hidden");
        $("brebOtherLbl").innerHTML = `<b class="text-emerald-700">✓ Captura lista</b><br><span class="soft text-xs">Toca para cambiarla</span>`;
        A.otherProof = imgToDataUrl(f, 1280, "image/jpeg");
      };
      $("brebOtherSend").onclick = async () => {
        if (!A.otherProof) return toast("Primero adjunta la captura del pago.", "error");
        const btn = $("brebOtherSend"); setBusy(btn, true, "Enviando…");
        try {
          await api("submitPlanProof", { image: await A.otherProof, months: bl.pendingOrder?.months || 1, paidAmount: Number($("brebOtherAmt").value || 0), reference: "Pagó otro valor por Bre-B" });
          A.otherProof = null;
          toast("¡Recibido! Revisamos tu pago y te avisamos cuando se active tu plan.");
        } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
      };
    }
    if ($("brebCancel")) $("brebCancel").onclick = async () => {
      if (!(await uiConfirm("¿Cancelar este pago?", "Si ya transferiste, no lo canceles: tu plan se activa solo en unos minutos.", { okText: "Sí, cancelar", cancelText: "Volver", danger: true }))) return;
      try { await api("cancelPlanOrder", {}); toast("Pago cancelado. Puedes generar otro cuando quieras."); } catch (err) { toast(err.message, "error"); }
    };
    // reloj del pago: al terminar, vuelve a mostrar el botón para generar otro
    clearInterval(A.brebTimer);
    if ($("brebLeft") && bl.pendingOrder) A.brebTimer = setInterval(() => {
      const left = toMillis(bl.pendingOrder?.expiresAt) - Date.now(), el2 = $("brebLeft");
      if (!el2) return clearInterval(A.brebTimer);
      if (left <= 0) { clearInterval(A.brebTimer); return draw(); }
      el2.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
    }, 1000);
    el.querySelectorAll("[data-planqr]").forEach((b) => b.onclick = () => { const m = methods[Number(b.dataset.planqr)]; viewImage(m.qr, `${m.label}: ${m.account}`); });
    if ($("planFile")) $("planFile").onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      $("planPrev").src = URL.createObjectURL(f); $("planPrev").classList.remove("hidden");
      $("planLabel").innerHTML = `<b class="text-emerald-700">✓ Comprobante listo</b><br><span class="text-xs text-ink/60">Toca para cambiarlo</span>`;
      A.planProof = imgToDataUrl(f, 1280, "image/jpeg");
    };
    if ($("planSend")) $("planSend").onclick = async () => {
      if (!A.planProof) return toast("Primero sube la captura del pago.", "error");
      const btn = $("planSend"); setBusy(btn, true, "Enviando…");
      try { await api("submitPlanProof", { image: await A.planProof, months }); A.planProof = null; toast("¡Recibido! Te avisamos cuando lo aprobemos."); }
      catch (err) { toast(err.message, "error"); setBusy(btn, false); }
    };
  }
}

// =====================================================================
//  INICIO: en vivo, hoy en la silla, pendientes, estados y huecos libres
// =====================================================================
const H = { today: "", apts: [], locks: [], live: [], stories: [], unsubs: [] };
const STAGE_TXT = {
  visit: "está viendo tu página", register: "se está registrando", hours: "mira los horarios",
  service: "eligió hora y escoge el servicio", pay: "está pagando el abono", done: "acaba de reservar"
};
const myStaff = () => A.staff.filter((s) => s.active !== false && (isOwner() || s.id === A.me?.staffId));
function syncBottomNav() {
  const cur = document.body.classList.contains("show-more") ? "more" : A.tab;
  document.querySelectorAll("#spNav [data-go]").forEach((b) => b.setAttribute("aria-current", b.dataset.go === cur ? "page" : "false"));
}
$("spNav").addEventListener("click", (e) => {
  const b = e.target.closest("[data-go]"); if (!b) return;
  if (b.dataset.go === "more") {
    document.body.classList.add("show-more"); $("hdrSub").textContent = "Todas las secciones"; syncBottomNav();
    window.scrollTo({ top: 0, behavior: "smooth" }); return;
  }
  if (b.dataset.go === "clients" && !isOwner()) return toast("Solo el dueño ve los clientes.", "error");
  switchTab(b.dataset.go);
});
$("btnQuick").onclick = () => openQuick();
$("btnQuickSide").onclick = () => openQuick();

function startHome() {
  H.unsubs.forEach((f) => f()); H.unsubs = [];
  H.unsubs.push(onSnapshot(doc(db, "platform", "public"), (d) => { A.plat = d.data() || {}; renderTabs(); if (A.tab === "home") renderHome(); }, () => {}));
  H.today = bogNow().date;
  H.unsubs.push(onSnapshot(query(collection(db, bpath("appointments")), where("date", "==", H.today)), (q) => { H.apts = q.docs.map((d) => d.data()); renderHome(); }, onErr));
  H.unsubs.push(onSnapshot(query(collection(db, bpath("slotLocks")), where("date", "==", H.today)), (q) => { H.locks = q.docs.map((d) => d.data()); renderHome(); }, onErr));
  H.unsubs.push(onSnapshot(collection(db, bpath("stories")), (q) => { H.stories = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((x) => toMillis(x.expiresAt) > Date.now()).sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt)); renderHome(); if (A.tab === "marketing") renderMarketing(); }, () => {}));
  subscribeLive();
  if (isOwner()) loadActivity();
  A.unsubs.push(() => H.unsubs.forEach((f) => f()));
  clearInterval(H.timer);
  H.timer = setInterval(() => { if (bogNow().date !== H.today) startHome(); else renderHome(); }, 30000);
  renderHome();
}
function subscribeLive() {
  H.unsubLive?.();
  H.unsubLive = onSnapshot(query(collection(db, bpath("presence")), where("at", ">", Timestamp.fromMillis(Date.now() - 15 * 60000))), (q) => {
    H.live = q.docs.map((d) => ({ id: d.id, ...d.data() })); renderHome();
  }, () => {});
  H.unsubs.push(() => H.unsubLive?.());
  clearTimeout(H.liveT); H.liveT = setTimeout(subscribeLive, 10 * 60000);
}
const liveNow = () => H.live.filter((p) => p.stage !== "left" && Date.now() - toMillis(p.at) < 75000)
  .sort((a, b) => ["pay", "service", "hours", "register", "done", "visit"].indexOf(a.stage) - ["pay", "service", "hours", "register", "done", "visit"].indexOf(b.stage));
// horas libres del día para todo el equipo visible (o solo para mí)
function freeTimes(date, locks, minutes) {
  if (!A.settings) return [];
  return computeSlots({ settings: A.settings, staffList: myStaff(), locks, date, totalMinutes: minutes || Number(A.settings.slotDurationMinutes || 30), forAdmin: true });
}
const firstName = (a) => (a.customer?.firstName || "Cliente").split(/\s+/)[0];

function renderHome() {
  if (!A.me || !$("tab-home")) return;
  const el = $("tab-home");
  const live = liveNow();
  const visible = H.apts.filter((a) => ["confirmed", "pending_verification", "pending_payment", "attended"].includes(a.status) && (isOwner() || a.staffId === A.me.staffId));
  const free = freeTimes(H.today, H.locks);
  const nowMin = (() => { const n = bogNow(); return n.min; })();
  const freeLater = free.filter((f) => { const [h, m] = f.time.split(":").map(Number); return h * 60 + m > nowMin; });
  const pendingMine = A.pending.filter((a) => isOwner() || a.staffId === A.me.staffId);
  if (A.tab === "home") $("hdrSub").textContent = `Hoy tienes ${visible.length} cita${visible.length === 1 ? "" : "s"}${pendingMine.length ? ` y ${pendingMine.length} abono${pendingMine.length === 1 ? "" : "s"} por revisar` : ""}.`;

  // --- en vivo
  const liveHtml = `<div class="live-bar ${live.length ? "" : "off"}"><span class="live-dot" style="${live.length ? "" : "background:#9aa6b8;box-shadow:none;animation:none"}"></span>
      <b>${live.length ? `${live.length} persona${live.length === 1 ? "" : "s"} en tu página ahora` : "Nadie en tu página en este momento"}</b></div>
    ${live.length ? `<div class="sp-card mt-2 !py-1">${live.slice(0, 6).map((p) => {
      const ini = p.name ? p.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";
      const tone = p.stage === "pay" ? "t-due" : p.stage === "done" ? "t-ok" : p.name ? "t-trial" : "t-off";
      const ago = Math.max(0, Math.round((Date.now() - toMillis(p.at)) / 60000));
      return `<div class="who-row"><span class="who-av ${tone}">${esc(ini)}</span><span class="min-w-0 flex-1">${p.name ? `<b>${esc(p.name)}</b>` : "Alguien sin cuenta"} ${STAGE_TXT[p.stage] || "está en tu página"}</span><span class="soft text-xs">${ago ? ago + " min" : "ahora"}</span></div>`;
    }).join("")}</div>` : ""}`;

  // --- hoy en la silla
  const staffList = myStaff();
  let open = 24 * 60, close = 0;
  staffList.forEach((s) => staffHours(A.settings, s, H.today).forEach((h) => { const [oh, om] = h.open.split(":").map(Number), [ch, cm] = h.close.split(":").map(Number); open = Math.min(open, oh * 60 + om); close = Math.max(close, ch * 60 + cm); }));
  let chair = "";
  if (close > open) {
    const span = close - open, pos = (m) => ((m - open) / span) * 100;
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const lanes = staffList.map((s) => {
      const blocks = visible.filter((a) => a.staffId === s.id).map((a) => {
        const st = toMin(a.startTime), en = st + Number(a.occupiedMinutes || 30);
        const tone = a.status === "pending_verification" ? "t-due" : a.status === "pending_payment" ? "t-off" : "t-ok";
        return `<button class="chair-blk ${tone}" style="left:${pos(st)}%;width:${Math.max(4, pos(en) - pos(st))}%" data-hcode="${a.code}" title="${esc(firstName(a))} ${hora12(a.startTime)}">${esc(firstName(a))}</button>`;
      }).join("") + (H.showFree ? freeLater.filter((f) => f.staffIds.includes(s.id)).map((f) => {
        const st = toMin(f.time), en = st + Number(A.settings.slotDurationMinutes || 30);
        return `<button class="chair-free" style="left:${pos(st)}%;width:${Math.max(3, pos(en) - pos(st))}%" data-hfreeat="${f.time}" aria-label="Libre ${hora12(f.time)}" title="Libre ${hora12(f.time)}"></button>`;
      }).join("") : "");
      const now = nowMin >= open && nowMin <= close ? `<span class="chair-now" style="left:${pos(nowMin)}%"></span>` : "";
      return `<p class="mt-2 text-xs font-bold">${esc(s.name)}</p><div class="chair-lane">${blocks}${now}</div>`;
    }).join("");
    const marks = [open, open + span / 3, open + (2 * span) / 3, close].map((m) => `<span>${hora12(String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(Math.round(m % 60 / 15) * 15 % 60).padStart(2, "0")).replace(":00", "")}</span>`).join("");
    chair = `${lanes}<div class="soft mt-1.5 flex justify-between text-[10.5px]">${marks}</div>`;
  } else chair = `<p class="soft mt-2 text-sm">Hoy no hay horario de atención.</p>`;

  // --- pendientes
  const todo = [];
  pendingMine.slice(0, 4).forEach((a) => todo.push(`<div class="todo"><span class="ic t-due"><i class="fa-solid fa-receipt"></i></span>
    <p class="min-w-0 flex-1 text-[13.5px] leading-snug"><b>${esc(custName(a))}</b> subió el abono de ${cop(a.payment?.amountCOP || a.depositCOP)} para el ${fechaCorta(a.date)} a las ${hora12(a.startTime)}.</p>
    <button class="act" style="background:var(--sink);color:#fff" data-happrove="${a.code}">Aprobar</button></div>`));
  const next = visible.filter((a) => a.status === "confirmed").map((a) => ({ a, m: (() => { const [h, mm] = a.startTime.split(":").map(Number); return h * 60 + mm; })() }))
    .filter((x) => x.m >= nowMin && x.m - nowMin <= 120).sort((p, q) => p.m - q.m)[0];
  if (next) todo.push(`<div class="todo"><span class="ic t-trial"><i class="fa-regular fa-clock"></i></span>
    <p class="min-w-0 flex-1 text-[13.5px] leading-snug"><b>${esc(custName(next.a))}</b> llega a las ${hora12(next.a.startTime)}${staffList.length > 1 ? ` con ${esc(next.a.staffName)}` : ""}.</p>
    ${next.a.customer?.whatsapp ? `<a class="act t-ok" target="_blank" rel="noopener" href="${waLink(next.a.customer.whatsapp, `Hola ${firstName(next.a)}, te esperamos hoy a las ${hora12(next.a.startTime)} en ${A.settings?.businessName || A.biz?.name}. ¡Nos vemos!`)}">WhatsApp</a>` : ""}</div>`);
  if (freeLater.length) todo.push(`<div class="todo"><span class="ic t-late"><i class="fa-solid fa-fire"></i></span>
    <p class="min-w-0 flex-1 text-[13.5px] leading-snug">Quedan <b>${freeLater.length} cupo${freeLater.length === 1 ? "" : "s"}</b> libres hoy.</p>
    <button class="act t-late" data-hfree="open">Ver huecos</button></div>`);

  // --- estados
  const stories = isOwner() ? `<div class="sp-h"><h2>Tus estados</h2><span>los ven tus clientes por 24 h</span></div>
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button class="story-btn" data-hstory="new"><span class="story-add">${lockedNow("marketing") ? "🔒" : "+"}</span>Nuevo</button>
      ${H.stories.map((x) => `<button class="story-btn" data-hstory="${x.id}"><span class="story-ring"><span style="${storyBg(x)}">${x.img ? "" : esc((x.text || "").slice(0, 18))}</span></span><span class="w-full truncate text-center">${esc((x.text || "Estado").split("\n")[0].slice(0, 12))}</span></button>`).join("")}
    </div>` : "";

  // --- huecos
  const fill = isOwner() && freeLater.length ? `<div class="sp-card mt-4" style="background:linear-gradient(135deg,var(--sink),var(--sblue));color:#fff">
      <p class="disp text-lg font-extrabold">Llena tus huecos de hoy</p>
      <p class="mt-1 text-[13px] opacity-80">${freeLater.slice(0, 6).map((f) => hora12(f.time)).join(", ")}${freeLater.length > 6 ? "…" : ""}</p>
      <div class="mt-3 grid grid-cols-2 gap-2 text-[13px] font-bold">
        <button class="rounded-xl bg-white py-2.5" style="color:var(--sink)" data-hfill="story">${lockedNow("marketing") ? "🔒 " : ""}Publicar como estado</button>
        <button class="rounded-xl py-2.5" style="background:rgba(255,255,255,.16)" data-hgo="marketing">Más opciones</button>
      </div></div>` : "";

  const team = myStaff();
  const teamHtml = team.length ? `<div class="mt-3 flex gap-2 overflow-x-auto pb-1">${team.map((s2) => {
      const busy = isBusy(s2);
      return `<button class="team-chip" data-hstaff="${s2.id}"><span class="sdot" style="width:9px;height:9px;border-radius:50%;background:${busy ? "var(--sred)" : "var(--mint)"}"></span>
        <span class="text-left"><b>${esc(team.length === 1 && s2.id === A.me.staffId ? "Tú" : s2.name)}</b><br><span class="soft text-xs">${busy ? "En descanso hasta " + timeOf(s2.busyUntil) : "Disponible"}</span></span>
        <span class="ml-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${busy ? "t-ok" : "t-off"}">${busy ? "Ya volví" : "Descanso"}</span></button>`;
    }).join("")}</div>` : "";
  const rec = isOwner() ? buildRecs()[0] : null;
  const recHtml = rec ? `<div class="todo mt-3" style="border:1.5px solid #f3d27a"><span class="ic" style="background:#fff7e0;color:#a86e00"><i class="fa-solid fa-lightbulb"></i></span>
      <p class="min-w-0 flex-1 text-[13.5px] leading-snug">${rec.txt}</p>${rec.act ? `<button class="act" style="background:var(--sink);color:#fff" data-hrec="0">${rec.act}</button>` : ""}</div>` : "";
  const refOn = isOwner() && A.plat?.referral?.enabled !== false;
  const refHtml = refOn ? `<button class="todo mt-3 w-full text-left" data-hgo="referrals" style="background:linear-gradient(135deg,#14213D,#2B59C3);color:#fff">
      <span class="ic" style="background:rgba(255,255,255,.15);color:#ffd166"><i class="fa-solid fa-gift"></i></span>
      <span class="min-w-0 flex-1 text-[13.5px] leading-snug"><b>Invita y paga menos</b><br><span class="opacity-80">Gana ${refLevels()[0]}% de descuento cada mes que paguen tus invitados.</span></span>
      <span class="rounded-full px-2 py-0.5 text-[10px] font-extrabold" style="background:var(--sred)">Nuevo</span></button>` : "";
  el.innerHTML = `${liveHtml}${teamHtml}${recHtml}${refHtml}
    <div class="sp-card mt-3" id="chairCard"><div class="flex items-center justify-between gap-2"><h2 class="disp text-[18px] font-bold">Hoy en la silla</h2>
      ${freeLater.length ? `<button class="rounded-full px-3 py-1.5 text-xs font-bold ${H.showFree ? "" : "t-late"}" style="${H.showFree ? "background:var(--sink);color:#fff" : ""}" data-hfree="1" aria-expanded="${!!H.showFree}">${freeLater.length} hueco${freeLater.length === 1 ? "" : "s"} libre${freeLater.length === 1 ? "" : "s"} ${H.showFree ? "▴" : "▾"}</button>` : `<span class="soft text-xs">Sin huecos libres</span>`}</div>${chair}
      ${H.showFree && freeLater.length ? `<div class="q-pop mt-3 rounded-2xl p-3" style="background:var(--canvas)">
        <p class="mb-2 text-sm font-bold">Toca un hueco para agendar a alguien ahí</p>
        <div class="grid grid-cols-3 gap-2">${freeLater.map((f) => `<button class="q-slot" data-hfreeat="${f.time}">${hora12(f.time)}${myStaff().length > 1 ? `<span class="soft block text-[10px] font-semibold">${f.staffIds.length} libre${f.staffIds.length === 1 ? "" : "s"}</span>` : ""}</button>`).join("")}</div>
        ${isOwner() ? `<button class="mt-3 w-full rounded-xl py-2.5 text-sm font-bold t-late" data-hfill="story">${lockedNow("marketing") ? "🔒 " : ""}Publicar estos huecos como estado</button>` : ""}
      </div>` : ""}
      <div class="soft mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">${isOwner() ? `<button class="font-bold underline" style="color:var(--sblue)" data-gstep="slot">Turnos de ${Number(A.settings?.slotDurationMinutes || 30)} min, cambiar</button>` : ""}<span><span style="color:var(--mint)">●</span> confirmada</span><span><span style="color:var(--amber)">●</span> abono por revisar</span><span><span style="color:#8a94a8">●</span> esperando pago</span><span><span style="color:var(--sred)">|</span> ahora</span></div></div>
    <div class="sp-h"><h2>Para hoy</h2><span>${todo.length ? todo.length + " pendiente" + (todo.length === 1 ? "" : "s") : ""}</span></div>
    ${todo.join("") || `<div class="todo"><span class="ic t-ok"><i class="fa-solid fa-check"></i></span><p class="flex-1 text-[13.5px]">Todo al día. Usa <b>Cita rápida</b> para agendar a quien llame o llegue.</p></div>`}
    ${stories}${fill}`;
  if (isOwner()) el.insertAdjacentHTML("afterbegin", guideCard());
}
function storyBg(x) { return x.img ? `background-image:url('${x.img}')` : `background:${x.bg || "#14213D"}`; }
$("tab-home").addEventListener("click", async (e) => {
  const ap = e.target.closest("[data-happrove]");
  if (ap) {
    const a = A.pending.find((x) => x.code === ap.dataset.happrove); if (!a) return;
    if (a.payment?.proofUrl && !(await uiConfirm("¿Aprobar el abono?", `${custName(a)} subió ${cop(a.payment?.amountCOP || a.depositCOP)}. Revisa el comprobante si aún no lo viste.`, { okText: "Aprobar", cancelText: "Ver comprobante" }))) { window.open(a.payment.proofUrl, "_blank"); return; }
    setBusy(ap, true, "…");
    try { await api("reviewPayment", { code: a.code, approve: true }); toast("Abono aprobado. La cita quedó confirmada."); } catch (err) { toast(err.message, "error"); setBusy(ap, false); }
    return;
  }
  const go = e.target.closest("[data-hgo]"); if (go) return switchTab(go.dataset.hgo);
  const fr = e.target.closest("[data-hfree]");
  if (fr) { H.showFree = fr.dataset.hfree === "open" ? true : !H.showFree; renderHome(); if (H.showFree) $("chairCard")?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
  const fa = e.target.closest("[data-hfreeat]"); if (fa) return openQuick({ date: H.today, time: fa.dataset.hfreeat });
  const hs = e.target.closest("[data-hstaff]"); if (hs) return toggleStaffStatus(A.staff.find((x) => x.id === hs.dataset.hstaff));
  const hr = e.target.closest("[data-hrec]"); if (hr) return buildRecs()[Number(hr.dataset.hrec)]?.fn?.();
  const blk = e.target.closest("[data-hcode]"); if (blk) { setAgendaDate(H.today); return switchTab("agenda"); }
  const st = e.target.closest("[data-hstory]"); if (st) return st.dataset.hstory === "new" ? newStory() : manageStory(st.dataset.hstory);
  const fl = e.target.closest("[data-hfill]"); if (fl) return fillAsStory(H.today);
});

// =====================================================================
//  CITA RÁPIDA: horas libres primero, luego WhatsApp, servicio y listo
// =====================================================================
const Q = {};
function openQuick(preset = {}) {
  const mains = A.services.filter((s) => s.active !== false && s.type !== "addon");
  if (!mains.length) return toast("Primero crea tus servicios.", "error");
  Object.assign(Q, { date: preset.date || bogNow().date, time: preset.time || null, staffId: null, mainId: mains[0].id, extras: new Set(), known: null, locks: [], phone: "" });
  openM("Cita rápida", `
    <p class="soft -mt-3 mb-3 text-sm">Para quien llamó o llegó sin cuenta. Toca una hora.</p>
    <div id="qDays" class="mb-3 flex gap-2 overflow-x-auto pb-1"></div>
    <div class="mb-2 flex items-baseline justify-between"><p id="qSlotsTitle" class="text-sm font-bold"></p><p id="qService" class="soft truncate pl-2 text-xs"></p></div>
    <div id="qSlots" class="grid grid-cols-3 gap-2"></div>
    <div id="qAfter" class="mt-4 hidden border-t border-line pt-4">
      <label class="field"><span>WhatsApp del cliente</span>
        <div class="flex items-center gap-2 rounded-xl border border-line bg-white px-3"><span class="soft text-sm">🇨🇴 +57</span><input id="qPhone" type="tel" inputmode="numeric" autocomplete="off" placeholder="300 123 4567" class="w-full border-0 py-3 text-[16px] outline-none"></div></label>
      <p id="qKnown" class="mt-1.5 min-h-[18px] text-xs font-semibold"></p>
      <label id="qNameWrap" class="field mt-1 hidden"><span>Nombre (opcional)</span><input id="qName" maxlength="40" placeholder="Para saludarlo por su nombre"></label>
      <p class="mb-1.5 mt-3 text-sm font-bold">Servicio</p><div id="qMains" class="flex flex-wrap gap-2"></div>
      <div id="qExtrasWrap"><p class="mb-1.5 mt-3 text-sm font-bold">Agregar</p><div id="qExtras" class="flex flex-wrap gap-2"></div></div>
      <div id="qStaffWrap" class="hidden"><p class="mb-1.5 mt-3 text-sm font-bold">Con quién</p><div id="qStaff" class="flex flex-wrap gap-2"></div></div>
      <button id="qSave" class="btn-primary mt-4 w-full py-3.5 text-base" disabled>Agendar y enviar por WhatsApp</button>
    </div>`);
  renderQDays(); renderQMains(); loadQLocks();
  $("qDays").onclick = (e) => { const b = e.target.closest("[data-qd]"); if (!b) return; Q.date = b.dataset.qd; Q.time = null; renderQDays(); loadQLocks(); };
  $("qSlots").onclick = (e) => {
    const b = e.target.closest("[data-qt]"); if (b) { Q.time = b.dataset.qt; renderQSlots(); $("qAfter").classList.remove("hidden"); $("qAfter").classList.add("q-pop"); setTimeout(() => $("qPhone").focus(), 60); return; }
    const n = e.target.closest("[data-qnext]"); if (n) { Q.date = n.dataset.qnext; Q.time = null; renderQDays(); loadQLocks(); }
  };
  $("qPhone").oninput = (e) => { e.target.value = e.target.value.replace(/[^\d ]/g, ""); lookupPhone(); updQSave(); };
  $("qMains").onclick = (e) => { const b = e.target.closest("[data-qm]"); if (!b) return; Q.mainId = b.dataset.qm; Q.extras.delete(Q.mainId); renderQMains(); renderQSlots(); };
  $("qExtras").onclick = (e) => { const b = e.target.closest("[data-qx]"); if (!b) return; const id = b.dataset.qx; Q.extras.has(id) ? Q.extras.delete(id) : Q.extras.add(id); renderQMains(); renderQSlots(); };
  $("qStaff").onclick = (e) => { const b = e.target.closest("[data-qs]"); if (!b) return; Q.staffId = b.dataset.qs; renderQStaff(); };
  $("qSave").onclick = saveQuick;
}
function renderQDays() {
  const today = bogNow().date;
  $("qDays").innerHTML = Array.from({ length: 8 }, (_, i) => addDays(today, i)).map((d, i) => {
    const [y, m, dd] = d.split("-").map(Number), dt = new Date(Date.UTC(y, m - 1, dd));
    const top = i === 0 ? "Hoy" : i === 1 ? "Mañana" : dt.toLocaleDateString("es-CO", { timeZone: "UTC", weekday: "short" }).replace(".", "");
    return `<button class="q-day" data-qd="${d}" aria-pressed="${d === Q.date}"><small>${top}</small><b>${dd}</b></button>`;
  }).join("");
}
function loadQLocks() {
  Q.unsub?.();
  $("qSlots").innerHTML = `<p class="soft col-span-3 text-sm">Buscando horas libres…</p>`;
  const date = Q.date;
  Q.unsub = onSnapshot(query(collection(db, bpath("slotLocks")), where("date", "==", date)), (q) => { if (Q.date !== date) return; Q.locks = q.docs.map((d) => d.data()); renderQSlots(); }, onErr);
}
const qMinutes = () => { const by = Object.fromEntries(A.services.map((s) => [s.id, s])); return [Q.mainId, ...Q.extras].reduce((t, id) => t + Number(by[id]?.minutes || 0), 0); };
function qSlotsFor(date, locks) {
  return computeSlots({ settings: A.settings, staffList: myStaff(), locks, date, totalMinutes: qMinutes(), mainId: Q.mainId, forAdmin: true });
}
function renderQSlots() {
  if (!$("qSlots")) return;
  const slots = qSlotsFor(Q.date, Q.locks);
  const svc = A.services.find((s) => s.id === Q.mainId);
  $("qService").textContent = svc ? `${svc.name}, ${qMinutes()} min` : "";
  const isToday = Q.date === bogNow().date;
  $("qSlotsTitle").textContent = slots.length ? `${slots.length} hora${slots.length === 1 ? "" : "s"} libre${slots.length === 1 ? "" : "s"} ${isToday ? "hoy" : "este día"}` : "Sin horas libres";
  const cur = slots.find((s) => s.time === Q.time);
  if (Q.time && !cur) { Q.time = null; $("qAfter").classList.add("hidden"); }
  if (cur && !cur.staffIds.includes(Q.staffId)) Q.staffId = cur.staffIds[0];
  if (cur && $("qAfter").classList.contains("hidden")) { $("qAfter").classList.remove("hidden"); $("qAfter").classList.add("q-pop"); }
  $("qSlots").innerHTML = slots.map((s) => `<button class="q-slot" data-qt="${s.time}" aria-pressed="${s.time === Q.time}">${hora12(s.time)}</button>`).join("")
    || `<div class="col-span-3 rounded-xl bg-paper p-3 text-sm">No quedan horas para este servicio ${isToday ? "hoy" : "ese día"}. <button class="font-bold underline" data-qnext="${addDays(Q.date, 1)}">Ver el día siguiente</button></div>`;
  renderQStaff(); updQSave();
}
function renderQMains() {
  const mains = A.services.filter((s) => s.active !== false && s.type !== "addon");
  $("qMains").innerHTML = mains.map((s) => `<button class="q-chip" data-qm="${s.id}" aria-pressed="${s.id === Q.mainId}">${esc(s.name)} <span class="opacity-60">${cop(s.priceCOP)}</span></button>`).join("");
  const ex = A.services.filter((s) => s.active !== false && s.type !== "base" && s.id !== Q.mainId);
  $("qExtrasWrap").classList.toggle("hidden", !ex.length);
  $("qExtras").innerHTML = ex.map((s) => `<button class="q-chip" data-qx="${s.id}" aria-pressed="${Q.extras.has(s.id)}">+ ${esc(s.name)}</button>`).join("");
}
function renderQStaff() {
  const cur = qSlotsFor(Q.date, Q.locks).find((s) => s.time === Q.time);
  const ids = cur?.staffIds || [];
  $("qStaffWrap").classList.toggle("hidden", ids.length < 2);
  $("qStaff").innerHTML = ids.map((id) => `<button class="q-chip" data-qs="${id}" aria-pressed="${id === Q.staffId}">${esc(A.staff.find((s) => s.id === id)?.name || id)}</button>`).join("");
}
let qLookT = null;
function lookupPhone() {
  clearTimeout(qLookT);
  const phone = normalizePhone($("qPhone").value);
  Q.known = null; Q.phone = phone || "";
  if (!phone) { $("qKnown").textContent = ""; $("qNameWrap").classList.add("hidden"); return; }
  $("qKnown").innerHTML = `<span class="soft">Buscando…</span>`;
  qLookT = setTimeout(async () => {
    try {
      const snap = await getDocs(query(collection(db, bpath("appointments")), where("customer.whatsapp", "==", phone)));
      if (normalizePhone($("qPhone").value) !== phone) return;
      const list = snap.docs.map((d) => d.data()).sort((a, b) => toMillis(b.startAt) - toMillis(a.startAt));
      if (list.length) {
        Q.known = list[0].customer;
        const visits = list.filter((a) => a.status === "attended").length;
        const blocked = list.filter((a) => a.status === "no_show").length;
        $("qKnown").innerHTML = `<span style="color:var(--mint)">✓ ${esc(`${Q.known.firstName} ${Q.known.lastName || ""}`.trim())}</span><span class="soft">${visits ? `, ha venido ${visits} ${visits === 1 ? "vez" : "veces"}` : ", ya tenía reservas"}${blocked ? `, ${blocked} falta${blocked === 1 ? "" : "s"}` : ""}</span>`;
        $("qNameWrap").classList.add("hidden");
      } else { $("qKnown").innerHTML = `<span class="soft">Cliente nuevo.</span>`; $("qNameWrap").classList.remove("hidden"); }
    } catch { $("qKnown").textContent = ""; $("qNameWrap").classList.remove("hidden"); }
  }, 350);
}
function updQSave() { if ($("qSave")) $("qSave").disabled = !(Q.time && normalizePhone($("qPhone")?.value)); }
async function saveQuick() {
  const btn = $("qSave"), phone = normalizePhone($("qPhone").value);
  if (!Q.time || !phone) return;
  const staffId = Q.staffId || qSlotsFor(Q.date, Q.locks).find((s) => s.time === Q.time)?.staffIds[0];
  const name = ($("qName").value || "").trim().split(/\s+/);
  const customer = Q.known ? { firstName: Q.known.firstName, lastName: Q.known.lastName || "", whatsapp: phone, email: Q.known.email || "" }
    : { firstName: name[0] || "", lastName: name.slice(1).join(" "), whatsapp: phone, email: "" };
  // la ventana de WhatsApp se abre ya para que el navegador no la bloquee
  const win = window.open("about:blank", "_blank");
  setBusy(btn, true, "Agendando…");
  try {
    const r = await api("createManualAppointment", { mainId: Q.mainId, extraIds: [...Q.extras], staffId, date: Q.date, time: Q.time, customer, paymentMethod: "local", depositPaidCOP: 0 });
    const apt = r.appointment;
    const link = waLink(apt.customer.whatsapp, fillTemplate(A.settings.waConfirmTemplate || DEFAULT_WA_CONFIRM, apt, A.settings));
    if (win) win.location.href = link;
    Q.unsub?.();
    openM("¡Cita agendada!", `
      <div class="q-pop text-center"><p class="text-5xl">✅</p>
        <p class="disp mt-2 text-2xl font-extrabold">${esc(apt.customer.firstName)}, ${hora12(apt.startTime)}</p>
        <p class="soft mt-1 text-sm capitalize">${fechaLarga(apt.date)} con ${esc(apt.staffName)}</p>
        <p class="ticket-code mx-auto my-4 w-fit">${esc(apt.code)}</p>
        <a class="btn-primary block w-full py-3" target="_blank" rel="noopener" href="${link}">Enviar confirmación por WhatsApp</a>
        <button class="btn-light mt-2 w-full" id="qAgain">Agendar otra</button></div>`);
    $("qAgain").onclick = () => openQuick();
  } catch (err) { win?.close(); toast(err.message, "error"); setBusy(btn, false); }
}

// =====================================================================
//  ESTADOS de 24 horas
// =====================================================================
const STORY_BGS = ["#14213D", "#2B59C3", "#D7263D", "#1E9E63", "#7C3AED", "#C77700"];
function newStory(preset = {}) {
  if (lockedNow("marketing")) return switchTab("marketing");
  const S2 = { img: "", bg: preset.bg || STORY_BGS[0], text: preset.text || "" };
  openM("Nuevo estado", `
    <div id="stPrev" class="relative mx-auto mb-3 grid aspect-[9/14] w-full max-w-[220px] place-items-center overflow-hidden rounded-2xl bg-cover bg-center p-4 text-center text-lg font-extrabold leading-tight text-white" style="text-shadow:0 2px 10px rgba(0,0,0,.45)"></div>
    <div class="mb-3 flex flex-wrap items-center gap-2">
      <label class="btn-light cursor-pointer text-sm"><i class="fa-regular fa-image"></i> Foto<input id="stFile" type="file" accept="image/*" class="hidden"></label>
      ${STORY_BGS.map((c) => `<button type="button" class="h-8 w-8 rounded-full border-2 border-white" style="background:${c};box-shadow:0 0 0 1px #DDE3EA" data-stbg="${c}" aria-label="Fondo"></button>`).join("")}
    </div>
    <label class="field mb-3"><span>Texto</span><textarea id="stText" rows="3" maxlength="140" placeholder="Ej. Nuevo corte disponible 🔥">${esc(S2.text)}</textarea></label>
    <button id="stSave" class="btn-primary w-full py-3">Publicar por 24 horas</button>`);
  const draw = () => { const p = $("stPrev"); p.style.background = S2.img ? `center/cover url('${S2.img}')` : S2.bg; p.textContent = $("stText").value || (S2.img ? "" : "Tu texto aquí"); };
  draw();
  $("stText").oninput = draw;
  $("modalBody").querySelectorAll("[data-stbg]").forEach((b) => b.onclick = () => { S2.bg = b.dataset.stbg; S2.img = ""; draw(); });
  $("stFile").onchange = async (e) => { const f = e.target.files[0]; if (!f) return; S2.img = await imgToDataUrl(f, 900, "image/jpeg"); draw(); };
  $("stSave").onclick = async () => {
    const text = $("stText").value.trim();
    if (!text && !S2.img) return toast("Agrega una foto o un texto.", "error");
    const btn = $("stSave"); setBusy(btn, true, "Publicando…");
    try {
      await addDoc(collection(db, bpath("stories")), { img: S2.img, bg: S2.bg, text, createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 86400000) });
      closeM(); toast("Estado publicado. Tus clientes lo ven arriba en tu página.");
    } catch (err) { toast("No se pudo publicar: " + err.message, "error"); setBusy(btn, false); }
  };
}
function manageStory(id) {
  const x = H.stories.find((s) => s.id === id); if (!x) return;
  const left = Math.max(0, Math.round((toMillis(x.expiresAt) - Date.now()) / 3600000));
  openM("Estado", `<div class="mx-auto mb-3 grid aspect-[9/14] w-full max-w-[220px] place-items-center overflow-hidden rounded-2xl p-4 text-center text-lg font-extrabold leading-tight text-white" style="${x.img ? `background:center/cover url('${x.img}')` : `background:${x.bg}`};text-shadow:0 2px 10px rgba(0,0,0,.45)">${esc(x.text || "")}</div>
    <p class="soft mb-3 text-center text-sm">Se quita sola en ${left} hora${left === 1 ? "" : "s"}.</p>
    <button id="stDel" class="w-full rounded-xl border border-rose-300 py-2.5 text-sm font-semibold text-rose-800">Quitar ahora</button>`);
  $("stDel").onclick = async () => { try { await deleteDoc(doc(db, bpath("stories", id))); closeM(); toast("Estado quitado."); } catch (err) { toast(err.message, "error"); } };
}
function fillAsStory(date) {
  const free = freeTimes(date, date === H.today ? H.locks : []).filter((f) => date !== H.today || (() => { const [h, m] = f.time.split(":").map(Number); return h * 60 + m > bogNow().min; })());
  const when = date === H.today ? "hoy" : "mañana";
  newStory({ bg: "#D7263D", text: `🔥 Cupos libres ${when}\n${free.slice(0, 6).map((f) => hora12(f.time)).join(" · ")}\nAparta el tuyo aquí` });
}

// =====================================================================
//  MARKETING: llenar huecos, estados, aviso en la página, clientes que no vuelven
// =====================================================================
const MK = { day: "today", lost: null, tLocks: [] };
function renderMarketing() {
  if (lockedNow("marketing")) return lockCard("marketing");
  const el = $("tab-marketing");
  const tomorrow = addDays(H.today, 1);
  const date = MK.day === "today" ? H.today : tomorrow;
  const locks = MK.day === "today" ? H.locks : MK.tLocks;
  const free = freeTimes(date, locks).filter((f) => MK.day !== "today" || (() => { const [h, m] = f.time.split(":").map(Number); return h * 60 + m > bogNow().min; })());
  const promo = A.settings?.promo || {};
  const promoOn = promo.text && promo.until >= H.today;
  const msg = `🔥 ¡Quedan cupos ${MK.day === "today" ? "hoy" : "mañana"} en ${A.settings?.businessName || A.biz?.name}!\n${free.slice(0, 8).map((f) => hora12(f.time)).join(" · ")}\nAparta el tuyo aquí 👉 ${$("linkUrl").textContent}`;
  el.innerHTML = `
    <div class="sp-card" style="background:linear-gradient(135deg,var(--sink),var(--sblue));color:#fff">
      <div class="flex items-center justify-between gap-2"><p class="disp text-xl font-extrabold">Llena tus huecos</p>
        <div class="flex rounded-full bg-white/15 p-1 text-xs font-bold">${[["today", "Hoy"], ["tomorrow", "Mañana"]].map(([k, t]) => `<button class="rounded-full px-3 py-1 ${MK.day === k ? "bg-white" : ""}" style="${MK.day === k ? "color:var(--sink)" : ""}" data-mkday="${k}">${t}</button>`).join("")}</div></div>
      <p class="mt-2 text-sm opacity-85">${free.length ? `${free.length} hora${free.length === 1 ? "" : "s"} libre${free.length === 1 ? "" : "s"}: ${free.slice(0, 8).map((f) => hora12(f.time)).join(", ")}${free.length > 8 ? "…" : ""}` : "No quedan horas libres. ¡Agenda llena!"}</p>
      ${free.length ? `<div class="mt-3 grid grid-cols-2 gap-2 text-[13px] font-bold">
        <button class="rounded-xl bg-white py-2.5" style="color:var(--sink)" data-mk="story">Publicar como estado</button>
        <a class="rounded-xl py-2.5 text-center" style="background:rgba(255,255,255,.16)" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}">Enviar por WhatsApp</a>
        <button class="rounded-xl py-2.5" style="background:rgba(255,255,255,.16)" data-mk="image">Imagen con QR</button>
        <button class="rounded-xl py-2.5" style="background:rgba(255,255,255,.16)" data-mk="tg">Avisar por Telegram</button>
      </div>` : ""}
    </div>

    <div class="sp-h"><h2>Estados en tu página</h2><span>${H.stories.length} activo${H.stories.length === 1 ? "" : "s"}</span></div>
    <div class="sp-card"><div class="flex gap-2 overflow-x-auto pb-1">
      <button class="story-btn" data-hstory="new"><span class="story-add">+</span>Nuevo</button>
      ${H.stories.map((x) => `<button class="story-btn" data-hstory="${x.id}"><span class="story-ring"><span style="${storyBg(x)}">${x.img ? "" : esc((x.text || "").slice(0, 18))}</span></span><span class="w-full truncate text-center">${esc((x.text || "Estado").split("\n")[0].slice(0, 12))}</span></button>`).join("")}
    </div><p class="soft mt-2 text-xs">Aparecen como círculos arriba en tu página, igual que los estados de WhatsApp. Duran 24 horas.</p></div>

    <div class="sp-h"><h2>Aviso destacado</h2><span>${promoOn ? "visible hasta el " + fechaCorta(promo.until) : "apagado"}</span></div>
    <div class="sp-card">
      <p class="soft mb-2 text-sm">Una franja de color arriba de tu página. Ideal para promociones o novedades.</p>
      <input id="mkPromo" maxlength="90" value="${esc(promo.text || "")}" placeholder="Ej. 20% en cortes de lunes a miércoles" class="w-full rounded-xl border border-line px-3 py-2.5">
      <div class="mt-2 flex flex-wrap items-center gap-2"><label class="soft text-sm">Hasta <input id="mkPromoUntil" type="date" min="${H.today}" value="${promo.until || addDays(H.today, 7)}" class="rounded-lg border border-line px-2 py-1.5"></label>
        <button class="btn-primary text-sm" data-mk="promo">Mostrar en mi página</button>${promoOn ? `<button class="btn-light text-sm" data-mk="promoOff">Quitar</button>` : ""}</div>
    </div>

    <div class="sp-h"><h2>Clientes que no vuelven</h2><span>más de 30 días sin venir</span></div>
    <div id="mkLost" class="sp-card"><p class="soft text-sm">Buscando…</p></div>

    <div class="sp-h"><h2>Tu enlace</h2><span>compártelo en todas partes</span></div>
    <div class="sp-card"><p class="mb-2 truncate rounded-lg bg-paper px-2.5 py-2 font-mono text-xs">${esc($("linkUrl").textContent)}</p>
      <div class="grid grid-cols-5 gap-1.5 text-center text-[10px] font-semibold text-ink/70">
        <button class="link-act" data-link="copy"><i class="fa-regular fa-copy"></i>Copiar</button><button class="link-act" data-link="share"><i class="fa-solid fa-share-nodes"></i>Compartir</button>
        <button class="link-act" data-link="wa"><i class="fa-brands fa-whatsapp"></i>WhatsApp</button><button class="link-act" data-link="qr"><i class="fa-solid fa-qrcode"></i>QR</button>
        <a class="link-act" target="_blank" rel="noopener" href="${$("linkOpen").href}"><i class="fa-regular fa-eye"></i>Ver</a></div></div>`;
  loadLost();
}
$("tab-marketing").addEventListener("click", async (e) => {
  const d = e.target.closest("[data-mkday]");
  if (d) {
    MK.day = d.dataset.mkday;
    if (MK.day === "tomorrow") { MK.tUnsub?.(); MK.tUnsub = onSnapshot(query(collection(db, bpath("slotLocks")), where("date", "==", addDays(H.today, 1))), (q) => { MK.tLocks = q.docs.map((x) => x.data()); renderMarketing(); }, onErr); }
    return renderMarketing();
  }
  const st = e.target.closest("[data-hstory]"); if (st) return st.dataset.hstory === "new" ? newStory() : manageStory(st.dataset.hstory);
  const b = e.target.closest("[data-mk]"); if (!b) return;
  const date = MK.day === "today" ? H.today : addDays(H.today, 1);
  if (b.dataset.mk === "story") return fillAsStory(date);
  if (b.dataset.mk === "image") return switchTab("images");
  if (b.dataset.mk === "tg") {
    const free = freeTimes(date, MK.day === "today" ? H.locks : MK.tLocks);
    const text = `Quedan cupos ${MK.day === "today" ? "hoy" : "mañana"}: ${free.slice(0, 8).map((f) => hora12(f.time)).join(", ")}. Aparta el tuyo: ${$("linkUrl").textContent}`;
    if (!(await uiConfirm("¿Avisar a tus clientes?", `Les llega por Telegram a quienes lo conectaron: “${text}”`, { okText: "Enviar" }))) return;
    setBusy(b, true, "Enviando…");
    try { const r = await api("broadcastNews", { text }); toast(`Aviso enviado${r?.sent !== undefined ? " a " + r.sent + " cliente(s)" : ""}.`); } catch (err) { toast(err.message, "error"); } finally { setBusy(b, false); }
  }
  if (b.dataset.mk === "promo") {
    const text = $("mkPromo").value.trim(), until = $("mkPromoUntil").value;
    if (!text) return toast("Escribe el aviso.", "error");
    try { await updateDoc(doc(db, bpath("settings", "general")), { promo: { text, until } }); toast("Aviso visible en tu página."); } catch (err) { toast(err.message, "error"); }
  }
  if (b.dataset.mk === "promoOff") { try { await updateDoc(doc(db, bpath("settings", "general")), { promo: { text: "", until: "" } }); toast("Aviso quitado."); } catch (err) { toast(err.message, "error"); } }
});
async function loadLost() {
  const box = $("mkLost"); if (!box) return;
  try {
    if (!MK.lost || Date.now() - MK.lostAt > 10 * 60000) {
      const from = addDays(H.today, -180);
      const snap = await getDocs(query(collection(db, bpath("appointments")), where("date", ">=", from)));
      const by = {};
      snap.docs.map((d) => d.data()).forEach((a) => {
        const ph = a.customer?.whatsapp; if (!ph || !["attended", "confirmed"].includes(a.status)) return;
        const c = by[ph] || (by[ph] = { name: `${a.customer.firstName} ${a.customer.lastName || ""}`.trim(), phone: ph, last: "", future: false, visits: 0 });
        if (a.date >= H.today) c.future = true; else { c.visits++; if (a.date > c.last) c.last = a.date; }
      });
      MK.lost = Object.values(by).filter((c) => !c.future && c.last && c.last <= addDays(H.today, -30)).sort((a, b) => b.visits - a.visits || b.last.localeCompare(a.last));
      MK.lostAt = Date.now();
    }
    if (!$("mkLost")) return;
    const name = A.settings?.businessName || A.biz?.name || "";
    $("mkLost").innerHTML = MK.lost.length ? MK.lost.slice(0, 15).map((c) => {
      const days = Math.round((Date.parse(H.today) - Date.parse(c.last)) / 86400000);
      const txt = `Hola ${c.name.split(" ")[0]}, ¡te extrañamos en ${name}! 💈 Hace ${days} días no te vemos. Aparta tu cita aquí: ${$("linkUrl").textContent}`;
      return `<div class="who-row"><span class="who-av t-trial">${esc(c.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase())}</span>
        <span class="min-w-0 flex-1"><b>${esc(c.name)}</b><br><span class="soft text-xs">Hace ${days} días, ${c.visits} visita${c.visits === 1 ? "" : "s"}</span></span>
        <a class="act t-ok rounded-full px-3 py-2 text-xs font-bold" target="_blank" rel="noopener" href="${waLink(c.phone, txt)}">Invitar</a></div>`;
    }).join("") : `<p class="soft text-sm">Todos tus clientes han vuelto en el último mes. 👏</p>`;
  } catch (err) { box.innerHTML = `<p class="soft text-sm">No se pudo calcular: ${esc(err.message)}</p>`; }
}

// =====================================================================
//  GUÍA DE CONFIGURACIÓN: paso a paso para dejar la tienda lista
// =====================================================================
const guideDone = () => A.settings?.guideDone || [];
function guideSteps() {
  const s = A.settings || {};
  const hasHours = Object.values(s.businessHours || {}).some((d) => (d || []).length);
  return [
    { id: "biz", ic: "fa-store", t: "Datos de tu negocio", d: "Nombre, WhatsApp, dirección y ciudad. Así te encuentran y te escriben tus clientes.",
      ok: !!(s.businessName && s.whatsapp && s.address), tab: "settings", focus: "stName",
      tip: "Escribe el nombre, el WhatsApp y la dirección. Al final de la página toca Guardar." },
    { id: "hours", ic: "fa-clock", t: "Horario de atención", d: "Los días y horas en que abres. Si cierras a almorzar, usa el segundo turno.",
      ok: hasHours && guideDone().includes("hours"), tab: "settings", focus: "[data-dow]", manual: true,
      tip: "Marca los días que abres y pon apertura y cierre. Al final toca Guardar." },
    { id: "slot", ic: "fa-stopwatch", t: "Duración de cada turno", d: `Cada cuánto se abre un cupo en tu agenda (ahora: ${Number(s.slotDurationMinutes || 30)} minutos). Elige el tiempo de tu servicio más común.`,
      ok: guideDone().includes("slot"), tab: "settings", focus: "stSlot", manual: true,
      tip: "En “Duración de cada cupo” elige 15, 30, 45 o 60 minutos (o Personalizado). Baja y toca Guardar." },
    { id: "services", ic: "fa-scissors", t: "Servicios y precios", d: "Revisa los servicios de ejemplo: cambia precios y duración, y oculta los que no haces.",
      ok: guideDone().includes("services"), tab: "services", manual: true,
      tip: "Toca Editar en cada servicio para poner tu precio y duración." },
    { id: "geo", ic: "fa-location-dot", t: "Ubicación para Waze", d: "Guardamos el punto exacto de tu local para que tus clientes lleguen con Waze o Google Maps.",
      ok: !!s.geo, guide: "geo" },
    { id: "pay", ic: "fa-qrcode", t: "Cómo te pagan el abono", d: "Tu Nequi, Daviplata o llave Bre-B con su QR, y cuánto cobras para apartar el cupo.",
      ok: (s.paymentMethods || []).length > 0, tab: "settings", focus: "pmList",
      tip: "Toca “Agregar medio de pago”, escribe tu número o llave y sube el QR. Revisa el valor del abono arriba y toca Guardar." },
    { id: "telegram", ic: "fa-paper-plane", t: "Avisos en tu Telegram", d: "Te llegan las reservas, los comprobantes con botón para aprobar y los recordatorios.",
      ok: !!A.tg?.owner, guide: "telegram" },
    { id: "team", ic: "fa-users", t: "Tu equipo y sus horarios", d: "Agrega a cada barbero, su horario propio y sus días libres. Si trabajas solo, revisa el tuyo.",
      ok: guideDone().includes("team"), tab: "staff", manual: true,
      tip: "En Disponibilidad toca Editar horario. Para agregar personas usa “Agregar al equipo”." },
    { id: "brand", ic: "fa-palette", t: "Tu logo y colores", d: "Que tu página se vea como tu negocio.", optional: true,
      ok: !!s.appearance?.logo, tab: "appearance", tip: "Sube tu logo, elige un tema o tus colores y toca Guardar apariencia." },
    { id: "share", ic: "fa-share-nodes", t: "Comparte tu enlace", d: "Ponlo en tu estado de WhatsApp, en Instagram y en tu perfil de Google.",
      ok: guideDone().includes("share"), guide: "share" }
  ];
}
function guideProgress() { const st = guideSteps().filter((x) => !x.optional); return { done: st.filter((x) => x.ok).length, total: st.length, next: guideSteps().find((x) => !x.ok && !x.optional) }; }
function guideCard() {
  if (!A.settings) return "";
  const g = guideProgress();
  if (!g.next) return "";
  const pct = Math.round((g.done / g.total) * 100);
  return `<div class="sp-card mb-3" style="border:2px solid var(--sblue)">
    <div class="flex items-center justify-between gap-2"><p class="disp text-[18px] font-extrabold">Deja tu agenda lista</p><span class="soft text-xs">${g.done} de ${g.total}</span></div>
    <div class="mt-2 h-2 overflow-hidden rounded-full" style="background:var(--hair)"><div class="h-full rounded-full" style="width:${pct}%;background:var(--sblue)"></div></div>
    <div class="mt-3 flex items-center gap-3"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl t-trial"><i class="fa-solid ${g.next.ic}"></i></span>
      <div class="min-w-0 flex-1"><p class="text-[14px] font-bold">Sigue: ${esc(g.next.t)}</p><p class="soft text-xs leading-snug">${esc(g.next.d)}</p></div></div>
    <div class="mt-3 grid grid-cols-2 gap-2"><button class="btn-primary text-sm" data-gstep="${g.next.id}">Hacerlo ahora</button><button class="btn-light text-sm" data-gopen="1">Ver todos los pasos</button></div></div>`;
}
function openGuide() {
  const steps = guideSteps(), g = guideProgress();
  openM(g.done === 0 ? "Tus primeros pasos" : "Guía de configuración", `
    <p class="soft -mt-2 mb-4 text-sm">${g.next ? `Llevas ${g.done} de ${g.total} pasos. Cada uno te lleva al lugar exacto y te dice qué hacer.` : "¡Tu agenda está lista! Puedes volver a cualquier paso cuando quieras."}</p>
    <div class="space-y-2">${steps.map((x) => `
      <div class="flex items-start gap-3 rounded-2xl p-3" style="background:${x.ok ? "#f1faf5" : "var(--canvas)"}">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl ${x.ok ? "t-ok" : "t-trial"}"><i class="fa-solid ${x.ok ? "fa-check" : x.ic}"></i></span>
        <div class="min-w-0 flex-1"><p class="text-[14px] font-bold">${esc(x.t)}${x.optional ? ` <span class="soft text-xs font-semibold">opcional${lockedNow("appearance") && x.id === "brand" ? ", Pro" : ""}</span>` : ""}</p>
          <p class="soft text-xs leading-snug">${esc(x.d)}</p>
          <div class="mt-2 flex flex-wrap gap-2"><button class="btn-sm" data-gstep="${x.id}">${x.ok ? "Revisar" : "Hacerlo"}</button>
            ${x.manual && !x.ok ? `<button class="btn-sm" data-gmark="${x.id}">Ya lo hice ✓</button>` : ""}</div></div>
      </div>`).join("")}</div>`);
}
async function markGuide(id) {
  if (guideDone().includes(id)) return;
  try { await updateDoc(doc(db, bpath("settings", "general")), { guideDone: [...guideDone(), id] }); } catch { /* no es grave */ }
}
function goStep(id) {
  const x = guideSteps().find((s2) => s2.id === id); if (!x) return;
  closeM();
  if (x.guide === "telegram") return openTelegramGuide();
  if (x.guide === "share") return openShareGuide();
  if (x.guide === "geo") return requestGeo(true);
  if (x.tab) switchTab(x.tab);
  // espera a que la sección se dibuje y resalta el lugar exacto
  setTimeout(() => {
    const el = x.focus ? (x.focus.startsWith("[") ? document.querySelector(`#tab-${x.tab} ${x.focus}`) : $(x.focus)) : $("tab-" + x.tab);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("guide-glow"); setTimeout(() => el.classList.remove("guide-glow"), 4200);
      if (el.focus && el.tagName === "INPUT") setTimeout(() => el.focus({ preventScroll: true }), 500);
    }
    showGuideTip(x);
  }, 350);
}
function showGuideTip(x) {
  document.getElementById("guideTip")?.remove();
  const t = document.createElement("div");
  t.id = "guideTip"; t.className = "guide-tip q-pop"; t.setAttribute("role", "status");
  t.innerHTML = `<i class="fa-solid fa-lightbulb mt-0.5" style="color:#f59e0b"></i><p class="min-w-0 flex-1 text-[13px] leading-snug"><b>${esc(x.t)}.</b> ${esc(x.tip || x.d)}</p>
    ${x.manual ? `<button class="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold" style="color:var(--sink)" data-gmark="${x.id}">Listo ✓</button>` : ""}
    <button class="shrink-0 px-1 text-lg leading-none opacity-70" data-gclose="1" aria-label="Cerrar">✕</button>`;
  document.body.appendChild(t);
}
document.addEventListener("click", (e) => {
  const st = e.target.closest("[data-gstep]"); if (st) return goStep(st.dataset.gstep);
  const op = e.target.closest("[data-gopen]"); if (op) return openGuide();
  const mk = e.target.closest("[data-gmark]");
  if (mk) { markGuide(mk.dataset.gmark); document.getElementById("guideTip")?.remove(); if ($("modal").classList.contains("hidden") === false) setTimeout(openGuide, 300); toast("¡Paso completado!"); return; }
  if (e.target.closest("[data-gclose]")) document.getElementById("guideTip")?.remove();
  if (e.target.closest("[data-link]")) markGuide("share");
});
// Telegram paso a paso, con el estado en vivo
function openTelegramGuide() {
  const on = !!A.tg?.owner;
  openM("Avisos en tu Telegram", `
    <p class="soft -mt-2 mb-4 text-sm">Te llegan las reservas nuevas, los comprobantes de pago con botones para aprobar o rechazar, los recordatorios y los avisos de tu plan.</p>
    <ol class="space-y-3">
      <li class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full t-trial text-sm font-bold">1</span><div class="flex-1 text-sm"><b>Instala Telegram</b> en tu celular si aún no lo tienes.
        <div class="mt-1.5 flex flex-wrap gap-2"><a class="btn-sm" target="_blank" rel="noopener" href="https://play.google.com/store/apps/details?id=org.telegram.messenger">Android</a><a class="btn-sm" target="_blank" rel="noopener" href="https://apps.apple.com/app/telegram-messenger/id686449807">iPhone</a></div></div></li>
      <li class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full t-trial text-sm font-bold">2</span><div class="flex-1 text-sm"><b>Toca “Conectar”</b>. Se abre Telegram con el bot de la plataforma.
        <button id="tgGo" class="btn-primary mt-1.5 w-full">Conectar mi Telegram</button></div></li>
      <li class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full t-trial text-sm font-bold">3</span><div class="flex-1 text-sm">En Telegram toca <b>Iniciar</b> (o <i>Start</i>) abajo. Te llega un mensaje de bienvenida.</div></li>
      <li class="flex gap-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full ${on ? "t-ok" : "t-off"} text-sm font-bold">${on ? "✓" : "4"}</span><div class="flex-1 text-sm"><b>Listo.</b> <span id="tgState">${on ? "Tu Telegram está conectado. 🎉" : `<span class="spin mr-1"></span>Esperando la conexión… esta pantalla se actualiza sola.`}</span></div></li>
    </ol>
    <p class="soft mt-4 rounded-xl p-3 text-xs" style="background:var(--canvas)">💡 Cada barbero puede recibir sus propias citas: en <b>Equipo</b>, toca “Conectar Telegram” en su tarjeta y envíale el enlace.</p>`);
  $("tgGo").onclick = async () => {
    const btn = $("tgGo"); setBusy(btn, true, "Creando enlace…");
    let bot = "";
    try { bot = ((await getDoc(doc(db, "platform", "public"))).data()?.telegramBot || "").replace(/^@/, "").trim(); } catch { /* sin bot */ }
    if (!bot) { setBusy(btn, false); return toast("El bot de la plataforma aún no está listo. Avísale a soporte.", "error"); }
    const code = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    try { await setDoc(doc(db, "telegramLinks", code), { businessId: bpath().split("/")[1], target: "owner", createdAt: serverTimestamp() }); }
    catch (err) { setBusy(btn, false); return toast(err.message, "error"); }
    window.open(`https://t.me/${bot}?start=${code}`, "_blank");
    setBusy(btn, false); btn.textContent = "Abrir Telegram otra vez";
  };
  A.tgGuideOpen = true;
}
// cuando llega la conexión, la guía lo muestra al instante
const _tgWatch = setInterval(() => {
  if (!A.tgGuideOpen || !$("tgState")) { A.tgGuideOpen = !!$("tgState"); return; }
  if (A.tg?.owner && !$("tgState").dataset.ok) { $("tgState").dataset.ok = "1"; $("tgState").innerHTML = "Tu Telegram está conectado. 🎉"; toast("¡Telegram conectado! Ya te llegarán los avisos."); renderHome(); }
}, 1500);
function openShareGuide() {
  const url = $("linkUrl").textContent, name = A.settings?.businessName || A.biz?.name || "";
  const msg = (panelPrefs().shareMsg || PANEL_DEFAULT.shareMsg).replace(/\{negocio\}/g, name).replace(/\{link\}/g, url);
  openM("Comparte tu enlace", `
    <p class="soft -mt-2 mb-3 text-sm">Entre más lo vean, más reservas te llegan solas. Estos son los mejores lugares:</p>
    <p class="mb-3 truncate rounded-lg bg-paper px-3 py-2 font-mono text-xs">${esc(url)}</p>
    <div class="space-y-2 text-sm">
      <a class="todo !mt-0" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(msg)}" data-link-done="1"><span class="ic t-ok"><i class="fa-brands fa-whatsapp"></i></span><span class="flex-1"><b>Estado de WhatsApp</b><br><span class="soft text-xs">Publícalo con la imagen de tus horarios.</span></span></a>
      <button class="todo !mt-0 w-full text-left" data-link="copy"><span class="ic t-trial"><i class="fa-brands fa-instagram"></i></span><span class="flex-1"><b>Biografía de Instagram</b><br><span class="soft text-xs">Copia el enlace y pégalo en “Editar perfil”.</span></span></button>
      <button class="todo !mt-0 w-full text-left" data-link="copy"><span class="ic t-due"><i class="fa-brands fa-google"></i></span><span class="flex-1"><b>Perfil de Google</b><br><span class="soft text-xs">En Google Business pégalo como “Enlace de reservas”.</span></span></button>
      <button class="todo !mt-0 w-full text-left" data-link="qr"><span class="ic t-off"><i class="fa-solid fa-qrcode"></i></span><span class="flex-1"><b>QR en tu local</b><br><span class="soft text-xs">Imprímelo y ponlo en el espejo o la caja.</span></span></button>
    </div>`);
  markGuide("share");
}

// =====================================================================
//  ESTADO DEL BARBERO: disponible o en descanso, a un toque
// =====================================================================
const meStaff = () => A.staff.find((x) => x.id === A.me?.staffId);
function renderMyStatus() {
  const b = $("myStatus"), me = meStaff();
  if (!me || me.active === false) { b.classList.add("hidden"); return; }
  const busy = isBusy(me);
  b.className = "status-pill" + (busy ? " busy" : "");
  b.innerHTML = `<span class="sdot"></span><span>${busy ? "Descanso · " + timeOf(me.busyUntil) : "Disponible"}</span>`;
  b.title = busy ? "Toca cuando vuelvas" : "Toca para tomar un descanso";
}
$("myStatus").onclick = () => toggleStaffStatus(meStaff());
async function toggleStaffStatus(s) {
  if (!s) return;
  if (!isOwner() && s.id !== A.me?.staffId) return toast("Solo puedes cambiar tu propio estado.", "error");
  if (isBusy(s)) {
    if (!(await uiConfirm(s.id === A.me?.staffId ? "¿Ya volviste?" : `¿${s.name} ya volvió?`, "Se abren de nuevo sus cupos en la página.", { okText: "Sí, disponible" }))) return;
    try { await api("endBreak", { staffId: s.id }); toast(`${s.id === A.me?.staffId ? "Estás" : s.name + " está"} disponible de nuevo.`); } catch (err) { toast(err.message, "error"); }
  } else openBreak(s);
}

// =====================================================================
//  ACTIVIDAD: quién entra a tu página, cuándo y hasta dónde llega
// =====================================================================
const ACT = { visits: [], at: 0, loading: false };
async function loadActivity(force) {
  if (ACT.loading || (!force && Date.now() - ACT.at < 5 * 60000)) return;
  ACT.loading = true;
  try {
    const snap = await getDocs(query(collection(db, bpath("presence")), where("first", ">=", Timestamp.fromMillis(Date.now() - 14 * 86400000))));
    ACT.visits = snap.docs.map((d) => d.data()).filter((v) => v.first).map((v) => ({ t: toMillis(v.first), best: Number(v.best || 0), named: !!v.name }));
    ACT.at = Date.now();
  } catch (e) { console.warn(e); }
  ACT.loading = false;
  if (A.tab === "home") renderHome();
  if (A.tab === "activity") renderActivity();
}
const bogDay = (ms) => new Date(ms - 5 * 3600000).toISOString().slice(0, 10);
const bogHour = (ms) => new Date(ms - 5 * 3600000).getUTCHours();
function actStats() {
  const today = bogNow().date, v = ACT.visits;
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const perDay = days.map((d) => v.filter((x) => bogDay(x.t) === d).length);
  const week = v.filter((x) => bogDay(x.t) >= days[0]);
  const prevWeek = v.filter((x) => bogDay(x.t) < days[0] && bogDay(x.t) >= addDays(days[0], -7)).length;
  const hours = Array.from({ length: 24 }, (_, h) => v.filter((x) => bogHour(x.t) === h).length);
  let peak = 0, peakH = -1;
  for (let h = 6; h < 23; h++) { const n = hours[h] + hours[h + 1]; if (n > peak) { peak = n; peakH = h; } }
  const reach = (n) => week.filter((x) => x.best >= n).length;
  return { days, perDay, today: perDay[6], week: week.length, prevWeek, hours, peakH, peak,
    funnel: [["Entraron", week.length], ["Vieron horarios", reach(2)], ["Eligieron hora", reach(3)], ["Llegaron al pago", reach(4)], ["Reservaron", reach(5)]] };
}
const hh = (h) => hora12(String(h).padStart(2, "0") + ":00").replace(":00", "");
function buildRecs() {
  if (!ACT.at || !A.settings) return [];
  const st = actStats(), out = [];
  const [, saw, chose, paid, done] = st.funnel.map((f) => f[1]);
  const live = liveNow().length;
  const freeLater = freeTimes(H.today, H.locks).filter((f) => { const [h, m] = f.time.split(":").map(Number); return h * 60 + m > bogNow().min; });
  if (live && freeLater.length) out.push({ w: 0, txt: `Ahora mismo hay <b>${live} persona${live === 1 ? "" : "s"}</b> en tu página y te quedan <b>${freeLater.length} huecos</b>. Publica tus horarios libres como estado.`, act: "Publicar", fn: () => fillAsStory(H.today) });
  if (st.today >= 5 && !H.stories.length) out.push({ w: 1, txt: `Hoy ya entraron <b>${st.today} personas</b> y no tienes estados activos. Sube uno: una foto de un corte o tu promo.`, act: "Subir estado", fn: () => newStory() });
  if (paid - done >= 2) out.push({ w: 1, txt: `<b>${paid - done} personas</b> llegaron a pagar el abono esta semana y no terminaron. Revisa que tu QR y tu llave se vean claros.`, act: "Revisar pagos", fn: () => goStep("pay") });
  if (saw >= 5 && done / Math.max(1, saw) < 0.25) out.push({ w: 2, txt: `<b>${saw} personas</b> vieron tus horarios y solo <b>${done}</b> reservaron. Prueba un aviso destacado con una promo.`, act: "Crear aviso", fn: () => switchTab("marketing") });
  if (st.peakH >= 0 && st.peak >= 4) out.push({ w: 3, txt: `Tus clientes entran más entre <b>${hh(st.peakH)} y ${hh(st.peakH + 2)}</b>. Publica tus estados y huecos un poco antes, cerca de las ${hh(Math.max(6, st.peakH - 1))}.`, act: "Subir estado", fn: () => newStory() });
  if (st.week < 10) out.push({ w: 2, txt: `Esta semana entraron <b>${st.week} persona${st.week === 1 ? "" : "s"}</b> a tu página. Comparte tu enlace en tu estado de WhatsApp y en Instagram.`, act: "Compartir", fn: () => openShareGuide() });
  if (st.prevWeek >= 5 && st.week > st.prevWeek * 1.15) out.push({ w: 4, txt: `🎉 Tus visitas subieron <b>${Math.round((st.week / st.prevWeek - 1) * 100)}%</b> frente a la semana pasada. ¡Sigue así!` });
  return out.filter((r) => !lockedNow("marketing") || !/estado|aviso/i.test(r.act || "")).sort((a, b) => a.w - b.w);
}
function renderActivity() {
  const el = $("tab-activity");
  if (!ACT.at) { el.innerHTML = `<div class="sp-card soft text-sm"><span class="spin mr-1"></span> Calculando tu actividad…</div>`; loadActivity(true); return; }
  const st = actStats(), max = Math.max(1, ...st.perDay), recs = buildRecs();
  const conv = st.funnel[0][1] ? Math.round((st.funnel[4][1] / st.funnel[0][1]) * 100) : 0;
  const trend = st.prevWeek ? Math.round((st.week / st.prevWeek - 1) * 100) : null;
  const hmax = Math.max(1, ...st.hours.slice(6, 23));
  el.innerHTML = `
    <div class="grid grid-cols-3 gap-2">
      <div class="sp-card !p-3"><p class="disp text-2xl font-extrabold">${st.today}</p><p class="soft text-xs">visitas hoy</p></div>
      <div class="sp-card !p-3"><p class="disp text-2xl font-extrabold">${st.week}</p><p class="soft text-xs">en 7 días${trend !== null ? ` <b style="color:${trend >= 0 ? "var(--mint)" : "var(--sred)"}">${trend >= 0 ? "↑" : "↓"}${Math.abs(trend)}%</b>` : ""}</p></div>
      <div class="sp-card !p-3"><p class="disp text-2xl font-extrabold">${conv}%</p><p class="soft text-xs">reservaron</p></div>
    </div>
    ${recs.length ? `<div class="sp-h"><h2>Te recomendamos</h2><span>según tus visitas</span></div>
      ${recs.map((r, i) => `<div class="todo"><span class="ic" style="background:#fff7e0;color:#a86e00"><i class="fa-solid fa-lightbulb"></i></span><p class="min-w-0 flex-1 text-[13.5px] leading-snug">${r.txt}</p>${r.act ? `<button class="act" style="background:var(--sink);color:#fff" data-arec="${i}">${r.act}</button>` : ""}</div>`).join("")}` : ""}
    <div class="sp-h"><h2>Visitas por día</h2><span>últimos 7 días</span></div>
    <div class="sp-card"><div class="bars" role="img" aria-label="Visitas por día">${st.days.map((d, i) => {
      const [y, m, dd] = d.split("-").map(Number);
      const lbl = new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString("es-CO", { timeZone: "UTC", weekday: "short" }).replace(".", "");
      return `<div><b>${st.perDay[i] || ""}</b><span class="b ${i === 6 ? "on" : ""}" style="height:${(st.perDay[i] / max) * 80}%"></span><small class="capitalize">${i === 6 ? "hoy" : lbl}</small></div>`;
    }).join("")}</div></div>
    <div class="sp-h"><h2>A qué hora entran</h2><span>${st.peakH >= 0 && st.peak ? `más entre ${hh(st.peakH)} y ${hh(st.peakH + 2)}` : "últimas 2 semanas"}</span></div>
    <div class="sp-card"><div class="bars" style="height:80px;gap:3px">${st.hours.slice(6, 23).map((n, i) => `<div><span class="b ${i + 6 === st.peakH || i + 6 === st.peakH + 1 ? "on" : ""}" style="height:${(n / hmax) * 85}%"></span><small>${(i + 6) % 3 === 0 ? hh(i + 6) : ""}</small></div>`).join("")}</div></div>
    <div class="sp-h"><h2>Hasta dónde llegan</h2><span>esta semana</span></div>
    <div class="sp-card">${st.funnel.map(([t, n], i) => `<div class="funnel-row"><span>${t}</span><span class="track"><span class="fill block" style="width:${st.funnel[0][1] ? (n / st.funnel[0][1]) * 100 : 0}%;${i === 4 ? "background:var(--mint)" : ""}"></span></span><b class="text-right">${n}</b></div>`).join("")}
      <p class="soft mt-2 text-xs">Cada visita es una persona que abrió tu enlace. Si muchos llegan a ver horarios pero pocos reservan, revisa precios, abono o tus huecos libres.</p></div>`;
}
$("tab-activity").addEventListener("click", (e) => { const b = e.target.closest("[data-arec]"); if (b) buildRecs()[Number(b.dataset.arec)]?.fn?.(); });

// =====================================================================
//  UBICACIÓN DEL LOCAL: el panel la pide solo con el GPS del celular o PC
// =====================================================================
const geoSkipKey = () => "geoSkip_" + bpath().split("/")[1];
function requestGeo(manual) {
  if (!navigator.geolocation) { if (manual) toast("Este dispositivo no permite leer la ubicación.", "error"); return; }
  if (!manual) { try { if (Number(localStorage.getItem(geoSkipKey()) || 0) > Date.now()) return; } catch { /* sin almacenamiento */ } }
  if (manual) toast("Buscando tu ubicación…");
  navigator.geolocation.getCurrentPosition((p) => {
    const lat = Math.round(p.coords.latitude * 1e6) / 1e6, lng = Math.round(p.coords.longitude * 1e6) / 1e6, acc = Math.round(p.coords.accuracy);
    const rough = acc > 150;
    const box = `${lng - 0.004},${lat - 0.0025},${lng + 0.004},${lat + 0.0025}`;
    openM("¿Estás en tu local?", `
      <p class="soft -mt-2 mb-3 text-sm">Encontramos esta ubicación. Si es la de tu local, la guardamos para que tus clientes lleguen directo con <b>Waze</b> o <b>Google Maps</b>.</p>
      <iframe title="Mapa de tu ubicación" class="mb-2 h-56 w-full rounded-2xl border border-line" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik&marker=${lat},${lng}"></iframe>
      <p class="mb-3 text-xs ${rough ? "font-semibold text-amber-800" : "soft"}">${rough ? `⚠️ Precisión aproximada de ${acc} m. En computador la ubicación es menos exacta: si puedes, hazlo desde el celular estando en el local.` : `Precisión de ${acc} m.`}</p>
      <button id="geoYes" class="btn-primary w-full py-3">Sí, estoy en mi local: guardar</button>
      <div class="mt-2 grid grid-cols-2 gap-2"><button id="geoRetry" class="btn-light text-sm">Volver a buscar</button><button id="geoNo" class="btn-light text-sm">No estoy en el local</button></div>`);
    $("geoYes").onclick = async () => {
      const btn = $("geoYes"); setBusy(btn, true, "Guardando…");
      try {
        await updateDoc(doc(db, bpath("settings", "general")), { geo: { lat, lng, acc } });
        closeM(); toast("¡Listo! Tus clientes ya ven el botón para llegar con Waze.");
        if (A.tab === "settings") renderSettings();
      } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
    };
    $("geoRetry").onclick = () => { closeM(); requestGeo(true); };
    $("geoNo").onclick = () => {
      try { localStorage.setItem(geoSkipKey(), String(Date.now() + 2 * 86400000)); } catch { /* nada */ }
      closeM(); toast("Te lo volvemos a pedir otro día. También está en la Guía de configuración.");
    };
  }, (err) => {
    try { localStorage.setItem(geoSkipKey(), String(Date.now() + 3 * 86400000)); } catch { /* nada */ }
    if (manual || err.code === 1) toast(err.code === 1 ? "Para guardar la ubicación, permite el acceso a tu ubicación en el navegador (el ícono del candado junto a la dirección)." : "No se pudo leer la ubicación. Intenta de nuevo.", "error");
  }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
}

// =====================================================================
//  REFERIDOS: invita tiendas y paga menos (solo descuento en tu propio plan)
// =====================================================================
const refLevels = () => (A.plat?.referral?.levels?.length ? A.plat.referral.levels : [20, 10, 8, 6, 4, 2]).map(Number);
const refCap = () => Math.max(1, Number(A.plat?.referral?.capMonths || 3));
const REF = { unsubs: [] };
function refLink() { return new URL("index.html?ref=" + encodeURIComponent(bpath().split("/")[1]), location.href).href; }
function renderReferrals() {
  const el = $("tab-referrals");
  if (A.plat?.referral?.enabled === false) { el.innerHTML = `<div class="sp-card soft text-sm">El programa de referidos está pausado por ahora.</div>`; return; }
  if (!REF.started) {
    REF.started = true;
    const bid = bpath().split("/")[1];
    REF.unsubs.push(onSnapshot(doc(db, bpath("private", "billing")), (d) => { REF.bl = d.data() || {}; if (A.tab === "referrals") renderReferrals(); }, onErr));
    REF.unsubs.push(onSnapshot(query(collection(db, "businesses"), where("referredBy", "==", bid)), (q) => { REF.kids = q.docs.map((d) => ({ id: d.id, ...d.data() })); if (A.tab === "referrals") renderReferrals(); }, () => {}));
    REF.unsubs.push(onSnapshot(collection(db, bpath("refMoves")), (q) => { REF.moves = q.docs.map((d) => d.data()).sort((a, b) => toMillis(b.at) - toMillis(a.at)); if (A.tab === "referrals") renderReferrals(); }, () => {}));
    A.unsubs.push(() => { REF.unsubs.forEach((f) => f()); REF.unsubs = []; REF.started = false; });
  }
  const bl = REF.bl || {}, kids = REF.kids || [], moves = REF.moves || [];
  const credit = Number(bl.creditCOP || 0), price = Number(bl.priceCOP || 0), cap = refCap() * price;
  const lv = refLevels();
  const month = bogNow().date.slice(0, 7);
  const payingNow = new Set(moves.filter((m) => m.type === "earn" && m.level === 1 && new Date(toMillis(m.at) - 5 * 3600000).toISOString().slice(0, 7) === month).map((m) => m.fromKey || m.fromId)).size;
  const need = lv[0] > 0 ? Math.ceil(100 / lv[0]) : 0;
  const saved = moves.filter((m) => m.type === "use").reduce((t, m) => t + Number(m.amountCOP || 0), 0);
  const link = refLink(), name = A.settings?.businessName || A.biz?.name || "";
  const inviteMsg = `¡Hola! Uso una agenda en línea para ${name} y mis clientes apartan su cita solos 💈. Créala gratis con mi enlace y te regalan días extra de prueba: ${link}`;
  el.innerHTML = `
    <div class="sp-card" style="background:linear-gradient(135deg,#14213D,#2B59C3);color:#fff">
      <p class="disp text-[38px] font-extrabold leading-none" style="color:#ffd166">${cop(credit)}</p>
      <p class="mt-1 text-sm opacity-85">Descuento acumulado para tu plan</p>
      ${need ? `<p class="mt-3 text-xs opacity-90">${payingNow} de ${need} invitados pagando este mes</p>
        <div class="mt-1.5 flex gap-1">${Array.from({ length: need }, (_, i) => `<span class="h-2 flex-1 rounded-full" style="background:${i < payingNow ? "#ffd166" : "rgba(255,255,255,.25)"}"></span>`).join("")}</div>
        <p class="mt-1.5 text-xs font-bold">${payingNow >= need ? "🎉 ¡Tu próximo mes sale gratis!" : `Te faltan ${need - payingNow} para tu mes gratis 🎁`}</p>` : ""}
    </div>

    <div class="sp-h"><h2>Comparte tu <span style="color:var(--sred)">enlace de invitación</span></h2></div>
    <div class="grid grid-cols-4 gap-2 text-center text-[11.5px] font-semibold">
      <a class="sp-card !p-3" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(inviteMsg)}"><i class="fa-brands fa-whatsapp mb-1 block text-xl" style="color:var(--mint)"></i>WhatsApp</a>
      <button class="sp-card !p-3" data-ref="qr"><i class="fa-solid fa-qrcode mb-1 block text-xl"></i>QR</button>
      <button class="sp-card !p-3" data-ref="share"><i class="fa-solid fa-share-nodes mb-1 block text-xl"></i>Compartir</button>
      <button class="sp-card !p-3" data-copy="${esc(link)}"><i class="fa-solid fa-link mb-1 block text-xl"></i>Copiar</button>
    </div>

    <div class="sp-h"><h2>Tus invitados</h2><span>${kids.length}</span></div>
    <div class="sp-card !py-1">${kids.length ? kids.slice().sort((a, b) => toMillis(a.createdAt) - toMillis(b.createdAt)).map((k, i) => {
      const paying = !k.trial && k.status === "active";
      const tone = paying ? "t-ok" : k.status !== "active" ? "t-off" : "t-trial";
      return `<div class="who-row"><span class="who-av ${tone}">${i + 1}</span>
        <span class="min-w-0 flex-1"><b>Referido ${i + 1}</b><br><span class="soft text-[11px]">Desde ${new Date(toMillis(k.createdAt)).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" })}</span></span>
        <span class="${tone} rounded-full px-2 py-0.5 text-[11px] font-bold">${paying ? "✓ Pagando" : k.status !== "active" ? "Pausada" : "En prueba"}</span></div>`;
    }).join("") : `<p class="soft py-3 text-sm">Aún no tienes invitados. Comparte tu enlace con otros barberos, salones o spas.</p>`}</div>

    <div class="sp-h"><h2>Movimientos</h2><span>${saved ? "ahorrado: " + cop(saved) : ""}</span></div>
    <div class="sp-card !py-1">${moves.length ? moves.slice(0, 30).map((m) => {
      const tone = m.type === "use" ? "t-late" : m.type === "cap" ? "t-off" : m.level === 1 ? "t-ok" : m.level === 2 ? "t-trial" : "t-off";
      const tag = m.type === "use" ? "Usado" : m.type === "cap" ? "Tope" : "Nivel " + m.level;
      const txt = m.type === "use" ? "Aplicado a tu plan"
        : m.type === "cap" ? `Llegaste al máximo guardado (${refCap()} meses de plan)`
        : `${m.level > 1 ? `Un referido de nivel ${m.level}` : "Un referido"} pagó su plan: ganaste el ${m.pct || ""}% de tu plan`;
      return `<div class="who-row"><span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${tone}">${tag}</span>
        <span class="min-w-0 flex-1 text-[13px]">${esc(txt)}<br><span class="soft text-[11px]">${new Date(toMillis(m.at)).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" })}</span></span>
        <b class="shrink-0" style="color:${m.type === "use" ? "var(--sink)" : "var(--mint)"}">${m.type === "use" ? "−" : "+"}${cop(m.amountCOP)}</b></div>`;
    }).join("") : `<p class="soft py-3 text-sm">No hay movimientos todavía.</p>`}</div>

    <div class="sp-h"><h2>Cómo funciona</h2></div>
    <div class="sp-card space-y-3 text-[13px] leading-snug">
      <p>🎁 <b>Ganas cada mes que tus invitados paguen su plan:</b> ${lv[0]}% de lo que paga quien invitaste${lv.length > 1 ? `, ${lv[1]}% de los que invite esa tienda${lv.length > 2 ? ` y ${lv.slice(2).join("%, ")}% en los siguientes niveles` : ""}` : ""}.</p>
      <p>💳 <b>Se descuenta solo</b> en tu próximo pago en “Mi plan”. Si tu descuento cubre todo, ese mes te sale gratis.</p>
      <p>📦 <b>Puedes guardar hasta ${refCap()} meses de tu plan</b> (${cop(cap)}). Lo que pase de ahí no se acumula.</p>
      <p class="soft text-xs">El descuento solo se usa en tu propio plan; no se cambia por dinero. Tus invitados reciben días extra de prueba gratis.</p>
    </div>`;
}
$("tab-referrals").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-ref]"); if (!b) return;
  const link = refLink();
  if (b.dataset.ref === "share") { if (navigator.share) { try { await navigator.share({ title: "Agenda en línea gratis", text: "Crea tu agenda en línea con mi enlace:", url: link }); } catch { /* canceló */ } } else copyText(link); }
  if (b.dataset.ref === "qr") {
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js").catch(() => {});
    if (!window.QRious) return toast("No se pudo generar el QR.", "error");
    viewImage(new window.QRious({ value: link, size: 700, level: "M" }).toDataURL(), "Escanéalo para crear tu agenda gratis");
  }
});

// =====================================================================
//  ASISTENTE DE INICIO: toda la configuración de la tienda, paso a paso
// =====================================================================
const W = { i: 0, open: false };
const WDAYS = [[1, "L"], [2, "M"], [3, "M"], [4, "J"], [5, "V"], [6, "S"], [0, "D"]];
const SOCIALS = [
  ["instagram", "fa-instagram", "#E1306C", "Instagram", "@tunegocio", (v) => /^https?:/.test(v) ? v : "https://instagram.com/" + v.replace(/^@/, "")],
  ["facebook", "fa-facebook", "#1877F2", "Facebook", "Nombre de tu página o enlace", (v) => /^https?:/.test(v) ? v : "https://facebook.com/" + v.replace(/^@/, "")],
  ["tiktok", "fa-tiktok", "#111111", "TikTok", "@tunegocio", (v) => /^https?:/.test(v) ? v : "https://tiktok.com/@" + v.replace(/^@/, "")],
  ["youtube", "fa-youtube", "#FF0000", "YouTube", "Enlace de tu canal", (v) => /^https?:/.test(v) ? v : "https://youtube.com/@" + v.replace(/^@/, "")]
];
const socialHandle = (url = "") => url.replace(/^https?:\/\/(www\.)?(instagram|facebook|tiktok|youtube)\.com\/@?/, "@").replace(/\/$/, "");
function wizInit() {
  const s = A.settings || {}, hrs = s.businessHours || {};
  const first = Object.values(hrs).find((d) => (d || []).length) || [{ open: "09:00", close: "19:00" }];
  const team = A.staff.filter((x) => x.active !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const pm = (s.paymentMethods || [])[0] || {};
  W.d = {
    name: s.businessName || A.biz?.name || "", type: s.businessType || "barberia", phone: (s.whatsapp || "").replace(/^\+?57/, ""),
    address: s.address || "", city: s.city || "", logo: s.appearance?.logo || "", logoNew: "",
    social: Object.fromEntries(SOCIALS.map(([k]) => [k, socialHandle(s.social?.[k] || "")])),
    count: Math.max(1, team.length), names: team.map((x) => x.name),
    days: new Set(WDAYS.map(([d]) => d).filter((d) => (hrs[String(d)] || []).length).length ? WDAYS.map(([d]) => d).filter((d) => (hrs[String(d)] || []).length) : [1, 2, 3, 4, 5, 6]),
    lunch: first.length > 1, open: first[0].open, close: (first[1] || first[0]).close, lunchFrom: first.length > 1 ? first[0].close : "13:00", lunchTo: first.length > 1 ? first[1].open : "14:00",
    slot: Number(s.slotDurationMinutes || 30),
    svc: Object.fromEntries(A.services.map((x) => [x.id, { on: x.active !== false, price: Number(x.priceCOP || 0) }])),
    deposit: Number(s.depositAmountCOP ?? 5000), pmLabel: pm.label || "Nequi", pmAccount: pm.account || "", pmHolder: pm.holder || "", pmQr: pm.qr || "",
    geo: s.geo || null, geoMode: s.geoMode || ""
  };
}
const toMinW = (t) => { const [h, m] = String(t || "0:0").split(":").map(Number); return h * 60 + m; };
function wizTurns() {
  const d = W.d, slot = d.slot;
  const parts = d.lunch ? [[d.open, d.lunchFrom], [d.lunchTo, d.close]] : [[d.open, d.close]];
  const out = [];
  parts.forEach(([o, c]) => { for (let t = toMinW(o); t + slot <= toMinW(c); t += slot) out.push(t); });
  return out;
}
const STEPS = [
  { id: "hi", essential: true, next: "Empezar", html: () => `<p class="text-5xl">💈</p><h3 class="wz-h">Armemos tu agenda en 3 minutos</h3>
      <p class="wz-sub">Te hacemos unas preguntas y dejamos todo listo para que tus clientes reserven solos. Puedes cambiar todo después.</p>
      <div class="sp-card text-[14px] leading-8">✓ Tu negocio y tu logo<br>✓ Tus redes sociales<br>✓ Tu equipo, horario y turnos<br>✓ Servicios y abono<br>✓ Ubicación para Waze<br>⭐ <b>Avisos en tu Telegram</b></div>` },
  { id: "biz", essential: true, html: () => {
      const d = W.d, logo = d.logoNew || d.logo;
      return `<h3 class="wz-h">Tu negocio</h3><p class="wz-sub">Así te verán tus clientes en tu página de citas.</p>
      <div class="sp-card flex items-center gap-3">
        <label for="wLogo" class="grid h-20 w-20 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border-2 border-dashed text-center text-[11px] font-bold" style="border-color:var(--hair);${logo ? `background:center/cover url('${logo}');border-style:solid` : ""}">${logo ? "" : "📷<br>Logo"}</label>
        <input id="wLogo" type="file" accept="image/*" class="hidden">
        <div class="min-w-0 text-[13px]"><b>Tu logo o una foto de tu negocio</b><br><span class="soft">Sale arriba en tu página, en tus estados y en tus imágenes.</span><br><label for="wLogo" class="mt-1 inline-block cursor-pointer font-bold" style="color:var(--sblue)">${logo ? "Cambiar imagen" : "Subir imagen"}</label></div>
      </div>
      <label class="field mt-3"><span>Nombre del negocio</span><input id="wName" value="${esc(d.name)}" maxlength="60"></label>
      <p class="mb-1 mt-3 text-sm font-semibold soft">Tipo</p><div class="flex flex-wrap gap-2">${[["barberia", "Barbería"], ["salon", "Salón"], ["unas", "Uñas"], ["spa", "Spa"], ["otro", "Otro"]].map(([k, t]) => `<button type="button" class="q-chip" data-wtype="${k}" aria-pressed="${d.type === k}">${t}</button>`).join("")}</div>
      <label class="field mt-3"><span>WhatsApp del negocio</span><div class="flex items-center gap-2 rounded-xl border border-line bg-white px-3"><span class="soft text-sm">🇨🇴 +57</span><input id="wPhone" type="tel" inputmode="numeric" value="${esc(d.phone)}" placeholder="300 123 4567" class="w-full border-0 py-2.5 outline-none"></div></label>
      <div class="mt-3 grid grid-cols-[1fr_8rem] gap-2"><label class="field"><span>Dirección</span><input id="wAddr" value="${esc(d.address)}" placeholder="Cra 15A #80-58"></label><label class="field"><span>Ciudad</span><input id="wCity" value="${esc(d.city)}" placeholder="Soledad"></label></div>`;
    },
    save: async () => {
      const d = W.d;
      d.name = $("wName").value.trim(); d.address = $("wAddr").value.trim(); d.city = $("wCity").value.trim();
      const phone = normalizePhone($("wPhone").value);
      if (d.name.length < 2) throw new Error("Escribe el nombre de tu negocio.");
      if (!phone) throw new Error("Escribe un WhatsApp válido.");
      d.phone = $("wPhone").value;
      const data = { businessName: d.name, businessType: d.type, whatsapp: phone, address: d.address, city: d.city,
        staffLabel: { barberia: "Barbero", salon: "Estilista", unas: "Manicurista", spa: "Profesional", otro: "Profesional" }[d.type] };
      if (d.logoNew) { data.appearance = { logo: d.logoNew }; d.logo = d.logoNew; d.logoNew = ""; }
      await setDoc(doc(db, bpath("settings", "general")), data, { merge: true });
    } },
  { id: "social", html: () => `<h3 class="wz-h">Tus redes sociales</h3><p class="wz-sub">Aparecen como íconos en tu página de citas para que te sigan y vean tus trabajos.</p>
      <div class="space-y-2">${SOCIALS.map(([k, ic, col, t, ph]) => `<label class="sp-card flex items-center gap-3 !py-2.5"><i class="fa-brands ${ic} w-7 text-center text-2xl" style="color:${col}"></i>
        <span class="min-w-0 flex-1"><span class="soft block text-[11px] font-bold">${t}</span><input data-wsoc="${k}" value="${esc(W.d.social[k] || "")}" placeholder="${ph}" class="w-full border-0 p-0 text-[15px] outline-none"></span></label>`).join("")}</div>`,
    save: async () => {
      const social = {};
      document.querySelectorAll("[data-wsoc]").forEach((i) => { const v = i.value.trim(); W.d.social[i.dataset.wsoc] = v; const def = SOCIALS.find((x) => x[0] === i.dataset.wsoc); social[i.dataset.wsoc] = v ? def[5](v) : ""; });
      await setDoc(doc(db, bpath("settings", "general")), { social }, { merge: true });
    } },
  { id: "team", essential: true, html: () => {
      const d = W.d;
      return `<h3 class="wz-h">¿Cuántas personas atienden?</h3><p class="wz-sub">Cada una tendrá su agenda. Tus clientes podrán elegir con quién.</p>
      <div class="flex gap-2">${[1, 2, 3, 4, 5].map((n) => `<button type="button" class="q-chip !px-5 !py-3 text-base" data-wcount="${n}" aria-pressed="${d.count === n}">${n === 5 ? "5+" : n}</button>`).join("")}</div>
      <p class="mb-1 mt-4 text-sm font-semibold soft">Sus nombres</p>
      <div class="space-y-2">${Array.from({ length: d.count }, (_, i) => `<input data-wname="${i}" value="${esc(d.names[i] || "")}" placeholder="${i === 0 ? "Tu nombre" : "Nombre de la persona " + (i + 1)}" class="w-full rounded-xl border border-line bg-white px-3 py-2.5">`).join("")}</div>`;
    },
    save: async () => {
      const d = W.d;
      document.querySelectorAll("[data-wname]").forEach((i) => { d.names[Number(i.dataset.wname)] = i.value.trim(); });
      const names = d.names.slice(0, d.count).map((n, i) => n || (i === 0 ? "Yo" : "Persona " + (i + 1)));
      const team = A.staff.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const ops = names.map((name, i) => {
        const ex = team[i];
        if (ex) return setDoc(doc(db, bpath("staff", ex.id)), { name, order: i, active: true }, { merge: true });
        return setDoc(doc(db, bpath("staff", "b" + Date.now().toString(36) + i)), { name, order: i, active: true, serviceIds: [], status: "ready", busyUntil: null, busyReason: "", activeBreakId: null });
      });
      team.slice(names.length).forEach((x) => ops.push(setDoc(doc(db, bpath("staff", x.id)), { active: false }, { merge: true })));
      await Promise.all(ops);
    } },
  { id: "hours", essential: true, html: () => {
      const d = W.d, turns = wizTurns();
      return `<h3 class="wz-h">¿Cuándo atiendes?</h3><p class="wz-sub">Toca los días que abres y cómo es tu jornada.</p>
      <div class="flex justify-between gap-1">${WDAYS.map(([k, t]) => `<button type="button" class="q-chip !w-10 !px-0 text-center" data-wday="${k}" aria-pressed="${d.days.has(k)}">${t}</button>`).join("")}</div>
      <button type="button" class="wz-opt" data-wlunch="0" aria-pressed="${!d.lunch}"><span class="text-xl">☀️</span><span class="flex-1 text-left"><b>Jornada corrida</b><br><span class="soft text-xs">Sin parar al mediodía</span></span></button>
      <button type="button" class="wz-opt" data-wlunch="1" aria-pressed="${d.lunch}"><span class="text-xl">🍽️</span><span class="flex-1 text-left"><b>Con hora de almuerzo</b><br><span class="soft text-xs">Dos turnos en el día</span></span></button>
      <div class="sp-card mt-2 grid grid-cols-2 gap-2 text-sm">
        <label class="field"><span>Abres</span><input type="time" step="900" data-wt="open" value="${d.open}"></label><label class="field"><span>Cierras</span><input type="time" step="900" data-wt="close" value="${d.close}"></label>
        ${d.lunch ? `<label class="field"><span>Sales a almorzar</span><input type="time" step="900" data-wt="lunchFrom" value="${d.lunchFrom}"></label><label class="field"><span>Vuelves</span><input type="time" step="900" data-wt="lunchTo" value="${d.lunchTo}"></label>` : ""}
      </div>
      <p class="mb-1 mt-3 text-sm font-semibold soft">¿Cada cuánto das un turno?</p>
      <div class="flex flex-wrap gap-2">${[15, 30, 45, 60].map((m) => `<button type="button" class="q-chip" data-wslot="${m}" aria-pressed="${d.slot === m}">${m === 60 ? "1 hora" : m + " min"}</button>`).join("")}</div>
      <div class="sp-card mt-3"><p class="text-[13px]"><b>Así verán tus clientes un día</b> <span class="soft">· ${turns.length} turnos por persona</span></p>
        <div class="mt-1.5 flex flex-wrap gap-1">${turns.slice(0, 7).map((t) => `<span class="rounded-full border border-line px-2 py-0.5 text-xs font-bold">${hora12(String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"))}</span>`).join("")}${turns.length > 7 ? `<span class="soft px-1 text-xs">… hasta ${hora12(String(Math.floor(turns[turns.length - 1] / 60)).padStart(2, "0") + ":" + String(turns[turns.length - 1] % 60).padStart(2, "0"))}</span>` : ""}</div></div>`;
    },
    save: async () => {
      const d = W.d;
      if (!d.days.size) throw new Error("Elige al menos un día.");
      if (toMinW(d.close) <= toMinW(d.open)) throw new Error("La hora de cierre debe ser después de la apertura.");
      if (d.lunch && !(toMinW(d.lunchFrom) > toMinW(d.open) && toMinW(d.lunchTo) > toMinW(d.lunchFrom) && toMinW(d.close) > toMinW(d.lunchTo))) throw new Error("Revisa la hora de almuerzo.");
      const iv = d.lunch ? [{ open: d.open, close: d.lunchFrom }, { open: d.lunchTo, close: d.close }] : [{ open: d.open, close: d.close }];
      const businessHours = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((k) => [String(k), d.days.has(k) ? iv : []]));
      await updateDoc(doc(db, bpath("settings", "general")), { businessHours, slotDurationMinutes: d.slot });
    } },
  { id: "services", html: () => `<h3 class="wz-h">Tus servicios</h3><p class="wz-sub">Marca los que haces y pon tu precio. Después puedes agregar más.</p>
      <div class="sp-card !py-1">${A.services.slice().sort((a, b) => (a.order ?? 99) - (b.order ?? 99)).map((x) => { const v = W.d.svc[x.id] || { on: true, price: x.priceCOP };
        return `<div class="flex items-center gap-3 border-t border-line py-2.5 first:border-0"><button type="button" class="grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold" style="${v.on ? "background:var(--sink);color:#fff" : "border:1.5px solid #c9d2de"}" data-wsvc="${x.id}" aria-pressed="${v.on}" aria-label="${esc(x.name)}">${v.on ? "✓" : ""}</button>
          <span class="min-w-0 flex-1 text-[14px]"><b>${esc(x.name)}</b><br><span class="soft text-xs">${Number(x.minutes || 0)} min${x.type === "addon" ? ", se suma a otro" : ""}</span></span>
          <span class="flex items-center rounded-lg border border-line px-2"><span class="soft text-sm">$</span><input data-wprice="${x.id}" type="number" inputmode="numeric" step="1000" value="${v.price}" class="w-20 border-0 py-1.5 text-right font-bold outline-none"></span></div>`; }).join("")}</div>`,
    save: async () => {
      document.querySelectorAll("[data-wprice]").forEach((i) => { W.d.svc[i.dataset.wprice].price = Number(i.value || 0); });
      await Promise.all(A.services.map((x) => { const v = W.d.svc[x.id]; if (!v) return null;
        if (v.on === (x.active !== false) && v.price === Number(x.priceCOP || 0)) return null;
        return setDoc(doc(db, bpath("services", x.id)), { active: v.on, priceCOP: v.price }, { merge: true }); }));
    } },
  { id: "deposit", html: () => {
      const d = W.d;
      return `<h3 class="wz-h">Abono para apartar</h3><p class="wz-sub">Con abono la gente no te deja plantado: lo paga por adelantado y el resto en tu local.</p>
      <div class="flex flex-wrap gap-2">${[[0, "Sin abono"], [5000, "$5.000"], [10000, "$10.000"], [15000, "$15.000"]].map(([v, t]) => `<button type="button" class="q-chip" data-wdep="${v}" aria-pressed="${d.deposit === v}">${t}</button>`).join("")}</div>
      ${d.deposit ? `<p class="mb-1 mt-4 text-sm font-semibold soft">¿Dónde te pagan?</p>
      <div class="flex flex-wrap gap-2">${["Nequi", "Daviplata", "Bre-B", "Bancolombia"].map((t) => `<button type="button" class="q-chip" data-wpml="${t}" aria-pressed="${d.pmLabel === t}">${t}</button>`).join("")}</div>
      <div class="sp-card mt-2 space-y-2">
        <label class="field"><span>${d.pmLabel === "Bre-B" ? "Tu llave Bre-B" : "Número de " + d.pmLabel}</span><input id="wPmAcc" value="${esc(d.pmAccount)}" placeholder="${d.pmLabel === "Bre-B" ? "@tullave" : "300 123 4567"}"></label>
        <label class="field"><span>A nombre de</span><input id="wPmHolder" value="${esc(d.pmHolder)}" placeholder="Nombre del titular"></label>
        <label class="flex cursor-pointer items-center gap-3 rounded-xl p-2" style="background:var(--canvas)"><span class="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-white text-xl" style="${d.pmQr ? `background:center/contain no-repeat url('${d.pmQr}') #fff` : ""}">${d.pmQr ? "" : "🔳"}</span>
          <span class="text-sm"><b>${d.pmQr ? "Cambiar QR" : "Subir tu QR de pago"}</b><br><span class="soft text-xs">Opcional: tus clientes lo escanean desde su banco</span></span><input id="wPmQr" type="file" accept="image/*" class="hidden"></label>
      </div>` : `<p class="soft mt-4 text-sm">Sin abono, el cupo se aparta sin pago. Puedes activarlo después en Configuración.</p>`}`;
    },
    save: async () => {
      const d = W.d;
      if ($("wPmAcc")) { d.pmAccount = $("wPmAcc").value.trim(); d.pmHolder = $("wPmHolder").value.trim(); }
      const data = { depositAmountCOP: d.deposit };
      if (d.deposit && !d.pmAccount) throw new Error("Escribe dónde te pagan el abono, o elige “Sin abono”.");
      if (d.deposit) {
        const rest = (A.settings.paymentMethods || []).slice(1);
        data.paymentMethods = [{ label: d.pmLabel, account: d.pmAccount, holder: d.pmHolder, qr: d.pmQr || "" }, ...rest];
      }
      await setDoc(doc(db, bpath("settings", "general")), data, { merge: true });
    } },
  { id: "geo", html: () => {
      const d = W.d;
      const box = d.geo ? `${d.geo.lng - 0.004},${d.geo.lat - 0.0025},${d.geo.lng + 0.004},${d.geo.lat + 0.0025}` : "";
      return `<h3 class="wz-h">📍 Ubica tu negocio</h3>
      <p class="wz-sub">Para crear el botón <b style="color:#0b6fa8">“Cómo llegar con Waze”</b>: lo verán en tu página de citas, en el comprobante de su reserva y en el WhatsApp de confirmación. Llegan directo a tu puerta.</p>
      <div class="sp-card text-[12.5px]">🔒 Solo guardamos la ubicación de tu <b>local</b>, una vez. No seguimos tu celular. Hazlo estando dentro de tu negocio.</div>
      ${d.geo ? `<iframe title="Tu local en el mapa" class="mt-3 h-44 w-full rounded-2xl border border-line" src="https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik&marker=${d.geo.lat},${d.geo.lng}"></iframe>
        <p class="mt-1 text-sm font-bold" style="color:var(--mint)">✓ Ubicación lista${d.geo.acc ? ` (precisión ${d.geo.acc} m)` : ""}. <button type="button" class="underline" data-wgeo="find">Volver a buscar</button></p>` : `
      <button type="button" class="wz-opt" data-wgeo="find"><span class="text-xl">📍</span><span class="flex-1 text-left"><b>Estoy en mi local: activar ubicación</b><br><span class="soft text-xs">Llegan exacto con Waze o Google Maps</span></span></button>`}
      <button type="button" class="wz-opt" data-wgeo="address" aria-pressed="${d.geoMode === "address" && !d.geo}"><span class="text-xl">🏠</span><span class="flex-1 text-left"><b>Usar solo mi dirección</b><br><span class="soft text-xs">Waze busca la calle escrita; puede no llegar exacto</span></span></button>`;
    },
    save: async () => {
      const d = W.d;
      if (d.geo) await updateDoc(doc(db, bpath("settings", "general")), { geo: d.geo, geoMode: "gps" });
      else if (d.geoMode === "address") await updateDoc(doc(db, bpath("settings", "general")), { geoMode: "address" });
    } },
  { id: "telegram", skipTxt: "Lo conecto después (no recibirás avisos)", html: () => {
      const on = !!A.tg?.owner;
      return `<span class="inline-block rounded-full px-2.5 py-1 text-[11px] font-extrabold" style="background:#fff3dc;color:#9a5a00">⭐ PASO MÁS IMPORTANTE</span>
      <h3 class="wz-h mt-2">Recibe tus citas en Telegram</h3>
      <p class="wz-sub">Te llega cada reserva al instante y <b>apruebas los abonos con un toque</b>, sin abrir el panel.</p>
      <div class="rounded-2xl p-2.5" style="background:#e7f1fb"><div class="rounded-2xl rounded-bl-sm bg-white p-2.5 text-[12.5px] leading-snug shadow-sm">💈 <b>NUEVA RESERVA</b> R-8K2PQ<br>Juan Pérez · Corte + barba<br>Hoy 3:30 p. m.<br>Abono $5.000 · 📎 comprobante</div>
        <div class="mt-1.5 grid grid-cols-2 gap-1.5 text-center text-xs font-bold" style="color:#2a7bc0"><span class="rounded-xl bg-white py-2">✅ Aprobar</span><span class="rounded-xl bg-white py-2">❌ Rechazar</span></div></div>
      ${on ? `<div class="mt-3 rounded-2xl p-4 text-center font-extrabold" style="background:#e2f5ec;color:#16774b">✓ ¡Telegram conectado! Te llegó un mensaje de bienvenida.</div>` : `
      <div class="sp-card mt-3 text-[13.5px] leading-relaxed">
        <p><b>1.</b> ¿No tienes Telegram? Instálalo gratis:</p>
        <div class="my-2 grid grid-cols-2 gap-2"><a class="btn-light text-center text-sm" target="_blank" rel="noopener" href="https://play.google.com/store/apps/details?id=org.telegram.messenger"><i class="fa-brands fa-google-play"></i> Android</a><a class="btn-light text-center text-sm" target="_blank" rel="noopener" href="https://apps.apple.com/app/telegram-messenger/id686449807"><i class="fa-brands fa-apple"></i> iPhone</a></div>
        <p><b>2.</b> Toca <b>Conectar</b>: se abre Telegram. Allá toca <b>Iniciar</b>.</p>
        <p><b>3.</b> Vuelve aquí: esta pantalla se pone en verde sola.</p>
      </div>
      <button type="button" id="wTgGo" class="mt-3 w-full rounded-2xl py-3.5 text-[15px] font-extrabold text-white" style="background:#2a9ee0"><i class="fa-brands fa-telegram"></i> Conectar mi Telegram</button>
      <p id="wTgWait" class="soft mt-2 hidden text-center text-sm"><span class="spin mr-1"></span>Esperando que toques Iniciar en Telegram…</p>`}`;
    } },
  { id: "done", essential: true, next: "Ir a mi panel", html: () => {
      const d = W.d, link = $("linkUrl").textContent;
      const ok = (b, t) => `<span class="${b ? "" : "soft line-through"}">${b ? "✓" : "○"} ${t}</span>`;
      return `<p class="text-5xl">🎉</p><h3 class="wz-h">¡Tu agenda está lista!</h3><p class="wz-sub">Ya puedes recibir reservas. Comparte tu enlace de citas:</p>
      <div class="sp-card"><p class="soft text-[11px] font-bold">TU ENLACE DE CITAS</p><p class="mt-1 break-all font-mono text-[12.5px]">${esc(link)}</p></div>
      <div class="mt-2 grid grid-cols-4 gap-2 text-center text-[11.5px] font-semibold">
        <button class="link-act" data-link="wa"><i class="fa-brands fa-whatsapp"></i>WhatsApp</button><button class="link-act" data-link="qr"><i class="fa-solid fa-qrcode"></i>QR</button>
        <button class="link-act" data-link="share"><i class="fa-solid fa-share-nodes"></i>Compartir</button><button class="link-act" data-link="copy"><i class="fa-regular fa-copy"></i>Copiar</button></div>
      <div class="sp-card mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">${ok(d.name, "Negocio")}${ok(d.logo, "Logo")}${ok(Object.values(d.social).some(Boolean), "Redes")}${ok(true, d.count + (d.count === 1 ? " persona" : " personas"))}${ok(d.days.size, "Horario")}${ok(true, "Servicios")}${ok(true, d.deposit ? "Abono" : "Sin abono")}${ok(d.geo || d.geoMode === "address", "Ubicación")}${ok(A.tg?.owner, "Telegram")}</div>
      <p class="soft mt-2 text-xs">Lo pendiente queda en la Guía de configuración (menú de tu inicial).</p>`;
    } }
];
function openWizard(start) {
  if (!A.settings) return;
  wizInit();
  W.i = Math.min(Number(start ?? A.settings.setupStep ?? 0) || 0, STEPS.length - 1);
  W.open = true;
  let el = $("wizard");
  if (!el) {
    el = document.createElement("div");
    el.id = "wizard"; el.className = "wizard"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Asistente de inicio");
    document.body.appendChild(el);
    el.addEventListener("click", wizClick); el.addEventListener("input", wizInput); el.addEventListener("change", wizChange);
  }
  document.body.classList.add("wiz-on");
  drawWizard();
}
function drawWizard() {
  const st = STEPS[W.i], el = $("wizard");
  el.innerHTML = `<div class="wz-top"><button type="button" class="wz-x" data-wx="close" aria-label="Cerrar">✕</button><span class="soft text-xs font-bold">Paso ${W.i + 1} de ${STEPS.length}</span><span class="wz-bar"><i style="width:${((W.i + 1) / STEPS.length) * 100}%"></i></span></div>
    <div class="wz-body q-pop">${st.html()}</div>
    <div class="wz-foot">${W.i ? `<button type="button" class="btn-light !px-5" data-wx="back">Atrás</button>` : ""}<button type="button" class="btn-primary flex-1 py-3.5 text-base" data-wx="next">${st.next || "Siguiente"}</button></div>
    ${st.essential ? "" : `<button type="button" class="wz-skip" data-wx="skip">${st.skipTxt || "Lo hago después"}</button>`}`;
  el.querySelector(".wz-body").scrollTop = 0;
  if (st.id === "telegram") wizWatchTg();
}
async function wizClick(e) {
  const d = W.d, t = e.target;
  const x = t.closest("[data-wx]");
  if (x) {
    const act = x.dataset.wx;
    if (act === "close") {
      if (!(await uiConfirm("¿Terminar después?", "Lo que ya guardaste queda listo. El resto lo encuentras en la Guía de configuración, en el menú de tu inicial.", { okText: "Salir", cancelText: "Seguir" }))) return;
      return closeWizard(true);
    }
    if (act === "back") { W.i--; return drawWizard(); }
    if (act === "skip") { W.i++; updateDoc(doc(db, bpath("settings", "general")), { setupStep: W.i }).catch(() => {}); return drawWizard(); }
    if (act === "next") {
      const st = STEPS[W.i];
      if (st.id === "done") return closeWizard(true);
      setBusy(x, true, "Guardando…");
      try {
        if (st.save) await st.save();
        W.i++;
        updateDoc(doc(db, bpath("settings", "general")), { setupStep: W.i }).catch(() => {});
        drawWizard();
      } catch (err) { toast(err.message, "error"); setBusy(x, false); }
      return;
    }
  }
  const ty = t.closest("[data-wtype]"); if (ty) { d.name = $("wName").value; d.address = $("wAddr").value; d.city = $("wCity").value; d.phone = $("wPhone").value; d.type = ty.dataset.wtype; return drawWizard(); }
  const ct = t.closest("[data-wcount]"); if (ct) { document.querySelectorAll("[data-wname]").forEach((i) => { d.names[Number(i.dataset.wname)] = i.value; }); d.count = Number(ct.dataset.wcount); return drawWizard(); }
  const dy = t.closest("[data-wday]"); if (dy) { const k = Number(dy.dataset.wday); d.days.has(k) ? d.days.delete(k) : d.days.add(k); return drawWizard(); }
  const lu = t.closest("[data-wlunch]"); if (lu) { d.lunch = lu.dataset.wlunch === "1"; return drawWizard(); }
  const sl = t.closest("[data-wslot]"); if (sl) { d.slot = Number(sl.dataset.wslot); return drawWizard(); }
  const sv = t.closest("[data-wsvc]"); if (sv) { document.querySelectorAll("[data-wprice]").forEach((i) => { d.svc[i.dataset.wprice].price = Number(i.value || 0); }); d.svc[sv.dataset.wsvc].on = !d.svc[sv.dataset.wsvc].on; return drawWizard(); }
  const dp = t.closest("[data-wdep]"); if (dp) { if ($("wPmAcc")) { d.pmAccount = $("wPmAcc").value; d.pmHolder = $("wPmHolder").value; } d.deposit = Number(dp.dataset.wdep); return drawWizard(); }
  const pl = t.closest("[data-wpml]"); if (pl) { if ($("wPmAcc")) { d.pmAccount = $("wPmAcc").value; d.pmHolder = $("wPmHolder").value; } d.pmLabel = pl.dataset.wpml; return drawWizard(); }
  const ge = t.closest("[data-wgeo]");
  if (ge) {
    if (ge.dataset.wgeo === "address") { d.geo = null; d.geoMode = "address"; return drawWizard(); }
    if (!navigator.geolocation) return toast("Este dispositivo no permite leer la ubicación.", "error");
    toast("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition((p) => {
      d.geo = { lat: Math.round(p.coords.latitude * 1e6) / 1e6, lng: Math.round(p.coords.longitude * 1e6) / 1e6, acc: Math.round(p.coords.accuracy) };
      d.geoMode = "gps"; drawWizard();
      if (d.geo.acc > 150) toast(`Precisión aproximada de ${d.geo.acc} m. Si puedes, hazlo desde el celular dentro de tu local.`, "error");
    }, (err) => toast(err.code === 1 ? "Permite el acceso a la ubicación (ícono del candado junto a la dirección) o usa solo tu dirección." : "No se pudo leer la ubicación. Intenta de nuevo.", "error"), { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
    return;
  }
  if (t.closest("#wTgGo")) {
    const btn = $("wTgGo"); setBusy(btn, true, "Abriendo Telegram…");
    let bot = "";
    try { bot = ((await getDoc(doc(db, "platform", "public"))).data()?.telegramBot || "").replace(/^@/, "").trim(); } catch { /* sin bot */ }
    if (!bot) { setBusy(btn, false); return toast("El bot de la plataforma aún no está listo. Avísale a soporte.", "error"); }
    const code = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
    try { await setDoc(doc(db, "telegramLinks", code), { businessId: bpath().split("/")[1], target: "owner", createdAt: serverTimestamp() }); }
    catch (err) { setBusy(btn, false); return toast(err.message, "error"); }
    window.open(`https://t.me/${bot}?start=${code}`, "_blank");
    setBusy(btn, false); btn.innerHTML = '<i class="fa-brands fa-telegram"></i> Abrir Telegram otra vez';
    $("wTgWait")?.classList.remove("hidden");
  }
}
function wizInput(e) {
  const t = e.target, d = W.d;
  if (t.dataset.wt) { d[t.dataset.wt] = t.value; clearTimeout(W.tT); W.tT = setTimeout(() => { const pos = t.dataset.wt; drawWizard(); document.querySelector(`[data-wt="${pos}"]`)?.focus(); }, 700); }
}
async function wizChange(e) {
  const t = e.target, d = W.d;
  if (t.id === "wLogo" && t.files[0]) { d.name = $("wName").value; d.address = $("wAddr").value; d.city = $("wCity").value; d.phone = $("wPhone").value; d.logoNew = await imgToDataUrl(t.files[0], 420, "image/jpeg"); drawWizard(); }
  if (t.id === "wPmQr" && t.files[0]) { if ($("wPmAcc")) { d.pmAccount = $("wPmAcc").value; d.pmHolder = $("wPmHolder").value; } d.pmQr = await imgToDataUrl(t.files[0], 480, "image/jpeg"); drawWizard(); }
}
function wizWatchTg() {
  clearInterval(W.tgT);
  W.tgT = setInterval(() => {
    if (!W.open || STEPS[W.i].id !== "telegram") return clearInterval(W.tgT);
    if (A.tg?.owner) { clearInterval(W.tgT); toast("¡Telegram conectado! Ya te llegarán los avisos."); drawWizard(); }
  }, 1500);
}
function closeWizard(done) {
  W.open = false; clearInterval(W.tgT);
  $("wizard")?.remove(); document.body.classList.remove("wiz-on");
  if (done) updateDoc(doc(db, bpath("settings", "general")), { setupDone: true }).catch(() => {});
  renderHome();
}
document.addEventListener("click", (e) => { if (e.target.closest("[data-wizopen]")) { closeMenus(); openWizard(0); } });
