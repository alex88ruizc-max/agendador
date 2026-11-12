# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 32 files · ~143,820 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 1021 nodes · 2928 edges · 54 communities (49 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `894a8e24`
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
- openQuick
- cartero.py
- mary.gs
- bogNow
- textos.js
- boot
- openWizard
- cuposLocal.js
- isKeyMethod
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- toMillis
- handleAct
- esc
- options
- waha-agendador
- renderHome
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
- start
- renderStaffTab
- cop
- openStore
- renderPlan
- tarea-clasp
- oido-agendador
- fechaCorta
- applyBrandColors
- renderWaBot
- openStoryViewer
- tarea-banco
- openAptModal

## God Nodes (most connected - your core abstractions)
1. `esc()` - 84 edges
2. `bogNow()` - 50 edges
3. `toast()` - 49 edges
4. `bpath()` - 47 edges
5. `crear()` - 42 edges
6. `toMillis()` - 34 edges
7. `cop()` - 34 edges
8. `hora12()` - 34 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `llega()` --calls--> `deWaha()`  [EXTRACTED]
  vps/banco/escenarios.js → vps/principal.js
- `myPlan()` --calls--> `planOfBiz()`  [EXTRACTED]
  admin.js → common.js
- `maxDate()` --calls--> `planOfBiz()`  [EXTRACTED]
  app.js → common.js
- `handleAct()` --calls--> `planOfBiz()`  [EXTRACTED]
  super.js → common.js

## Import Cycles
- None detected.

## Communities (54 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (98): llega(), AGRUPA, ahoraLocal(), alEventoConexion(), alMensaje(), anotar(), armarEstado(), arrancarRelojes() (+90 more)

### Community 1 - "super.js"
Cohesion: 0.08
Nodes (25): APP_VERSION, BIZ_TYPES, enAppInterna(), planOfBiz(), pushNav(), readPublishedVersion(), reloadFresh(), replaceNav() (+17 more)

