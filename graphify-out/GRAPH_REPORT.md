# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 32 files · ~139,003 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 1001 nodes · 2885 edges · 52 communities (47 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `23e4336e`
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
- bpath
- esc
- cartero.py
- mary.gs
- drawStory
- textos.js
- bogNow
- openWizard
- cuposLocal.js
- isKeyMethod
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- atenderMensaje
- handleAct
- cop
- options
- waha-agendador
- toMillis
- toast
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- config.js
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- pruebas.js
- bogNow
- log
- esc
- atenderPedidoWa
- esc
- environment
- oido-agendador
- boot
- openStore
- renderStaffTab
- guideSteps

## God Nodes (most connected - your core abstractions)
1. `esc()` - 84 edges
2. `bogNow()` - 50 edges
3. `toast()` - 49 edges
4. `bpath()` - 47 edges
5. `crear()` - 39 edges
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

## Communities (52 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (42): AGRUPA, armarEstado(), atendidos, _banco, BOT, BOT_DEF, BOT_LEIDO, botDe() (+34 more)

### Community 1 - "super.js"
Cohesion: 0.08
Nodes (20): APP_VERSION, auth, PLAN_KEYS, readPublishedVersion(), reloadFresh(), SERVER_VERSION, setNavHandler(), startUpdateWatcher() (+12 more)

### Community 2 - "app.js"
Cohesion: 0.08
Nodes (44): APP, BIZ_ID, busyUntilLabel(), checkPhone(), CITA_LINK, COUNTRIES, country(), googleBloqueado() (+36 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (57): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, citasCliente(), CLIENT_FILTERS (+49 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (31): app, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), categoriaAuto(), db (+23 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.07
Nodes (27): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+19 more)

### Community 7 - "bpath"
Cohesion: 0.12
Nodes (32): abrirCupos(), citasDeClientes(), clientHistory(), closeM(), deleteClient(), geoSkipKey(), goStep(), loadQLocks() (+24 more)

### Community 8 - "esc"
Cohesion: 0.36
Nodes (9): lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff(), updQSave() (+1 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (44): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+36 more)

### Community 11 - "drawStory"
Cohesion: 0.12
Nodes (26): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+18 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "bogNow"
Cohesion: 0.18
Nodes (21): freeNowStaff(), renderQNow(), walkInReason(), dayBookable(), dayGrid(), dayRatio(), freeFrom(), hoursOfStaff() (+13 more)

### Community 14 - "openWizard"
Cohesion: 0.27
Nodes (11): closeWizard(), drawWizard(), openWizard(), socialHandle(), syncPlanGate(), wizChange(), wizClick(), wizInit() (+3 more)

### Community 15 - "cuposLocal.js"
Cohesion: 0.23
Nodes (17): crear(), cupos(), datos(), dias(), horas(), DIAS, diaTxt(), dow() (+9 more)

### Community 16 - "isKeyMethod"
Cohesion: 0.20
Nodes (10): pmProblem(), renderPM(), isKeyMethod(), payAccountInput(), pushNav(), goMoney(), goSV(), loadPlanCfg() (+2 more)

### Community 17 - "environment"
Cohesion: 0.29
Nodes (7): WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED, WAHA_PRINT_QR, WHATSAPP_DEFAULT_ENGINE, WHATSAPP_SWAGGER_ENABLED, environment

### Community 18 - "textos.js"
Cohesion: 0.15
Nodes (49): conNumeros(), corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo() (+41 more)

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

### Community 23 - "atenderMensaje"
Cohesion: 0.36
Nodes (8): atenderMensaje(), bajarMediaWaha(), debeResponder(), escuchar(), esSinbot(), esWaha(), frenoRobot(), normal()

### Community 24 - "handleAct"
Cohesion: 0.26
Nodes (13): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+5 more)

### Community 25 - "cop"
Cohesion: 0.20
Nodes (18): renderPlan(), canChange(), renderMine(), renderTrialPlans(), serviceButton(), showTrialForm(), subscribeMine(), cop() (+10 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.12
Nodes (35): activeStories(), actStats(), applyPanelBrand(), bogDay(), bogHour(), buildRecs(), estadoCupos(), fillAsStory() (+27 more)

### Community 29 - "toast"
Cohesion: 0.38
Nodes (7): connectTg(), renderTg(), watchTicket(), copyText(), toast(), uiPrompt(), deleteBusiness()

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "config.js"
Cohesion: 0.33
Nodes (5): API_URL, DEFAULT_BUSINESS_ID, firebaseConfig, META_APP_ID, META_CONFIG_ID

### Community 39 - "web.js"
Cohesion: 0.07
Nodes (22): assert, fs, NUESTROS, path, RAIZ, scripts, test, archivos (+14 more)

### Community 40 - "pruebas.js"
Cohesion: 0.11
Nodes (12): assert, baseFalsa(), fsVal(), GS_MARY, INFO, SEMANA, test, alMensaje() (+4 more)

### Community 41 - "bogNow"
Cohesion: 0.25
Nodes (15): renderImages(), renderQDays(), firstOpenDay(), maxDate(), nextBookableDay(), openResched(), renderCalendar(), shiftMonth() (+7 more)

### Community 42 - "log"
Cohesion: 0.26
Nodes (25): ahoraLocal(), alEventoConexion(), anotar(), arrancarRelojes(), ASIS, atiende(), botAlDia(), cada() (+17 more)

### Community 43 - "esc"
Cohesion: 0.18
Nodes (34): aptAction(), aptCard(), bloqueo(), brPreview(), citasHtml(), connectWhatsApp(), custName(), loadLost() (+26 more)

### Community 44 - "atenderPedidoWa"
Cohesion: 0.43
Nodes (14): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+6 more)

### Community 45 - "esc"
Cohesion: 0.15
Nodes (22): botCfg(), botGuardar(), isTrial(), lockCard(), maryWaCard(), mwCuenta(), mwEsperar(), mwPintar() (+14 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "boot"
Cohesion: 0.22
Nodes (17): renderClosed(), afterGoogle(), bookingStaff(), boot(), doHold(), expectedDeposit(), loadProfile(), onErr() (+9 more)

### Community 49 - "openStore"
Cohesion: 0.47
Nodes (6): adminUrl(), msgFor(), openStore(), phoneOf(), publicUrl(), waTo()

### Community 50 - "renderStaffTab"
Cohesion: 0.31
Nodes (9): h12s(), hoursSummary(), isBusy(), isServing(), meStaff(), renderMyStatus(), renderStaffTab(), timeOf() (+1 more)

### Community 52 - "guideSteps"
Cohesion: 0.43
Nodes (7): guideCard(), guideDone(), guideProgress(), guideSteps(), openGuide(), stepDone(), wizPassed()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 290 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `app.js`, `admin.js`, `common.js`, `esc`, `bogNow`, `mary.gs`, `drawStory`, `esc`, `bogNow`, `boot`, `renderStaffTab`, `toMillis`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05656565656565657 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08307692307692308 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `app.js`, `admin.js`, `common.js`, `bpath`, `esc`, `drawStory`, `bogNow`, `isKeyMethod`, `handleAct`, `cop`, `toMillis`, `toast`, `bogNow`, `esc`, `boot`, `openStore`, `renderStaffTab`, `guideSteps`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._