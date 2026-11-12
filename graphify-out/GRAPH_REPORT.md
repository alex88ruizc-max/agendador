# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 32 files · ~136,653 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 994 nodes · 2855 edges · 55 communities (50 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ee2e90a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- super.js
- app.js
- admin.js
- common.js
- estado.js
- escenarios.js
- esc
- esc
- cartero.py
- mary.gs
- drawStory
- textos.js
- bogNow
- bpath
- cuposLocal.js
- openModal
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- handleAct
- esc
- options
- waha-agendador
- toMillis
- correo.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- startUpdateWatcher
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- pruebas.js
- handleAct
- atenderMensaje
- cop
- atenderPedidoWa
- esc
- environment
- oido-agendador
- boot
- log
- doHold
- servidor
- guideSteps
- render
- publicarEstado

## God Nodes (most connected - your core abstractions)
1. `esc()` - 84 edges
2. `bogNow()` - 50 edges
3. `toast()` - 49 edges
4. `bpath()` - 47 edges
5. `crear()` - 38 edges
6. `hora12()` - 34 edges
7. `toMillis()` - 34 edges
8. `cop()` - 34 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `setDialogBrand()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (55 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (31): AGRUPA, atendidos, _banco, BOT, BOT_DEF, BOT_LEIDO, botDesdeBase(), botNormal() (+23 more)

### Community 1 - "super.js"
Cohesion: 0.09
Nodes (23): pmProblem(), APP_VERSION, DEFAULT_PAY_WARNING, isKeyMethod(), payAccountInput(), PLAN_KEYS, pushNav(), TG_EVENTS (+15 more)

### Community 2 - "app.js"
Cohesion: 0.09
Nodes (34): APP, BIZ_ID, busyUntilLabel(), checkPhone(), CITA_LINK, connectTg(), COUNTRIES, country() (+26 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (65): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, citasCliente(), CLIENT_FILTERS (+57 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (37): app, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), categoriaAuto() (+29 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (22): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+14 more)

### Community 7 - "esc"
Cohesion: 0.18
Nodes (31): aptAction(), bloqueo(), brPreview(), closeM(), connectWhatsApp(), custName(), goStep(), manageStory() (+23 more)

### Community 8 - "esc"
Cohesion: 0.33
Nodes (11): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff() (+3 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (42): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+34 more)

### Community 11 - "drawStory"
Cohesion: 0.17
Nodes (20): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba() (+12 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "bogNow"
Cohesion: 0.15
Nodes (29): estadoCupos(), freeSlotsFor(), renderCupos(), renderQDays(), dayBookable(), dayGrid(), dayRatio(), firstOpenDay() (+21 more)

### Community 14 - "bpath"
Cohesion: 0.21
Nodes (16): citasDeClientes(), clientHistory(), deleteClient(), geoSkipKey(), loadLost(), loadUsers(), openClient(), publicUrl() (+8 more)

### Community 15 - "cuposLocal.js"
Cohesion: 0.23
Nodes (17): crear(), cupos(), datos(), dias(), horas(), DIAS, diaTxt(), dow() (+9 more)

### Community 16 - "openModal"
Cohesion: 0.23
Nodes (13): openConsent(), openStoryViewer(), draw(), go(), tick(), renderStories(), seen(), closeModal() (+5 more)

### Community 17 - "environment"
Cohesion: 0.29
Nodes (7): WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED, WAHA_PRINT_QR, WHATSAPP_DEFAULT_ENGINE, WHATSAPP_SWAGGER_ENABLED, environment

### Community 18 - "textos.js"
Cohesion: 0.15
Nodes (48): conNumeros(), corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo() (+40 more)

### Community 19 - "agendador-ia"
Cohesion: 0.18
Nodes (11): build, container_name, cpus, depends_on, env_file, mem_limit, networks, ports (+3 more)

### Community 20 - "postgres-agendador"
Cohesion: 0.18
Nodes (11): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, container_name, environment, image, mem_limit, networks (+3 more)

### Community 21 - "services"
Cohesion: 0.18
Nodes (10): name, name, networks, agenda, services, volumes, evo_instancias, oido_modelos (+2 more)

### Community 22 - "evolution-agendador"
Cohesion: 0.20
Nodes (10): container_name, depends_on, env_file, image, mem_limit, networks, ports, restart (+2 more)

### Community 23 - "reglas.js"
Cohesion: 0.18
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 24 - "handleAct"
Cohesion: 0.24
Nodes (15): adminUrl(), daysLeft(), dm(), initials(), logoOf(), msgFor(), openStore(), phoneOf() (+7 more)

### Community 25 - "esc"
Cohesion: 0.17
Nodes (19): applyPanelBrand(), imgToDataUrl(), loadModalLocks(), openAptModal(), panelPrefs(), quienBloq(), renderAppearance(), renderExtras() (+11 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.09
Nodes (47): abrirCupos(), activeStories(), actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName() (+39 more)

### Community 29 - "correo.js"
Cohesion: 0.32
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "startUpdateWatcher"
Cohesion: 0.67
Nodes (3): readPublishedVersion(), reloadFresh(), startUpdateWatcher()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "pruebas.js"
Cohesion: 0.12
Nodes (13): assert, baseFalsa(), fsVal(), GS_MARY, INFO, SEMANA, test, alMensaje() (+5 more)

### Community 41 - "handleAct"
Cohesion: 0.25
Nodes (9): planPrice(), planOfBiz(), planPriceOf(), plansOf(), addMonths(), handleAct(), openM(), planForm() (+1 more)

### Community 42 - "atenderMensaje"
Cohesion: 0.25
Nodes (19): anotar(), ASIS, atenderMensaje(), atiende(), bajarMediaWaha(), escribir(), escribirLista(), escuchar() (+11 more)

### Community 43 - "cop"
Cohesion: 0.25
Nodes (18): aptCard(), citasHtml(), renderAgenda(), renderFree(), apptCard(), canChange(), openResched(), renderMine() (+10 more)

### Community 44 - "atenderPedidoWa"
Cohesion: 0.40
Nodes (15): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+7 more)

### Community 45 - "esc"
Cohesion: 0.15
Nodes (21): botCfg(), botGuardar(), isTrial(), lockCard(), maryWaCard(), mwCuenta(), mwEsperar(), mwPintar() (+13 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "boot"
Cohesion: 0.24
Nodes (13): afterGoogle(), boot(), loadProfile(), onErr(), renderAll(), renderCalendar(), renderSlots(), selectDate() (+5 more)

### Community 49 - "log"
Cohesion: 0.29
Nodes (13): ahoraLocal(), armarEstado(), arrancarRelojes(), botAlDia(), botDe(), botFresco(), cada(), gas() (+5 more)

### Community 50 - "doHold"
Cohesion: 0.29
Nodes (10): h12s(), hoursSummary(), renderClosed(), bookingStaff(), doHold(), expectedDeposit(), renderSummary(), selection() (+2 more)

### Community 51 - "servidor"
Cohesion: 0.22
Nodes (9): llega(), alEventoConexion(), buscarClave(), deWaha(), json(), leerCuerpo(), negocioRegistrado(), servidor (+1 more)

### Community 52 - "guideSteps"
Cohesion: 0.36
Nodes (8): guideCard(), guideDone(), guideProgress(), guideSteps(), markGuide(), openGuide(), stepDone(), wizPassed()

### Community 53 - "render"
Cohesion: 0.38
Nodes (7): hideOrder(), render(), renderNewsAdmin(), renderOrders(), renderTodo(), start(), unhideOrder()

### Community 54 - "publicarEstado"
Cohesion: 0.50
Nodes (4): contactosDe(), guardarImg(), publicarEstado(), quienVeEstados()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 287 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `cop` to `app.js`, `admin.js`, `common.js`, `esc`, `esc`, `mary.gs`, `drawStory`, `bogNow`, `bpath`, `esc`, `boot`, `doHold`, `esc`, `toMillis`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `cop`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08620689655172414 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `app.js`, `admin.js`, `common.js`, `esc`, `esc`, `handleAct`, `cop`, `drawStory`, `esc`, `bpath`, `bogNow`, `openModal`, `doHold`, `guideSteps`, `render`, `handleAct`, `toMillis`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._