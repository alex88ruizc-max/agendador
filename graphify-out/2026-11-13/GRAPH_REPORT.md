# Graph Report - agendador  (2026-11-13)

## Corpus Check
- 32 files · ~145,927 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 1032 nodes · 2968 edges · 50 communities (45 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 124 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2173aad5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- super.js
- atenderMensaje
- admin.js
- common.js
- estado.js
- escenarios.js
- bpath
- openQuick
- cartero.py
- mary.gs
- app.js
- textos.js
- newStory
- openWizard
- cuposLocal.js
- atenderPedidoWa
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- gas
- handleAct
- esc
- options
- waha-agendador
- toMillis
- reglas.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- correo.js
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- pruebas.js
- renderAppearance
- memGuardar
- handleAct
- esc
- tarea-clasp
- oido-agendador
- applyBrandColors
- openStoryViewer
- tarea-banco

## God Nodes (most connected - your core abstractions)
1. `esc()` - 85 edges
2. `bogNow()` - 52 edges
3. `toast()` - 49 edges
4. `bpath()` - 48 edges
5. `crear()` - 42 edges
6. `cop()` - 35 edges
7. `hora12()` - 34 edges
8. `toMillis()` - 34 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `warmServer()`  [EXTRACTED]
  admin.js → common.js
- `renderPlanBanner()` --calls--> `bogNow()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (50 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (37): llega(), AGRUPA, atendidos, _banco, BOT, BOT_DEF, BOT_LEIDO, botDesdeBase() (+29 more)

### Community 1 - "super.js"
Cohesion: 0.08
Nodes (24): APP_VERSION, auth, PLAN_KEYS, pushNav(), readPublishedVersion(), reloadFresh(), salirAlNavegador(), startUpdateWatcher() (+16 more)

### Community 2 - "atenderMensaje"
Cohesion: 0.25
Nodes (23): ahoraLocal(), anotar(), arrancarRelojes(), atenderMensaje(), atiende(), bajarMediaWaha(), botAlDia(), botDe() (+15 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (64): A, ACT, ACTIVE, actStats(), ALL_TABS, bogDay(), bogHour(), BOT_DEF (+56 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (40): app, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), categoriaAuto(), closeModal() (+32 more)

### Community 5 - "estado.js"
Cohesion: 0.09
Nodes (31): imapflow, mailparser, @resvg/resvg-js, color(), DCORTO, DIAS, fechaLarga(), inicial() (+23 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (22): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+14 more)

### Community 7 - "bpath"
Cohesion: 0.16
Nodes (39): aptAction(), brPreview(), citasDeClientes(), clientHistory(), closeM(), connectWhatsApp(), custName(), deleteClient() (+31 more)

### Community 8 - "openQuick"
Cohesion: 0.26
Nodes (12): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff() (+4 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (28): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+20 more)

### Community 10 - "mary.gs"
Cohesion: 0.11
Nodes (45): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+37 more)

### Community 11 - "app.js"
Cohesion: 0.06
Nodes (100): aptCard(), bloqueo(), citasHtml(), estadoCupos(), freeNowStaff(), freeSlotsFor(), myStaff(), payLine() (+92 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "newStory"
Cohesion: 0.19
Nodes (17): activeStories(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba(), loadImg() (+9 more)

### Community 14 - "openWizard"
Cohesion: 0.39
Nodes (8): closeWizard(), drawWizard(), openWizard(), wizChange(), wizClick(), wizInput(), wizReadSvcs(), wizWatchTg()

### Community 15 - "cuposLocal.js"
Cohesion: 0.23
Nodes (17): crear(), cupos(), datos(), dias(), horas(), DIAS, diaTxt(), dow() (+9 more)

### Community 16 - "atenderPedidoWa"
Cohesion: 0.40
Nodes (15): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+7 more)

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.14
Nodes (51): conNumeros(), corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo() (+43 more)

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

### Community 23 - "gas"
Cohesion: 0.19
Nodes (13): alEventoConexion(), armarEstado(), botFresco(), contactosDe(), gas(), guardarImg(), json(), leer() (+5 more)

### Community 24 - "handleAct"
Cohesion: 0.23
Nodes (15): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+7 more)

### Community 25 - "esc"
Cohesion: 0.16
Nodes (15): planPrice(), pmProblem(), renderPM(), renderTrialPlans(), showTrialForm(), isKeyMethod(), payAccountInput(), planBenefits() (+7 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.09
Nodes (49): abrirCupos(), buildRecs(), fillAsStory(), firstName(), freeTimes(), goTab(), hh(), isBusy() (+41 more)

### Community 29 - "reglas.js"
Cohesion: 0.18
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "correo.js"
Cohesion: 0.31
Nodes (6): fs, leerPago(), montos(), pagador(), path, revisarBuzon()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "pruebas.js"
Cohesion: 0.10
Nodes (13): assert, baseFalsa(), fsVal(), GS_MARY, INFO, SEMANA, test, alMensaje() (+5 more)

### Community 41 - "renderAppearance"
Cohesion: 0.16
Nodes (15): applyPanelBrand(), guideCard(), guideDone(), guideProgress(), guideSteps(), imgToDataUrl(), markGuide(), openGuide() (+7 more)

### Community 42 - "memGuardar"
Cohesion: 0.50
Nodes (9): ASIS, escribir(), escribirLista(), esWaha(), memGuardar(), numeroWa(), sesionDe(), tickRevisadas() (+1 more)

### Community 44 - "handleAct"
Cohesion: 0.21
Nodes (14): planOfBiz(), uiPrompt(), addMonths(), adminUrl(), deleteBusiness(), handleAct(), msgFor(), openM() (+6 more)

### Community 45 - "esc"
Cohesion: 0.12
Nodes (28): botCfg(), botGuardar(), isTrial(), loadModalLocks(), lockCard(), maryWaCard(), mwCuenta(), mwEsperar() (+20 more)

### Community 46 - "tarea-clasp"
Cohesion: 0.29
Nodes (7): tarea-clasp, cpus, image, mem_limit, networks, profiles, working_dir

### Community 47 - "oido-agendador"
Cohesion: 0.15
Nodes (13): HILOS, IDIOMA, MODELO, build, container_name, cpus, environment, image (+5 more)

### Community 49 - "applyBrandColors"
Cohesion: 0.36
Nodes (9): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), headerBgCss(), hexRgb(), lum() (+1 more)

### Community 51 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 52 - "tarea-banco"
Cohesion: 0.33
Nodes (6): tarea-banco, cpus, image, mem_limit, network_mode, profiles

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 305 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `admin.js`, `common.js`, `bpath`, `openQuick`, `mary.gs`, `esc`, `newStory`, `toMillis`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05641025641025641 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08045977011494253 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `admin.js`, `common.js`, `bpath`, `openQuick`, `renderAppearance`, `app.js`, `handleAct`, `newStory`, `applyBrandColors`, `openStoryViewer`, `handleAct`, `esc`, `toMillis`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._