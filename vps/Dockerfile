FROM node:22-bookworm-slim
# fonts-inter: la letra de los estados (la misma del diseño). Nada de navegador: los estados se dibujan con resvg.
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl fonts-inter && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
COPY principal.js textos.js correo.js estado.js asistente.js cuposLocal.js guia.js ./
COPY banco ./banco
ENV DATOS=/datos NEGOCIOS=/config/negocios.json TZ=America/Bogota
EXPOSE 3060
HEALTHCHECK --interval=30s --timeout=5s CMD curl -fs http://127.0.0.1:3060/salud || exit 1
CMD ["node", "principal.js"]
