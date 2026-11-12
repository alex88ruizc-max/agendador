# 👂 OÍDO DEL AGENDADOR: pasa las notas de voz de WhatsApp a texto, DENTRO del VPS (gratis, el audio no sale de aquí).
#    Copia de la idea del oído de Epic (Whisper «faster-whisper-small», español), hecha aparte: no usa nada de Epic.
#    POST /transcribir  (cuerpo = el audio tal cual: ogg/opus de WhatsApp, mp3, m4a…) → {"texto": "...", "duracion": s, "tardo": s}
#    GET  /salud        → {"ok": true|false, "modelo": "small", "error": ""}
import io, json, os, threading, time
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

MODELO = os.environ.get('MODELO', 'small')
IDIOMA = os.environ.get('IDIOMA', 'es')
HILOS = int(os.environ.get('HILOS', '2'))
MAX_BYTES = 8 * 1024 * 1024          # ~ 8 minutos de nota de voz
MAX_SEG = int(os.environ.get('MAX_SEG', '180'))   # más de 3 minutos no se transcribe (tardaría mucho)
PRUEBA = os.environ.get('OIDO_PRUEBA') == '1'      # banco de pruebas: sin modelo

modelo, error = None, ''
listo, turno = threading.Event(), threading.Lock()   # un audio a la vez (el VPS es compartido)

def parche_av():
    # 3.17: faster-whisper llama av.open(..., metadata_errors=...) y PyAV ≥ 16 ya no tiene esa opción → se quita sola
    try:
        import av, inspect
        orig = av.open
        try: inspect.signature(orig).bind_partial('x', metadata_errors='ignore'); return
        except TypeError: pass
        except ValueError: pass
        def abrir(*a, **k):
            k.pop('metadata_errors', None)
            return orig(*a, **k)
        av.open = abrir
        import faster_whisper.audio as fa
        fa.av.open = abrir
    except Exception as e:
        print('parche av:', e, flush=True)

def cargar():
    global modelo, error
    parche_av()
    if PRUEBA: listo.set(); return
    try:
        from faster_whisper import WhisperModel
        modelo = WhisperModel(MODELO, device='cpu', compute_type='int8', cpu_threads=HILOS, download_root=os.environ.get('MODELOS', '/modelos'))
        listo.set(); print('👂 modelo listo:', MODELO, flush=True)
    except Exception as e:
        error = str(e)[:300]; print('❌ no cargó el modelo:', error, flush=True)

def transcribir(datos):
    if PRUEBA: return {'texto': datos.decode('utf-8', 'ignore')[:300], 'duracion': 1.0}
    segs, info = modelo.transcribe(io.BytesIO(datos), language=IDIOMA, beam_size=1, vad_filter=True)
    if info.duration and info.duration > MAX_SEG: return {'texto': '', 'duracion': info.duration, 'largo': True}
    return {'texto': ' '.join(s.text.strip() for s in segs).strip()[:1000], 'duracion': info.duration}

class Oido(BaseHTTPRequestHandler):
    def responder(self, codigo, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(codigo); self.send_header('Content-Type', 'application/json; charset=utf-8'); self.send_header('Content-Length', str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        if self.path.startswith('/salud'): return self.responder(200, {'ok': listo.is_set(), 'modelo': MODELO, 'error': error})
        self.responder(404, {'error': 'no existe'})
    def do_POST(self):
        if not self.path.startswith('/transcribir'): return self.responder(404, {'error': 'no existe'})
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > MAX_BYTES: return self.responder(413, {'error': 'audio vacío o muy grande'})
        datos = self.rfile.read(n)
        if not listo.wait(timeout=3): return self.responder(503, {'error': 'el oído todavía está cargando: ' + (error or 'bajando el modelo')})
        t0 = time.time()
        try:
            with turno: r = transcribir(datos)
        except Exception as e:
            return self.responder(500, {'error': str(e)[:200]})
        r['tardo'] = round(time.time() - t0, 1)
        self.responder(200, r)
    def log_message(self, *a): pass

if __name__ == '__main__':
    threading.Thread(target=cargar, daemon=True).start()
    print('👂 oído escuchando en :9000 (modelo ' + MODELO + ', idioma ' + IDIOMA + ')', flush=True)
    ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PUERTO', '9000'))), Oido).serve_forever()
