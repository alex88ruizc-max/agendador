// Panel del superusuario: crear y vender barberías, planes, pagos y suspensiones
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc, setDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { APP_VERSION, readPublishedVersion, reloadFresh, startUpdateWatcher, uiConfirm, uiPrompt, setDialogBrand, db, auth, api, bogNow, addDays, fechaLarga, fechaCorta, cop, esc, toMillis, toast, openModal, closeModal, setBusy, copyText } from "./common.js?v=2026-10-08r";

const $ = (id) => document.getElementById(id);
const show = (id, on) => $(id).classList.toggle("hidden", !on);
const Z = { list: [], billing: {}, stats: {}, unsubs: [], q: "", payments: [] };
const base = location.origin + location.pathname.replace(/super\.html$/, "");
const publicUrl = (slug) => `${base}index.html?b=${slug}`;
const adminUrl = (slug) => `${base}admin.html?b=${slug}`;

// ================= Sesión =================
onAuthStateChanged(auth, async (u) => {
  Z.unsubs.forEach((f) => f()); Z.unsubs = [];
  show("loginView", !u); $("btnLogout").classList.toggle("hidden", !u);
  if (!u) { show("appView", false); show("deniedView", false); $("who").textContent = ""; return; }
  const s = await getDoc(doc(db, "superusers", u.uid)).catch(() => null);
  if (!s?.exists()) { show("deniedView", true); show("appView", false); $("who").textContent = u.email; return; }
  $("who").textContent = u.email + " (superusuario)";
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

// Menú de secciones (igual al del panel de las tiendas)
const SUPER_TABS = [["biz", "Tiendas", "fa-store", "#2563eb"], ["plan", "Cobro", "fa-crown", "#ca8a04"], ["pay", "Pagos", "fa-money-bill-wave", "#059669"], ["tg", "Telegram", "fa-paper-plane", "#0891b2"], ["ver", "Versión", "fa-rotate", "#7c3aed"]];
let superTab = "biz";
function renderSuperTabs() {
  $("tabs").innerHTML = SUPER_TABS.map(([id, t, ic, col]) => `<button class="admin-tab" data-stab="${id}" aria-current="${superTab === id ? "page" : "false"}"><i class="fa-solid ${ic}" style="color:${col}"></i><span>${t}</span></button>`).join("");
}
$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-stab]"); if (!b) return;
  superTab = b.dataset.stab;
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("hidden", p.id !== "sec-" + superTab));
  renderSuperTabs();
  if (superTab === "plan") loadPlanCfg();
});
function start() {
  renderSuperTabs();
  Z.unsubs.push(onSnapshot(collection(db, "businesses"), (q) => {
    Z.list = q.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    Z.list.forEach((b) => {
      if (Z.billing[b.id] !== undefined) return;
      Z.billing[b.id] = null;
      Z.unsubs.push(onSnapshot(doc(db, "businesses", b.id, "private", "billing"), (s) => { Z.billing[b.id] = s.data() || {}; render(); }));
    });
    render();
  }, (e) => toast("Error leyendo barberías: " + e.message, "error")));
  Z.unsubs.push(onSnapshot(query(collection(db, "platformPayments"), orderBy("at", "desc"), limit(30)), (q) => {
    Z.payments = q.docs.map((d) => d.data()); renderPayments(); render();
  }, () => {}));
  Z.unsubs.push(onSnapshot(doc(db, "platform", "public"), (s) => { $("botUser").value = s.data()?.telegramBot || ""; }, () => {}));
  Z.unsubs.push(onSnapshot(doc(db, "platform", "telegram"), (s) => { $("tgSuperState").textContent = s.data()?.super ? "Conectado ✓" : "Sin conectar"; }, () => {}));
}

