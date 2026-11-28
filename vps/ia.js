// 🤖 3.65 · EL ASISTENTE ENTIENDE LO QUE LAS REGLAS NO (Claude, de Anthropic). Idea copiada de Mary de Epic (solo la idea):
//    «la IA entiende y redacta; el código decide». Las reglas de siempre (agendar, cupos, cancelar, cambiar) van PRIMERO y no cambian.
//    La IA solo entra cuando el cliente escribe algo que las reglas no entienden («¿el corte incluye lavado?», «¿aceptan tarjeta?»).
//    Nunca aparta, cancela ni cobra: si el cliente quiere eso, devuelve la ACCIÓN y el flujo de siempre lo hace (con sus revisiones).
//    Solo sabe lo que el dueño puso en el panel (servicios, precios, horario, pagos, «Lo que tu asistente debe saber»). Lo demás:
//    «déjame confirmarlo con el negocio» y le avisa al dueño.
//    La llave (ANTHROPIC_API_KEY) vive en agendador-ia.env del VPS. Nunca en el código ni en el chat.
'use strict';

const MODELO = 'claude-haiku-5-5';   // 3.66: el mismo que Alex eligió en Epic (ESTADO 1288). IA_MODELO lo cambia.
const ACCIONES = ['responder', 'agendar', 'cupos', 'cancelar', 'cambiar', 'dueno', 'nada'];

// Las reglas de trato: fijas (sin datos del negocio) para que se guarden en caché y cuesten menos.
const REGLAS = `Eres el asistente virtual por WhatsApp de un negocio que atiende con cita (barbería, uñas, pestañas, spa, estética, consultorio…).
Le escribes a los clientes del negocio, en Colombia, en español.

Cómo hablas:
- Como una recepcionista amable y despierta: natural, cálida y directa. Nada de frases de robot.
- Mensajes cortos: 1 a 3 frases. Máximo un emoji, y solo si suma.
- Si sabes el nombre del cliente, úsalo de vez en cuando (no en cada mensaje).
- Nunca vuelvas a pedir un dato que el cliente ya dio en la conversación (nombre, servicio, día, hora): úsalo.
- Si el cliente pregunta algo, responde ESA pregunta primero, con los datos que tienes. Nunca la cambies por una oferta, un saludo o la lista de servicios.
- Una sola pregunta a la vez. Si hay varias opciones, pregunta una cosa clara.
- No repitas lo que ya dijiste en la conversación. No saludes otra vez si ya saludaste.
- Nunca cierres con «¿Te puedo ayudar en algo más?» ni frases parecidas.
- «ok», «gracias», «listo», «vale» o un emoji suelto NO son un pedido: responde corto («¡Con gusto! 😊») o elige la acción "nada".
- Si el cliente está molesto o tiene un problema, nada de alegría: reconoce, sé breve y ofrece la solución o pásalo al negocio.

Lo que sabes y lo que no:
- Solo sabes lo que viene en <negocio> y <cliente>. Precios, servicios, horarios, direcciones, medios de pago y políticas SOLO de ahí.
- Nunca inventes precios, descuentos, servicios, horarios, promociones ni tiempos. Si no está, no lo sabes.
- Si te preguntan algo que no sabes, o algo que debe decidir el negocio (un descuento, una excepción, un caso especial),
  usa la acción "dueno": le dices al cliente que lo confirmas con el negocio y le avisas, y escribes la pregunta para el dueño.
- No digas que eres una persona. Si preguntan, eres el asistente virtual del negocio.
- No hables de cómo funcionas por dentro, ni de IA, ni de Claude, ni de proveedores.

Lo que NO haces tú (lo hace el sistema con la acción):
- Apartar, cambiar o cancelar citas, ni mostrar horas libres. Para eso eliges la acción y el sistema sigue con sus listas.
  · Quiere sacar una cita o pregunta por un servicio con intención de ir → "agendar".
  · Pregunta qué horas o cupos hay → "cupos".
  · Quiere cancelar su cita → "cancelar".   · Quiere mover su cita a otro día u hora → "cambiar".
- Con "agendar", "cupos", "cancelar" o "cambiar" puedes escribir en "texto" una frase corta de puente (o dejarlo vacío): el sistema manda la lista justo después.

Siempre respondes llamando a la herramienta "responder", una sola vez.`;

