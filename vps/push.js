// 🔔 3.55 · NOTIFICACIONES DE LA APP (Web Push), enviadas desde el VPS. Sin librerías: solo lo que trae Node.
//    El dueño toca «Activar notificaciones» en su panel → su celular entrega una «suscripción» (una dirección + 2 llaves).
//    Para avisarle, aquí se cifra el mensaje con esas llaves (RFC 8291, aes128gcm) y se firma con las llaves del agendador (VAPID, RFC 8292).
//    Las llaves VAPID se crean solas la primera vez y se guardan en la carpeta de datos del agendador (nunca en el código).
'use strict';
const crypto = require('crypto'), fs = require('fs'), path = require('path');
const b64 = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const de64 = (s) => Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const hkdf = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));

// llaves del agendador: { publica, privada } en base64url (se crean una sola vez)
function llaves(carpeta) {
  const f = path.join(carpeta, 'push-llaves.json');
  try { const k = JSON.parse(fs.readFileSync(f, 'utf8')); if (k.publica && k.privada) return k; } catch (e) { /* aún no existen */ }
  const e = crypto.createECDH('prime256v1'); e.generateKeys();
  const k = { publica: b64(e.getPublicKey()), privada: b64(e.getPrivateKey()) };
  fs.mkdirSync(carpeta, { recursive: true }); fs.writeFileSync(f, JSON.stringify(k), { mode: 0o600 });
  return k;
}
// cifra el texto para UNA suscripción. `fijo` solo lo usan las pruebas (sal y llave efímera de ejemplo del RFC 8291).
function cifrar(sub, texto, fijo) {
  const ua = de64(sub.p256dh), auth = de64(sub.auth);
  if (ua.length !== 65 || auth.length < 16) throw new Error('suscripción inválida');
  const e = crypto.createECDH('prime256v1');
  if (fijo && fijo.privada) e.setPrivateKey(de64(fijo.privada)); else e.generateKeys();
  const as = e.getPublicKey(), secreto = e.computeSecret(ua), sal = fijo && fijo.sal ? de64(fijo.sal) : crypto.randomBytes(16);
  const ikm = hkdf(auth, secreto, Buffer.concat([Buffer.from('WebPush: info\0'), ua, as]), 32);
  const cek = hkdf(sal, ikm, Buffer.from('Content-Encoding: aes128gcm\0'), 16), nonce = hkdf(sal, ikm, Buffer.from('Content-Encoding: nonce\0'), 12);
  const c = crypto.createCipheriv('aes-128-gcm', cek, nonce);
  const cifrado = Buffer.concat([c.update(Buffer.concat([Buffer.from(texto, 'utf8'), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([sal, rs, Buffer.from([as.length]), as, cifrado]);
}
// la firma que le dice al servicio de notificaciones «esto lo manda Tu Agenda»
function firma(endpoint, K, ahora) {
  const pub = de64(K.publica), jwk = { kty: 'EC', crv: 'P-256', d: K.privada, x: b64(pub.subarray(1, 33)), y: b64(pub.subarray(33, 65)) };
  const cab = b64(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const cuerpo = b64(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor((ahora || Date.now()) / 1000) + 12 * 3600, sub: 'https://tuagenda.vip' }));
  const sig = crypto.sign('sha256', Buffer.from(cab + '.' + cuerpo), { key: crypto.createPrivateKey({ key: jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' });
  return 'vapid t=' + cab + '.' + cuerpo + '.' + b64(sig) + ', k=' + K.publica;
}
// solo se le manda a servicios de notificaciones conocidos (la dirección la entrega el navegador del dueño, pero se revisa igual)
const SERVICIOS = /^https:\/\/([a-z0-9-]+\.)*(googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com|push\.apple\.com)\//i;
// manda una notificación. Devuelve { ok } o { ok:false, baja:true } si esa suscripción ya no existe (se debe borrar).
async function enviar(sub, datos, K, f) {
  if (!sub || !SERVICIOS.test(String(sub.endpoint || ''))) return { ok: false, baja: true, motivo: 'dirección no permitida' };
  let cuerpo; try { cuerpo = cifrar(sub, JSON.stringify(datos)); } catch (e) { return { ok: false, baja: true, motivo: e.message }; }
  try {
    const r = await (f || fetch)(sub.endpoint, { method: 'POST', body: cuerpo, signal: AbortSignal.timeout(15000),
      headers: { Authorization: firma(sub.endpoint, K), 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', TTL: '86400', Urgency: 'high' } });
    if (r.status === 404 || r.status === 410) return { ok: false, baja: true, motivo: 'la suscripción ya no existe' };
    return r.status >= 200 && r.status < 300 ? { ok: true } : { ok: false, motivo: 'respondió ' + r.status };
  } catch (e) { return { ok: false, motivo: String(e.message).slice(0, 80) }; }
}
module.exports = { llaves, cifrar, firma, enviar, b64, de64 };
