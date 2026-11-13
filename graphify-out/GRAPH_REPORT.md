# Graph Report - agendador  (2026-11-13)

## Corpus Check
- 32 files · ~147,717 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 1034 nodes · 2984 edges · 46 communities (41 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 125 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a6a276ce`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- principal.js
- super.js
- switchTab
- admin.js
- common.js
- estado.js
- escenarios.js
- bpath
- bogNow
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
- config.js
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
- openModal
- esc
- tarea-clasp
- oido-agendador
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
- `armarEstado()` --calls--> `textoHoy()`  [EXTRACTED]
  vps/principal.js → vps/estado.js
- `armarEstado()` --calls--> `textoSemana()`  [EXTRACTED]
  vps/principal.js → vps/estado.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (46 total, 5 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (101): llega(), AGRUPA, ahoraLocal(), alEventoConexion(), alMensaje(), anotar(), armarEstado(), arrancarRelojes() (+93 more)

### Community 1 - "super.js"
Cohesion: 0.08
Nodes (27): pmProblem(), auth, BIZ_TYPES, db, enAppInterna(), isKeyMethod(), payAccountInput(), PLAN_FEATURES (+19 more)

### Community 2 - "switchTab"
Cohesion: 0.17
Nodes (29): abrirCupos(), botCfg(), botGuardar(), goTab(), isOwner(), linkOptOn(), lockCard(), lockedNow() (+21 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (77): A, ACT, ACTIVE, ALL_TABS, applyPanelBrand(), BOT_DEF, BOT_OPTS, citasCliente() (+69 more)

### Community 4 - "common.js"
Cohesion: 0.06
Nodes (38): closeWizard(), app, APP_VERSION, BID, BRAND, brandRow(), businessFromUrl(), categoriaAuto() (+30 more)

### Community 5 - "estado.js"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (23): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+15 more)

### Community 7 - "bpath"
Cohesion: 0.15
Nodes (39): aptAction(), closeM(), connectWhatsApp(), geoSkipKey(), goStep(), manageStory(), markGuide(), newStory() (+31 more)

### Community 8 - "bogNow"
Cohesion: 0.13
Nodes (27): cargarReporte(), estadoCupos(), freeNowStaff(), freeSlotsFor(), h12s(), hoursSummary(), isBusy(), loadQLocks() (+19 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (28): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+20 more)

### Community 10 - "mary.gs"
Cohesion: 0.11
Nodes (45): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+37 more)

### Community 11 - "app.js"
Cohesion: 0.06
Nodes (77): renderQDays(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), canChange() (+69 more)

### Community 12 - "textos.js"
Cohesion: 0.10
Nodes (15): asistio(), citaHecha(), conCita(), cop(), cuposDia(), duracion(), enTiempo(), estadoTxt() (+7 more)

### Community 13 - "newStory"
Cohesion: 0.15
Nodes (22): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba() (+14 more)

### Community 14 - "estado.js"
Cohesion: 0.24
Nodes (16): color(), DCORTO, DIAS, fechaLarga(), inicial(), linkCorto(), lum(), marca() (+8 more)

### Community 15 - "cuposLocal.js"
Cohesion: 0.23
Nodes (17): crear(), cupos(), datos(), dias(), horas(), DIAS, diaTxt(), dow() (+9 more)

### Community 16 - "renderSettings"
Cohesion: 0.40
Nodes (6): readPM(), renderPM(), renderSettings(), saveSettings(), trialDays(), fastSave()

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

### Community 23 - "config.js"
Cohesion: 0.33
Nodes (5): API_URL, DEFAULT_BUSINESS_ID, firebaseConfig, META_APP_ID, META_CONFIG_ID

### Community 24 - "handleAct"
Cohesion: 0.21
Nodes (16): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+8 more)

### Community 25 - "plansOf"
Cohesion: 0.50
Nodes (5): planPrice(), renderTrialPlans(), showTrialForm(), planPriceOf(), plansOf()

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.09
Nodes (33): activeStories(), actStats(), bogDay(), bogHour(), buildRecs(), fillAsStory(), firstName(), freeTimes() (+25 more)

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

### Community 44 - "openModal"
Cohesion: 0.23
Nodes (12): openConsent(), openResched(), closeModal(), hideModal(), openModal(), adminUrl(), msgFor(), openM() (+4 more)

### Community 45 - "esc"
Cohesion: 0.12
Nodes (43): aptCard(), bloqueo(), brPreview(), citasHtml(), clientHistory(), custName(), deleteClient(), isTrial() (+35 more)

### Community 46 - "tarea-clasp"
Cohesion: 0.29
Nodes (7): tarea-clasp, cpus, image, mem_limit, networks, profiles, working_dir

### Community 47 - "oido-agendador"
Cohesion: 0.15
Nodes (13): HILOS, IDIOMA, MODELO, build, container_name, cpus, environment, image (+5 more)

### Community 52 - "tarea-banco"
Cohesion: 0.33
Nodes (6): tarea-banco, cpus, image, mem_limit, network_mode, profiles

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 303 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `switchTab`, `admin.js`, `common.js`, `bpath`, `bogNow`, `mary.gs`, `app.js`, `openModal`, `newStory`, `toMillis`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06273338312173264 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07765151515151515 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `switchTab`, `admin.js`, `common.js`, `bpath`, `bogNow`, `app.js`, `openModal`, `newStory`, `renderSettings`, `handleAct`, `plansOf`, `toMillis`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._