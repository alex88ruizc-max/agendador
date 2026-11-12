# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~126,042 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 946 nodes · 2739 edges · 46 communities (41 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 103 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6199e94`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- toast
- app.js
- admin.js
- common.js
- estado.js
- escenarios.js
- super.js
- renderHome
- cartero.py
- mary.gs
- drawImage
- renderMarketing
- anotar
- bogNow
- renderPlan
- openModal
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- atenderMensaje
- options
- waha-agendador
- esc
- textos.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- fechaCorta
- toMillis
- atenderPedidoWa
- openQuick
- openWizard
- environment
- oido-agendador
- renderAppearance

## God Nodes (most connected - your core abstractions)
1. `esc()` - 82 edges
2. `toast()` - 49 edges
3. `bogNow()` - 48 edges
4. `bpath()` - 46 edges
5. `crear()` - 38 edges
6. `cop()` - 34 edges
7. `toMillis()` - 34 edges
8. `hora12()` - 33 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `openConsent()` --calls--> `openModal()`  [EXTRACTED]
  app.js → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `aptAction()` --calls--> `uiPrompt()`  [EXTRACTED]
  admin.js → common.js
- `brPreview()` --calls--> `esc()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (46 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.07
Nodes (31): AGRUPA, alMensaje(), atendidos, _banco, BOT, BOT_DEF, CFG, CONTACTOS (+23 more)

### Community 1 - "toast"
Cohesion: 0.14
Nodes (46): aptAction(), bloqueo(), brPreview(), clientHistory(), closeM(), connectWhatsApp(), custName(), deleteClient() (+38 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (74): renderQDays(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), checkPhone() (+66 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (59): A, ACT, ACTIVE, actStats(), ALL_TABS, bogDay(), bogHour(), BOT_DEF (+51 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (45): pmProblem(), renderPM(), app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND (+37 more)

### Community 5 - "estado.js"
Cohesion: 0.07
Nodes (37): imapflow, mailparser, @resvg/resvg-js, fs, leerPago(), montos(), pagador(), path (+29 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (25): assert, audio(), CATALOGO, CONFIRMADA, DIR, DOS, filas(), fs (+17 more)

### Community 7 - "super.js"
Cohesion: 0.09
Nodes (37): db, PLAN_KEYS, pushNav(), adminUrl(), daysLeft(), dm(), FILTERS, goMoney() (+29 more)

### Community 8 - "renderHome"
Cohesion: 0.11
Nodes (36): abrirCupos(), activeStories(), buildRecs(), estadoCupos(), fillAsStory(), firstName(), freeNowStaff(), freeTimes() (+28 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "drawImage"
Cohesion: 0.15
Nodes (22): apInitials(), applyPanelBrand(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText() (+14 more)

### Community 12 - "renderMarketing"
Cohesion: 0.17
Nodes (20): botCfg(), botGuardar(), isServing(), lockCard(), lockedNow(), maryWaCard(), meStaff(), mwEsperar() (+12 more)

### Community 13 - "anotar"
Cohesion: 0.21
Nodes (23): ahoraLocal(), alEventoConexion(), anotar(), armarEstado(), arrancarRelojes(), atiende(), botDe(), botFresco() (+15 more)

### Community 14 - "bogNow"
Cohesion: 0.33
Nodes (9): bogNow(), copyText(), uiPrompt(), addMonths(), deleteBusiness(), handleAct(), planForm(), readPlan() (+1 more)

### Community 15 - "renderPlan"
Cohesion: 0.23
Nodes (13): isTrial(), myPlan(), planPrice(), renderPlan(), showPlanWelcome(), syncPlanGate(), renderTrialPlans(), showTrialForm() (+5 more)

### Community 16 - "openModal"
Cohesion: 0.32
Nodes (8): openResched(), presence(), showPay(), closeModal(), hideModal(), openModal(), warmServer(), openM()

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
Cohesion: 0.14
Nodes (11): assert, GS_MARY, INFO, test, assert, fs, NUESTROS, path (+3 more)

### Community 24 - "atenderMensaje"
Cohesion: 0.24
Nodes (17): ASIS, atenderMensaje(), bajarMediaWaha(), debeResponder(), escribir(), escribirLista(), escuchar(), esWaha() (+9 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "esc"
Cohesion: 0.26
Nodes (17): aptCard(), renderAgenda(), renderPlanBanner(), renderQMains(), apptCard(), serviceButton(), showTicket(), cop() (+9 more)

### Community 29 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "fechaCorta"
Cohesion: 0.20
Nodes (11): h12s(), hoursSummary(), readPM(), renderClosed(), renderSettings(), saveSettings(), tgLink(), trialDays() (+3 more)

### Community 41 - "toMillis"
Cohesion: 0.23
Nodes (14): newsUnread(), openPlatformNews(), renderBell(), startNews(), canChange(), openStoryViewer(), draw(), go() (+6 more)

### Community 42 - "atenderPedidoWa"
Cohesion: 0.46
Nodes (13): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+5 more)

### Community 43 - "openQuick"
Cohesion: 0.39
Nodes (9): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQSlots(), renderQStaff(), updQSave() (+1 more)

### Community 45 - "openWizard"
Cohesion: 0.39
Nodes (8): closeWizard(), drawWizard(), openWizard(), wizChange(), wizClick(), wizInput(), wizReadSvcs(), wizWatchTg()

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "renderAppearance"
Cohesion: 0.17
Nodes (15): goStep(), guideCard(), guideDone(), guideProgress(), guideSteps(), imgToDataUrl(), markGuide(), openGuide() (+7 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 272 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `toast` to `app.js`, `admin.js`, `common.js`, `renderHome`, `fechaCorta`, `mary.gs`, `drawImage`, `renderMarketing`, `openQuick`, `openModal`, `esc`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0659536541889483 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `toast`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.14106280193236714 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `toast`, `app.js`, `admin.js`, `common.js`, `super.js`, `renderHome`, `toMillis`, `fechaCorta`, `drawImage`, `renderMarketing`, `openQuick`, `bogNow`, `renderPlan`, `renderAppearance`, `openModal`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._