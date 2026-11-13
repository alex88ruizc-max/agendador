# Graph Report - agendador  (2026-11-13)

## Corpus Check
- 36 files · ~182,467 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 19 file(s) not represented in the graph (top: (none) 7, .css 5, .otf 4)

## Summary
- 1172 nodes · 3428 edges · 66 communities (53 shown, 13 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 155 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4af9ea2f`
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
- atenderMensaje
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
- openQuick
- reglas.js
- actualizar-google.sh script
- correo.gs
- instalar.sh script
- guia.js
- configurar-waha.sh
- mudar-google.sh
- conectar.sh
- web.js
- pruebas.js
- applyBrandColors
- switchTab
- handleAct
- gas
- esc
- tarea-clasp
- oido-agendador
- closeMenus
- bogNow
- push.js
- syncBottomNav
- tarea-banco
- toMinW
- citasCliente
- atenderPedidoWa
- guideSteps
- anotar
- botDe
- guiaFab
- botAlDia
- accesosDe
- maryWaCard
- wizInit
- como-vps.sh

## God Nodes (most connected - your core abstractions)
1. `esc()` - 89 edges
2. `toast()` - 55 edges
3. `bpath()` - 52 edges
4. `bogNow()` - 52 edges
5. `crear()` - 42 edges
6. `renderHome()` - 37 edges
7. `hora12()` - 35 edges
8. `cop()` - 35 edges
9. `toMillis()` - 34 edges
10. `maryAgenda()` - 33 edges

## Surprising Connections (you probably didn't know these)
- `maryCupos_()` --indirect_call--> `hora12()`  [INFERRED]
  vps/gs/mary.gs → vps/cuposLocal.js
- `responderSinNumero()` --calls--> `sinNumero()`  [EXTRACTED]
  vps/principal.js → vps/textos.js
- `onErr()` --calls--> `toast()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `bpath()`  [EXTRACTED]
  admin.js → common.js
- `start()` --calls--> `toMillis()`  [EXTRACTED]
  admin.js → common.js

## Import Cycles
- None detected.

## Communities (66 total, 13 thin omitted)

### Community 0 - "principal.js"
Cohesion: 0.05
Nodes (45): llega(), AGRUPA, alMensaje(), atendidos, AUDIENCIA, avisados, _banco, BOT (+37 more)

### Community 1 - "super.js"
Cohesion: 0.08
Nodes (27): pmProblem(), renderPM(), APP_VERSION, BIZ_TYPES, BOT_GLOBAL, enAppInterna(), isKeyMethod(), payAccountInput() (+19 more)

### Community 2 - "renderHome"
Cohesion: 0.10
Nodes (36): activeStories(), buildRecs(), fillAsStory(), firstName(), freeNowStaff(), freeTimes(), h12s(), hh() (+28 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (48): A, ACC_CORTO, ACC_DEF, ACT, ACTIVE, ALL_TABS, BOT_DEF, BOT_OPTS (+40 more)

### Community 4 - "common.js"
Cohesion: 0.05
Nodes (40): app, auth, BENEFITS_VIEJOS, BID, BRAND, brandRow(), businessFromUrl(), categoriaAuto() (+32 more)

### Community 5 - "estado.js"
Cohesion: 0.12
Nodes (19): imapflow, mailparser, @resvg/resvg-js, letras(), png(), dependencies, imapflow@1.0.171, mailparser@3.7.1 (+11 more)

### Community 6 - "escenarios.js"
Cohesion: 0.08
Nodes (23): assert, audio(), CATALOGO, CONFIRMADA, delNegocio(), DIR, DOS, filas() (+15 more)

### Community 7 - "bpath"
Cohesion: 0.18
Nodes (37): aptAction(), bloqueo(), clientHistory(), closeM(), connectWhatsApp(), deleteClient(), geoSkipKey(), goStep() (+29 more)

### Community 8 - "renderWaBot"
Cohesion: 0.25
Nodes (11): botCfg(), botGuardar(), cargarReporte(), mwCuenta(), mwEsperar(), mwPintar(), pesos(), pintarReporte() (+3 more)

### Community 9 - "cartero.py"
Cohesion: 0.10
Nodes (30): atender(), auditoria(), puertos(), bajar(), banco_web(), cmd_modo(), cmd_prueba(), curl() (+22 more)

### Community 10 - "mary.gs"
Cohesion: 0.08
Nodes (61): MARY_SIEMPRE, maryAgenda(), maryAsistencia_(), maryAvisada_(), maryAvisos_(), maryAvisosCfg_(), maryAvisoWa_(), maryBotCfg_() (+53 more)

### Community 11 - "app.js"
Cohesion: 0.05
Nodes (86): estadoCupos(), afterGoogle(), APP, BIZ_ID, bookingStaff(), boot(), busyUntilLabel(), checkPhone() (+78 more)

### Community 12 - "atenderMensaje"
Cohesion: 0.16
Nodes (24): ASIS, atenderMensaje(), bajarMediaWaha(), contar(), debeResponder(), escribir(), escribirLista(), escuchar() (+16 more)

### Community 13 - "newStory"
Cohesion: 0.22
Nodes (11): drawOwnStory(), drawRich(), drawStory(), fitText(), hexRgba(), loadImg(), marcaAgua(), richLines() (+3 more)

### Community 14 - "estado.js"
Cohesion: 0.20
Nodes (19): color(), DCORTO, DIAS, fechaLarga(), FUENTES, inicial(), linkCorto(), lum() (+11 more)

### Community 15 - "cuposLocal.js"
Cohesion: 0.19
Nodes (20): crear(), cupos(), datos(), dias(), guia(), horas(), DIAS, diaTxt() (+12 more)

### Community 16 - "renderSettings"
Cohesion: 0.22
Nodes (11): palabraEquipo(), readPM(), renderClosed(), renderSettings(), saveSettings(), tgPorQue(), trialDays(), ventanaAdmin() (+3 more)

### Community 17 - "environment"
Cohesion: 0.17
Nodes (12): environment, EVO_URL, PUBLICO, PUERTO, TZ, WAHA_API_KEY, WAHA_BASE_URL, WAHA_DASHBOARD_ENABLED (+4 more)

### Community 18 - "textos.js"
Cohesion: 0.08
Nodes (81): conNumeros(), corto(), crear(), agendar(), apartar(), aprender(), cancelarCita(), catalogo() (+73 more)

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
Cohesion: 0.36
Nodes (9): closeWizard(), drawWizard(), leerDuracion(), openWizard(), wizChange(), wizClick(), wizInput(), wizReadSvcs() (+1 more)

### Community 24 - "handleAct"
Cohesion: 0.21
Nodes (16): daysLeft(), dm(), hideOrder(), initials(), logoOf(), planLine(), render(), renderBiz() (+8 more)

### Community 25 - "plansOf"
Cohesion: 0.32
Nodes (8): planPrice(), renderTrialPlans(), showTrialForm(), planBenefits(), planBenefitsIntro(), planPriceOf(), plansOf(), renderPlanEditor()

### Community 26 - "options"
Cohesion: 0.33
Nodes (9): logging, logging, driver, options, logging, max-file, max-size, logging (+1 more)

### Community 27 - "waha-agendador"
Cohesion: 0.25
Nodes (8): waha-agendador, container_name, image, mem_limit, networks, ports, restart, volumes

### Community 28 - "openQuick"
Cohesion: 0.21
Nodes (14): loadQLocks(), lookupPhone(), onErr(), openQuick(), qMinutes(), qSlotsFor(), refCap(), refLevels() (+6 more)

### Community 29 - "reglas.js"
Cohesion: 0.11
Nodes (13): assert, fs, NUESTROS, path, RAIZ, scripts, test, fs (+5 more)

### Community 30 - "actualizar-google.sh script"
Cohesion: 0.47
Nodes (4): C(), actualizar-google.sh script, actualizar.sh script, volver()

### Community 31 - "correo.gs"
Cohesion: 0.39
Nodes (8): RFC-5545, correoEntidades_(), correoEnviar_(), correoEstado_(), correoFrase_(), correoIcs_(), correoSinEmoji_(), emailClient()

### Community 32 - "instalar.sh script"
Cohesion: 0.33
Nodes (3): instalar-cartero.sh script, instalar-google.sh script, instalar.sh script

### Community 33 - "guia.js"
Cohesion: 0.14
Nodes (22): btn(), C, celular(), corto(), datosGuia(), DCORTO, DLARGO, dow() (+14 more)

### Community 39 - "web.js"
Cohesion: 0.14
Nodes (10): archivos, avisos, DEL_SITIO, fallas, fs, os, path, { spawnSync } (+2 more)

### Community 40 - "pruebas.js"
Cohesion: 0.12
Nodes (8): assert, baseFalsa(), fsVal(), GS_MARY, INFO, SEMANA, test, decision()

### Community 41 - "applyBrandColors"
Cohesion: 0.36
Nodes (9): apInitials(), darkenIfLight(), renderApPreview(), applyBrandColors(), darken(), headerBgCss(), hexRgb(), lum() (+1 more)

### Community 42 - "switchTab"
Cohesion: 0.13
Nodes (30): applyPanelBrand(), goTab(), imgToDataUrl(), isOwner(), linkOptOn(), lockCard(), myPlan(), panelPrefs() (+22 more)

### Community 43 - "handleAct"
Cohesion: 0.21
Nodes (14): planOfBiz(), uiPrompt(), addMonths(), adminUrl(), deleteBusiness(), handleAct(), msgFor(), openM() (+6 more)

### Community 44 - "gas"
Cohesion: 0.29
Nodes (21): ahoraLocal(), arrancarRelojes(), atiende(), cada(), crearCL(), entregarAvisos(), gas(), leer() (+13 more)

### Community 45 - "esc"
Cohesion: 0.15
Nodes (36): aptCard(), brPreview(), citasHtml(), custName(), hoyListaHtml(), isTrial(), loadLost(), loadModalLocks() (+28 more)

### Community 46 - "tarea-clasp"
Cohesion: 0.29
Nodes (7): tarea-clasp, cpus, image, mem_limit, networks, profiles, working_dir

### Community 47 - "oido-agendador"
Cohesion: 0.15
Nodes (13): HILOS, IDIOMA, MODELO, build, container_name, cpus, environment, image (+5 more)

### Community 49 - "bogNow"
Cohesion: 0.17
Nodes (22): abrirCupos(), actStats(), bogDay(), bogHour(), citasDeClientes(), drawImage(), freeSlotsFor(), publicUrl() (+14 more)

### Community 50 - "push.js"
Cohesion: 0.20
Nodes (13): RFC-8291, RFC-8292, llavesPush(), b64(), cifrar(), crypto, de64(), enviar() (+5 more)

### Community 52 - "tarea-banco"
Cohesion: 0.33
Nodes (6): tarea-banco, cpus, image, mem_limit, network_mode, profiles

### Community 55 - "atenderPedidoWa"
Cohesion: 0.37
Nodes (15): alEventoConexion(), asegurarInstancia(), atenderPedidoWa(), estadoInstancia(), evo(), guardarNegocio(), limpiarSinVincular(), motorBid() (+7 more)

### Community 56 - "guideSteps"
Cohesion: 0.25
Nodes (11): guideDone(), guideSteps(), hayBot(), markGuide(), pushCard(), pushClave(), pushOn(), pushSoporta() (+3 more)

### Community 57 - "anotar"
Cohesion: 0.33
Nodes (11): textoGuia(), aLaPagina(), anotar(), aQuienes(), enviarEstado(), esperar(), guardarImg(), publicarEstado() (+3 more)

### Community 58 - "botDe"
Cohesion: 0.29
Nodes (7): apagarGlobal(), audienciaDe(), botDe(), botFresco(), contactosDe(), guardarContacto(), telDe()

### Community 59 - "guiaFab"
Cohesion: 0.47
Nodes (6): fabClave(), fabEstado(), guiaFab(), guideCard(), guideProgress(), openGuide()

### Community 60 - "botAlDia"
Cohesion: 0.50
Nodes (5): botAlDia(), botDesdeBase(), botNormal(), botOffAlDia(), deFs()

### Community 61 - "accesosDe"
Cohesion: 0.67
Nodes (3): accesosDe(), accesosHtml(), accPermitidos()

## Knowledge Gaps
- **3 isolated node(s):** `RFC-5545`, `RFC-8291`, `RFC-8292`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 324 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `hora12()` connect `cuposLocal.js` to `mary.gs`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `crear()` (e.g. with `asistente.js` and `cliente()`) actually correct?**
  _`crear()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-5545`, `RFC-8291`, `RFC-8292` to the rest of the system?**
  _3 weakly-connected nodes found - possible missing edges._
- **Should `principal.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05053191489361702 - nodes in this community are weakly interconnected._
- **Why does `maryCupos_()` connect `mary.gs` to `cuposLocal.js`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Should `super.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07575757575757576 - nodes in this community are weakly interconnected._
- **Why does `esc()` connect `esc` to `super.js`, `renderHome`, `admin.js`, `common.js`, `bpath`, `renderWaBot`, `applyBrandColors`, `switchTab`, `app.js`, `handleAct`, `renderSettings`, `bogNow`, `handleAct`, `plansOf`, `guiaFab`, `openQuick`, `maryWaCard`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._