const HERRAMIENTA = {
  name: 'responder',
  description: 'Lo que el asistente le contesta al cliente y la acción que debe seguir el sistema. Llámala siempre, una sola vez.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      accion: { type: 'string', enum: ACCIONES, description: 'responder = solo contestar · agendar/cupos/cancelar/cambiar = el sistema sigue con su flujo · dueno = no sabes y lo pasas al negocio · nada = no hace falta contestar' },
      texto: { type: 'string', description: 'El mensaje para el cliente (vacío si la acción es nada).' },
      pregunta_dueno: { type: 'string', description: 'Solo con accion=dueno: la pregunta del cliente, clara, para el dueño. Vacío en los demás casos.' }
    },
    required: ['accion', 'texto', 'pregunta_dueno'],
    additionalProperties: false
  }
};

const cop = (n) => '$' + Number(n || 0).toLocaleString('es-CO');
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const limpia = (t, n) => String(t == null ? '' : t).replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 300);

// Lo que el dueño puso en el panel, en texto corto. Solo datos que la app tiene: nada inventado.
function contextoNegocio(D) {
  const st = D.st || {}, L = [];
  L.push('Nombre: ' + limpia(st.businessName || (D.biz && D.biz.name) || '', 80));
  const dir = [st.address, st.city].filter(Boolean).map((x) => limpia(x, 120)).join(', ');
  if (dir) L.push('Dirección: ' + dir);
  const h = st.businessHours;   // { '0'..'6': [{ open: '09:00', close: '13:00' }, …] } (0 = domingo), igual que el panel
  if (h && typeof h === 'object') {
    const filas = [];
    for (let d = 1; d <= 7; d++) { const k = d % 7, R = (h[String(k)] || []).filter((x) => x && x.open && x.close); filas.push(DIAS[k] + ': ' + (R.length ? R.map((x) => x.open + '–' + x.close).join(' y ') : 'cerrado')); }
    if (filas.some((f) => !/cerrado$/.test(f))) L.push('Horario (24 h): ' + filas.join(' · '));
  }
  if ((st.closedDates || []).length) L.push('Días cerrados: ' + st.closedDates.slice(0, 12).map((x) => limpia(x.date || x, 12)).join(', '));
  const pagos = (st.paymentMethods || []).map((m) => limpia(m.label || '', 30)).filter(Boolean);
  if (pagos.length) L.push('Medios de pago para el abono: ' + pagos.join(', '));
  if (Number(st.depositAmountCOP) > 0) L.push('Abono para apartar la cita: ' + cop(st.depositAmountCOP) + ' (se paga al negocio).');
  if (st.rescheduleMinHours != null) L.push('Cambiar o cancelar: hasta ' + Number(st.rescheduleMinHours) + ' horas antes, desde el link o por aquí.');
  const serv = (D.servicios || []).slice(0, 60).map((s) => '- ' + limpia(s.name || s.nombre, 60) + ': ' + cop(s.priceCOP != null ? s.priceCOP : s.precio) + ', ' + Number(s.minutes || s.min || 0) + ' min' + (s.description ? ' · ' + limpia(s.description, 140) : '') + (s.category ? ' [' + limpia(s.category, 30) + ']' : ''));
  if (serv.length) L.push('Servicios:\n' + serv.join('\n'));
  const equipo = (D.staff || []).filter((x) => x.active !== false).map((x) => limpia(x.name || x.nombre, 40)).filter(Boolean);
  if (equipo.length) L.push('Quienes atienden: ' + equipo.join(', '));
  if (D.link) L.push('Link para agendar en línea: ' + D.link);
  const saber = limpia(((st.maryBot || {}).ia || {}).saber || '', 2500);
  if (saber) L.push('Lo que el dueño quiere que sepas (manda sobre todo lo demás):\n' + saber);
  return L.join('\n');
}
function contextoCliente(cl) {
  const L = [];
  if (cl.nombre) L.push('Nombre: ' + limpia(cl.nombre, 60));
  (cl.citas || []).slice(0, 3).forEach((x) => L.push('Tiene cita: ' + limpia(x.dia, 30) + ' a las ' + limpia(x.hora, 20) + ' · ' + limpia(x.servicio, 80) + (x.con ? ' con ' + limpia(x.con, 40) : '') + (x.status === 'pending_payment' ? ' (falta el abono)' : '')));
  if (!L.length) L.push('Cliente sin citas activas.');
  return L.join('\n');
}

