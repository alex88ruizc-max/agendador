# Graph Report - agendador  (2026-11-12)

## Corpus Check
- 31 files · ~132,540 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 7, .css 3, .ejemplo 2)

## Summary
- 964 nodes · 2834 edges · 52 communities (44 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 105 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a7dbd11`
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
- esc
- plansOf
- renderReferrals
- lockedNow
- handleAct
- environment
- textos.js
- agendador-ia
- postgres-agendador
- services
- evolution-agendador
- reglas.js
- handleAct
- openWizard
- options
- waha-agendador
- toMillis
- correo.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- renderAppearance
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- renderWaBot
- isKeyMethod
- wahaMsg
- actStats
- citasDeClientes
- switchTab
- environment
- oido-agendador
- saveSettings
- closeMenus
- syncBottomNav
- toMinW

## God Nodes (most connected - your core abstractions)
1. `esc()` - 83 edges
2. `bogNow()` - 50 edges
3. `toast()` - 49 edges
4. `bpath()` - 47 edges
5. `crear()` - 40 edges
6. `hora12()` - 34 edges
7. `toMillis()` - 34 edges
8. `cop()` - 34 edges
9. `renderHome()` - 32 edges
10. `seguir()` - 30 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → common.js
- `atenderMensaje()` --calls--> `demora()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `atenderMensaje()` --calls--> `fotoRecibida()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `atenderMensaje()` --calls--> `fotoSinCita()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `atenderMensaje()` --calls--> `problema()`  [EXTRACTED]
  vps/principal.js → vps/textos.js

## Import Cycles
- None detected.

## Communities (52 total, 8 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.06
Nodes (102): llega(), assert, GS_MARY, INFO, test, AGRUPA, ahoraLocal(), alEventoConexion() (+94 more)

### Community 1 - "super.js"
Cohesion: 0.09
Nodes (21): PLAN_FEATURES, readPublishedVersion(), reloadFresh(), setNavHandler(), startUpdateWatcher(), FILTERS, HIDDEN, hideOrder() (+13 more)

### Community 2 - "app.js"
Cohesion: 0.06
Nodes (87): renderQDays(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), checkPhone() (+79 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (42): A, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS, CLIENT_FILTERS, DAY_SHORT (+34 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (36): app, APP_VERSION, auth, BID, BIZ_TYPES, BRAND, businessFromUrl(), categoriaAuto() (+28 more)

### Community 5 - "estado.js"
Cohesion: 0.08
Nodes (32): imapflow, mailparser, @resvg/resvg-js, revisarBuzon(), color(), DCORTO, DIAS, fechaLarga() (+24 more)

### Community 6 - "escenarios.js"
Cohesion: 0.09
Nodes (18): assert, CATALOGO, CONFIRMADA, DIR, DOS, filas(), fs, HC_IDS() (+10 more)

### Community 7 - "esc"
Cohesion: 0.15
Nodes (39): aptAction(), bloqueo(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep() (+31 more)

### Community 8 - "bogNow"
Cohesion: 0.20
Nodes (20): abrirCupos(), estadoCupos(), freeNowStaff(), loadQLocks(), lookupPhone(), myStaff(), openQuick(), qMinutes() (+12 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (26): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+18 more)

### Community 10 - "mary.gs"
Cohesion: 0.12
Nodes (41): maryAgenda(), maryAsistencia_(), maryAvisada_(), maryBotCfg_(), maryCancelar_(), maryCatalogo_(), maryCatAuto_(), maryCategorias_() (+33 more)

### Community 11 - "drawStory"
Cohesion: 0.16
Nodes (21): apInitials(), darkenIfLight(), drawImage(), drawOwnStory(), drawRich(), drawStory(), fitText(), freeSlotsFor() (+13 more)

### Community 12 - "esc"
Cohesion: 0.19
Nodes (29): aptCard(), brPreview(), citasHtml(), custName(), loadModalLocks(), loadUsers(), openAptModal(), payLine() (+21 more)

### Community 13 - "plansOf"
Cohesion: 0.18
Nodes (13): planPrice(), renderTrialPlans(), showTrialForm(), planBenefitsIntro(), planPriceOf(), plansOf(), pushNav(), goMoney() (+5 more)

### Community 14 - "renderReferrals"
Cohesion: 0.50
Nodes (4): refCap(), refLevels(), refLink(), renderReferrals()

### Community 15 - "lockedNow"
Cohesion: 0.43
Nodes (7): guideCard(), guideDone(), guideProgress(), guideSteps(), openGuide(), stepDone(), wizPassed()

### Community 16 - "handleAct"
Cohesion: 0.22
Nodes (13): planOfBiz(), addMonths(), adminUrl(), handleAct(), msgFor(), openM(), openStore(), phoneOf() (+5 more)

### Community 17 - "environment"
Cohesion: 0.29
Nodes (7): WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED, WAHA_PRINT_QR, WHATSAPP_DEFAULT_ENGINE, WHATSAPP_SWAGGER_ENABLED, environment

### Community 18 - "textos.js"
Cohesion: 0.08
Nodes (78): conNumeros(), corto(), crear(), agendar(), apartar(), aprender(), caben(), cancelarCita() (+70 more)

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

### Community 23 - "reglas.js"
Cohesion: 0.20
Nodes (7): assert, fs, NUESTROS, path, RAIZ, scripts, test

### Community 24 - "handleAct"
Cohesion: 0.30
Nodes (12): daysLeft(), dm(), initials(), logoOf(), planLine(), render(), renderBiz(), renderLane() (+4 more)

### Community 25 - "openWizard"
Cohesion: 0.29
Nodes (10): closeWizard(), drawWizard(), openWizard(), socialHandle(), wizChange(), wizClick(), wizInit(), wizInput() (+2 more)

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "toMillis"
Cohesion: 0.11
Nodes (33): activeStories(), buildRecs(), fillAsStory(), firstName(), freeTimes(), h12s(), hh(), hoursSummary() (+25 more)

### Community 29 - "correo.js"
Cohesion: 0.28
Nodes (5): fs, leerPago(), montos(), pagador(), path

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "renderAppearance"
Cohesion: 0.40
Nodes (5): applyPanelBrand(), imgToDataUrl(), panelPrefs(), renderAppearance(), renderPanelOrder()

### Community 39 - "web.js"
Cohesion: 0.13
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "renderWaBot"
Cohesion: 0.38
Nodes (7): botCfg(), botGuardar(), maryWaCard(), mwCuenta(), mwEsperar(), mwPintar(), renderWaBot()

### Community 41 - "isKeyMethod"
Cohesion: 0.50
Nodes (4): pmProblem(), renderPM(), isKeyMethod(), payAccountInput()

### Community 42 - "wahaMsg"
Cohesion: 0.50
Nodes (4): audio(), delNegocio(), toca(), wahaMsg()

### Community 43 - "actStats"
Cohesion: 0.67
Nodes (3): actStats(), bogDay(), bogHour()

### Community 44 - "citasDeClientes"
Cohesion: 0.67
Nodes (3): citasCliente(), citasDeClientes(), k10()

### Community 45 - "switchTab"
Cohesion: 0.14
Nodes (30): goTab(), isOwner(), isTrial(), linkOptOn(), lockCard(), myPlan(), onErr(), planFor() (+22 more)

### Community 46 - "environment"
Cohesion: 0.22
Nodes (9): environment, EVO_URL, HILOS, IDIOMA, MODELO, PUBLICO, PUERTO, TZ (+1 more)

### Community 47 - "oido-agendador"
Cohesion: 0.22
Nodes (9): build, container_name, cpus, image, mem_limit, networks, restart, volumes (+1 more)

### Community 48 - "saveSettings"
Cohesion: 0.67
Nodes (3): readPM(), saveSettings(), fastSave()

## Knowledge Gaps
- **1 isolated node(s):** `RFC-5545`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 260 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `esc` to `app.js`, `admin.js`, `common.js`, `esc`, `bogNow`, `renderWaBot`, `mary.gs`, `drawStory`, `toMillis`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545` to the rest of the system?**
  _1 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.055705300988319856 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `esc`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09401709401709402 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `renderAppearance`, `app.js`, `admin.js`, `common.js`, `super.js`, `esc`, `bogNow`, `renderWaBot`, `isKeyMethod`, `drawStory`, `switchTab`, `renderReferrals`, `lockedNow`, `plansOf`, `handleAct`, `handleAct`, `toMillis`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._