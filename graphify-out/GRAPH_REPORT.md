# Graph Report - agendador  (2026-11-13)

## Corpus Check
- 32 files · ~151,688 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 1040 nodes · 2983 edges · 55 communities (46 shown, 9 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8e034b44`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- super.js
- renderHome
- admin.js
- common.js
- estado.js
- escenarios.js
- bpath
- renderWaBot
- cartero.py
- mary.gs
- app.js
- textos.js
- newStory
- estado.js
- cuposLocal.js
- renderSettings
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- openWizard
- handleAct
- plansOf
- options
- waha-agendador
- bogNow
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
- applyBrandColors
- renderPlan
- openStore
- openModal
- esc
- tarea-clasp
- oido-agendador
- closeMenus
- actStats
- bpath
- syncBottomNav
- tarea-banco
- toMinW
- citasCliente

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
- `start()` --calls--> `setDialogBrand()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (55 total, 9 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (103): llega(), AGRUPA, ahoraLocal(), alEventoConexion(), alMensaje(), anotar(), armarEstado(), arrancarRelojes() (+95 more)

### Community 1 - "super.js"
Cohesion: 0.07
Nodes (27): pmProblem(), renderPM(), auth, isKeyMethod(), payAccountInput(), PLAN_FEATURES, pushNav(), replaceNav() (+19 more)

### Community 2 - "renderHome"
Cohesion: 0.10
Nodes (39): activeStories(), buildRecs(), fillAsStory(), firstName(), freeTimes(), goStep(), goTab(), guideCard() (+31 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (44): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, DAY_SHORT (+36 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (33): app, APP_VERSION, BID, BIZ_TYPES, BRAND, businessFromUrl(), categoriaAuto(), db (+25 more)

### Community 5 - "estado.js"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (22): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+14 more)

### Community 7 - "bpath"
Cohesion: 0.16
Nodes (34): aptAction(), bloqueo(), closeM(), connectWhatsApp(), manageStory(), openBreak(), openM(), openMyServices() (+26 more)

### Community 8 - "renderWaBot"
Cohesion: 0.18
Nodes (18): botCfg(), botGuardar(), cargarReporte(), lockCard(), maryWaCard(), mwCuenta(), mwEsperar(), mwPintar() (+10 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (30): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+22 more)

### Community 10 - "mary.gs"
Cohesion: 0.10
Nodes (48): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+40 more)

### Community 11 - "app.js"
Cohesion: 0.06
Nodes (81): newsUnread(), openPlatformNews(), renderBell(), startNews(), afterGoogle(), APP, BIZ_ID, bookingStaff() (+73 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "newStory"
Cohesion: 0.19
Nodes (16): drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor(), hexRgba(), loadImg() (+8 more)

### Community 14 - "estado.js"
Cohesion: 0.24
Nodes (14): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+6 more)

### Community 15 - "cuposLocal.js"
Cohesion: 0.23
Nodes (17): crear(), cupos(), datos(), dias(), horas(), DIAS, diaTxt(), dow() (+9 more)

### Community 16 - "renderSettings"
Cohesion: 0.33
Nodes (7): readPM(), renderClosed(), renderSettings(), saveSettings(), trialDays(), fastSave(), staffWord()

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

### Community 23 - "openWizard"
Cohesion: 0.21
Nodes (13): closeWizard(), drawWizard(), imgToDataUrl(), openWizard(), renderAppearance(), renderPanelOrder(), socialHandle(), wizChange() (+5 more)

### Community 24 - "handleAct"
Cohesion: 0.21
Nodes (16): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+8 more)

### Community 25 - "plansOf"
Cohesion: 0.40
Nodes (6): planPrice(), renderTrialPlans(), showTrialForm(), planBenefitsIntro(), planPriceOf(), plansOf()

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "bogNow"
Cohesion: 0.24
Nodes (17): estadoCupos(), freeNowStaff(), lookupPhone(), myStaff(), openQuick(), qMinutes(), qSlotsFor(), renderQDays() (+9 more)

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
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 39 - "web.js"
Cohesion: 0.14
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "pruebas.js"
Cohesion: 0.13
Nodes (7): assert, baseFalsa(), fsVal(), GS_MARY, INFO, SEMANA, test

### Community 41 - "applyBrandColors"
Cohesion: 0.36
Nodes (9): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), headerBgCss(), hexRgb(), lum() (+1 more)

### Community 42 - "renderPlan"
Cohesion: 0.23
Nodes (16): applyPanelBrand(), isOwner(), isTrial(), linkOptOn(), myPlan(), panelPrefs(), renderLinkCli(), renderPlan() (+8 more)

### Community 43 - "openStore"
Cohesion: 0.47
Nodes (6): adminUrl(), msgFor(), openStore(), phoneOf(), publicUrl(), waTo()

### Community 44 - "openModal"
Cohesion: 0.22
Nodes (10): openConsent(), brandRow(), dialog(), dropOverlay(), hideModal(), openModal(), pushOverlay(), uiAlert() (+2 more)

### Community 45 - "esc"
Cohesion: 0.16
Nodes (34): aptCard(), brPreview(), citasHtml(), custName(), loadLost(), loadModalLocks(), openAptModal(), quienBloq() (+26 more)

### Community 46 - "tarea-clasp"
Cohesion: 0.29
Nodes (7): tarea-clasp, cpus, image, mem_limit, networks, profiles, working_dir

### Community 47 - "oido-agendador"
Cohesion: 0.15
Nodes (13): HILOS, IDIOMA, MODELO, build, container_name, cpus, environment, image (+5 more)

### Community 49 - "actStats"
Cohesion: 0.67
Nodes (3): actStats(), bogDay(), bogHour()

### Community 50 - "bpath"
Cohesion: 0.17
Nodes (19): abrirCupos(), citasDeClientes(), clientHistory(), deleteClient(), geoSkipKey(), loadQLocks(), loadUsers(), onErr() (+11 more)

### Community 52 - "tarea-banco"
Cohesion: 0.33
Nodes (6): tarea-banco, cpus, image, mem_limit, network_mode, profiles

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 307 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `renderHome`, `admin.js`, `common.js`, `bpath`, `renderWaBot`, `mary.gs`, `app.js`, `newStory`, `bpath`, `bogNow`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.061096136567834684 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07308377896613191 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `renderHome`, `admin.js`, `common.js`, `bpath`, `renderWaBot`, `applyBrandColors`, `renderPlan`, `app.js`, `openModal`, `newStory`, `openStore`, `renderSettings`, `bpath`, `openWizard`, `handleAct`, `plansOf`, `bogNow`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._