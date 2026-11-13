#!/bin/sh
# 🧪 Corre el banco IGUAL que el VPS: solo con los archivos que van dentro de la imagen (sin gs/, sin los .sh ni el cartero).
#    Se corre ANTES de entregar cada zip de Mary:  sh banco/como-vps.sh   (desde vps/)
#    El 2026-11-13 la 3.47 pasó el banco aquí y falló en el VPS porque una prueba leía gs/mary.gs, que en la imagen no existe.
set -e
AQUI=$(cd "$(dirname "$0")/.." && pwd)
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
# los mismos archivos del COPY del Dockerfile
for f in $(grep '^COPY ' "$AQUI/Dockerfile" | grep -v 'package' | sed 's/^COPY //; s/ \.\/.*$//'); do cp -r "$AQUI/$f" "$T/"; done
cp "$AQUI/package.json" "$T/"
ln -s "$AQUI/node_modules" "$T/node_modules"
cd "$T" && node --test banco/pruebas.js banco/escenarios.js 2>&1 | grep -E '^not ok|^# (pass|fail|skipped)'
