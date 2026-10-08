// Panel del superusuario: crear y vender barberías, planes, pagos y suspensiones
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_VERSION, readPublishedVersion, reloadFresh, startUpdateWatcher, uiConfirm, uiPrompt, setDialogBrand, db, auth, api, bogNow, addDays, fechaLarga, fechaCorta, cop, esc, toMillis, toast, openModal, closeModal, setBusy, copyText } from "./common.js?v=2026-10-09k";

const $ = (id) => document.getElementById(id);
const show = (id, on) => $(id).classList.toggle("hidden", !on);
const Z = { list: [], billing: {}, stats: {}, unsubs: [], q: "", payments: [], orders: [], goal: 0, filter: "all", settings: {} };
const base = location.origin + location.pathname.replace(/super\.html$/, "");
const publicUrl = (slug) => `${base}index.html?b=${slug}`;
const adminUrl = (slug) => `${base}admin.html?b=${slug}`;

// ================= Sesión =================
onAuthStateChanged(auth, async (u) => {
  Z.unsubs.forEach((f) => f()); Z.unsubs = [];
  show("loginView", !u); show("btnAvatar", !!u);
  if (!u) { show("appView", false); show("deniedView", false); show("spNav", false); $("who").textContent = ""; $("hello").textContent = "Panel de la plataforma"; $("helloSub").textContent = ""; return; }
  const s = await getDoc(doc(db, "superusers", u.uid)).catch(() => null);
  if (!s?.exists()) { show("deniedView", true); show("appView", false); $("who").textContent = u.email; return; }
  $("who").textContent = u.email;
  const first = (u.email.match(/^[a-záéíóúñ]+/i) || ["Hola"])[0];
  $("hello").textContent = "Hola, " + first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  $("btnAvatar").textContent = first.charAt(0).toUpperCase();
  show("spNav", true);
  setDialogBrand("Agendador · superusuario");
  $("txtVersion").textContent = "Versión de esta página: " + APP_VERSION;
  show("deniedView", false); show("appView", true);
  start();
});
$("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector("button[type=submit]");
  setBusy(btn, true, "Ingresando…");
  try { await signInWithEmailAndPassword(auth, f.email.value.trim(), f.password.value); }
  catch { toast("Correo o contraseña incorrectos.", "error"); }
  finally { setBusy(btn, false); }
});
$("btnForgot").onclick = async () => {
  const email = $("loginForm").email.value.trim();
  if (!email) return toast("Escribe tu correo y vuelve a tocar “Olvidé mi contraseña”.", "error");
  try { await sendPasswordResetEmail(auth, email); toast("Te enviamos un correo para cambiar la contraseña."); }
  catch { toast("No se pudo enviar el correo.", "error"); }
};
$("btnLogout").onclick = () => signOut(auth);
$("btnAvatar").onclick = (e) => { e.stopPropagation(); $("avatarMenu").classList.toggle("hidden"); };
document.addEventListener("click", (e) => { if (!e.target.closest("#avatarMenu")) $("avatarMenu").classList.add("hidden"); });

