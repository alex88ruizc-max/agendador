# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 30 files · ~111,082 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .css 3, .ejemplo 2)

## Summary
- 888 nodes · 2597 edges · 49 communities (40 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 98 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3c92336b`
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
- openAptModal
- switchTab
- renderSettings
- plansOf
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- pruebas.js
- renderLane
- openWizard
- options
- waha-agendador
- atenderMensaje
- openQuick
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- toMillis
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- atenderPedidoWa
- applyBrandColors
- openStore
- openStoryViewer
- closeMenus
- syncBottomNav
- wizInit
- toMinW
- isKeyMethod

## God Nodes (most connected - your core abstractions)
1. `esc()` - 81 edges
2. `toast()` - 48 edges
3. `bpath()` - 45 edges
4. `bogNow()` - 44 edges
5. `cop()` - 34 edges
6. `toMillis()` - 34 edges
7. `renderHome()` - 32 edges
8. `hora12()` - 31 edges
9. `crear()` - 30 edges
10. `openM()` - 24 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `brPreview()` --calls--> `esc()`  [EXTRACTED]
  admin.js → common.js
- `brPreview()` --calls--> `fillTemplate()`  [EXTRACTED]
  admin.js → common.js
- `brPreview()` --calls--> `hora12()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (49 total, 9 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (37): atendidos, bajarMediaWaha(), _banco, BOT, BOT_DEF, CFG, CONTACTOS, contactosDe() (+29 more)

### Community 1 - "toast"
Cohesion: 0.12
Nodes (47): aptAction(), brPreview(), clientHistory(), closeM(), connectWhatsApp(), custName(), deleteClient(), geoSkipKey() (+39 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (99): aptCard(), h12s(), hoursSummary(), renderClosed(), renderFree(), renderQDays(), afterGoogle(), APP (+91 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (42): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, DAY_SHORT (+34 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (37): app, BID, BIZ_TYPES, BRAND, brandRow(), businessFromUrl(), categoriaAuto(), db (+29 more)

### Community 5 - "estado.js"
Cohesion: 0.07
Nodes (37): imapflow, mailparser, @resvg/resvg-js, fs, leerPago(), montos(), pagador(), path (+29 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (22): assert, CATALOGO, CONFIRMADA, DIR, filas(), fs, HOY, ids() (+14 more)

### Community 7 - "super.js"
Cohesion: 0.08
Nodes (23): APP_VERSION, auth, pushNav(), readPublishedVersion(), reloadFresh(), RULES_VERSION, salirAlNavegador(), SERVER_VERSION (+15 more)

### Community 8 - "bogNow"
Cohesion: 0.12
Nodes (32): activeStories(), actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeNowStaff() (+24 more)

### Community 9 - "cartero.py"
Cohesion: 0.17
Nodes (19): atender(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl(), decir(), env_leer() (+11 more)

### Community 10 - "mary.gs"
Cohesion: 0.14
Nodes (39): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+31 more)

### Community 11 - "newStory"
Cohesion: 0.21
Nodes (15): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor(), hexRgba(), loadImg() (+7 more)

### Community 12 - "renderAppearance"
Cohesion: 0.18
Nodes (14): applyPanelBrand(), guideCard(), guideDone(), guideProgress(), guideSteps(), imgToDataUrl(), markGuide(), openGuide() (+6 more)

### Community 13 - "openAptModal"
Cohesion: 0.60
Nodes (5): loadModalLocks(), openAptModal(), renderExtras(), renderModalSlots(), staffOptions()

### Community 14 - "switchTab"
Cohesion: 0.25
Nodes (16): isOwner(), linkOptOn(), myPlan(), onErr(), renderAgenda(), renderLinkCli(), renderPlan(), renderServices() (+8 more)

### Community 15 - "renderSettings"
Cohesion: 0.20
Nodes (19): botCfg(), botGuardar(), isTrial(), lockCard(), maryWaCard(), mwEsperar(), mwPintar(), planFor() (+11 more)

### Community 16 - "plansOf"
Cohesion: 0.24
Nodes (11): planPrice(), renderTrialPlans(), showTrialForm(), planBenefits(), planBenefitsIntro(), planPriceOf(), plansOf(), loadPlanCfg() (+3 more)

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.08
Nodes (60): corto(), crear(), agendar(), aprender(), cancelarCita(), catalogo(), cliente(), crearCita() (+52 more)

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
Nodes (18): assert, GS_MARY, INFO, test, assert, fs, NUESTROS, path (+10 more)

### Community 24 - "renderLane"
Cohesion: 0.24
Nodes (14): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+6 more)

### Community 25 - "openWizard"
Cohesion: 0.25
Nodes (11): closeWizard(), drawWizard(), openWizard(), readPM(), saveSettings(), wizChange(), wizClick(), wizInput() (+3 more)

### Community 26 - "options"
Cohesion: 0.36
Nodes (8): logging, logging, driver, options, max-file, max-size, logging, logging

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "atenderMensaje"
Cohesion: 0.28
Nodes (23): alEventoConexion(), anotar(), armarEstado(), arrancarRelojes(), ASIS, atenderMensaje(), atiende(), botDe() (+15 more)

### Community 29 - "openQuick"
Cohesion: 0.39
Nodes (9): loadQLocks(), openQuick(), qMinutes(), qSlotsFor(), renderQMains(), renderQSlots(), renderQStaff(), saveQuick() (+1 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "toMillis"
Cohesion: 0.23
Nodes (12): newsUnread(), openPlatformNews(), refCap(), refLevels(), refLink(), renderBell(), renderReferrals(), startNews() (+4 more)

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "atenderPedidoWa"
Cohesion: 0.43
Nodes (14): asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid(), numeroInstancia() (+6 more)

### Community 41 - "applyBrandColors"
Cohesion: 0.43
Nodes (8): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), hexRgb(), lum(), onColor()

### Community 42 - "openStore"
Cohesion: 0.38
Nodes (7): adminUrl(), msgFor(), openM(), openStore(), phoneOf(), publicUrl(), waTo()

### Community 43 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 48 - "isKeyMethod"
Cohesion: 0.50
Nodes (4): pmProblem(), renderPM(), isKeyMethod(), payAccountInput()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 239 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `app.js` to `toast`, `admin.js`, `common.js`, `bogNow`, `mary.gs`, `newStory`, `openAptModal`, `renderSettings`, `openQuick`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06025641025641026 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `app.js`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `toast` be split into smaller, more focused modules?**
  _Cohesion score 0.12025901942645699 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `renderSettings` to `toast`, `app.js`, `admin.js`, `toMillis`, `common.js`, `super.js`, `bogNow`, `applyBrandColors`, `openStore`, `newStory`, `renderAppearance`, `openAptModal`, `switchTab`, `openStoryViewer`, `isKeyMethod`, `plansOf`, `renderLane`, `openQuick`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05672948791166952 - nodes in this community are weakly interconnected._