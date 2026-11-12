# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~128,136 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 955 nodes · 2758 edges · 45 communities (40 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 104 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5f2c6108`
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
- bogNow
- cartero.py
- mary.gs
- drawStory
- anotar
- plansOf
- atenderPedidoWa
- atenderMensaje
- openStoryViewer
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- pruebas.js
- handleAct
- renderLane
- options
- waha-agendador
- toMillis
- textos.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- renderWaBot
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderSettings
- openAptModal
- openWizard
- environment
- oido-agendador

## God Nodes (most connected - your core abstractions)
1. `esc()` - 82 edges
2. `toast()` - 49 edges
3. `bogNow()` - 48 edges
4. `bpath()` - 46 edges
5. `crear()` - 38 edges
6. `toMillis()` - 34 edges
7. `cop()` - 34 edges
8. `hora12()` - 33 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `setDialogBrand()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `warmServer()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (45 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (38): AGRUPA, alMensaje(), atendidos, _banco, BOT, BOT_DEF, BOT_LEIDO, botDesdeBase() (+30 more)

### Community 1 - "super.js"
Cohesion: 0.09
Nodes (24): PLAN_KEYS, readPublishedVersion(), reloadFresh(), RULES_VERSION, startUpdateWatcher(), TG_EVENTS, FILTERS, HIDDEN (+16 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (96): aptCard(), bloqueo(), h12s(), payLine(), renderAgenda(), renderCupos(), renderFree(), renderQDays() (+88 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (62): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, closeMenus() (+54 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (41): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl() (+33 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.07
Nodes (26): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+18 more)

### Community 7 - "esc"
Cohesion: 0.15
Nodes (44): aptAction(), brPreview(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep() (+36 more)

### Community 8 - "bogNow"
Cohesion: 0.19
Nodes (20): abrirCupos(), estadoCupos(), freeNowStaff(), loadQLocks(), lookupPhone(), myStaff(), onErr(), openQuick() (+12 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "drawStory"
Cohesion: 0.15
Nodes (22): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+14 more)

### Community 12 - "anotar"
Cohesion: 0.21
Nodes (24): ahoraLocal(), alEventoConexion(), anotar(), armarEstado(), arrancarRelojes(), atiende(), botAlDia(), botDe() (+16 more)

### Community 13 - "plansOf"
Cohesion: 0.13
Nodes (17): planPrice(), pmProblem(), renderPM(), renderTrialPlans(), showTrialForm(), isKeyMethod(), payAccountInput(), planBenefitsIntro() (+9 more)

### Community 14 - "atenderPedidoWa"
Cohesion: 0.43
Nodes (14): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+6 more)

### Community 15 - "atenderMensaje"
Cohesion: 0.29
Nodes (14): ASIS, atenderMensaje(), bajarMediaWaha(), escribir(), escribirLista(), escuchar(), esSinbot(), esWaha() (+6 more)

### Community 16 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

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

### Community 23 - "pruebas.js"
Cohesion: 0.10
Nodes (17): assert, GS_MARY, INFO, test, assert, fs, NUESTROS, path (+9 more)

### Community 24 - "handleAct"
Cohesion: 0.22
Nodes (13): planOfBiz(), addMonths(), adminUrl(), handleAct(), msgFor(), openM(), openStore(), phoneOf() (+5 more)

### Community 25 - "renderLane"
Cohesion: 0.39
Nodes (9): daysLeft(), dm(), initials(), logoOf(), planLine(), renderBiz(), renderLane(), stateOf() (+1 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.10
Nodes (44): activeStories(), actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeTimes() (+36 more)

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

### Community 33 - "renderWaBot"
Cohesion: 0.47
Nodes (6): botCfg(), botGuardar(), maryWaCard(), mwEsperar(), mwPintar(), renderWaBot()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderSettings"
Cohesion: 0.18
Nodes (20): isTrial(), lockCard(), myPlan(), planFor(), planInfo(), PLANS(), readPM(), renderClosed() (+12 more)

### Community 41 - "openAptModal"
Cohesion: 0.47
Nodes (6): custName(), loadModalLocks(), openAptModal(), renderExtras(), renderModalSlots(), staffOptions()

### Community 45 - "openWizard"
Cohesion: 0.21
Nodes (13): applyPanelBrand(), closeWizard(), drawWizard(), imgToDataUrl(), openWizard(), panelPrefs(), renderAppearance(), renderPanelOrder() (+5 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 274 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `renderWaBot`, `admin.js`, `common.js`, `esc`, `bogNow`, `openAptModal`, `mary.gs`, `drawStory`, `toMillis`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05609756097560976 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08817204301075268 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `renderWaBot`, `app.js`, `admin.js`, `common.js`, `super.js`, `renderSettings`, `bogNow`, `openAptModal`, `drawStory`, `openWizard`, `plansOf`, `openStoryViewer`, `handleAct`, `renderLane`, `toMillis`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._