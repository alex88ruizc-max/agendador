# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 32 files · ~140,190 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 1005 nodes · 2903 edges · 50 communities (45 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `00cddf62`
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
- gas
- estado.js
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
- plansOf
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
- bogNow
- log
- cop
- atenderPedidoWa
- esc
- environment
- oido-agendador
- startUpdateWatcher
- guideSteps

## God Nodes (most connected - your core abstractions)
1. `esc()` - 84 edges
2. `bogNow()` - 50 edges
3. `toast()` - 49 edges
4. `bpath()` - 47 edges
5. `crear()` - 41 edges
6. `cop()` - 34 edges
7. `toMillis()` - 34 edges
8. `hora12()` - 34 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `drawImage()` --calls--> `addDays()`  [EXTRACTED]
  admin.js → common.js
- `drawImage()` --calls--> `bogNow()`  [EXTRACTED]
  admin.js → common.js
- `drawImage()` --calls--> `fechaLarga()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (50 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (31): AGRUPA, atendidos, _banco, BOT, BOT_DEF, BOT_LEIDO, botDesdeBase(), botNormal() (+23 more)

### Community 1 - "super.js"
Cohesion: 0.09
Nodes (23): APP_VERSION, DEFAULT_PAY_WARNING, SERVER_VERSION, addMonths(), FILTERS, HIDDEN, hideOrder(), NW_KINDS (+15 more)

### Community 2 - "app.js"
Cohesion: 0.05
Nodes (93): estadoCupos(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), checkPhone() (+85 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (72): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, closeMenus() (+64 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (37): app, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), categoriaAuto() (+29 more)

### Community 5 - "estado.js"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (23): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+15 more)

### Community 7 - "bpath"
Cohesion: 0.18
Nodes (35): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), manageStory() (+27 more)

### Community 8 - "esc"
Cohesion: 0.33
Nodes (10): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff() (+2 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (44): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+36 more)

### Community 11 - "drawStory"
Cohesion: 0.16
Nodes (21): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+13 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "gas"
Cohesion: 0.15
Nodes (17): llega(), alEventoConexion(), armarEstado(), botDe(), botFresco(), buscarClave(), contactosDe(), deWaha() (+9 more)

### Community 14 - "estado.js"
Cohesion: 0.24
Nodes (13): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+5 more)

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
Cohesion: 0.14
Nodes (50): conNumeros(), corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo() (+42 more)

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
Cohesion: 0.32
Nodes (13): ASIS, atenderMensaje(), bajarMediaWaha(), escribir(), escribirLista(), escuchar(), esSinbot(), esWaha() (+5 more)

### Community 24 - "handleAct"
Cohesion: 0.24
Nodes (15): adminUrl(), daysLeft(), dm(), initials(), logoOf(), msgFor(), openStore(), phoneOf() (+7 more)

### Community 25 - "plansOf"
Cohesion: 0.67
Nodes (4): renderTrialPlans(), showTrialForm(), planBenefitsIntro(), plansOf()

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.09
Nodes (42): activeStories(), buildRecs(), fillAsStory(), firstName(), freeNowStaff(), freeTimes(), goTab(), hh() (+34 more)

### Community 29 - "reglas.js"
Cohesion: 0.20
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
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "pruebas.js"
Cohesion: 0.10
Nodes (13): assert, baseFalsa(), fsVal(), GS_MARY, INFO, SEMANA, test, alMensaje() (+5 more)

### Community 41 - "bogNow"
Cohesion: 0.16
Nodes (21): abrirCupos(), actStats(), bloqueo(), bogDay(), bogHour(), citasCliente(), citasDeClientes(), citasHtml() (+13 more)

### Community 42 - "log"
Cohesion: 0.36
Nodes (17): ahoraLocal(), anotar(), arrancarRelojes(), atiende(), botAlDia(), cada(), leer(), log() (+9 more)

### Community 43 - "cop"
Cohesion: 0.27
Nodes (19): aptCard(), brPreview(), custName(), loadModalLocks(), openAptModal(), payLine(), renderExtras(), renderModalSlots() (+11 more)

### Community 44 - "atenderPedidoWa"
Cohesion: 0.40
Nodes (15): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+7 more)

### Community 45 - "esc"
Cohesion: 0.12
Nodes (37): applyPanelBrand(), botCfg(), botGuardar(), isOwner(), isTrial(), linkOptOn(), loadLost(), lockCard() (+29 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "startUpdateWatcher"
Cohesion: 0.67
Nodes (3): readPublishedVersion(), reloadFresh(), startUpdateWatcher()

### Community 52 - "guideSteps"
Cohesion: 0.43
Nodes (7): guideCard(), guideDone(), guideProgress(), guideSteps(), openGuide(), stepDone(), wizPassed()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 292 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `cop` to `app.js`, `admin.js`, `common.js`, `bpath`, `esc`, `bogNow`, `mary.gs`, `drawStory`, `esc`, `toMillis`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `cop`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08735632183908046 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05240549828178694 - nodes in this community are weakly interconnected._