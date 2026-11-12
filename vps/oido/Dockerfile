# 👂 oido-agendador · Whisper (faster-whisper) en CPU, solo dentro de la red del agendador (no se abre a internet)
FROM python:3.12-slim
RUN pip install --no-cache-dir faster-whisper==1.1.1 requests==2.32.3
WORKDIR /app
COPY oido.py .
ENV MODELOS=/modelos MODELO=small IDIOMA=es HILOS=2 PYTHONUNBUFFERED=1
EXPOSE 9000
HEALTHCHECK --interval=60s --timeout=5s CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:9000/salud',timeout=4)"
CMD ["python", "oido.py"]
