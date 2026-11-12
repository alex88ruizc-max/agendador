# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 32 files · ~140,947 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 1007 nodes · 2911 edges · 55 communities (47 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bf9459ce`
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
- bogNow
- cartero.py
- mary.gs
- drawStory
- textos.js
- gas
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
- renderReferrals
- log
- esc
- atenderPedidoWa
- renderPlan
- environment
- oido-agendador
- handleAct
- applyBrandColors
- renderWaBot
- closeMenus
- guideSteps
- syncBottomNav
- toMinW

## God Nodes (most connected - your core abstractions)
1. `esc()` - 84 edges
2. `bogNow()` - 50 edges
3. `toast()` - 49 edges
4. `bpath()` - 47 edges
5. `crear()` - 41 edges
6. `toMillis()` - 34 edges
7. `cop()` - 34 edges
8. `hora12()` - 34 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 28 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `planForm()` --calls--> `bogNow()`  [EXTRACTED]
  super.js → common.js
- `planForm()` --calls--> `esc()`  [EXTRACTED]
  super.js → common.js
- `renderNewsAdmin()` --calls--> `esc()`  [EXTRACTED]
  super.js → common.js
- `renderNewsAdmin()` --calls--> `toMillis()`  [EXTRACTED]
  super.js → common.js

## Import Cycles
- None detected.

## Communities (55 total, 8 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (31): AGRUPA, atendidos, _banco, BOT, BOT_DEF, BOT_LEIDO, botDesdeBase(), botNormal() (+23 more)

### Community 1 - "super.js"
Cohesion: 0.09
Nodes (24): auth, PLAN_KEYS, readPublishedVersion(), reloadFresh(), RULES_VERSION, salirAlNavegador(), startUpdateWatcher(), FILTERS (+16 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (75): renderQDays(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), checkPhone() (+67 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (45): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, DAY_SHORT (+37 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (37): app, APP_VERSION, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), categoriaAuto() (+29 more)

### Community 5 - "estado.js"
Cohesion: 0.09
Nodes (31): imapflow, mailparser, @resvg/resvg-js, color(), DCORTO, DIAS, fechaLarga(), inicial() (+23 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (23): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+15 more)

### Community 7 - "bpath"
Cohesion: 0.17
Nodes (36): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), imgToDataUrl() (+28 more)

### Community 8 - "bogNow"
Cohesion: 0.16
Nodes (25): actStats(), bogDay(), bogHour(), buildRecs(), estadoCupos(), fillAsStory(), freeNowStaff(), freeTimes() (+17 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (28): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+20 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (44): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+36 more)

### Community 11 - "drawStory"
Cohesion: 0.21
Nodes (15): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor(), hexRgba(), loadImg() (+7 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "gas"
Cohesion: 0.15
Nodes (17): llega(), alEventoConexion(), armarEstado(), botDe(), botFresco(), buscarClave(), contactosDe(), deWaha() (+9 more)

### Community 14 - "openWizard"
Cohesion: 0.23
Nodes (12): closeWizard(), drawWizard(), openWizard(), socialHandle(), wizChange(), wizClick(), wizInit(), wizInput() (+4 more)

### Community 15 - "cuposLocal.js"
Cohesion: 0.23
Nodes (17): crear(), cupos(), datos(), dias(), horas(), DIAS, diaTxt(), dow() (+9 more)

### Community 16 - "isKeyMethod"
Cohesion: 0.18
Nodes (11): pmProblem(), renderPM(), isKeyMethod(), payAccountInput(), pushNav(), warmServer(), goMoney(), goSV() (+3 more)

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
Cohesion: 0.32
Nodes (8): planPrice(), renderTrialPlans(), showTrialForm(), planBenefits(), planBenefitsIntro(), planPriceOf(), plansOf(), renderPlanEditor()

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.11
Nodes (36): activeStories(), applyPanelBrand(), firstName(), goTab(), isBusy(), isOwner(), isServing(), linkOptOn() (+28 more)

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

### Community 41 - "renderReferrals"
Cohesion: 0.17
Nodes (12): abrirCupos(), citasCliente(), citasDeClientes(), k10(), loadUsers(), onErr(), refCap(), refLevels() (+4 more)

### Community 42 - "log"
Cohesion: 0.36
Nodes (17): ahoraLocal(), anotar(), arrancarRelojes(), atiende(), botAlDia(), cada(), leer(), log() (+9 more)

### Community 43 - "esc"
Cohesion: 0.15
Nodes (38): aptCard(), bloqueo(), brPreview(), citasHtml(), custName(), loadLost(), loadModalLocks(), openAptModal() (+30 more)

### Community 44 - "atenderPedidoWa"
Cohesion: 0.40
Nodes (15): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+7 more)

### Community 45 - "renderPlan"
Cohesion: 0.16
Nodes (21): isTrial(), lockCard(), lookupPhone(), myPlan(), planFor(), planInfo(), PLANS(), readPM() (+13 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "handleAct"
Cohesion: 0.22
Nodes (10): openConsent(), hideModal(), openModal(), planOfBiz(), addMonths(), handleAct(), openM(), planForm() (+2 more)

### Community 49 - "applyBrandColors"
Cohesion: 0.36
Nodes (9): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), headerBgCss(), hexRgb(), lum() (+1 more)

### Community 50 - "renderWaBot"
Cohesion: 0.38
Nodes (7): botCfg(), botGuardar(), maryWaCard(), mwCuenta(), mwEsperar(), mwPintar(), renderWaBot()

### Community 52 - "guideSteps"
Cohesion: 0.43
Nodes (7): guideCard(), guideDone(), guideProgress(), guideSteps(), openGuide(), stepDone(), wizPassed()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 292 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `app.js`, `admin.js`, `common.js`, `bpath`, `bogNow`, `mary.gs`, `drawStory`, `renderWaBot`, `toMillis`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.062388591800356503 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08602150537634409 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `app.js`, `admin.js`, `common.js`, `bpath`, `bogNow`, `renderReferrals`, `drawStory`, `renderPlan`, `openWizard`, `isKeyMethod`, `applyBrandColors`, `renderWaBot`, `handleAct`, `guideSteps`, `handleAct`, `plansOf`, `toMillis`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._