// ================= Lista =================
function daysLeft(b) {
  if (!b?.paidUntil) return null;
  return Math.round((Date.parse(b.paidUntil + "T00:00:00-05:00") - Date.parse(bogNow().date + "T00:00:00-05:00")) / 86400000);
}
function planLine(b) {
  if (!b) return "Cargando plan…";
  if (b.mode === "monthly") {
    const d = daysLeft(b);
    const when = d === null ? "sin fecha de vencimiento" : d < 0 ? `venció hace ${-d} día(s)` : d === 0 ? "vence hoy" : `vence en ${d} día(s)`;
    return `Mensualidad de ${cop(b.priceCOP)}: ${when}${b.paidUntil ? ` (${fechaLarga(b.paidUntil)})` : ""}.${b.autoSuspend ? ` Se suspende sola tras ${b.graceDays || 0} día(s) de gracia.` : " Suspensión manual."}`;
  }
  if (b.mode === "one_time") return `Pago único de ${cop(b.priceCOP)}: ${b.paidOnce ? "pagado" : "pendiente de pago"}.`;
  return "Control manual: tú decides cuándo suspenderla.";
}
function render() {
  const q = Z.q.trim().toLowerCase();
  const list = Z.list.filter((b) => !q || (b.name + " " + b.id + " " + (Z.billing[b.id]?.ownerEmail || "")).toLowerCase().includes(q));
  const active = Z.list.filter((b) => b.status === "active").length;
  const due = Z.list.filter((b) => { const bl = Z.billing[b.id]; const d = daysLeft(bl); return bl?.mode === "monthly" && d !== null && d <= 7; }).length;
  const month = bogNow().date.slice(0, 7);
  const income = Z.payments.filter((p) => new Date(toMillis(p.at)).toISOString().slice(0, 7) === month).reduce((s, p) => s + Number(p.amountCOP || 0), 0);
  const stat = (n, t) => `<div class="rounded-xl border border-line bg-white px-3 py-2.5"><p class="font-narrow text-2xl font-bold leading-tight">${n}</p><p class="text-xs text-ink/70">${t}</p></div>`;
  $("stats").innerHTML = stat(Z.list.length, "tiendas") + stat(active, "activas") + stat(Z.list.length - active, "suspendidas")
    + stat(due, "vencen en 7 días o ya vencieron") + stat(cop(income), "cobrado este mes");
  $("list").innerHTML = list.map((b) => {
    const bl = Z.billing[b.id];
    const d = daysLeft(bl);
    const warn = bl?.mode === "monthly" && d !== null && d <= 7;
    const st = Z.stats[b.id];
    return `<article class="rounded-xl border ${warn ? "border-amber-400" : "border-line"} bg-white p-3">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="truncate font-narrow text-xl font-bold leading-tight">${esc(b.name)}</p>
          <p class="truncate text-xs text-ink/60">${esc(b.id)}${bl?.ownerEmail ? " · " + esc(bl.ownerEmail) : ""}</p>
        </div>
        <span class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.status === "active" ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"}">${b.status === "active" ? "Activa" : "Suspendida"}</span>
      </div>
      <p class="mt-1.5 text-xs ${warn ? "font-semibold text-amber-900" : "text-ink/70"}">${planLine(bl)}</p>
      ${b.status !== "active" && b.suspendReason ? `<p class="text-xs text-rose-800">Motivo: ${esc(b.suspendReason)}</p>` : ""}
      ${st ? `<p class="text-xs text-ink/60">${st.error ? "Sin estadísticas" : `${st.monthAppointments} cita(s) este mes · ${st.customers} cliente(s)`}</p>` : ""}
      <div class="mt-2.5 flex gap-1.5">
        <a class="btn-sm flex-1 text-center" href="${adminUrl(b.id)}" target="_blank" rel="noopener"><i class="fa-solid fa-gauge"></i> Panel</a>
        <button class="btn-sm flex-1 !border-emerald-600 text-emerald-800" data-a="pay" data-id="${b.id}"><i class="fa-solid fa-money-bill-wave"></i> Pago</button>
        <button class="btn-sm px-3" data-a="more" data-id="${b.id}" aria-label="Más opciones de ${esc(b.name)}"><i class="fa-solid fa-ellipsis-vertical"></i></button>
      </div>
    </article>`;
  }).join("") || `<p class="text-sm text-ink/60">${Z.list.length ? "No hay coincidencias." : "Aún no has creado tiendas. Toca “+ Nueva tienda” para vender la primera."}</p>`;
}
function renderPayments() {
  $("payments").innerHTML = Z.payments.length ? `<ul class="divide-y divide-line">${Z.payments.slice(0, 15).map((p) => `
    <li class="flex justify-between gap-2 py-2"><span><b>${esc(p.businessName || p.businessId)}</b><br><span class="text-ink/60">${new Date(toMillis(p.at)).toLocaleDateString("es-CO", { timeZone: "America/Bogota" })}${p.months ? `, ${p.months} mes(es)` : ""}${p.note ? ", " + esc(p.note) : ""}</span></span>
    <span class="font-semibold">${cop(p.amountCOP)}</span></li>`).join("")}</ul>` : `<p class="text-ink/60">Todavía no hay pagos registrados.</p>`;
}
$("search").oninput = (e) => { Z.q = e.target.value; render(); };

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
  openM("Nueva barbería", `
    <label class="field mb-3"><span>Nombre del negocio</span><input id="nName" placeholder="Barbería Don Carlos"></label>
    <label class="field mb-1"><span>Identificador para el enlace</span><input id="nSlug" placeholder="don-carlos"></label>
    <p id="nLink" class="mb-3 break-all text-xs text-ink/60"></p>
    <div class="mb-4 grid grid-cols-2 gap-3">
      <label class="field"><span>Nombre del dueño</span><input id="nOwnerName"></label>
      <label class="field"><span>Correo del dueño</span><input id="nOwnerEmail" type="email"></label>
    </div>
    ${planForm({})}
    <button id="nSave" class="btn-primary w-full">Crear barbería</button>`);
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
    setBusy(btn, true, "Creando barbería…");
    try {
      const r = await api("superCreateBusiness", { name, slug, ownerEmail: email, ownerName: $("nOwnerName").value.trim(), billing: readPlan() });
      const msg = `¡Hola! Tu agenda en línea de ${name} ya está lista.\n\nEnlace para tus clientes:\n${publicUrl(r.slug)}\n\nTu panel de administración:\n${adminUrl(r.slug)}\nCorreo: ${r.ownerEmail}\n` +
        (r.tempPassword ? `Contraseña temporal: ${r.tempPassword}\n(Cámbiala con "Olvidé mi contraseña")` : "Entra con la contraseña que ya tienes.");
      openM("Barbería creada", `
        <p class="mb-3">Envíale este mensaje al dueño:</p>
        <pre class="mb-4 whitespace-pre-wrap rounded-lg bg-paper p-3 text-sm">${esc(msg)}</pre>
        <div class="flex flex-wrap gap-2"><button class="btn-primary" data-copy="${esc(msg)}">Copiar mensaje</button>
        <a class="btn-light" target="_blank" rel="noopener" href="${adminUrl(r.slug)}">Abrir su panel</a></div>`);
    } catch (err) { toast(err.message, "error"); setBusy(btn, false); }
  };
};