// ================= Navegación =================
let SV = "home";
function goSV(v) {
  SV = v;
  document.querySelectorAll(".sv").forEach((x) => x.classList.toggle("hidden", x.id !== "sv-" + v));
  document.querySelectorAll("[data-sv]").forEach((x) => x.setAttribute("aria-current", x.dataset.sv === v ? "page" : "false"));
  if (v === "money") loadPlanCfg();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
$("spNav").addEventListener("click", (e) => { const b = e.target.closest("[data-sv]"); if (b) goSV(b.dataset.sv); });
document.querySelectorAll("[data-mseg]").forEach((b) => b.onclick = () => {
  document.querySelectorAll("[data-mseg]").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
  document.querySelectorAll(".mseg").forEach((x) => x.classList.toggle("hidden", x.id !== "m-" + b.dataset.mseg));
});
function goMoney(seg) { goSV("money"); document.querySelector(`[data-mseg="${seg}"]`).click(); }

function start() {
  Z.unsubs.push(onSnapshot(collection(db, "businesses"), (q) => {
    Z.list = q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    Z.list.forEach((b) => {
      if (Z.billing[b.id] !== undefined) return;
      Z.billing[b.id] = null;
      Z.unsubs.push(onSnapshot(doc(db, "businesses", b.id, "private", "billing"), (s) => { Z.billing[b.id] = s.data() || {}; render(); }));
      getDoc(doc(db, "businesses", b.id, "settings", "general")).then((s) => { Z.settings[b.id] = s.data() || {}; render(); }).catch(() => {});
    });
    render();
  }, (e) => toast("Error leyendo las tiendas: " + e.message, "error")));
  Z.unsubs.push(onSnapshot(query(collection(db, "platformPayments"), orderBy("at", "desc"), limit(60)), (q) => {
    Z.payments = q.docs.map((d) => d.data()); renderPayments(); render();
  }, () => {}));
  Z.unsubs.push(onSnapshot(query(collection(db, "platformOrders"), where("status", "==", "pending")), (q) => {
    Z.orders = q.docs.map((d) => ({ id: d.id, ...d.data() })).filter((o) => toMillis(o.expiresAt) > Date.now()); renderOrders(); render();
  }, () => {}));
  Z.unsubs.push(onSnapshot(doc(db, "platform", "public"), (s) => { $("botUser").value = s.data()?.telegramBot || ""; }, () => {}));
  Z.unsubs.push(onSnapshot(doc(db, "platform", "telegram"), (s) => { $("tgSuperState").textContent = s.data()?.super ? "Conectado ✓" : "Sin conectar"; }, () => {}));
  Z.unsubs.push(onSnapshot(doc(db, "platform", "private"), (s) => { Z.goal = Number(s.data()?.goalCOP || 0); $("goalInput").value = Z.goal || ""; render(); }, () => {}));
  api("superOverview", {}).then((r) => { Z.stats = r || {}; render(); }).catch(() => {});
}

// ================= Estado de cada tienda =================
function daysLeft(b) {
  if (!b?.paidUntil) return null;
  return Math.round((Date.parse(b.paidUntil + "T00:00:00-05:00") - Date.parse(bogNow().date + "T00:00:00-05:00")) / 86400000);
}
// ok · trial · due · late · off
function stateOf(biz) {
  const bl = Z.billing[biz.id] || {};
  if (biz.status !== "active") return "off";
  const d = daysLeft(bl);
  if (bl.mode === "monthly" && d !== null && d < 0) return "late";
  if (biz.trial || bl.trial) return "trial";
  if (bl.mode === "monthly" && d !== null && d <= 7) return "due";
  return "ok";
}
const STATE_TXT = { ok: "Al día", trial: "Prueba", due: "Vence pronto", late: "Vencida", off: "Pausada" };
const STATE_COLOR = { ok: "var(--mint)", trial: "var(--sky)", due: "var(--amber)", late: "var(--sred)", off: "#8a94a8" };
const initials = (n) => (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const logoOf = (id) => Z.settings[id]?.appearance?.logo || "";
function planLine(b) {
  if (!b) return "Cargando plan…";
  if (b.mode === "monthly") {
    const d = daysLeft(b);
    if (d === null) return `Mensual de ${cop(b.priceCOP)} sin fecha`;
    const when = d < 0 ? `venció hace ${-d} día${d === -1 ? "" : "s"}` : d === 0 ? "vence hoy" : `${b.trial ? "prueba hasta" : "vence"} el ${fechaCorta(b.paidUntil)}`;
    return `${b.trial ? "Prueba gratis" : "Mensual " + cop(b.priceCOP)}, ${when}`;
  }
  if (b.mode === "one_time") return `Pago único ${b.paidOnce ? "pagado" : "pendiente"}`;
  return "Control manual";
}
const phoneOf = (id) => String(Z.billing[id]?.ownerPhone || Z.settings[id]?.whatsapp || "").replace(/\D/g, "");
function waTo(id, text) {
  let ph = phoneOf(id);
  if (!ph) return toast("Esta tienda no tiene WhatsApp guardado.", "error");
  if (ph.length === 10) ph = "57" + ph;
  window.open(`https://wa.me/${ph}?text=${encodeURIComponent(text)}`, "_blank");
}
function msgFor(kind, biz) {
  const bl = Z.billing[biz.id] || {};
  const panel = adminUrl(biz.id);
  if (kind === "late") return `Hola, el plan de ${biz.name} en la agenda en línea venció el ${fechaLarga(bl.paidUntil)}. Para seguir recibiendo reservas renuévalo desde “Mi plan” en tu panel: ${panel}`;
  if (kind === "due") return `Hola, el plan de ${biz.name} vence el ${fechaLarga(bl.paidUntil)}. Puedes renovarlo desde “Mi plan” en tu panel: ${panel}`;
  if (kind === "trial") return `Hola, ¿cómo te va con la agenda de ${biz.name}? Tu prueba gratis termina el ${fechaLarga(bl.paidUntil)}. Si activas tu plan desbloqueas todas las funciones: ${panel}`;
  return `Hola, te escribo por la agenda en línea de ${biz.name}. Tu panel: ${panel}`;
}

const dm = (date) => { const [y, m, d] = date.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-CO", { timeZone: "UTC", day: "numeric", month: "short" }).replace(".", ""); };
// ================= Pintar todo =================
function render() {
  renderLane(); renderTodo(); renderMonth(); renderBiz();
  $("ordersBadge").textContent = Z.orders.length ? `(${Z.orders.length})` : "";
}
function renderLane() {
  const lane = $("lane"); if (!lane) return;
  const PAST = 7, FUT = 30, span = PAST + FUT;
  const x = (d) => Math.min(97, Math.max(3, ((d + PAST) / span) * 100));
  const todayX = (PAST / span) * 100;
  const today = bogNow().date;
  const ticks = [7, 14, 21, 28].map((d) => `<span class="tick" style="left:${x(d)}%"></span><span class="tl" style="left:${x(d)}%">${dm(addDays(today, d))}</span>`).join("");
  const onLane = Z.list.map((b) => ({ b, d: daysLeft(Z.billing[b.id]) })).filter((o) => Z.billing[o.b.id]?.mode === "monthly" && o.d !== null && o.d <= FUT).sort((p, q) => p.d - q.d);
  const lastX = [];
  const pins = onLane.map((o, i) => {
    const st = stateOf(o.b), px = x(o.d);
    let level = 0; while (lastX.some((l) => l.level === level && Math.abs(l.x - px) < 9)) level++;
    lastX.push({ x: px, level });
    const top = [6, 40, 22, 56][level % 4];
    const logo = logoOf(o.b.id);
    return `<button class="pin" role="listitem" style="left:${px}%;top:${top}px;color:${STATE_COLOR[st]}" data-store="${o.b.id}" aria-label="${esc(o.b.name)}, ${STATE_TXT[st]}, ${planLine(Z.billing[o.b.id])}" title="${esc(o.b.name)}">
      <b class="t-${st}">${logo ? `<img src="${logo}" alt="">` : esc(initials(o.b.name))}</b><i></i></button>`;
  }).join("");
  lane.innerHTML = `<div class="zone" style="width:${todayX}%"></div><div class="axis"></div>${ticks}
    <span class="tl" style="left:${todayX / 2}%;color:var(--sred);font-weight:700">vencidas</span>
    <div class="today" style="left:${todayX}%"><span>Hoy</span></div>${pins}`;
  const off = Z.list.length - onLane.length;
  $("laneOff").textContent = off > 0 ? `${off} sin vencimiento cercano` : "";
}
function tasks() {
  const out = [];
  Z.list.forEach((b) => {
    const bl = Z.billing[b.id]; if (!bl) return;
    const d = daysLeft(bl), st = stateOf(b);
    if (bl.pendingProof) out.push({ w: 0, ic: "fa-receipt", tone: "t-trial", txt: `<b>${esc(b.name)}</b> envió un comprobante por ${cop(bl.pendingProof.amountCOP)}. Apruébalo en Telegram o regístralo aquí.`, act: "Registrar", fn: () => handleAct("pay", b, null) });
    if (st === "off" && b.suspendReason === "Plan vencido") out.push({ w: 1, ic: "fa-circle-pause", tone: "t-late", txt: `<b>${esc(b.name)}</b> está pausada por falta de pago.`, act: "Cobrar", fn: () => waTo(b.id, msgFor("late", b)) });
    else if (st === "late") {
      const left = bl.autoSuspend ? Number(bl.graceDays || 0) + d : null;
      out.push({ w: 1, ic: "fa-triangle-exclamation", tone: "t-late", txt: `<b>${esc(b.name)}</b> venció hace ${-d} día${d === -1 ? "" : "s"}${left !== null ? (left > 0 ? ` y se pausa en ${left} día${left === 1 ? "" : "s"}` : " y se pausa hoy") : ""}.`, act: "Cobrar", fn: () => waTo(b.id, msgFor("late", b)) });
    } else if (st === "trial" && d !== null && d <= 5) {
      const n = Z.stats[b.id]?.monthAppointments;
      out.push({ w: 3, ic: "fa-wand-magic-sparkles", tone: "t-trial", txt: `<b>${esc(b.name)}</b> termina su prueba ${d === 0 ? "hoy" : `en ${d} día${d === 1 ? "" : "s"}`}${n ? ` y lleva ${n} citas este mes` : ""}. Buen momento para ofrecerle el plan.`, act: "Escribir", fn: () => waTo(b.id, msgFor("trial", b)) });
    } else if (st === "due" && d <= 3) out.push({ w: 2, ic: "fa-clock", tone: "t-due", txt: `<b>${esc(b.name)}</b> vence ${d === 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`}.`, act: "Recordar", fn: () => waTo(b.id, msgFor("due", b)) });
  });
  Z.orders.forEach((o) => out.push({ w: 0, ic: "fa-bolt", tone: "t-trial", txt: `<b>${esc(o.businessName)}</b> generó un pago Bre-B de ${cop(o.amountCOP)}. Si ya te llegó y no se activó solo, apruébalo.`, act: "Revisar", fn: () => goMoney("orders") }));
  return out.sort((a, b) => a.w - b.w);
}
let TASKS = [];
function renderTodo() {
  TASKS = tasks();
  const n = TASKS.length;
  $("helloSub").textContent = !Z.list.length ? "Crea tu primera tienda con el botón +." : n === 0 ? "Todo al día. Nada pendiente por hoy." : `${n === 1 ? "Una tienda necesita" : n + " cosas necesitan"} algo de ti hoy.`;
  $("todoCount").textContent = n ? `${n} pendiente${n === 1 ? "" : "s"}` : "";
  $("todo").innerHTML = TASKS.slice(0, 8).map((t, i) => `<div class="todo"><span class="ic ${t.tone}"><i class="fa-solid ${t.ic}"></i></span>
    <p class="min-w-0 flex-1 text-[13.5px] leading-snug">${t.txt}</p><button class="act ${t.tone}" data-task="${i}">${t.act}</button></div>`).join("")
    || `<div class="todo"><span class="ic t-ok"><i class="fa-solid fa-check"></i></span><p class="flex-1 text-[13.5px]">No hay cobros vencidos, pruebas por terminar ni pagos por revisar.</p></div>`;
}
$("todo").addEventListener("click", (e) => { const b = e.target.closest("[data-task]"); if (b) TASKS[Number(b.dataset.task)]?.fn(); });
function renderMonth() {
  const month = bogNow().date.slice(0, 7);
  const monthName = new Date(month + "-15T12:00:00").toLocaleDateString("es-CO", { month: "long" });
  const income = Z.payments.filter((p) => new Date(toMillis(p.at) - 5 * 3600000).toISOString().slice(0, 7) === month).reduce((s, p) => s + Number(p.amountCOP || 0), 0);
  const pend = Z.list.filter((b) => ["late", "due"].includes(stateOf(b)) || (stateOf(b) === "off" && b.suspendReason === "Plan vencido"));
  const pendSum = pend.reduce((s, b) => s + Number(Z.billing[b.id]?.priceCOP || 0), 0);
  const pct = Z.goal ? Math.min(100, Math.round((income / Z.goal) * 100)) : 0;
  const names = pend.slice(0, 2).map((b) => b.name).join(" y ");
  $("month").innerHTML = `
    <div class="flex items-baseline justify-between"><span class="soft text-sm capitalize">${monthName}</span><span class="soft text-xs">${Z.goal ? "meta " + cop(Z.goal) : `<button class="underline" data-gomore="1">Definir meta</button>`}</span></div>
    <p class="disp mt-1 text-[32px] font-extrabold leading-none">${cop(income)}</p>
    ${Z.goal ? `<div class="mt-3 flex gap-[3px]" role="img" aria-label="${pct}% de la meta"><span style="flex:${pct};height:8px;background:var(--sblue);border-radius:8px 2px 2px 8px"></span><span style="flex:${100 - pct};height:8px;background:var(--hair);border-radius:2px 8px 8px 2px"></span></div>` : ""}
    <p class="soft mt-2 text-xs">${pend.length ? `Si cobras a ${esc(names)}${pend.length > 2 ? ` y ${pend.length - 2} más` : ""} sumas ${cop(pendSum)}.` : `${Z.payments.filter((p) => new Date(toMillis(p.at) - 5 * 3600000).toISOString().slice(0, 7) === month).length} pago(s) recibidos este mes.`}</p>`;
}
$("month").addEventListener("click", (e) => { if (e.target.closest("[data-gomore]")) goSV("more"); });
$("lane").addEventListener("click", (e) => { const b = e.target.closest("[data-store]"); if (b) openStore(Z.list.find((x) => x.id === b.dataset.store)); });

const FILTERS = [["all", "Todas"], ["trial", "En prueba"], ["due", "Por vencer"], ["late", "Vencidas"], ["off", "Pausadas"]];
function renderBiz() {
  const counts = {}; Z.list.forEach((b) => { const s = stateOf(b); counts[s] = (counts[s] || 0) + 1; });
  $("bizFilters").innerHTML = FILTERS.map(([k, t]) => `<button class="fchip" data-f="${k}" aria-pressed="${Z.filter === k}">${t}${k === "all" ? ` ${Z.list.length}` : counts[k] ? ` ${counts[k]}` : ""}</button>`).join("");
  const q = Z.q.trim().toLowerCase();
  const list = Z.list.filter((b) => (Z.filter === "all" || stateOf(b) === Z.filter)
    && (!q || (b.name + " " + b.id + " " + (Z.billing[b.id]?.ownerEmail || "")).toLowerCase().includes(q)));
  $("list").innerHTML = list.map((b) => {
    const st = stateOf(b), logo = logoOf(b.id), sx = Z.stats[b.id];
    return `<button class="srow" data-store="${b.id}">
      <span class="av t-${st}">${logo ? `<img src="${logo}" alt="">` : esc(initials(b.name))}</span>
      <span class="min-w-0 flex-1"><span class="block truncate text-[15px] font-bold">${esc(b.name)}</span>
        <span class="soft block truncate text-xs">${planLine(Z.billing[b.id])}${sx && !sx.error ? `, ${sx.monthAppointments} citas este mes` : ""}</span></span>
      <span class="tag t-${st}">${STATE_TXT[st]}</span><i class="fa-solid fa-chevron-right soft text-xs"></i></button>`;
  }).join("") || `<p class="soft p-5 text-center text-sm">${Z.list.length ? "Ninguna tienda coincide." : "Aún no tienes tiendas. Toca + para crear la primera."}</p>`;
}
$("bizFilters").addEventListener("click", (e) => { const b = e.target.closest("[data-f]"); if (b) { Z.filter = b.dataset.f; renderBiz(); } });
$("list").addEventListener("click", (e) => { const b = e.target.closest("[data-store]"); if (b) openStore(Z.list.find((x) => x.id === b.dataset.store)); });
function renderPayments() {
  $("payments").innerHTML = Z.payments.length ? `<ul class="divide-y divide-line">${Z.payments.slice(0, 40).map((p) => `
    <li class="flex justify-between gap-3 py-2.5"><span class="min-w-0"><b>${esc(p.businessName || p.businessId)}</b><br><span class="soft text-xs">${new Date(toMillis(p.at)).toLocaleDateString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short" })}${p.months ? `, ${p.months} mes(es)` : ""}${p.note ? ", " + esc(p.note) : ""}</span></span>
    <span class="shrink-0 font-semibold">${cop(p.amountCOP)}</span></li>`).join("")}</ul>` : `<p class="soft">Todavía no hay pagos registrados.</p>`;
}
function renderOrders() {
  $("orders").innerHTML = Z.orders.length ? Z.orders.map((o) => `<div class="todo"><span class="ic t-trial"><i class="fa-solid fa-bolt"></i></span>
    <div class="min-w-0 flex-1 text-[13.5px] leading-snug"><b>${esc(o.businessName)}</b> debe enviar <b>${cop(o.amountCOP)}</b><br><span class="soft text-xs">${o.months} mes(es), creada ${new Date(toMillis(o.createdAt)).toLocaleString("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span></div>
    <button class="act t-ok" data-approve="${o.id}">Aprobar</button></div>`).join("")
    : `<div class="sp-card soft text-sm">No hay pagos Bre-B esperando. Cuando un dueño genere uno, aparece aquí y se activa solo al llegar el aviso de Nequi.</div>`;
}
$("orders").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-approve]"); if (!b) return;
  const o = Z.orders.find((x) => x.id === b.dataset.approve);
  if (!(await uiConfirm("¿Aprobar este pago?", `Úsalo solo si ya ves en tu Nequi los ${cop(o.amountCOP)} de ${o.businessName}. Se activan ${o.months} mes(es).`, { okText: "Aprobar pago" }))) return;
  setBusy(b, true, "Aprobando…");
  try { const r = await api("superApproveOrder", { orderId: o.id }); toast(`Pago aprobado.${r.paidUntil ? " Activo hasta el " + fechaLarga(r.paidUntil) + "." : ""}`); }
  catch (err) { toast(err.message, "error"); setBusy(b, false); }
});
$("search").oninput = (e) => { Z.q = e.target.value; renderBiz(); };

// ================= Ajustes: mensaje a dueños y meta =================
$("newsSend").onclick = async () => {
  const text = $("newsText").value.trim();
  if (text.length < 5) return toast("Escribe el mensaje.", "error");
  if (!(await uiConfirm("¿Enviar a todos los dueños?", "Les llega por Telegram a quienes lo conectaron.", { okText: "Enviar" }))) return;
  const btn = $("newsSend"); setBusy(btn, true, "Enviando…");
  try { const r = await api("superBroadcast", { text }); $("newsText").value = ""; toast(`Enviado a ${r.sent} dueño(s).${r.skipped ? ` ${r.skipped} no tienen Telegram conectado.` : ""}`); }
  catch (err) { toast(err.message, "error"); }
  finally { setBusy(btn, false); }
};
$("goalSave").onclick = async () => {
  try { await setDoc(doc(db, "platform", "private"), { goalCOP: Math.max(0, Number($("goalInput").value || 0)) }, { merge: true }); toast("Meta guardada."); }
  catch (err) { toast(err.message, "error"); }
};

// ================= Modal =================
function openM(title, html) { $("modalTitle").textContent = title; $("modalBody").innerHTML = html; openModal("modal"); }
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-copy]"); if (c) copyText(c.dataset.copy);
  if (e.target.closest("[data-close]")) closeModal("modal");
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal("modal"); });

// Formulario de plan reutilizable (crear y editar)
function planForm(bl = {}) {
  const mode = bl.mode || "monthly";
  const opt = (v, t, d) => `<label class="flex items-start gap-2 rounded-lg border border-line p-3 text-sm"><input type="radio" name="pMode" value="${v}" class="mt-0.5 h-4 w-4" ${mode === v ? "checked" : ""}><span><b>${t}</b><br><span class="text-ink/60">${d}</span></span></label>`;
  return `
    <p class="mb-2 text-sm font-semibold">¿Cómo le cobras?</p>
    <div class="mb-3 grid gap-2">
      ${opt("monthly", "Mensualidad con vencimiento", "Paga cada mes. Al registrar el pago se corre la fecha de vencimiento.")}
      ${opt("one_time", "Pago único", "Paga una sola vez y la agenda no vence.")}
      ${opt("manual", "Control manual", "Sin fechas: tú la suspendes o activas cuando quieras.")}
    </div>
    <label class="field mb-3"><span id="pPriceLbl">Valor (COP)</span><input id="pPrice" type="number" min="0" step="1000" value="${bl.priceCOP ?? ""}"></label>
    <div id="pMonthly" class="mb-3 grid grid-cols-2 gap-3">
      <label class="field"><span>Pagado hasta</span><input id="pUntil" type="date" value="${bl.paidUntil || addMonths(bogNow().date, 1)}"></label>
      <label class="field"><span>Días de gracia</span><input id="pGrace" type="number" min="0" value="${bl.graceDays ?? 3}"></label>
      <label class="col-span-2 flex items-center gap-2 text-sm"><input id="pAuto" type="checkbox" class="h-4 w-4" ${bl.autoSuspend === false ? "" : "checked"}> Suspender automáticamente si no paga después de los días de gracia</label>
    </div>
    <label id="pOnceWrap" class="mb-3 flex items-center gap-2 text-sm"><input id="pOnce" type="checkbox" class="h-4 w-4" ${bl.paidOnce ? "checked" : ""}> Ya pagó</label>
    <label class="field mb-4"><span>Notas internas (opcional)</span><input id="pNotes" value="${esc(bl.notes || "")}" placeholder="Ej. paga por Nequi los 5 de cada mes"></label>`;
}
function wirePlanForm() {
  const sync = () => {
    const m = document.querySelector("input[name=pMode]:checked")?.value;
    $("pMonthly").classList.toggle("hidden", m !== "monthly");
    $("pOnceWrap").classList.toggle("hidden", m !== "one_time");
    $("pPriceLbl").textContent = m === "monthly" ? "Valor mensual (COP)" : m === "one_time" ? "Valor del pago único (COP)" : "Valor acordado (COP, opcional)";
  };
  document.querySelectorAll("input[name=pMode]").forEach((r) => (r.onchange = sync));
  sync();
}
function readPlan() {
  const mode = document.querySelector("input[name=pMode]:checked").value;
  return {
    mode, priceCOP: Number($("pPrice").value || 0), paidUntil: mode === "monthly" ? $("pUntil").value : "",
    graceDays: Number($("pGrace").value || 0), autoSuspend: $("pAuto").checked, paidOnce: $("pOnce").checked, notes: $("pNotes").value.trim()
  };
}
function addMonths(date, n) {
  const [y, m, d] = date.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1 + n, d));
  if (x.getUTCDate() !== d) x.setUTCDate(0);
  return x.toISOString().slice(0, 10);
}
const slugify = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);

// ================= Nueva barbería =================
$("btnNew").onclick = () => {
  openM("Crear tienda", `
    <label class="field mb-3"><span>Nombre del negocio</span><input id="nName" placeholder="Barbería Don Carlos"></label>
    <label class="field mb-1"><span>Identificador para el enlace</span><input id="nSlug" placeholder="don-carlos"></label>
    <p id="nLink" class="mb-3 break-all text-xs text-ink/60"></p>
    <div class="mb-4 grid grid-cols-2 gap-3">
      <label class="field"><span>Nombre del dueño</span><input id="nOwnerName"></label>
      <label class="field"><span>Correo del dueño</span><input id="nOwnerEmail" type="email"></label>
    </div>
    ${planForm({})}
    <button id="nSave" class="btn-primary w-full">Crear tienda</button>`);
  wirePlanForm();
  let touched = false;
  const upd = () => { $("nLink").textContent = $("nSlug").value ? "Enlace para clientes: " + publicUrl($("nSlug").value) : ""; };
  $("nName").oninput = () => { if (!touched) $("nSlug").value = slugify($("nName").value); upd(); };
  $("nSlug").oninput = () => { touched = true; $("nSlug").value = slugify($("nSlug").value); upd(); };
  $("nSave").onclick = async () => {
    const btn = $("nSave");
    const name = $("nName").value.trim(), slug = $("nSlug").value.trim(), email = $("nOwnerEmail").value.trim();
    if (!name || slug.length < 2) return toast("Escribe el nombre y el identificador.", "error");
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast("Escribe el correo del dueño.", "error");
    setBusy(btn, true, "Creando tienda…");
    try {
      const r = await api("superCreateBusiness", { name, slug, ownerEmail: email, ownerName: $("nOwnerName").value.trim(), billing: readPlan() });
      const msg = `¡Hola! Tu agenda en línea de ${name} ya está lista.\n\nEnlace para tus clientes:\n${publicUrl(r.slug)}\n\nTu panel de administración:\n${adminUrl(r.slug)}\nCorreo: ${r.ownerEmail}\n` +
        (r.tempPassword ? `Contraseña temporal: ${r.tempPassword}\n(Cámbiala con "Olvidé mi contraseña")` : "Entra con la contraseña que ya tienes.");
      openM("Tienda creada", `
        <p class="mb-3">Envíale este mensaje al dueño:</p>
        <pre class="mb-4 whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm">${esc(msg)}</pre>
        <div class="flex flex-wrap gap-2"><button class="btn-primary" data-copy="${esc(msg)}">Copiar mensaje</button>
        <a class="btn-light" target="_blank" rel="noopener" href="${adminUrl(r.slug)}">Abrir su panel</a></div>`);
    } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
  };
};

// ================= Acciones por barbería =================
// Ficha de una tienda: todo lo que puedes hacer con ella
function openStore(biz) {
  if (!biz) return;
  const bl = Z.billing[biz.id] || {}, st = stateOf(biz), sx = Z.stats[biz.id], ph = phoneOf(biz.id);
  const item = (a, ic, t, cls = "") => `<button class="menu-item ${cls}" data-ma="${a}"><i class="fa-solid ${ic}"></i>${t}</button>`;
  openM(biz.name, `
    <div class="-mt-2 mb-4 flex flex-wrap items-center gap-2"><span class="tag t-${st}">${STATE_TXT[st]}</span><span class="soft text-sm">${esc(biz.id)}</span></div>
    <dl class="mb-4 grid grid-cols-2 gap-3 rounded-2xl p-3 text-sm" style="background:var(--canvas)">
      <div class="col-span-2"><dt class="soft text-xs">Plan</dt><dd class="font-semibold">${planLine(bl)}</dd></div>
      <div><dt class="soft text-xs">Dueño</dt><dd class="truncate font-semibold">${esc(bl.ownerEmail || "Sin correo")}</dd></div>
      <div><dt class="soft text-xs">WhatsApp</dt><dd class="font-semibold">${ph ? esc(ph) : "Sin número"}</dd></div>
      ${biz.referredBy ? `<div class="col-span-2"><dt class="soft text-xs">Invitada por</dt><dd class="font-semibold">${esc(Z.list.find((x) => x.id === biz.referredBy)?.name || biz.referredBy)}</dd></div>` : ""}
      ${Number(bl.creditCOP || 0) ? `<div class="col-span-2"><dt class="soft text-xs">Descuento por referidos guardado</dt><dd class="font-semibold">${cop(bl.creditCOP)}</dd></div>` : ""}
      ${sx && !sx.error ? `<div><dt class="soft text-xs">Citas este mes</dt><dd class="font-semibold">${sx.monthAppointments}</dd></div><div><dt class="soft text-xs">Clientes</dt><dd class="font-semibold">${sx.customers}</dd></div>` : ""}
      ${biz.status !== "active" && biz.suspendReason ? `<div class="col-span-2"><dt class="soft text-xs">Motivo de la pausa</dt><dd class="font-semibold">${esc(biz.suspendReason)}</dd></div>` : ""}
    </dl>
    <a class="btn-primary mb-2 block w-full py-3 text-center" href="${adminUrl(biz.id)}">Gestionar todo en su panel</a>
    <div class="mb-3 grid grid-cols-2 gap-2">
      <button class="btn-light text-sm" data-ma="pay">Registrar pago</button>
      <button class="btn-light text-sm" data-ma="wa">Escribir por WhatsApp</button>
    </div>
    <div class="grid gap-0.5 border-t border-line pt-2">
      ${item("edit", "fa-pen", "Editar nombre y plan")}
      ${biz.status === "active" ? item("suspend", "fa-circle-pause", "Pausar la tienda") : item("activate", "fa-circle-play", "Activar la tienda")}
      <a class="menu-item" href="${publicUrl(biz.id)}" target="_blank" rel="noopener"><i class="fa-regular fa-eye"></i>Ver la página de clientes</a>
      <button class="menu-item" data-copy="${publicUrl(biz.id)}"><i class="fa-regular fa-copy"></i>Copiar enlace para clientes</button>
      ${item("pass", "fa-key", "Nueva contraseña del dueño")}
      ${item("delete", "fa-trash-can", "Eliminar tienda", "text-pole-red")}
    </div>`);
  $("modalBody").onclick = (e) => {
    const m = e.target.closest("[data-ma]"); if (!m) return;
    $("modalBody").onclick = null;
    closeModal("modal");
    if (m.dataset.ma === "wa") return waTo(biz.id, msgFor(st, biz));
    handleAct(m.dataset.ma, biz, null);
  };
}
async function handleAct(act, biz, b) {
  b = b || document.createElement("button"); // cuando viene del menú no hay botón que marcar
  const bl = Z.billing[biz.id] || {};
  if (act === "delete") return deleteBusiness(biz);

  if (act === "edit") {
    openM("Editar " + biz.name, `<label class="field mb-4"><span>Nombre del negocio</span><input id="eName" value="${esc(biz.name)}"></label>${planForm(bl)}
      <button id="eSave" class="btn-primary w-full">Guardar</button>`);
    wirePlanForm();
    $("eSave").onclick = async () => {
      const btn = $("eSave"); setBusy(btn, true, "Guardando…");
      try { await api("superUpdateBusiness", { businessId: biz.id, name: $("eName").value.trim(), billing: readPlan() }); closeModal("modal"); toast("Plan actualizado."); }
      catch (err) { toast(err.message, "error"); setBusy(btn, false); }
    };
  }

  if (act === "pay") {
    const monthly = bl.mode === "monthly";
    openM("Registrar pago de " + biz.name, `
      <p class="mb-3 text-sm text-ink/70">${planLine(bl)}</p>
      <div class="mb-3 grid grid-cols-2 gap-3">
        <label class="field"><span>Valor recibido (COP)</span><input id="yAmount" type="number" min="0" step="1000" value="${bl.priceCOP || 0}"></label>
        ${monthly ? `<label class="field"><span>Meses que paga</span><input id="yMonths" type="number" min="1" value="1"></label>` : ""}
      </div>
      ${monthly ? `<p id="yNew" class="mb-3 text-sm"></p>` : ""}
      <label class="field mb-4"><span>Nota (opcional)</span><input id="yNote" placeholder="Ej. Nequi, referencia 1234"></label>
      <button id="ySave" class="btn-primary w-full">Registrar pago</button>`);
    if (monthly) {
      const today = bogNow().date;
      const updNew = () => {
        const baseDate = bl.paidUntil && bl.paidUntil > today ? bl.paidUntil : today;
        const m = Math.max(1, Number($("yMonths").value || 1));
        $("yNew").innerHTML = `Quedará pagado hasta el <b>${fechaLarga(addMonths(baseDate, m))}</b>.`;
        $("yAmount").value = Number(bl.priceCOP || 0) * m;
      };
      $("yMonths").oninput = updNew; updNew();
    }
    $("ySave").onclick = async () => {
      const btn = $("ySave"); setBusy(btn, true, "Registrando…");
      try {
        const r = await api("superRegisterPayment", { businessId: biz.id, amountCOP: Number($("yAmount").value || 0), months: monthly ? Number($("yMonths").value || 1) : 0, note: $("yNote").value.trim() });
        closeModal("modal");
        toast(r.paidUntil ? `Pago registrado. Vence el ${fechaLarga(r.paidUntil)}.${r.reactivated ? " La barbería se reactivó." : ""}` : "Pago registrado.");
      } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
    };
  }

  if (act === "suspend") {
    const reason = await uiPrompt(`Suspender ${biz.name}`, "¿Por qué la suspendes? El dueño recibe un aviso.", "Falta de pago", { okText: "Suspender", danger: true });
    if (reason === null) return;
    setBusy(b, true, "Suspendiendo…");
    try { await api("superSetStatus", { businessId: biz.id, status: "suspended", reason }); toast(biz.name + " quedó suspendida."); }
    catch (err) { toast(err.message, "error"); setBusy(b, false); }
  }

  if (act === "activate") {
    setBusy(b, true, "Activando…");
    try { await api("superSetStatus", { businessId: biz.id, status: "active" }); toast(biz.name + " quedó activa."); }
    catch (err) { toast(err.message, "error"); setBusy(b, false); }
  }

  if (act === "pass") {
    if (!(await uiConfirm("¿Contraseña nueva?", `Se genera una contraseña nueva para el dueño de ${biz.name}. La anterior deja de funcionar.`, { okText: "Generar" }))) return;
    try {
      const r = await api("superResetPassword", { businessId: biz.id });
      const msg = `Panel: ${adminUrl(biz.id)}\nCorreo: ${r.ownerEmail}\nContraseña temporal: ${r.tempPassword}`;
      openM("Contraseña nueva", `<pre class="mb-4 whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm">${esc(msg)}</pre><button class="btn-primary" data-copy="${esc(msg)}">Copiar</button>`);
    } catch (err) { toast(err.message, "error"); }
  }
}

// Eliminar tienda (pide escribir el identificador para evitar errores)
async function deleteBusiness(biz) {
  const typed = await uiPrompt(`Eliminar ${biz.name}`,
    `Se borran para siempre su configuración, servicios, equipo, citas, clientes y accesos al panel. Esto no se puede deshacer. Para confirmar escribe: ${biz.id}`,
    "", { okText: "Eliminar para siempre", danger: true });
  if (typed === null) return;
  if (typed.trim().toLowerCase() !== biz.id) return toast("El identificador no coincide. No se eliminó nada.", "error");
  toast("Eliminando " + biz.name + "…");
  try {
    const r = await api("superDeleteBusiness", { businessId: biz.id, confirm: typed.trim().toLowerCase() });
    toast(`${biz.name} fue eliminada (${r.deleted} registro(s) borrados).`);
  } catch (err) { toast(err.message, "error"); }
}

$("btnOverview").onclick = async () => {
  const btn = $("btnOverview"); setBusy(btn, true, "Contando…");
  try { Z.stats = await api("superOverview", {}); render(); }
  catch (err) { toast(err.message, "error"); }
  finally { setBusy(btn, false); }
};

// ================= Telegram de la plataforma =================
$("btnSaveBot").onclick = async () => {
  const v = $("botUser").value.replace(/^@/, "").trim();
  try { await setDoc(doc(db, "platform", "public"), { telegramBot: v }, { merge: true }); toast("Bot guardado. Ya los dueños pueden conectar su Telegram."); }
  catch (err) { toast(err.message, "error"); }
};
$("btnTgSuper").onclick = async () => {
  const bot = $("botUser").value.replace(/^@/, "").trim();
  if (!bot) return toast("Primero escribe y guarda el usuario del bot.", "error");
  const code = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  try { await setDoc(doc(db, "telegramLinks", code), { businessId: "", target: "super", createdAt: serverTimestamp() }); }
  catch (err) { return toast(err.message, "error"); }
  const link = `https://t.me/${bot}?start=${code}`;
  openM("Conectar tu Telegram", `<p class="mb-3">Abre este enlace en tu celular y toca <b>Iniciar</b>.</p>
    <p class="mb-4 break-all rounded-lg bg-paper p-3 text-sm">${link}</p>
    <a class="btn-primary inline-block" href="${link}" target="_blank" rel="noopener">Abrir Telegram</a>`);
};

// ================= Versión de la página =================
$("btnCheckVersion").onclick = async () => {
  const btn = $("btnCheckVersion"), box = $("versionResult");
  setBusy(btn, true, "Comprobando…");
  try {
    const pub = await readPublishedVersion();
    const nueva = !!pub && pub > APP_VERSION;
    box.classList.remove("hidden");
    box.innerHTML = nueva
      ? `<div class="flex items-center gap-2 rounded-xl border border-sky-300 bg-sky-50 p-2.5 text-xs text-sky-900"><span class="flex-grow">Hay una versión nueva (${esc(pub)}). Actualiza para verla.</span><button type="button" id="btnReloadFresh" class="rounded-lg bg-sky-600 px-2.5 py-1 font-bold text-white">Actualizar</button></div>`
      : `<div class="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-900">✓ Tienes la versión más reciente${pub ? " (" + esc(pub) + ")" : ""}.</div>`;
    if (nueva) $("btnReloadFresh").onclick = reloadFresh;
  } catch (err) {
    box.classList.remove("hidden");
    box.innerHTML = `<div class="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-900">${esc(err.message)}</div>`;
  } finally { setBusy(btn, false); }
};
startUpdateWatcher();

// ================= Cobro: plan, prueba gratis y medios de pago del superusuario =================
let PL = { methods: [] };
const TRIAL_FEATURES = [
  ["clients", "Clientes", "Lista de clientes, notas, preferenciales y bloqueos."],
  ["marketing", "Marketing", "Llenar huecos, estados, aviso destacado y mensajes por Telegram."],
  ["appearance", "Apariencia", "Logo, colores y textos de su página."],
  ["images", "Imágenes", "Imágenes con horarios y QR para compartir."],
  ["team", "Varios profesionales", "Agregar personas al equipo y darles acceso al panel."]
];
async function loadPlanCfg() {
  const pp = (await getDoc(doc(db, "platform", "public")).catch(() => null))?.data() || {};
  $("plName").value = pp.planName || ""; $("plPrice").value = pp.planPriceCOP ?? ""; $("plDays").value = pp.trialDays ?? 30;
  $("plTrial").checked = pp.trialEnabled !== false;
  PL.methods = (pp.payMethods || []).map((m) => ({ ...m }));
  const tr = { daysAhead: 5, locked: ["clients", "marketing", "appearance", "images", "team"], ...(pp.trialRules || {}) };
  $("trDays").value = tr.daysAhead;
  const rf = { enabled: true, levels: [20, 10, 8, 6, 4, 2], capMonths: 3, bonusDays: 7, ...(pp.referral || {}) };
  $("rfOn").checked = rf.enabled !== false; $("rfCap").value = rf.capMonths; $("rfBonus").value = rf.bonusDays;
  $("rfLevels").innerHTML = Array.from({ length: 6 }, (_, i) => `<label class="rounded-xl p-2 text-center" style="background:var(--canvas)"><span class="soft block text-[11px] font-semibold">Nivel ${i + 1}</span>
    <span class="flex items-center justify-center gap-0.5"><input type="number" min="0" max="50" data-rfl="${i}" value="${Number(rf.levels[i] || 0)}" class="w-12 rounded-lg border border-line px-1 py-1 text-center font-bold">%</span></label>`).join("");
  const counts = {}; Z.list.forEach((b) => { if (b.referredBy) counts[b.referredBy] = (counts[b.referredBy] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  $("rfTop").innerHTML = top.length ? `<p class="mb-1 text-sm font-semibold">Los que más invitan</p>${top.map(([id, n], i) => `<p class="flex justify-between border-t border-line py-1.5 text-sm"><span>${i + 1}. ${esc(Z.list.find((b) => b.id === id)?.name || id)}</span><b>${n} invitada${n === 1 ? "" : "s"}</b></p>`).join("")}` : `<p class="soft text-xs">Todavía nadie ha invitado tiendas.</p>`;
  PL.bundles = { ...(pp.planBundles || {}) };
  renderBundles();
  $("trLocks").innerHTML = TRIAL_FEATURES.map(([k, t, d]) => `<label class="flex items-start gap-2 rounded-xl p-2.5 text-sm" style="background:var(--canvas)"><input type="checkbox" class="mt-0.5 h-4 w-4" data-trl="${k}" ${tr.locked.includes(k) ? "checked" : ""}><span><b>${t}</b><br><span class="soft text-xs">${d}</span></span></label>`).join("");
  $("bbOn").checked = !!pp.brebEnabled; $("bbKey").value = pp.brebKey || ""; $("bbHolder").value = pp.brebHolder || ""; $("bbSender").value = pp.brebSender || "nequi";
  PL.brebQr = pp.brebQr || ""; $("bbQrImg").src = PL.brebQr; $("bbQrImg").classList.toggle("hidden", !PL.brebQr);
  renderPlMethods();
}
function readPl() {
  PL.methods = [...document.querySelectorAll("[data-plm]")].map((r) => ({
    label: r.querySelector(".plL").value.trim(), account: r.querySelector(".plA").value.trim(), holder: r.querySelector(".plH").value.trim(),
    qr: PL.methods[Number(r.dataset.plm)]?.qr || ""
  }));
}
function renderPlMethods() {
  $("plMethods").innerHTML = PL.methods.map((m, i) => `<div class="grid gap-2 rounded-lg bg-paper p-2 sm:grid-cols-3" data-plm="${i}">
    <input class="plL rounded border border-line px-2 py-1.5" placeholder="Nequi, Bre-B, Bancolombia…" value="${esc(m.label)}">
    <input class="plA rounded border border-line px-2 py-1.5" placeholder="Número o llave" value="${esc(m.account)}">
    <input class="plH rounded border border-line px-2 py-1.5" placeholder="Titular" value="${esc(m.holder || "")}">
    <div class="flex flex-wrap items-center gap-2 sm:col-span-3">
      ${m.qr ? `<img src="${m.qr}" alt="QR" class="h-12 w-12 rounded border border-line bg-white object-contain">` : ""}
      <label class="btn-sm cursor-pointer">${m.qr ? "Cambiar QR" : "Subir QR (opcional)"}<input type="file" accept="image/*" class="hidden" data-plqr="${i}"></label>
      <button type="button" class="btn-sm" data-plrm="${i}">Quitar</button>
    </div></div>`).join("") || `<p class="text-sm text-ink/60">Agrega al menos un medio de pago.</p>`;
}
// Paquetes: total por 3, 6 y 12 meses, con el ahorro calculado al instante
function renderBundles() {
  const price = Number($("plPrice").value || 0);
  $("plBundles").innerHTML = [3, 6, 12].map((m) => {
    const v = Number(PL.bundles?.[m] || 0), full = price * m, save = v && full > v ? full - v : 0;
    return `<label class="rounded-xl p-2.5" style="background:var(--canvas)"><span class="block text-sm font-bold">${m} meses</span>
      <input type="number" min="0" step="1000" data-bundle="${m}" value="${v || ""}" placeholder="${full ? full : ""}" class="mt-1 w-full rounded-lg border border-line px-2 py-1.5">
      <span class="mt-1 block text-xs ${save ? "font-semibold" : "soft"}" style="${save ? "color:#16774b" : ""}">${save ? `Ahorran ${cop(save)} (-${Math.round((save / full) * 100)}%), ${cop(Math.round(v / m / 100) * 100)} al mes` : `Normal: ${cop(full)}`}</span></label>`;
  }).join("");
}
$("plBundles").addEventListener("input", (e) => {
  const i = e.target.closest("[data-bundle]"); if (!i) return;
  PL.bundles[i.dataset.bundle] = Number(i.value || 0);
  const pos = i.selectionStart; renderBundles();
  const again = document.querySelector(`[data-bundle="${i.dataset.bundle}"]`); again.focus(); try { again.setSelectionRange(pos, pos); } catch { /* number */ }
});
$("plPrice").addEventListener("input", renderBundles);
$("plAdd").onclick = () => { readPl(); PL.methods.push({ label: "", account: "", holder: "", qr: "" }); renderPlMethods(); };
$("plMethods").addEventListener("click", (e) => { const b = e.target.closest("[data-plrm]"); if (b) { readPl(); PL.methods.splice(Number(b.dataset.plrm), 1); renderPlMethods(); } });
$("plMethods").addEventListener("change", async (e) => {
  const inp = e.target.closest("[data-plqr]"); if (!inp || !inp.files[0]) return;
  readPl();
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(inp.files[0]); });
  const max = 480; let w = img.naturalWidth, h = img.naturalHeight;
  if (Math.max(w, h) > max) { const r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
  PL.methods[Number(inp.dataset.plqr)].qr = c.toDataURL("image/jpeg", 0.85);
  renderPlMethods(); toast("QR listo. Toca Guardar.");
});
$("bbQr").onchange = async (e) => {
  const f = e.target.files[0]; if (!f) return;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f); });
  const max = 480; let w = img.naturalWidth, h = img.naturalHeight;
  if (Math.max(w, h) > max) { const r = max / Math.max(w, h); w = Math.round(w * r); h = Math.round(h * r); }
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
  PL.brebQr = c.toDataURL("image/jpeg", 0.85); $("bbQrImg").src = PL.brebQr; $("bbQrImg").classList.remove("hidden");
  toast("QR listo. Toca Guardar.");
};
$("plSave").onclick = async () => {
  readPl();
  const btn = $("plSave"); setBusy(btn, true, "Guardando…");
  try {
    await setDoc(doc(db, "platform", "public"), {
      planName: $("plName").value.trim() || "Plan mensual", planPriceCOP: Number($("plPrice").value || 0),
      trialDays: Math.min(90, Math.max(1, Number($("plDays").value || 30))), trialEnabled: $("plTrial").checked,
      payMethods: PL.methods.filter((m) => m.label && m.account),
      brebEnabled: $("bbOn").checked, brebKey: $("bbKey").value.trim(), brebHolder: $("bbHolder").value.trim(),
      brebSender: $("bbSender").value.trim() || "nequi", brebQr: PL.brebQr || "",
      referral: { enabled: $("rfOn").checked, levels: [...document.querySelectorAll("[data-rfl]")].map((x) => Math.min(50, Math.max(0, Number(x.value || 0)))),
        capMonths: Math.min(12, Math.max(1, Number($("rfCap").value || 3))), bonusDays: Math.min(60, Math.max(0, Number($("rfBonus").value || 0))) },
      planBundles: { 3: Number(PL.bundles?.[3] || 0), 6: Number(PL.bundles?.[6] || 0), 12: Number(PL.bundles?.[12] || 0) }, // 0 = precio normal
      trialRules: { daysAhead: Math.min(60, Math.max(1, Number($("trDays").value || 5))), locked: [...document.querySelectorAll("[data-trl]:checked")].map((x) => x.dataset.trl) }
    }, { merge: true });
    toast("Guardado. Los dueños ya lo ven en “Mi plan”.");
  } catch (err) { toast(err.message, "error"); }
  finally { setBusy(btn, false); }
};
