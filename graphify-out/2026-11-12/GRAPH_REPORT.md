# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 30 files · ~108,269 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 877 nodes · 2580 edges · 43 communities (38 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 97 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d1275062`
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
- bogNow
- cartero.py
- mary.gs
- newStory
- renderAppearance
- openStore
- bogNow
- renderSettings
- warmServer
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- pruebas.js
- plansOf
- renderReferrals
- options
- waha-agendador
- openStoryViewer
- openQuick
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- atenderMensaje
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- atenderPedidoWa
- config.js
- renderWaBot

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 48 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 44 edges
5. `toMillis()` - 34 edges
6. `cop()` - 34 edges
7. `renderHome()` - 32 edges
8. `hora12()` - 31 edges
9. `crear()` - 30 edges
10. `switchTab()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `atenderMensaje()` --calls--> `fotoRecibida()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `atenderMensaje()` --calls--> `fotoSinCita()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `atenderMensaje()` --calls--> `problema()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (43 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (40): alMensaje(), armarEstado(), atendidos, bajarMediaWaha(), _banco, BOT, BOT_DEF, CFG (+32 more)

### Community 1 - "toast"
Cohesion: 0.18
Nodes (36): aptAction(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep(), loadUsers() (+28 more)

### Community 2 - "app.js"
Cohesion: 0.05
Nodes (111): aptCard(), brPreview(), custName(), loadLost(), loadModalLocks(), openAptModal(), renderAgenda(), renderExtras() (+103 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (60): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, closeMenus() (+52 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (36): app, auth, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), db (+28 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (21): assert, CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY, ids() (+13 more)

### Community 7 - "super.js"
Cohesion: 0.09
Nodes (23): APP_VERSION, RULES_VERSION, salirAlNavegador(), TG_EVENTS, addMonths(), FILTERS, HIDDEN, hideOrder() (+15 more)

### Community 8 - "bogNow"
Cohesion: 0.11
Nodes (31): activeStories(), actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeNowStaff() (+23 more)

### Community 9 - "cartero.py"
Cohesion: 0.20
Nodes (13): atender(), bajar(), banco_web(), curl(), decir(), gh(), hacer_apk(), instalar_mary() (+5 more)

### Community 10 - "mary.gs"
Cohesion: 0.14
Nodes (38): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCategorias_(), maryChat_() (+30 more)

### Community 11 - "newStory"
Cohesion: 0.14
Nodes (23): apInitials(), applyPanelBrand(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText() (+15 more)

### Community 12 - "renderAppearance"
Cohesion: 0.19
Nodes (13): guideCard(), guideDone(), guideProgress(), guideSteps(), imgToDataUrl(), markGuide(), openGuide(), openShareGuide() (+5 more)

### Community 13 - "openStore"
Cohesion: 0.18
Nodes (18): adminUrl(), daysLeft(), dm(), goMoney(), initials(), logoOf(), msgFor(), openM() (+10 more)

### Community 14 - "bogNow"
Cohesion: 0.15
Nodes (31): goTab(), h12s(), hoursSummary(), isOwner(), isTrial(), linkOptOn(), lockCard(), lockedNow() (+23 more)

### Community 15 - "renderSettings"
Cohesion: 0.40
Nodes (6): readPM(), renderSettings(), saveSettings(), trialDays(), fastSave(), staffWord()

### Community 16 - "warmServer"
Cohesion: 0.20
Nodes (10): pmProblem(), renderPM(), isKeyMethod(), payAccountInput(), pushNav(), warmServer(), goSV(), loadPlanCfg() (+2 more)

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.09
Nodes (63): corto(), crear(), agendar(), aprender(), cancelarCita(), catalogo(), cliente(), crearCita() (+55 more)

### Community 19 - "agendador-ia"
Cohesion: 0.18
Nodes (11): build, container_name, cpus, depends_on, env_file, mem_limit, networks, ports (+3 more)

### Community 20 - "postgres-agendador"
Cohesion: 0.18
Nodes (11): POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, container_name, environment, image, mem_limit, networks (+3 more)

### Community 21 - "services"
Cohesion: 0.20
Nodes (9): name, name, networks, agenda, services, volumes, evo_instancias, pg_datos (+1 more)

### Community 22 - "evolution-agendador"
Cohesion: 0.20
Nodes (10): container_name, depends_on, env_file, image, mem_limit, networks, ports, restart (+2 more)

### Community 23 - "pruebas.js"
Cohesion: 0.10
Nodes (18): assert, INFO, test, assert, fs, NUESTROS, path, RAIZ (+10 more)

### Community 24 - "plansOf"
Cohesion: 0.40
Nodes (6): planPrice(), renderTrialPlans(), showTrialForm(), planBenefitsIntro(), planPriceOf(), plansOf()

### Community 25 - "renderReferrals"
Cohesion: 0.50
Nodes (4): refCap(), refLevels(), refLink(), renderReferrals()

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 29 - "openQuick"
Cohesion: 0.23
Nodes (13): loadQLocks(), lookupPhone(), onErr(), openQuick(), qMinutes(), qSlotsFor(), renderQDays(), renderQSlots() (+5 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "atenderMensaje"
Cohesion: 0.24
Nodes (25): ahoraLocal(), alEventoConexion(), anotar(), arrancarRelojes(), ASIS, atenderMensaje(), atiende(), botDe() (+17 more)

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "atenderPedidoWa"
Cohesion: 0.43
Nodes (14): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+6 more)

### Community 41 - "config.js"
Cohesion: 0.33
Nodes (5): API_URL, DEFAULT_BUSINESS_ID, firebaseConfig, META_APP_ID, META_CONFIG_ID

### Community 42 - "renderWaBot"
Cohesion: 0.47
Nodes (6): botCfg(), botGuardar(), maryWaCard(), mwEsperar(), mwPintar(), renderWaBot()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 233 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `toast`, `admin.js`, `common.js`, `bogNow`, `renderWaBot`, `newStory`, `mary.gs`, `bogNow`, `openQuick`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06090808416389812 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0517162471395881 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `app.js` to `toast`, `admin.js`, `common.js`, `super.js`, `bogNow`, `renderWaBot`, `newStory`, `renderAppearance`, `openStore`, `bogNow`, `renderSettings`, `warmServer`, `plansOf`, `renderReferrals`, `openStoryViewer`, `openQuick`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.039938556067588324 - nodes in this community are weakly interconnected._