### Community 2 - "app.js"
Cohesion: 0.10
Nodes (29): afterGoogle(), APP, BIZ_ID, checkPhone(), CITA_LINK, connectTg(), COUNTRIES, country() (+21 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (58): A, ACT, ACTIVE, actStats(), ALL_TABS, bogDay(), bogHour(), BOT_DEF (+50 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (33): app, auth, BID, BRAND, businessFromUrl(), categoriaAuto(), db, DEFAULT_BENEFITS (+25 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (23): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+15 more)

### Community 7 - "bpath"
Cohesion: 0.17
Nodes (38): aptAction(), bloqueo(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), loadUsers() (+30 more)

### Community 8 - "openQuick"
Cohesion: 0.39
Nodes (9): loadQLocks(), lookupPhone(), openQuick(), qMinutes(), qSlotsFor(), renderQSlots(), renderQStaff(), updQSave() (+1 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (28): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+20 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (44): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+36 more)

### Community 11 - "bogNow"
Cohesion: 0.09
Nodes (51): citasCliente(), citasDeClientes(), citasHtml(), drawImage(), drawOwnStory(), drawRich(), drawStory(), estadoCupos() (+43 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "boot"
Cohesion: 0.26
Nodes (17): bookingStaff(), boot(), doHold(), expectedDeposit(), occFor(), onErr(), renderAll(), renderServices() (+9 more)

### Community 14 - "openWizard"
Cohesion: 0.25
Nodes (11): closeWizard(), drawWizard(), imgToDataUrl(), openWizard(), renderAppearance(), renderPanelOrder(), wizChange(), wizClick() (+3 more)

### Community 15 - "cuposLocal.js"
Cohesion: 0.23
Nodes (17): crear(), cupos(), datos(), dias(), horas(), DIAS, diaTxt(), dow() (+9 more)

### Community 16 - "isKeyMethod"
Cohesion: 0.50
Nodes (4): pmProblem(), renderPM(), isKeyMethod(), payAccountInput()

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

### Community 23 - "toMillis"
Cohesion: 0.17
Nodes (16): newsUnread(), openPlatformNews(), renderBell(), startNews(), busyUntilLabel(), canChange(), renderStaff(), staffIsBusy() (+8 more)

### Community 24 - "handleAct"
Cohesion: 0.26
Nodes (13): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+5 more)

### Community 25 - "esc"
Cohesion: 0.21
Nodes (16): loadLost(), planPrice(), renderPlan(), renderQMains(), renderTrialPlans(), serviceButton(), showTrialForm(), esc() (+8 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "renderHome"
Cohesion: 0.13
Nodes (30): activeStories(), buildRecs(), fillAsStory(), firstName(), freeTimes(), goStep(), goTab(), guideCard() (+22 more)

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
Cohesion: 0.12
Nodes (8): assert, baseFalsa(), fsVal(), GS_MARY, INFO, SEMANA, test, debeResponder()

### Community 41 - "start"
Cohesion: 0.25
Nodes (14): abrirCupos(), applyPanelBrand(), isOwner(), linkOptOn(), onErr(), panelPrefs(), renderAgenda(), renderLinkCli() (+6 more)

### Community 42 - "renderStaffTab"
Cohesion: 0.32
Nodes (8): h12s(), hoursSummary(), isBusy(), isServing(), meStaff(), renderMyStatus(), renderStaffTab(), timeOf()

### Community 43 - "cop"
Cohesion: 0.38
Nodes (12): aptCard(), brPreview(), custName(), apptCard(), renderMine(), showTicket(), cop(), fillTemplate() (+4 more)

### Community 44 - "openStore"
Cohesion: 0.38
Nodes (7): adminUrl(), msgFor(), openM(), openStore(), phoneOf(), publicUrl(), waTo()

### Community 45 - "renderPlan"
Cohesion: 0.19
Nodes (18): isTrial(), lockCard(), myPlan(), planFor(), planInfo(), PLANS(), readPM(), renderClosed() (+10 more)

### Community 46 - "tarea-clasp"
Cohesion: 0.29
Nodes (7): tarea-clasp, cpus, image, mem_limit, networks, profiles, working_dir

### Community 47 - "oido-agendador"
Cohesion: 0.15
Nodes (13): HILOS, IDIOMA, MODELO, build, container_name, cpus, environment, image (+5 more)

### Community 48 - "fechaCorta"
Cohesion: 0.19
Nodes (14): openConsent(), openResched(), presence(), showPay(), brandRow(), closeModal(), dialog(), dropOverlay() (+6 more)

### Community 49 - "applyBrandColors"
Cohesion: 0.43
Nodes (8): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), hexRgb(), lum(), onColor()

### Community 50 - "renderWaBot"
Cohesion: 0.38
Nodes (7): botCfg(), botGuardar(), maryWaCard(), mwCuenta(), mwEsperar(), mwPintar(), renderWaBot()

### Community 51 - "openStoryViewer"
Cohesion: 0.60
Nodes (6): openStoryViewer(), draw(), go(), tick(), renderStories(), seen()

### Community 52 - "tarea-banco"
Cohesion: 0.33
Nodes (6): tarea-banco, cpus, image, mem_limit, network_mode, profiles

### Community 53 - "openAptModal"
Cohesion: 0.60
Nodes (5): loadModalLocks(), openAptModal(), renderExtras(), renderModalSlots(), staffOptions()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 303 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `cop` to `app.js`, `admin.js`, `common.js`, `bpath`, `openQuick`, `renderStaffTab`, `bogNow`, `mary.gs`, `boot`, `fechaCorta`, `renderWaBot`, `openAptModal`, `renderHome`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06297029702970297 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `cop`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07526881720430108 - nodes in this community are weakly interconnected._
- **Should `app.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10227272727272728 - nodes in this community are weakly interconnected._