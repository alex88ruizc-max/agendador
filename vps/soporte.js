// 🆘 3.58 · LÍNEA DE SOPORTE DE TU AGENDA. Va en el WhatsApp PERSONAL de Alex, en una sesión aparte («agendador-soporte»).
//    LEY: aquí el bot SOLO le responde a gente de las tiendas (dueños y empleados). A cualquier otra persona NO le escribe nunca.
//    ¿Cómo sabe quién es de una tienda? Porque entró por el botón «¿Necesitas ayuda?» de su panel: ese botón abre el chat con un mensaje
//    que dice su tienda. Ese número queda recordado. También reconoce los números que la tienda ya puso en su panel.
//    Esta sesión NO es una tienda: no está en negocios.json, así que no publica estados, no manda recordatorios, no guarda contactos, nada.
//    Solo responde ayuda. Si Alex escribe a mano en un chat, el bot se calla ahí 12 horas.
'use strict';
const SESION = 'agendador-soporte';
const CALLADO_MS = 12 * 3600000;     // después de «hablar con Alex» o de que Alex escriba a mano
const TOPE_DIA = 40;                 // respuestas del bot por chat al día (freno contra bucles)
const normal = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();

// el mensaje que arma el botón del panel:  «Hola, necesito ayuda con mi agenda. (Tienda: elbarba)»
const textoBoton = (bid) => 'Hola, necesito ayuda con mi agenda. (Tienda: ' + bid + ')';
function tiendaEnTexto(t) { const m = String(t || '').match(/\(\s*tienda\s*:\s*([a-z0-9][a-z0-9-]{1,29})\s*\)/i); return m ? m[1].toLowerCase() : ''; }

// Cada tema: número, título, palabras que lo reconocen y los pasos. Solo cosas que YA existen en el panel.
const TEMAS = [
  { n: 1, t: 'Vincular mi WhatsApp (el bot)', re: /vincul|conect|codigo|qr\b/, pasos: [
    'En tu panel entra a *WhatsApp Bot*.',
    'Escribe el número del negocio con el 57 adelante y toca *Vincular mi WhatsApp*.',
    'Te sale un código de 8 letras. Tienes 3 minutos.',
    'En el celular del negocio: WhatsApp › *Dispositivos vinculados* › *Vincular un dispositivo* › *Vincular con el número de teléfono*.',
    'Escribe ahí el código. Listo.'],
    nota: '¿Se venció el código? Toca «Vincular mi WhatsApp» otra vez y sale uno nuevo.' },
  { n: 2, t: 'Crear o cambiar un servicio', re: /servicio|precio|duracion|categoria/, pasos: [
    'En tu panel entra a *Servicios*.',
    'Toca *Nuevo servicio*.',
    'Ponle nombre, precio y cuánto dura.',
    'Guarda. Ya aparece en tu página y en el bot.'],
    nota: 'Para cambiar uno que ya existe, tócalo en la lista.' },
  { n: 3, t: 'Cambiar mi horario', re: /horario|hora de|abr[oi]|cierr|dias de atencion|festivo/, pasos: [
    'En tu panel entra a *Configuración*.',
    'Busca *Horario de atención*.',
    'Marca los días que atiendes y pon la hora de abrir y de cerrar.',
    'Guarda. Tu página muestra los cupos nuevos de una vez.'],
    nota: 'Si alguien de tu equipo tiene otro horario, se cambia en «Equipo y descansos».' },
  { n: 4, t: 'Mi equipo y los descansos', re: /equipo|emplead|barbero|profesional|descanso|almuerzo|vacacion/, pasos: [
    'En tu panel entra a *Equipo y descansos*.',
    'Ahí agregas a cada persona que atiende clientes.',
    'A cada una le puedes poner su horario y sus descansos.'],
    nota: 'Para cerrar un rato o un día completo, usa *Cupos* y toca «Bloquear».' },
  { n: 5, t: 'Recibir avisos de cada cita', re: /aviso|notific|telegram|campana|no me llega/, pasos: [
    'Tienes 3 formas. Puedes usar las tres.',
    '*En el celular:* en Inicio toca *Activar notificaciones* y di que sí.',
    '*En tu WhatsApp:* en *WhatsApp Bot* busca «Avisos a tu WhatsApp» y pon tu número personal.',
    '*En Telegram:* toca *Conectar Telegram* en tu panel y sigue los pasos.'],
    nota: 'Cada reserva nueva y cada cancelación te avisa.' },
  { n: 6, t: 'Compartir mi link con los clientes', re: /link|enlace|compart|pagina/, pasos: [
    'En tu panel entra a *Link de clientes*.',
    'Copia el link.',
    'Pégalo en tu Instagram, en tu WhatsApp y en tus estados.'],
    nota: 'El cliente entra, elige día y hora, y aparta solo.' },
  { n: 7, t: 'Los estados de WhatsApp del bot', re: /estado|historia|cupos de hoy|como agendar/, pasos: [
    'En tu panel entra a *WhatsApp Bot*.',
    'Busca la parte de *Estados*.',
    'Ahí prendes o apagas cada estado y le cambias la hora.'],
    nota: 'El bot los publica solo en el WhatsApp del negocio.' },
  { n: 8, t: 'Mi plan y los pagos', re: /plan|pag[oa]|precio del plan|gold|basico|venc|renov|factur/, pasos: [
    'En tu panel entra a *Mi plan*.',
    'Ahí ves qué plan tienes, hasta cuándo va y qué trae cada uno.',
    'Para cambiar o renovar, elige el plan y sigue los pasos de pago.'],
    nota: 'Si pagaste y no se activó, escribe *0* y Alex lo revisa.' },
];
const ORDEN = [8, 7, 1, 5, 4, 3, 6, 2];   // al buscar por palabras, primero los temas más específicos («precio del plan» es el plan, no un servicio)
const pie = '\n\nEscribe otro número, *menú* para ver la lista o *0* para hablar con Alex.';
function menu(nombreTienda) {
  return '👋 Hola' + (nombreTienda ? ', equipo de *' + nombreTienda + '*' : '') + '. Soy el ayudante de *Tu Agenda*.\n¿Con qué te ayudo? Escribe el número:\n\n'
    + TEMAS.map((x) => '*' + x.n + '.* ' + x.t).join('\n') + '\n*0.* Hablar con Alex';
}
const tema = (x) => '*' + x.t + '*\n\n' + x.pasos.map((p, i) => (i + 1) + '. ' + p).join('\n') + (x.nota ? '\n\n💡 ' + x.nota : '') + pie;
const T_ALEX = '🙋 Listo. Alex ya ve tu mensaje aquí mismo y te responde apenas pueda.\nCuéntale en un solo mensaje qué necesitas.';
const T_NO_ENTENDI = '🤔 No te entendí. Escribe el *número* de lo que necesitas, *menú* para ver la lista o *0* para hablar con Alex.';