function crear(o) {
  o = o || {};
  const modelo = o.modelo || MODELO;
  let cliente = o.cliente || null;   // las pruebas pasan un cliente falso
  const sdk = () => { if (!cliente) { const m = require('@anthropic-ai/sdk'); const A = m.default || m.Anthropic || m; cliente = new A({ apiKey: o.clave, maxRetries: 1, timeout: 25000 }); } return cliente; };

  // historial: [{ yo: bool, t: 'texto' }] (lo último que se habló, viejo → nuevo). mensaje: lo que acaba de escribir.
  async function pensar({ negocio, clienteInfo, historial, mensaje }) {
    const msgs = [];
    (historial || []).slice(-8).forEach((h) => { const role = h.yo ? 'assistant' : 'user', t = limpia(h.t, 600); if (!t) return; if (msgs.length && msgs[msgs.length - 1].role === role) msgs[msgs.length - 1].content += '\n' + t; else msgs.push({ role, content: t }); });
    if (msgs.length && msgs[0].role === 'assistant') msgs.shift();
    const nuevo = '<cliente>\n' + contextoCliente(clienteInfo || {}) + '\n</cliente>\n\nMensaje del cliente: ' + limpia(mensaje, 1200);
    if (msgs.length && msgs[msgs.length - 1].role === 'user') msgs[msgs.length - 1].content += '\n\n' + nuevo; else msgs.push({ role: 'user', content: nuevo });
    const pedido = {
      model: modelo, max_tokens: 900,   // 3.70: respuestas cortas = gasto mínimo (la herramienta trae 1–3 frases)
      output_config: { effort: 'low' },                                     // chat corto: esfuerzo bajo (más rápido y barato)
      system: [
        { type: 'text', text: REGLAS },
        { type: 'text', text: '<negocio>\n' + contextoNegocio(negocio || {}) + '\n</negocio>', cache_control: { type: 'ephemeral' } }   // reglas + negocio se guardan en caché
      ],
      tools: [HERRAMIENTA], tool_choice: { type: 'auto' },
      messages: msgs
    };
    // Haiku no tiene respaldo del servidor si declina: va por la vía normal. Opus/Sonnet sí: si declina, el servidor intenta con otro modelo.
    const r = /haiku/.test(modelo) ? await sdk().messages.create(pedido)
      : await sdk().beta.messages.create(Object.assign({ betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' }, pedido));
    const uso = r.usage || {};
    const gasto = { entrada: uso.input_tokens || 0, cache: uso.cache_read_input_tokens || 0, salida: uso.output_tokens || 0 };
    if (r.stop_reason === 'refusal') return { ok: false, motivo: 'declinó', gasto };
    const b = (r.content || []).find((x) => x.type === 'tool_use' && x.name === 'responder');
    if (!b) return { ok: false, motivo: 'no usó la herramienta', gasto };
    let x = b.input; if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { return { ok: false, motivo: 'respuesta dañada', gasto }; } }
    if (!x || ACCIONES.indexOf(x.accion) < 0) return { ok: false, motivo: 'acción desconocida', gasto };
    const texto = String(x.texto || '').trim().slice(0, 700);
    if (x.accion === 'responder' && !texto) return { ok: false, motivo: 'sin texto', gasto };
    return { ok: true, accion: x.accion, texto, preguntaDueno: String(x.pregunta_dueno || '').trim().slice(0, 400), gasto };
  }
  return { pensar };
}

module.exports = { crear, contextoNegocio, contextoCliente, REGLAS, HERRAMIENTA, ACCIONES, MODELO };