// ================= Acciones por barbería =================
$("list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  const biz = Z.list.find((x) => x.id === b.dataset.id); if (!biz) return;
  if (b.dataset.a === "more") return openMore(biz);
  handleAct(b.dataset.a, biz, b);
});
// Menú completo de una tienda
function openMore(biz) {
  const item = (a, ic, t, extra = "") => `<button class="menu-item" data-ma="${a}" ${extra}><i class="fa-solid ${ic}"></i>${t}</button>`;
  openM(biz.name, `
    <p class="-mt-2 mb-3 text-xs text-ink/60">${esc(biz.id)} · ${biz.status === "active" ? "Activa" : "Suspendida"}</p>
    <div class="grid gap-0.5">
      <a class="menu-item" href="${adminUrl(biz.id)}" target="_blank" rel="noopener"><i class="fa-solid fa-gauge"></i>Abrir su panel</a>
      ${item("pay", "fa-money-bill-wave", "Registrar pago")}
      ${item("edit", "fa-pen", "Editar nombre y plan")}
      ${biz.status === "active" ? item("suspend", "fa-circle-pause", "Suspender") : item("activate", "fa-circle-play", "Activar")}
      <div class="my-1 border-t border-line"></div>
      <a class="menu-item" href="${publicUrl(biz.id)}" target="_blank" rel="noopener"><i class="fa-regular fa-eye"></i>Ver la página de clientes</a>
      <button class="menu-item" data-copy="${publicUrl(biz.id)}"><i class="fa-regular fa-copy"></i>Copiar enlace para clientes</button>
      ${item("pass", "fa-key", "Nueva contraseña del dueño")}
      <div class="my-1 border-t border-line"></div>
      <button class="menu-item text-pole-red" data-ma="delete"><i class="fa-regular fa-trash-can"></i>Eliminar tienda</button>
    </div>`);
  $("modalBody").onclick = (e) => {
    const m = e.target.closest("[data-ma]"); if (!m) return;
    $("modalBody").onclick = null;
    closeModal("modal");
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
async function loadPlanCfg() {
  const pp = (await getDoc(doc(db, "platform", "public")).catch(() => null))?.data() || {};
  $("plName").value = pp.planName || ""; $("plPrice").value = pp.planPriceCOP ?? ""; $("plDays").value = pp.trialDays ?? 30;
  $("plTrial").checked = pp.trialEnabled !== false;
  PL.methods = (pp.payMethods || []).map((m) => ({ ...m }));
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
      brebSender: $("bbSender").value.trim() || "nequi", brebQr: PL.brebQr || ""
    }, { merge: true });
    toast("Guardado. Los dueños ya lo ven en “Mi plan”.");
  } catch (err) { toast(err.message, "error"); }
  finally { setBusy(btn, false); }
};
