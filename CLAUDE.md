# Reglas del proyecto Tu Agenda (agendador)

## 🚫 Regla universal: no se modifica ningún otro proyecto
Este proyecto (Tu Agenda / Agendador IA, «Mary» por dentro) **nunca modifica otro proyecto**: Epic, Mary de Epic, Luisa, epic-tiendas ni ningún otro.
- **Sí se puede copiar:** leer el código o la versión de otro proyecto y hacer una copia propia, aparte y con su propio nombre.
- **No se puede tocar:** sus contenedores, redes, webhooks, sesiones de WhatsApp, archivos, base de datos ni repositorios. Tampoco reiniciarlo ni unirlo a nada del agendador.
- Si el agendador necesita algo de otro proyecto, se crea una copia propia del agendador (ej. `waha-agendador`, `evolution-agendador`), jamás se usa el original.
- Si un script o instrucción rompe esta regla, es un error: se deshace y se corrige.

## Otras reglas
- Todo se instala por Telegram (bot «Agendador VPS», el cartero) o en el VPS, en `~/agendador`.
- Nunca poner secretos (tokens, claves, llaves) en el código ni en el chat.