// Decide qué responder. `chat` es lo que se recuerda de esa persona: { bid, saludo, noEntendi }
// Devuelve { texto, callar } · callar = el bot se queda callado en ese chat (lo atiende Alex).
function responder(chat, texto, nombreTienda) {
  const n = normal(texto), solo = n.replace(/\s/g, '');
  if (!n) return { texto: T_ALEX, callar: true };                                   // foto, audio, documento: eso lo mira Alex
  if (solo === '0' || /\b(alex|asesor|humano|persona|soporte humano)\b/.test(n)) return { texto: T_ALEX, callar: true };
  if (/^[1-9]$/.test(solo)) { const x = TEMAS.find((y) => y.n === Number(solo)); if (x) { chat.noEntendi = 0; return { texto: tema(x) }; } }
  if (!chat.saludo || /^(menu|hola|buenas|buenos dias|buenas tardes|buenas noches|ayuda|inicio)\b/.test(n) || tiendaEnTexto(texto)) { chat.saludo = Date.now(); chat.noEntendi = 0; return { texto: menu(nombreTienda) }; }
  const x = ORDEN.map((k) => TEMAS[k - 1]).find((y) => y.re.test(n));
  if (x) { chat.noEntendi = 0; return { texto: tema(x) }; }
  chat.noEntendi = (chat.noEntendi || 0) + 1;
  if (chat.noEntendi >= 2) { chat.noEntendi = 0; return { texto: T_ALEX, callar: true }; }   // dos veces sin entender: mejor que lo atienda Alex
  return { texto: T_NO_ENTENDI };
}

module.exports = { SESION, CALLADO_MS, TOPE_DIA, TEMAS, textoBoton, tiendaEnTexto, menu, responder, T_ALEX, T_NO_ENTENDI };
