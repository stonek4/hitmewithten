# Vocab Cards — Reverse-Engineering & Rebuild Specification

**Source of truth:** `hmwt_app/` at commit `c9f1adae` ("fixing bug with navigating to creator", 2022-09-19)
**App version:** 0.2.0 · **Production URL:** https://www.vocabcards.com
**Purpose of this document:** capture everything needed to rebuild this application from scratch on a modern, well-supported stack, without needing to read the Aurelia 1 source again.

> **Verified against production.** The deployed `index.html` is byte-identical to the repo's, and the minified `app-bundle.js` fingerprints exactly to this commit (contains the `fliptInX` typo and the `list-flip` mismatch; contains `route:"creator/"` and *not* `creator/:id`). **Production === commit `c9f1adae`.**
>
> Behaviors marked **✅ verified** below were confirmed by driving the live site in headless Chromium. Ground-truth output vectors for the spelling-diff algorithm are in [§9.1.1](#911-ground-truth-test-vectors-verified-against-production).

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Technology Inventory](#2-technology-inventory)
3. [Aurelia 1 Primer — Only What You Need to Read This Code](#3-aurelia-1-primer--only-what-you-need-to-read-this-code)
4. [Build, Bundle & Deploy Pipeline](#4-build-bundle--deploy-pipeline)
5. [Application Architecture](#5-application-architecture)
6. [Data Model & Persistence Contract](#6-data-model--persistence-contract)
7. [Routing & Navigation Graph](#7-routing--navigation-graph)
8. [Screen-by-Screen Specification](#8-screen-by-screen-specification)
9. [Core Algorithms](#9-core-algorithms)
10. [The Animation System](#10-the-animation-system)
11. [Visual Design & Styling Spec](#11-visual-design--styling-spec)
12. [Third-Party Integrations](#12-third-party-integrations)
13. [Known Bugs, Quirks & Footguns](#13-known-bugs-quirks--footguns)
14. [Rebuild Guide](#14-rebuild-guide)
15. [Open Questions for the Author](#15-open-questions-for-the-author)

---

## 1. Product Overview

Vocab Cards is a **client-side-only flashcard app for spelling and vocabulary drilling**. There is no backend, no user accounts, and no server-side persistence. Everything lives in the browser's `localStorage`.

### The core loop

1. The user creates a **card set** — a named list of cards, each card being a `{ hint, answer }` pair.
2. The user selects one set as "current".
3. The user starts a **test** of either 10 randomly-selected cards or the entire set.
4. For each card the app shows the *hint* and the user **types the answer**.
   - **Correct** (case-insensitive) → the answer flashes green, advance to the next card.
   - **Incorrect** → the app computes the **minimum edit distance** between what was typed and the correct answer, and renders the correct answer with **the characters the user got wrong highlighted in red**. The card shakes. The user tries again.
5. A **progress bar** tracks position through the set.
6. **Trophies** unlock in the background based on cumulative counters (cards seen / passed / failed) and pop up as toast notifications.

### Secondary features

- **Card set management** — create, edit, delete, select, import, export.
- **Import/export** — sets are `.cards` files (JSON) exchanged via the file system.
- **Card flip** — swap the hint and answer sides mid-test, so you can drill in either direction.
- **About page** — version info and a hand-maintained changelog.

### What it deliberately is *not*

- No accounts, sync, or multi-device support.
- No spaced repetition / scheduling — the only "algorithm" is random shuffle.
- No settings (the Settings button exists and shows a "no settings yet" alert).
- No monetization or ads.

---

## 2. Technology Inventory

### Runtime dependencies (exact resolved versions from `package-lock.json`)

| Package | Version | Role |
|---|---|---|
| `aurelia-bootstrapper` | 2.4.0 | Boots the app from the `aurelia-app` attribute |
| `aurelia-framework` | **1.4.1** | Aurelia **v1** facade (`inject`, `bindable`, `LogManager`, …) |
| `aurelia-binding` | 2.5.4 | Binding engine |
| `aurelia-templating` | 1.11.1 | Template/custom-element engine |
| `aurelia-templating-binding` | 1.6.0 | Binding-syntax parser for templates |
| `aurelia-templating-resources` | 1.14.3 | `repeat.for`, `if`, `compose`, … |
| `aurelia-templating-router` | 1.5.0 | `<router-view>` element |
| `aurelia-router` | 1.7.1 | Router |
| `aurelia-history-browser` | 1.4.0 | Hash-based history |
| `aurelia-dependency-injection` | 1.5.2 | DI container |
| `aurelia-event-aggregator` | 1.0.3 | Pub/sub bus |
| `aurelia-animator-css` | 1.0.4 | CSS-class-driven animation plugin |
| `aurelia-logging` / `-console` | 1.5.2 / 1.1.1 | Logging |
| `aurelia-pal` / `-browser` | 1.8.2 / 1.8.1 | Platform abstraction layer |
| `aurelia-polyfills` | 1.3.4 | ES2015 polyfills for ES5 targets |
| `bootstrap` | 3.x | CSS framework — **Bootstrap 3**, for Glyphicons, forms, list-group, progress bar |
| `jquery` | 3.6.1 | Only required by Bootstrap 3 and bootstrap-notify |
| `bootstrap-notify` | 3.1.3 | Toast notifications for trophies |
| `firebase` | 9.x (`@firebase/app` 0.7.33, `@firebase/analytics` 0.8.0) | **Analytics only** |
| `bluebird` | 3.7.2 | Promise polyfill, loaded before RequireJS |
| `requirejs` | 2.3.6 | AMD module loader |
| `text` (requirejs/text) | latest | AMD plugin that inlines `.html`/`.css` as strings |

> **Critical framing:** this is **Aurelia 1**, not Aurelia 2. Aurelia 1 reached end-of-life; Aurelia 2 is a different framework with a different API. Any "Aurelia docs" you find online today are most likely Aurelia 2 and will not describe this code.

### Build-time dependencies

`aurelia-cli` 3.0.1, `gulp` 4, `typescript` 4.8.3, `gulp-typescript`, `gulp-sass` + `sass` 1.54, `tslint` 5.20 (deprecated), `uglify-js`, `browser-sync`, `karma` + `jasmine` (unit tests, effectively unused).

### TypeScript configuration (`tsconfig.json`)

```jsonc
{
  "target": "es5",
  "module": "amd",              // AMD, not ESM — required by RequireJS
  "moduleResolution": "node",
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true, // required by Aurelia's DI for @inject
  "noImplicitAny": false,        // the codebase is loosely typed
  "sourceMap": true,
  "lib": ["es2015", "dom"]
}
```

---

## 3. Aurelia 1 Primer — Only What You Need to Read This Code

This section exists so you never have to hunt for Aurelia 1 documentation. Every Aurelia feature actually used in this codebase is listed here with its modern equivalent.

### 3.1 Bootstrapping

`index.html` carries `<body aurelia-app="main">`. The bootstrapper loads `src/main.ts` and calls its exported `configure(aurelia)` function. That function configures the framework and then calls `aurelia.setRoot('app/app')`, which instantiates `src/app/app.ts` + `src/app/app.html` as the root component.

```ts
export function configure(aurelia: Aurelia) {
  aurelia.use.standardConfiguration()   // binding, templating, router, default resources
           .feature('resources');       // loads src/resources/index.ts (a no-op here)
  aurelia.use.plugin('aurelia-animator-css');
  aurelia.start().then(() => aurelia.setRoot('app/app'));
}
```

### 3.2 The view-model / view convention

Aurelia pairs `foo.ts` with `foo.html` **by filename convention**. The `.html` file's root element must be `<template>`. There is no JSX, no explicit template registration — `moduleId: 'menu/menu'` loads both `src/menu/menu.ts` and `src/menu/menu.html`.

### 3.3 Template syntax used in this project

| Aurelia 1 syntax | Meaning | React / modern equivalent |
|---|---|---|
| `${expression}` | Text interpolation | `{expression}` |
| `value.bind="prop"` | Bind attribute/property; **binding direction defaults per-target** | `value={prop}` |
| `value.two-way="prop"` | Explicit two-way binding | `value={prop} onChange={...}` |
| `innerhtml.bind="html"` | Set `innerHTML` from a string | `dangerouslySetInnerHTML` |
| `style.bind="cssString"` | Set the `style` attribute from a string | `style={...}` |
| `click.delegate="fn()"` | Event handler via **delegated** listener at document root | `onClick={fn}` |
| `click.trigger="fn()"` | Event handler attached **directly** to the element | `onClick={fn}` |
| `submit.delegate="fn()"` | Form submit handler (returning falsy prevents default) | `onSubmit={fn}` |
| `repeat.for="x of items"` | List rendering | `items.map(...)` |
| `<require from="./x.css">` | Import a resource (CSS or custom element) **into this view only** | `import './x.css'` |
| `<router-view>` | Where the active route renders | `<Outlet />` |
| `<slot name="x">` / `<div slot="x">` | Content projection (Aurelia 1 shadow-DOM emulation) | `props.children` / named slots |

**Important gotcha:** `.bind` is *not* always one-way. For a `<input value.bind>` it's two-way. For a **custom element's `@bindable`**, `.bind` resolves to that bindable's declared `defaultBindingMode`. That is why `<modal-form value.bind="name">` is a two-way binding — `ModalForm.value` declares `defaultBindingMode: bindingMode.twoWay`.

### 3.4 Custom elements

A class in a module required by a view becomes a custom element. The element name is the **dash-cased class name**: `class ModalForm` → `<modal-form>`. Public API is declared with `@bindable`:

```ts
@bindable({ defaultBindingMode: bindingMode.twoWay }) value: string = "";
```

Bindable property names dash-case too: `action` → `action.two-way="..."`; a `myProp` bindable would be `my-prop.bind`.

### 3.5 Component lifecycle

In order, for a routed component:

| Hook | When | Notes / this codebase |
|---|---|---|
| `constructor(...deps)` | DI instantiation | Used for reading `localStorage` and stashing injected services |
| `activate(params, routeConfig, navInstruction)` | **Router-only.** Before the view binds | `Tester.activate` and `Creator.activate` read route params and `routeConfig.settings` |
| `created(owningView, myView)` | After view/VM created | not used |
| `bind(bindingContext, overrideContext)` | Bindings attached | not used |
| `attached()` | **Element is in the DOM** | Used everywhere for entrance animations, focusing inputs, and hiding modals via `document.querySelector` |
| `detached()` | Removed from DOM | `Loader.detached` disposes EventAggregator subscriptions |
| `unbind()` / `deactivate()` | Teardown | not used |

If `activate`/`attached` return a Promise, the router/templating engine awaits it.

### 3.6 Dependency injection

`@inject(Router, Trophies, Globals)` declares constructor dependencies. **The container resolves classes as singletons by default**, application-wide. This matters: `Trophies` and `Globals` are *shared single instances* across every screen. `Router` and `EventAggregator` are framework singletons.

There is no explicit registration anywhere — `@inject` + `emitDecoratorMetadata` is the entire DI story.

### 3.7 Routing

Configured by implementing `configureRouter` on the root component:

```ts
configureRouter(config: RouterConfiguration, router: Router) {
  config.title = 'Vocab Cards';
  config.map([
    { route: '',            moduleId: 'menu/menu',       title: 'Menu', name: 'Menu' },
    { route: 'tester/:id',  moduleId: 'tester/tester',   name: 'Tester' },
    { route: 'creator/',    moduleId: 'creator/creator', name: 'Creator' },
    { route: 'loader',      moduleId: 'loader/loader',   name: 'Loader' },
    { route: 'about',       moduleId: 'about/about',     name: 'About' }
  ]);
  this.router = router;
}
```

Navigation APIs used:

- `router.navigateToRoute(name, params?)` — navigate by route **name**. Params that don't match a pattern segment (`:id`) are appended as a **query string**, and Aurelia still surfaces them in `activate(params)`. This is why `creator/` with no `:id` still receives `params.id`.
- `router.history.navigateBack()` — browser back.
- `router.routes.find(x => x.name === 'Tester').settings = data` — **mutating the route config object to smuggle data to the next screen.** The target reads it as `activate(params, routeConfig)` → `routeConfig.settings`. This is the app's only cross-screen data channel besides `localStorage`.

History mode is **hash-based** (`#/tester/MySet`), the Aurelia 1 default. Note `firebase.json` has no SPA rewrite rule, so hash routing is load-bearing for deployment.

### 3.8 EventAggregator

A global pub/sub bus, injected via DI:

```ts
this.eventAggregator.publish('modal-closed', {});
const sub = this.eventAggregator.subscribe('modal-action', (payload) => { ... });
sub.dispose();
this.eventAggregator.subscribeOnce('modal-closed', (payload) => { ... });
```

Two channels exist in this app: `modal-action` (payload = string action name) and `modal-closed` (payload = `{}`).

### 3.9 `aurelia-animator-css` — how `animate()` actually works

This is the least obvious part of the codebase. `CssAnimator.animate(element, className)` performs an **add-then-remove class cycle**:

1. Add class `` `${className}-add` `` to the element.
2. If a CSS animation is detected on the element, wait for `animationend`. If none is detected, resolve **immediately**.
3. Remove `` `${className}-add` ``, add the bare class `` `${className}` ``.
4. Add `` `${className}-remove` ``, wait for its animation (or resolve immediately), then remove both classes.
5. Resolve the returned Promise.

**Consequences you must replicate or replace:**

- `src/_animate.scss` defines the `-add` / `-remove` bridge classes (see §10). `slide` and `slideBack` deliberately define *both*, producing a two-phase out-then-in animation from a single `animate()` call.
- `flipInX`, `flipOutX`, `slideInRight`, etc. define only `-add`, so their `-remove` phase resolves instantly.
- Because the animation classes are **removed** at the end, `animation-fill-mode: forwards` does not persist the final state. That is precisely why `Globals` attaches manual `animationend` handlers that set `visibility: hidden` / `visible` — see §10.
- A **typo'd animation name resolves instantly with no visual effect** and no error. (`about.ts` has one — see §13.)

The plugin also supports view-transition classes `au-enter` / `au-leave`, but **this app does not use them** — all animation is imperative via `Globals`.

---

## 4. Build, Bundle & Deploy Pipeline

Driven by `aurelia_project/aurelia.json` (the Aurelia CLI project file) and Gulp 4 tasks in `aurelia_project/tasks/`.

### Commands

```bash
au run --watch     # build + browser-sync dev server on :9000 with history fallback
au build           # one-off build
au build --env prod  # minified + sourcemaps
au test            # karma + jasmine (effectively unused, see §13)
firebase deploy    # publishes ./www
```

### Pipeline stages (`tasks/build.ts`)

```
readProjectConfiguration        (build.src)
  ├─ transpile      src/**/*.ts   → AMD JS (TypeScript)
  ├─ process-markup src/**/*.html → passthrough (markupProcessor.id = "none")
  └─ process-css    src/**/*.scss → CSS (sass), sourcemapped
lint                            (tslint)
writeBundles                    (build.dest)
dist                            (copy to ./www)
```

### Bundles

| Bundle | Contents |
|---|---|
| `scripts/app-bundle.js` | All of `src/` — transpiled JS plus `.html` and `.css` inlined as AMD `text!` modules |
| `scripts/vendor-bundle.js` | `bluebird.core.js` + `require.js` prepended, then all Aurelia packages, jQuery, Bootstrap, bootstrap-notify, `firebase/app`, `firebase/analytics`, and the RequireJS config |

`index.html` loads only `<script src="scripts/vendor-bundle.js" data-main="aurelia-bootstrapper">`.

### Distribution (`dist.output = "www"`)

Copies `favicon.ico`, `scripts/**/*`, `index.html`, `img/*`, `bootstrap/**/*` into `www/`, which is what `firebase.json` serves (`{ "hosting": { "public": "www" } }`, project `vocards-62df8`).

### The loading-splash hack

`index.html` renders a centered `img/icon.png` before Aurelia boots. `main.ts` wraps `aurelia.setRoot()` in a bare `setTimeout(...)` so the browser gets one frame to paint that splash before the root view replaces the body.

### Notes on build assets

- `bootstrap/fonts/glyphicons-halflings-regular.*` is vendored into the repo because Bootstrap 3's Glyphicon font must resolve relative to the deployed CSS.
- `scripts/require.js` and `scripts/text.js` are checked in (`.gitignore` only excludes `scripts/*-bundle.*`).
- `config.xml` is a **stale Apache Cordova config** (`com.kszapps.hmwt`, cordova-android ^6.2.3) from an abandoned Android packaging attempt. `hmwt.keystore` is the matching Android signing keystore. Neither is part of the web build.
- "hmwt" = the project's original name, *Hit Me With Ten* (see the GitHub URL in `about.html`).

---

## 5. Application Architecture

### Module map

| Path | Kind | Responsibility |
|---|---|---|
| `src/main.ts` | Bootstrap | Framework config, log level, Firebase init, `setRoot` |
| `src/environment.ts` | Config | `{ debug, testing }` — swapped at build time from `aurelia_project/environments/{dev,stage,prod}.ts` |
| `src/console-logger.ts` | Infrastructure | Aurelia `LogManager` appender writing to `console` |
| `src/globals.ts` | **Service (singleton)** | Bulk entrance/exit CSS animations by class name |
| `src/card.ts` | Model | `interface Card { definitions: string[]; answers: string[] }` |
| `src/trophy.ts` | Model | `Trophy` abstract + 3 concrete counter-trophy classes |
| `src/trophies/trophies.ts` | **Service (singleton)** | Trophy collection, localStorage persistence, unlock notifications |
| `src/notification/notification.ts` | Service | Wraps `bootstrap-notify` toasts |
| `src/resources/index.ts` | Feature | Empty — no global resources registered |
| `src/app/app.ts` + `.html` | Root component | Router config + `<router-view>` |
| `src/menu/` | Route `''` | Home screen |
| `src/tester/` | Route `tester/:id` | The quiz screen |
| `src/creator/` | Route `creator/` | Card set editor |
| `src/loader/` | Route `loader` | Card set manager |
| `src/about/` | Route `about` | About + changelog |
| `src/modal/` | Custom element `<modal>` | Base modal: full-screen scrim + named slot |
| `src/modal-alert/` | Custom element `<modal-alert>` | Dismissible message modal (extends `Modal`) |
| `src/modal-form/` | Custom element `<modal-form>` | Single text input modal (extends `Modal`) |
| `src/modal-menu/` | Custom element `<modal-menu>` | 4-button action menu modal (extends `Modal`) |
| `src/_general.scss` | Style partial | `gradient()` mixin + `.general-btn` base button |
| `src/_animate.scss` | Style partial | animate.css 3.5.1 + the Aurelia animator bridge classes |

### Cross-cutting patterns (all of which you should *replace*, not port)

1. **Global DOM queries for modal visibility.** Modals are never conditionally rendered. Every screen toggles `document.querySelector('.modal').style.display` between `'block'` and `'none'`. `.modal` is styled `display: inline` by default, so screens must actively hide it in `attached()`.
2. **Data-passing via mutated route config.** `Menu.serve()` writes the shuffled card array onto `router.routes.find(...).settings`, and `Tester.activate` reads it back.
3. **`localStorage` accessed directly from components.** There is no repository/service layer for card data — `Menu`, `Loader`, `Creator`, and `Tester` each call `window.localStorage` directly with hand-built key strings.
4. **Animation coupled to CSS class names as selectors.** `Globals.performEntranceAnimations('menu-btn-cont', 'flipInX')` does `document.getElementsByClassName(...)`, so **CSS class names are load-bearing application logic**.
5. **EventAggregator as the modal return channel.** Modals don't return values; they broadcast `modal-action` / `modal-closed` globally.

---

## 6. Data Model & Persistence Contract

**All state is in `window.localStorage`. There is no server-side state.** If you rebuild this, you must be able to read the existing schema to migrate real users' data.

### Types

```ts
interface Card {
  definitions: string[];  // Only index [0] is ever read or written. UI label: "Hint"
  answers:     string[];  // Only index [0] is ever read or written. UI label: "Answer"
}

interface CardSet {        // Loader-screen view model only; not persisted in this shape
  name: string;
  number: number;          // card count
}
```

> The `string[]` shape was clearly intended to support multiple accepted answers / multiple hints per card. **That capability was never implemented** — every read/write path uses `[0]` exclusively.

### localStorage keys

| Key | Type | Value | Written by |
|---|---|---|---|
| `keys` | JSON `string[]` | Names of all card sets | `Loader` (create/delete/import), `Creator.done()` |
| `current` | plain string | Name of the selected set. **May be the literal string `"null"`** | `Loader.load()`, `Loader.import()`, `Creator.done()`, `Loader.delete()` |
| `<setName>.cards` | JSON `Card[]` | The cards of one set | `Creator.done()`, `Loader.import()` |
| `trophies` | JSON array of serialized trophies | Trophy progress | `Trophies.save()` |

### Example state

```jsonc
// localStorage["keys"]
["Spanish 101", "SAT Words"]

// localStorage["current"]
"SAT Words"

// localStorage["SAT Words.cards"]
[
  { "definitions": ["Extremely hungry"],       "answers": ["ravenous"] },
  { "definitions": ["To speak in favor of"],   "answers": ["advocate"] }
]

// localStorage["trophies"]
[
  { "name": undefined, "type": "CardsTestedTrophy", "displayTitle": "New Trophy Unlocked!",
    "displayText": "Used 10 cards.", "cards": 14, "goal": 10, "newObtained": false },
  ...
]
```

> `Trophy.name` is declared but **never assigned** — it serializes as `undefined` and is dropped by `JSON.stringify`. Don't rely on it.

### Set-name constraints

The set name is used verbatim as a `localStorage` key prefix *and* as an exported filename. There is **no validation, sanitization, or uniqueness check** anywhere. Consequences to fix on rebuild:

- Naming a set `keys`, `current`, or `trophies` will not collide (the suffix `.cards` saves it), but naming two sets identically silently overwrites.
- A set name containing `/` or other path characters produces an invalid download filename.
- An empty name is possible via `Creator` if the modal is bypassed.

### Import / export file format

- **Extension:** `.cards`
- **Filename:** `<setName>.cards` — the set name is derived on import by stripping the last 6 characters (`f.name.slice(0, -6)`).
- **Content:** the raw JSON string of `Card[]` — byte-identical to the `localStorage` value.
- **Export mechanism:** builds a `data:charset=utf-8,<encodeURIComponent(json)>` URL on a temporary `<a download>`, clicks it, removes it.
- **Import mechanism:** hidden `<input type="file" id="loader-file" multiple>`, `FileReader.readAsText`, then writes `<title>.cards` and appends to `keys`.

**Keep this format compatible** in any rebuild, or ship an explicit importer — it is the only way existing users can move their data.

---

## 7. Routing & Navigation Graph

| Name | Pattern | Module | Params |
|---|---|---|---|
| `Menu` | `''` | `menu/menu` | — |
| `Tester` | `tester/:id` | `tester/tester` | `id` = set name; card array smuggled via `routeConfig.settings` |
| `Creator` | `creator/` | `creator/creator` | `id` = set name, **passed as a query string** (`#/creator/?id=Foo`); absent ⇒ create-new mode |
| `Loader` | `loader` | `loader/loader` | — |
| `About` | `about` | `about/about` | — |

### Navigation graph

```
                 ┌──────────────────────────────────────────┐
                 │                  MENU  ('')              │
                 └──┬─────────┬─────────┬─────────┬─────────┘
      serve(10)/(0) │         │ load()  │settings()│ about()
                    ▼         ▼         ▼          ▼
                 TESTER     LOADER   [alert modal]  ABOUT
              (tester/:id) (loader)                (about)
                    │         │                      │
        navigateBack│         ├─ Use    → set 'current', navigateBack → MENU
                    │         ├─ Edit   → CREATOR (?id=name)
                    │         ├─ Export → download .cards file
                    │         ├─ Delete → remove set, stay
                    │         ├─ Upload → import .cards file(s), stay
                    │         ├─ Create → CREATOR (no id)
                    │         └─ Back   → navigateBack → MENU
                    │                       │
                    ▼                       ▼
                  MENU                   CREATOR
                                            │
                                    done() → navigateBack() ×2 → MENU
```

### Back-navigation semantics (fragile — see §13)

- `Tester.done()`, `About.back()`, `Loader.back()` each call `router.history.navigateBack()` **once**.
- `Creator.done()` calls `router.history.navigateBack()` **twice**, on the assumption that the user arrived Menu → Loader → Creator and wants to land on Menu.
- Every one of these is wrapped in a `.catch()` that falls back to `router.navigateToRoute('Menu')`.

**Rebuild recommendation:** replace all history manipulation with explicit named navigation. The double-back is a latent bug the moment the entry path changes.

---

## 8. Screen-by-Screen Specification

### 8.1 Menu — `src/menu/` (route `''`)

**Layout:** a 30vh logo area (`img/logo.png`, centered) above a 65vh grid of five buttons. Portrait: 5 stacked full-width rows. Landscape: 2 columns at 45% width.

**Buttons** (each wrapped in a `.menu-btn-cont` for animation targeting):

| Label | Glyphicon | Action |
|---|---|---|
| 10 Cards | `glyphicon-ok` | `serve(10)` |
| All Cards | `glyphicon-education` | `serve(0)` |
| Manage Cards | `glyphicon-th-list` | `load()` → Loader |
| Settings | `glyphicon-cog` | Shows alert modal: *"Currently there are no settings available to change. If you have an idea for a setting, please email info@vocabcards.com"* |
| About | `glyphicon-info-sign` | `about()` → About |

**Constructor:** reads `current` from storage into `this.name`; if non-null, parses `<name>.cards` into `this.cards`. Calls `trophies.initializeTrophies()`.

**`attached()`:** hides the `.modal`, then runs entrance animation `flipInX` on all `.menu-btn-cont` elements.

**`serve(num)` logic:**

```
if (cards == null || 0 > cards.length):        // second clause is dead — see §13
    modalText = " You have no selected card set, go to 'Manage Cards' to create/select one!"
    show the alert modal; return
else:
    info = num > 0 ? shuffle(cards).slice(0, num) : shuffle(cards)
    router.routes.find(r => r.name === 'Tester').settings = info
    navigateTo('Tester')   // exit-animates .menu-btn-cont with flipOutX, then navigates with {id: name}
```

**Contains:** `<modal-alert>` with `${modalText}` projected into the `modal-alert-content` slot.

---

### 8.2 Tester — `src/tester/` (route `tester/:id`)

The core screen. A white card panel (`.tester`) floating over the lined-paper background.

**Structure (top → bottom):**

1. `.tester-progress` — a Bootstrap 3 striped progress bar, forced black (`.progress-bar-black`), bound via `style.bind="progressStyle"` (a `"width:NN%"` string) and `aria-valuenow.bind="progressValue"`.
2. `.tester-definition` — scrollable region containing:
   - `.tester-flip` button (`glyphicon-refresh`, top-right) → `flip()`
   - `.tester-text` — **`innerhtml.bind="definition"`**, rendering raw HTML (see markup semantics below).
3. `form.tester-answer` (`submit.delegate="submit()"`):
   - `.tester-back` button (`glyphicon-circle-arrow-left`) → `back()`
   - `input.tester-input` — `value.bind="answer"`, with `autocomplete/autocorrect/autocapitalize=off`, `spellcheck=false` (essential — never help the user spell)
   - An off-screen `<input type="submit">` so mobile keyboards show a Go/Enter action
   - `.tester-next` button (`glyphicon-circle-arrow-right`) → `submit()`

**`activate(params, routeConfig)`:**

```
cards = routeConfig.settings
if (cards is null or has no length)  cards = JSON.parse(localStorage["<params.id>.cards"])
if (cards is still null or has no length)  done()      // ⚠ does not return — see §13
setDefinition()
```

**State:** `definition` (displayed prompt HTML), `answer` (input value), `index`, `progressStyle`, `progressValue`, `flipped`.

**Flip semantics** — `flipped` swaps which side is the prompt:

| `flipped` | Prompt (`setDefinition`) | Expected answer (`getSolution`) |
|---|---|---|
| `false` | `cards[index].definitions[0]` | `cards[index].answers[0]` |
| `true` | `cards[index].answers[0]` | `cards[index].definitions[0]` |

**`submit()`:**

- **Correct** — comparison is `inputted.toLocaleLowerCase() === actual.toLowerCase()`:
  - `trophies.updateCardsPassedTrophies(1)`
  - `definition = "<correct>" + solution + "</correct>"` → a **custom element name used purely as a CSS hook**; `_animate`/`tester.scss` styles bare `correct { color: green }`.
  - After a 200 ms `setTimeout`, call `next()`.
- **Incorrect:**
  - `trophies.updateCardsFailedTrophies(1)`
  - Compute the edit script via `calcDist()` (§9.1) and build a marked-up string where wrong/missing characters are wrapped in `<em>` (styled `em { color: red }`). A required space renders as `<em>&nbsp;_&nbsp;</em>`.
  - Assign it to `definition` and run the `shake` animation on `.tester-text`.
- Either way, refocus `.tester-input`.

**`next()`:**

```
index += 1
trophies.updateCardsTestedTrophies(1)
trophies.displayNewTrophies()
updateProgress()                                       // width = index/cards.length*100
performExitAnimations('tester-text', 'slideOutLeft')
  .then(() => index < cards.length
              ? (setDefinition(), answer = "", performEntranceAnimations('tester-text','slideInRight'))
              : done())
```

**`back()`:** if `index > 0`, decrement and run the `slideBack` two-phase animation, with nested `setTimeout`s (500 ms then 50 ms) that blink opacity to 0 and back while swapping the text. If `index === 0`, exit via `done()`.

**`done()`:** exit-animate `.tester` with `slideOutRight`, then `router.history.navigateBack()`.

**Responsive:** portrait → panel 60vh, definition 40vh, top spacer 15vh. Landscape → 80vh / 60vh / 10vh.

---

### 8.3 Loader (Card Set Manager) — `src/loader/` (route `loader`)

**Layout:** a scrollable white panel (85vh) listing every card set as a Bootstrap `list-group-item`, showing the set name and a badge with the card count. Three fixed bottom buttons: Back (left, 18vw), Create (center, 60vw), Upload (right, 18vw).

**`loadData()`:** reads `keys`; for each key, parses `<key>.cards` and pushes `{ name, number: cards.length }`. If `keys` is absent, initializes it to `[]`.

**`attached()`:** hides the `.modal`; subscribes to `modal-action` (stores the action string) and `modal-closed` (dispatches to `load`/`edit`/`delete`/`export`); entrance-animates `.list-group` with `slideInLeft` and `.loader-flip` with `flipInX`.

**`detached()`:** disposes both subscriptions.

**Tapping a set** → `showModal(set)` stores `currentSet` and displays the `<modal-menu>`.

**`<modal-menu>` actions:**

| Button | Glyphicon | Handler | Effect |
|---|---|---|---|
| Use | `glyphicon-ok-sign` | `load()` | `localStorage.current = currentSet.name`, then back to Menu |
| Edit | `glyphicon-pencil` | `edit()` | → Creator with `?id=<name>` |
| Export | `glyphicon-save` | `export()` | Download `<name>.cards` |
| Delete | `glyphicon-trash` | `delete()` | Remove `<name>.cards`, splice from `keys`, reload list; if it was `current`, set `current` to `null` |

**Upload:** programmatically clicks the hidden `#loader-file` input, attaches a `change` listener, and imports each `.cards` file.

**Create:** ensures `keys` exists, sets `currentSet = { name: "", number: 0 }`, navigates to Creator with no params.

**`navigateTo(location)`:** exit-animates `.list-group` (`slideOutLeft`) and `.list-flip` (`flipOutX`) — **note the class name is `list-flip` here but the buttons are `loader-flip`**, so the flip-out never runs (§13). Then branches: `'Menu'` → `history.navigateBack()`; `currentSet.name === ''` → `navigateToRoute(location)`; else → `navigateToRoute(location, { id: currentSet.name })`.

---

### 8.4 Creator — `src/creator/` (route `creator/`)

A one-card-at-a-time editor: a white panel split 20% / 60% / 20%.

- **Top:** "Done" button (left) and a red trash button (right).
- **Middle:** two Bootstrap input-groups — `Hint:` (`.creator-definition`, placeholder *"A great vocab app"*) and `Answer:` (`.creator-answer`, placeholder *"vocabcards.com"*), both `value.bind` and with autocomplete/spellcheck disabled.
- **Bottom:** back (`glyphicon-circle-arrow-left`) and next (`glyphicon-circle-arrow-right`) buttons, plus an off-screen submit input. The whole panel is a `<form submit.delegate="next()">`, so Enter advances.

**Contains** `<modal-form value.bind="name">` — the "name this set" prompt, two-way bound to `Creator.name`.

**`activate(params)`:**
- **Edit mode** (`params.id` present): `index = -1`, load `<id>.cards`, `name = params.id`.
- **Create mode** (no `params.id`): `subscribeOnce('modal-closed', ...)` to focus the hint input once the user names the set. The modal is visible by default because `.modal` defaults to `display: inline` and Creator doesn't hide it in this branch.

**`attached()`:** if `index === -1` (edit mode) hide the modal, focus the hint input, and call `back()` — which normalizes `index` to 0 and loads the first card. Then entrance-animate `.creator` with `slideInLeft`.

**`next()`** — the save-and-advance operation:
```
if definition == ""  → focus hint, abort
if answer     == ""  → focus answer, abort
card = { definitions: [definition], answers: [answer] }
if cards.length < index + 1:            // appending a new card
    cards.push(card); definition = ""; answer = ""
else:                                   // overwriting an existing card
    cards[index] = card
    if cards.length == index + 1:  definition = ""; answer = ""      // was the last card
    else:                          load cards[index + 1] into the inputs
index += 1
focus hint
```

**`back()`:** if `index > 0`, load `cards[index-1]` and decrement. Otherwise clamp `index` to 0 and show either `cards[0]` or a blank card.

**`delete()`:** splice `cards[index]` if it exists, then `back()`.

**`done()`:** if both fields are non-empty, call `next()` to save the in-progress card; write `<name>.cards`, append `name` to `keys` if absent, set `current = name`; exit-animate `.creator` with `slideOutLeft`; then `history.navigateBack()` **twice**.

---

### 8.5 About — `src/about/` (route `about`)

A scrollable 85vh text block (`.about-text-container`) with a hard-coded version heading, a description paragraph, and a **manually maintained changelog** (entries from 6/12/2017 through 9/18/2022). One fixed bottom-left back button.

`attached()` runs `slideInRight` on `.about-text-container` and `fliptInX` (**typo**) on `.about-back`. `back()` runs `slideOutRight` / `flipOutX`, then `history.navigateBack()`.

**Rebuild note:** move the changelog out of the component into data (Markdown or JSON), and derive the version string from `package.json`. It currently appears hard-coded in **four** places: `package.json`, `index.html`'s JSON-LD `softwareVersion`, `about.html`'s `<h2>`, and the changelog entry.

---

### 8.6 Modal family — `src/modal*/`

`Modal` is the base class; the three variants extend it. **The inheritance is real but Aurelia treats each subclass as an independent custom element** — the base `<modal>` element is separately required and composed inside each subclass's template.

```
Modal (base)
├── close(): document.querySelector('.modal').style.display = 'none'
│            eventAggregator.publish('modal-closed', {})
│
├── ModalAlert  → <modal-alert>   slot: modal-alert-content
│     Clicking the message box calls close(). Shows a ✕ glyphicon.
│
├── ModalForm   → <modal-form>    @bindable value (two-way by default)
│     A single "Name:" text input inside a <form submit.delegate="closeForm()">.
│     closeForm() only closes if value !== "" — i.e. the name is mandatory.
│     attached() focuses .modal-form-input.
│
└── ModalMenu   → <modal-menu>    @bindable action (two-way)
      Four buttons (Use/Edit/Export/Delete). Each sets this.action then calls
      closeForm(), which publishes 'modal-action' with the value, then close().
```

`<modal>` itself is a fixed full-viewport `rgba(0,0,0,0.5)` scrim at `z-index: 99` containing a single named slot `modal-content`, with `.modal > *` forced to `100vw × 100vh`.

**Everything about this design should be replaced on rebuild.** See §14.3.

---

## 9. Core Algorithms

### 9.1 Spelling-error markup via minimum edit distance

This is the app's signature feature and the piece most worth porting carefully. Implemented as `Tester.calcDist(aword, bword)` + the marking loop in `Tester.submit()`.

**`calcDist(inputted, actual)`** — both already lowercased.

1. Build three `(len(a)+1) × (len(b)+1)` matrices: `dist` (Levenshtein distances), `paths` (back-pointers), `edits` (the operation chosen at each cell).
2. Initialize row 0 and column 0 to their indices, with edit `"i"` (insert) along row 0 and `"d"` (delete) along column 0.
3. Fill with the standard recurrence:
   `dist[i][j] = min(dist[i-1][j] + 1, dist[i][j-1] + 1, dist[i-1][j-1] + cost)` where `cost = (a[i-1] === b[j-1]) ? 0 : 1`.
   Tie-breaking order determines the recorded operation: **delete** (`"d"`) is checked first, then **substitute** (`"s"`), then **insert** (`"i"`).
4. Walk the back-pointers from `[len(a)][len(b)]` to the origin, building the `edit` array front-to-back. At each step, if the distance did not change along that step, record `"n"` (no change); otherwise record the stored operation.

**Returns:** a character-aligned array of `"n" | "s" | "i" | "d"`.

**The marking loop** then walks `edit[]` and mutates working copies of `inputted` and `actual`:

| Edit | Meaning | Rendered output |
|---|---|---|
| `"n"` | character correct | `actual[i]` (plain) |
| `"d"` | user typed an extra character | `<em>-</em>`, and `actual` is prefixed with `-` to stay aligned |
| `"i"` | user omitted a character | insert `actual[i]` into `inputted` at `i`; emit `<em>char</em>`, or `<em>&nbsp;_&nbsp;</em>` if the char is a space |
| `"s"` | user typed the wrong character | substitute `actual[i]` into `inputted` at `i`; emit the same markup as `"i"` |

**Special case:** `if (edit.length === 1) edit[0] = "i"` — a single-element edit script is forced to *insert*.

The result is assigned to `definition` and rendered with `innerhtml.bind`. `<em>` is red, plain text is black, and a required space is shown as a red underscore surrounded by non-breaking spaces (added in v0.1.6 specifically to make missing spaces visible).

> **Port this verbatim first, then refactor.** The tie-break order and the mutate-as-you-go alignment are what make the output read correctly; a "cleaner" reimplementation will produce different highlighting. Write characterization tests against the current behavior before touching it.

#### 9.1.1 Ground-truth test vectors (verified against production)

Captured by driving the live app: seed a one-card set, submit the given input, read `.tester-text`'s `innerHTML`. **Use these directly as your characterization test suite.**

| # | Correct answer | User typed | Rendered `innerHTML` | Notes |
|---|---|---|---|---|
| 1 | `ravenous` | `ravenous` | `<correct>ravenous</correct>` | Exact match |
| 2 | `ravenous` | `RaVeNoUs` | `<correct>ravenous</correct>` | ✅ Case-insensitive; **echoes the stored answer's casing**, not the user's |
| 3 | `ravenous` | `ravenus` | `raven<em>o</em>us` | Omitted char → insert |
| 4 | `ravenous` | `ravenious` | `raven<em>-</em>ous` | Extra char → `-` marks the deletion |
| 5 | `ravenous` | `ravanous` | `rav<em>e</em>nous` | Wrong char → substitute |
| 6 | `ravenous` | `ravenou` | `ravenou<em>s</em>` | Truncated at end |
| 7 | `ravenous` | `avenous` | `<em>r</em>avenous` | Missing first char |
| 8 | `ravenous` | `ravenouss` | `ravenous<em>-</em>` | Doubled last char |
| 9 | `ravenous` | `xyz` | `<em>r</em><em>a</em><em>v</em><em>e</em><em>n</em><em>o</em><em>u</em><em>s</em>` | **Every char in its own `<em>`** |
| 10 | `ravenous` | *(empty)* | `<em>r</em><em>a</em><em>v</em><em>e</em><em>n</em><em>o</em><em>u</em><em>s</em>` | Same as #9 |
| 11 | `ice cream` | `icecream` | `ice<em>&nbsp;_&nbsp;</em>cream` | **The missing-space case** (the v0.1.6 fix) |
| 12 | `ice cream` | `ice creem` | `ice cre<em>a</em>m` | Substitute after a space |
| 13 | `ice cream` | `ice  cream` | `ice <em>-</em>cream` | Extra space |
| 14 | `a` | `b` | `<em>a</em>` | The `edit.length === 1` special case |
| 15 | `ab` | `a` | `a<em>b</em>` | Single missing char |

Behavioral facts confirmed alongside these (all ✅ verified):

- A **correct** answer renders `<correct>…</correct>`, waits 200 ms, then advances. Counters: `tested +1`, `passed +1`.
- A **wrong** answer renders the marked-up string, shakes, and **leaves the user's text in the input box** — they must clear it manually to retry. Counters: `failed +1` only; `tested` and the progress bar do **not** move.
- Retrying is unlimited: three wrong answers in a row on one card → `failed = 3`, `tested = 0`, progress still `width: 0%`.
- The `<correct>` and `<em>` tags are bare unknown/semantic elements styled by `tester.scss` (`correct { color: green }`, `em { color: red }`).

### 9.2 Card shuffle

```ts
this.cards.sort(() => 0.5 - Math.random())
```

An **inconsistent comparator**. It is not a uniform shuffle and its behavior is engine-dependent, plus `sort` mutates `this.cards` in place — which here also mutates the array held by the Menu view model. **Replace with Fisher–Yates on a copy.**

### 9.3 Trophy system

**Class hierarchy** (`src/trophy.ts`):

```
abstract Trophy
  name: string            (declared, never assigned)
  type: string            (discriminator used for (de)serialization)
  displayTitle = "New Trophy Unlocked!"
  displayText: string
  abstract updateTrophy(data?), isObtained(), isNewlyObtained()

CardsTestedTrophy extends Trophy   — "Used {goal} cards."
  cards = 0, goal, newObtained = true
  updateTrophy(n)      → cards += n
  isObtained()         → cards >= goal
  isNewlyObtained()    → if (cards >= goal && newObtained) { newObtained = false; return true } else false
  load(data)           → restores cards, goal, newObtained, displayText, type

CardsPassedTrophy extends CardsTestedTrophy — "Successfully spelled {goal} cards."
CardsFailedTrophy extends CardsTestedTrophy — "Failed to spell {goal} cards."
```

The subclasses differ **only** in `type` and `displayText`. `isNewlyObtained()` is a one-shot latch — reading it flips `newObtained` to false, so a trophy only notifies once.

**The trophy roster** (`Trophies.initializeTrophies()`), created only when `localStorage.trophies` is absent:

| Type | Goals |
|---|---|
| `CardsTestedTrophy` | 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000 (9) |
| `CardsPassedTrophy` | 50, 100, 500, 1000, 5000, 10000, 50000, 100000 (8) |
| `CardsFailedTrophy` | 10, 50, 100, 500, 1000, 5000, 10000 (7) |

**24 trophies total.**

**Counter semantics:**

- `updateCardsTestedTrophies(1)` — called once per `Tester.next()`, i.e. per card advanced past.
- `updateCardsPassedTrophies(1)` — called once per correct submission.
- `updateCardsFailedTrophies(1)` — called once per **incorrect submission**, so repeated wrong attempts on the same card each increment it.
- `updateTrophyType` **skips already-obtained trophies** (`if (!isObtained()) updateTrophy(amount)`), so each trophy's counter freezes at/after its goal. Counters are therefore per-trophy, not global.

**Persistence:** the whole array is `JSON.stringify`'d to `localStorage.trophies` after every update. `load()` reconstructs concrete classes by switching on the `type` field.

**Display:** `displayNewTrophies()` iterates all trophies, and for each newly obtained one calls `Notification.display(displayText, displayTitle)`.

---

## 10. The Animation System

### 10.1 `Globals` — the animation service

```ts
performEntranceAnimations(elementClass: string, animation: string): Promise<any>
performExitAnimations(elementClass: string, animation: string): Promise<any>
```

Both do the same thing:

1. `document.getElementsByClassName(elementClass)` — a **live** HTMLCollection.
2. For each element: attach an `animationend` listener (entrance → set `visibility: visible`; exit → set `visibility: hidden`) and call `animator.animate(element, animation)`.
3. Return `Promise.all(...)` of the animator promises.

The `visibility` manipulation exists because `aurelia-animator-css` strips the animation classes when it finishes, discarding `animation-fill-mode: forwards`. Without it, elements would snap back to their pre-animation state.

> The listeners try to `removeEventListener('animationend', this.animationEndHandler)` — a property that **does not exist** on `Globals`. Since these are `function` expressions (not arrows), `this` is the event target anyway, so the removal is a silent no-op and **listeners accumulate on every navigation**. Fix this on rebuild.

### 10.2 Aurelia animator bridge classes (`src/_animate.scss`)

Durations: `$tiny: 300ms`, `$short: 500ms`, `$long: 1s` (unused). All bridge classes `@extend .stayForward` (`-webkit-animation-fill-mode: forwards`).

| Bridge class | Keyframes | Duration |
|---|---|---|
| `.slideInRight-add` | `slideInRight` | 500 ms |
| `.slideInLeft-add` | `slideInLeft` | 500 ms |
| `.slideOutLeft-add` | `slideOutLeft` | 500 ms |
| `.slideOutRight-add` | `slideOutRight` | 500 ms |
| `.flipInX-add` | `flipInX` | 500 ms |
| `.flipOutX-add` | `flipOutX` | 500 ms |
| `.shake-add` | `shake` | 300 ms |
| `.slide-add` / `.slide-remove` | `slideOutLeft` then `slideInRight` | 500 ms each |
| `.slideBack-add` / `.slideBack-remove` | `slideOutRight` then `slideInLeft` | 500 ms each |

The rest of the 3,425-line file is **animate.css 3.5.1 verbatim** (MIT, Daniel Eden) — only the 7 keyframe sets above are actually reachable.

### 10.3 Where each animation is used

| Screen | Trigger | Target class | Animation |
|---|---|---|---|
| Menu | `attached` | `menu-btn-cont` | `flipInX` |
| Menu | `navigateTo` | `menu-btn-cont` | `flipOutX` |
| Tester | `attached` | `tester` | `slideInRight` |
| Tester | `next` (out) | `tester-text` | `slideOutLeft` |
| Tester | `next` (in) | `tester-text` | `slideInRight` |
| Tester | `back` | `.tester-text` (direct `animator.animate`) | `slideBack` (two-phase) |
| Tester | wrong answer | `.tester-text` (direct) | `shake` |
| Tester | `done` | `tester` | `slideOutRight` |
| Loader | `attached` | `list-group` / `loader-flip` | `slideInLeft` / `flipInX` |
| Loader | `navigateTo` | `list-group` / `list-flip` ⚠ | `slideOutLeft` / `flipOutX` |
| Creator | `attached` | `creator` | `slideInLeft` |
| Creator | `done` | `creator` | `slideOutLeft` |
| About | `attached` | `about-text-container` / `about-back` | `slideInRight` / `fliptInX` ⚠ |
| About | `back` | `about-text-container` / `about-back` | `slideOutRight` / `flipOutX` |

⚠ = broken (see §13).

### 10.4 Performance measures the author added

Several commits ("performance tweaks for the css animations", "might be overdoing the css animation optimization") added GPU-compositing hints to animated elements: `will-change: transform` and `transform: translateZ(0)` on `.menu-btn-cont`, `.list-group`, `.loader-*`, `.about`, `.tester`, `.tester-text`, `.tester-input`, `.creator`. Preserve the intent (smooth animation on low-end mobile), not necessarily the exact hacks — modern browsers handle this better, and `will-change` left on permanently is itself a memory cost.

---

## 11. Visual Design & Styling Spec

### Aesthetic

A **paper/notebook metaphor**: a tiling lined-paper background (`img/linedpaper.png`) with white "card" panels floating over it, soft light-grey drop shadows, and rounded pale-blue gradient buttons. Black text throughout; the only colors are red (errors) and green (correct).

### Design tokens

| Token | Value | Where |
|---|---|---|
| Page background | `url(img/linedpaper.png)` repeating | `body`, `.background` |
| Panel background | `white` | `.tester`, `.creator`, `.loader` |
| Panel shadow | `0 0 3px 1px lightgrey` | `.tester`, `.creator` |
| Button shadow | `2px 2px 1px lightgrey` | `.general-btn` |
| Button gradient | `linear-gradient(to top, #ffffff, #dee8f9)` | `.general-btn` via `gradient()` mixin |
| Button radius | `15px` | `.general-btn` |
| Disabled button | `#8e8f91`, no shadow | `.menu-btn:disabled` |
| Error text | `red` | `em` |
| Correct text | `green` | `correct` |
| Progress track | `#e0e2e5` | `.tester-progress` |
| Progress fill | `black !important` | `.progress-bar-black` |
| Focus ring | `border-color: black; box-shadow: 0 1px 1px rgba(0,0,0,.075) inset, 0 0 8px rgba(240,240,240,.9)` | global input focus |
| Modal scrim | `rgba(0,0,0,0.5)`, `z-index: 99` | `.modal` |

### The `.general-btn` base (`src/_general.scss`)

```scss
@mixin gradient($color1, $color2) { /* 4 vendor-prefixed variants + W3C */ }

.general-btn {
  color: black;
  border: none;
  border-radius: 15px;
  font-size: 5vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 1px lightgrey;
  @include gradient(#ffffff, #dee8f9);
  box-sizing: border-box;
}
```

`@extend`ed by `.menu-btn`, `.modal-menu-btn`, `.modal-alert-text`, `.loader-create`, `.loader-back`, `.loader-upload`, `.about-back`.

### Layout approach

**Everything is viewport-relative** — `vh`, `vw`, `vmin` for both sizing *and* font sizes. There are essentially no pixel values and no `rem`. `body`/`.background` are `100vw × 100vh` with `overflow: hidden`; individual panels manage their own scrolling.

This yields a genuinely responsive, app-like layout at the cost of text that scales with the viewport rather than with the user's font-size preference — **an accessibility problem worth fixing on rebuild** (a user who sets a larger default font size gets no benefit).

Responsive branching is done with **`@media (orientation: portrait|landscape)`**, not width breakpoints — a mobile-first choice.

### Glyphicons used (Bootstrap 3)

`ok`, `education`, `th-list`, `cog`, `info-sign`, `arrow-left`, `plus`, `open-file`, `trash`, `circle-arrow-left`, `circle-arrow-right`, `refresh`, `ok-sign`, `pencil`, `save`, `remove`, `gift`.

**Glyphicons do not exist in Bootstrap 4+.** On rebuild, substitute an icon set (Lucide, Heroicons, Material Symbols) and map each one.

### Bootstrap 3 components relied on

`.form-control`, `.input-group` / `.input-group-addon`, `.list-group` / `.list-group-item`, `.badge`, `.progress-bar` / `.progress-bar-striped`, `.alert`, `.btn`. **All are removable** — the app's own SCSS already overrides most of the visual treatment. Bootstrap 3 also drags in jQuery, which is otherwise only needed by bootstrap-notify.

> **Naming collision to watch:** Bootstrap 3 defines its own `.modal` class (`display: none; position: fixed`). This app's `modal.scss` redefines `.modal` with `display: inline`. Correct behavior depends on `app.css` loading *after* `bootstrap.css` — which `app.html` does via ordered `<require>` tags. Do not reproduce this; namespace your class names.

### Assets

| File | Use |
|---|---|
| `img/linedpaper.png` | Tiling page background |
| `img/logo.png` | Menu header logo |
| `img/icon.png` | Pre-boot splash in `index.html` |
| `img/ball.svg` | Loading spinner — **appears unused** in the current code |
| `favicon.ico` | Favicon |
| `logo/*` | Source art (Illustrator `.ai`, vector PDF, JPEG/PNG exports, a mockup) — not shipped |
| `bootstrap/fonts/glyphicons-halflings-regular.*` | Glyphicon font, 5 formats |

---

## 12. Third-Party Integrations

### Firebase (v9 modular SDK)

Initialized in `main.ts` **after** `setRoot` resolves:

```ts
const firebaseConfig = {
  apiKey: "AIzaSyDBq_wLErSyKvKyb5j_fIC6Yw7S0dryxUw",
  authDomain: "vocards-62df8.firebaseapp.com",
  databaseURL: "https://vocards-62df8.firebaseio.com",
  projectId: "vocards-62df8",
  storageBucket: "vocards-62df8.appspot.com",
  messagingSenderId: "997127268774",
  appId: "1:997127268774:web:2fe4d338fada310b368767",
  measurementId: "G-GZG1SK5K0V"
};
initializeApp(firebaseConfig);
getAnalytics(app);
```

**Only Analytics is used.** No Auth, Firestore, Realtime Database, or Storage calls exist anywhere in `src/`. The `databaseURL` and `storageBucket` entries are unused boilerplate.

No custom events are logged — `getAnalytics()` alone provides automatic page-view collection. If analytics matters in the rebuild, this is the moment to decide what events you actually want (test started, test completed, set created, trophy unlocked) rather than reproducing pageview-only tracking.

Firebase is also the **hosting** provider (`firebase.json` → `public: "www"`, project alias `vocards` → `vocards-62df8`).

> **Security note:** a Firebase web `apiKey` is a public client identifier, not a secret, so committing it is not itself a vulnerability. But because it's in a public repo and the project has Database/Storage configured, confirm those services are disabled or locked down by security rules, and that the API key is restricted by HTTP referrer in the Google Cloud console.

### bootstrap-notify

`Notification.display(text, title)` calls `$.notify(...)` with a custom template and `type: 'minimalist'`, mapping to the `.alert-minimalist` styles defined in `app.scss` (light grey card, bold dark title, 80%-size message, 50px icon slot). Icon: `glyphicon-gift`. Delay: 2000 ms. Container classes: `col-xs-11 col-sm-3`.

Requires jQuery + Bootstrap 3. **Replace with any modern toast library** (react-hot-toast, sonner, etc.) and drop jQuery entirely.

### Apache Cordova (abandoned)

`config.xml` (widget id `com.kszapps.hmwt`, cordova-android `^6.2.3`, `cordova-plugin-whitelist`) plus `hmwt.keystore`. The About page mentions "Eventually a goal is to release this app on the Android Play Store." Cordova is deprecated; if native packaging is still a goal, use **Capacitor** (drop-in for a static SPA) or make the rebuild an installable **PWA** — the app is 100% offline-capable already, so a service worker + manifest gets you most of the way.

> **Do not reuse `hmwt.keystore` as committed** — a signing keystore in a public repository must be considered compromised. Generate a new one and keep it out of version control.

---

## 13. Known Bugs, Quirks & Footguns

Found while reading the code. Each is worth an explicit decision during the rebuild.

### Logic bugs

| # | Location | Issue |
|---|---|---|
| **1** | `menu.ts:68` | 🔴 **CONFIRMED SOFT-LOCK — the most serious bug in the app.** `if (this.cards == null \|\| 0 > this.cards.length)` — the second clause is **always false** (`length` is never negative); the intent was `this.cards.length <= 0`. See the callout below. |
| 2 | `tester.ts:54-58` | When no cards are found, `this.done()` is called but **execution continues** to `this.setDefinition()`, which throws on `cards[0]`. Needs a `return`. Contributes to bug #1. |
| 3 | `about.ts:23` | Animation name `'fliptInX'` is a **typo** for `'flipInX'`. No matching CSS class exists, so the animator resolves instantly and the back button never animates in. |
| 4 | `loader.ts:61` | Exit animation targets class `'list-flip'`, but the buttons carry `loader-flip`. The exit flip never runs. |
| 5 | `loader.ts:132-169` | 🟠 **CONFIRMED.** `import()` reuses a **single `FileReader`** across a `for` loop over `files`, calling `readAsText(f)` *before* assigning `reader.onload`. Selecting 2 files imports **only the first** — the second is silently discarded, with no error and no UI feedback. Verified: selecting `AAA.cards` + `BBB.cards` yields `keys = ["AAA"]` and no `BBB.cards` entry. Single-file import works correctly (control tested). The `<input>` is `multiple`, so users are actively invited into the broken path. |
| 6 | `loader.ts:204` | ✅ **Confirmed harmless-by-accident.** `this.storage.setItem('current', null)` stores the **literal string `"null"`** (verified: `typeof` is `string`). `menu.ts` then checks `this.name != null`, true for `"null"`, and reads `localStorage["null.cards"]` → `null` → `JSON.parse(null)` → `null`. The guard then catches it and the correct "no selected card set" alert appears. It works entirely by accident — don't reproduce the pattern. |
| 7 | `globals.ts:15,20` | `removeEventListener('animationend', this.animationEndHandler)` references a **nonexistent property**, and `this` inside these `function` expressions is the event target, not `Globals`. Listeners are never removed and **accumulate on every navigation**. |
| 8 | `creator.ts:45` | `subscribeOnce('modal-closed', ...)` is never disposed if the user leaves without closing the modal. |
| 9 | `menu.ts:79,83` | `sort(() => 0.5 - Math.random())` is not a valid shuffle and mutates `this.cards` in place. |
| 10 | `loader.ts:175` | Export URL is `data:charset=utf-8,...` — **missing the MIME type**. Should be `data:text/plain;charset=utf-8,`. |
| 11 | `loader.ts:156-160` | On import, `current` is only updated when the set is *new*; re-importing an existing set silently leaves `current` pointing elsewhere. |
| 12 | `creator.ts:153-154` | `navigateBack()` called **twice**, hard-coding the assumption that the entry path was Menu → Loader → Creator. |

### 🔴 Bug #1 in detail — the empty-set soft-lock (confirmed on production)

**Reproduce:** have a card set that exists but contains zero cards (easily produced by creating a set and deleting all its cards), select it, then press **10 Cards** or **All Cards**.

**What happens:**

1. `serve()`'s guard fails to catch `length === 0`, so it proceeds.
2. `navigateTo('Tester')` runs `performExitAnimations('menu-btn-cont', 'flipOutX')`, whose `animationend` handler sets **`visibility: hidden` on all five menu buttons**.
3. Navigation proceeds; `Tester.activate` throws `TypeError: Cannot read properties of undefined (reading 'definitions')` (bug #2 — the missing `return`).
4. Aurelia's router catches the error, logs `ERROR [app-router]`, and **aborts the navigation**. The URL stays at `#/`.
5. The Menu view is never re-attached, so nothing restores `visibility`.

**Result: the menu is left completely blank** — only the logo remains. All five buttons are still in the DOM at full size but invisible and therefore unclickable. **The app is unusable until the user reloads the page**, and nothing on screen suggests reloading. Verified visually and via computed styles (all five `.menu-btn-cont` go `visible` → `hidden`).

This is the single strongest argument for two rebuild decisions in §14.3: **never drive visibility from animation side-effects**, and **validate before navigating, not after**.

### The `@bindable` two-way `FIXME`

`modal-menu.ts:8` carries the comment `// FIXME: Why doesn't this work???` above the two-way `action` bindable, and the code works around it by *also* publishing the value over the EventAggregator.

**Almost certainly the cause:** Aurelia 1's `@bindable` properties are observed by `BehaviorPropertyObserver`, which notifies subscribers through the **micro-task queue**, not synchronously. `ModalMenu.load()` assigns `this.action = "load"` and then *synchronously* calls `closeForm()` → `close()` → `publish('modal-closed')`. The parent's `modal-closed` handler therefore reads `Loader.action` **before** the two-way propagation micro-task has flushed. The `modal-action` event, which passes the value directly, is what makes it work.

(By contrast, `ModalForm.value` two-way binding *does* work, because `Creator` reads `this.name` much later — in `done()` — long after the micro-task flushed.)

> I could not verify this against the installed `aurelia-templating` source (`node_modules` is not present in the working tree). If you want certainty, `npm install` and check `BehaviorPropertyObserver.setValue` in `node_modules/aurelia-templating/dist/…`. Either way the practical conclusion is the same: **in the rebuild, pass the action as an explicit callback argument** and the whole problem disappears.

### Naming & code-hygiene issues

- `src/about/about.ts` exports `class Menu`, and `src/loader/loader.ts` also exports `class Menu`. Harmless to Aurelia (module-based routing takes the first export) but actively misleading.
- The `Card` interface's `definitions: string[]` / `answers: string[]` arrays are always length 1 — dead generality.
- `Trophy.name` is declared but never assigned.
- `trophies.ts` imports `'bootstrap-notify'` for side effects, but `notification.ts` already does; redundant.
- The subclass trophies redeclare `cards`, `goal`, and `newObtained`, so their field initializers re-run after `super()`. The values happen to match, so it's harmless — but it's a real hazard pattern.
- `test/unit/app.spec.ts` tests `new App().message === 'Hello World!'` — the **Aurelia CLI scaffolding test**, referencing a property that doesn't exist and importing `'../../src/app'` (a directory, not a module). **The test suite has never passed.** There is effectively zero test coverage.
- `tslint` is end-of-life (superseded by ESLint); `gulp-tslint` and `tslint` 5.20 are unmaintained.
- `.gitignore` lists `src/environments.ts` (plural) but the real file is `src/environment.ts` (singular) and *is* committed. Likely a typo, harmless.

### Architectural footguns

- **`document.querySelector('.modal')` everywhere** — returns the first match; works only because each screen has exactly one modal. Adding a second modal to any screen breaks it.
- **Modals are always mounted**, only visually hidden. Their inputs stay in the tab order and their state persists across "closes".
- **CSS class names are application logic** (animation targeting). Renaming a class for styling reasons silently disables an animation — bugs #3 and #4 are exactly this.
- **No repository layer** for storage; four components build `localStorage` keys by hand.
- **No error handling on `JSON.parse`** of any stored value. Corrupt localStorage = white screen.
- **No validation on set names** (§6). ✅ **Confirmed:** creating a set with the name of an existing set **silently overwrites it** — `keys` stays length 1 and the old cards are gone, with no warning and no undo.
- 🟠 **Stored XSS via `innerhtml.bind` — confirmed executing on production.** `.tester-text` uses `innerhtml.bind="definition"`, and `definition` is the raw card hint on the *normal* prompt path (not just the error path). A card whose hint is `<img src=x onerror="…">` **executes script** on the `vocabcards.com` origin — verified by driving the live site (the payload set a global). Delivery vector: **importing an attacker-supplied `.cards` file**, which is a first-class, advertised feature.

  Severity is bounded by the app's own design — there are no accounts, cookies, tokens, or server-side data, so there is nothing to exfiltrate but the victim's own localStorage. But it is script execution on your real domain, so it could be used to silently corrupt or exfiltrate the user's card sets, or to render convincing phishing UI at a trusted URL. It requires the victim to import a hostile file.

  **Fix in the rebuild by construction:** return a structured diff and render it as elements (§14.3 item 1). Then no user-controlled string is ever interpreted as HTML and the whole class of bug disappears.

---

## 14. Rebuild Guide

### 14.1 Recommended target stack

The app is a small, offline-first, client-only SPA with heavy animation and localStorage persistence. Any modern framework works; the concrete recommendation is:

| Concern | Recommendation | Why |
|---|---|---|
| Language | **TypeScript 5**, `strict: true` | Same language, far better checking than the current `noImplicitAny: false` |
| Framework | **React 18+** or **Svelte 5** | React for ecosystem depth; Svelte if you want the smallest bundle and the most direct feel to the current code |
| Build | **Vite** | Replaces the entire aurelia-cli / gulp / RequireJS / AMD stack |
| Routing | **React Router 6** (or SvelteKit routing) | `<Outlet />` maps directly onto `<router-view>` |
| State | Plain React state + a small store (**Zustand**) | The app has three real stores: card sets, current set, trophies |
| Styling | **CSS Modules** or **Tailwind** | Kills the global-class-name coupling that causes bugs #3/#4 |
| Animation | **Framer Motion** (React) or Svelte transitions | Replaces the animator + animate.css + the `visibility` hacks with declarative enter/exit |
| Icons | **Lucide** / Heroicons | Glyphicons don't exist past Bootstrap 3 |
| Toasts | **sonner** / react-hot-toast | Drops jQuery + bootstrap-notify |
| Testing | **Vitest** + Testing Library + **Playwright** | The current suite is nonfunctional |
| Packaging | **PWA** (manifest + service worker), optionally **Capacitor** | The app is already fully offline; Cordova is dead |

**Net effect:** jQuery, Bootstrap, RequireJS, Bluebird, AMD, gulp, tslint, and animate.css all disappear. Only Firebase (analytics/hosting, optional) remains.

### 14.2 Concept mapping

| Aurelia 1 | React equivalent |
|---|---|
| `main.ts` `configure()` | `main.tsx` `createRoot().render()` |
| `app.ts` `configureRouter` | `createBrowserRouter([...])` |
| `<router-view>` | `<Outlet />` |
| `moduleId: 'menu/menu'` | `element: <Menu />` / lazy `import()` |
| `activate(params, routeConfig)` | `useParams()` + `useLocation().state` |
| `attached()` | `useEffect(() => {...}, [])` |
| `detached()` | `useEffect` cleanup return |
| `@inject(Service)` singleton | Module-level store (Zustand) or Context |
| `EventAggregator` pub/sub | Callback props, or store subscription |
| `@bindable` + two-way | `value` prop + `onChange` callback prop |
| `<slot name="x">` | `children` / a named render prop |
| `repeat.for="x of xs"` | `xs.map(x => ...)` |
| `innerhtml.bind` | `dangerouslySetInnerHTML` **after sanitizing** — or, better, render the diff as structured JSX (see below) |
| `router.history.navigateBack()` | `navigate(-1)` — but prefer explicit `navigate('/')` |
| `Globals.perform*Animations` | `<AnimatePresence>` + `motion.div` variants |

### 14.3 Specific redesigns worth making

1. **Return a structured diff, not an HTML string.** Change `calcDist` + the marking loop to return `Array<{ char: string; status: 'ok' | 'wrong' | 'missing' | 'extra' }>` and render it as JSX spans. This eliminates `innerhtml.bind`, the XSS surface, and the `<em>`/`<correct>` pseudo-element hacks in one move — and makes the algorithm unit-testable.

2. **Introduce a storage repository.** One module owning every `localStorage` key, with schema validation (Zod) and a versioned migration path:
   ```ts
   interface CardSetRepository {
     listSets(): CardSetSummary[];
     getSet(name: string): Card[];
     saveSet(name: string, cards: Card[]): void;
     deleteSet(name: string): void;
     getCurrentSetName(): string | null;
     setCurrentSetName(name: string | null): void;
     exportSet(name: string): Blob;
     importSet(file: File): Promise<string>;   // returns the set name
   }
   ```
   Make it read the **existing v0.2.0 schema** unchanged so current users lose nothing (§6).

3. **Modals as real components with props and callbacks.** `<AlertModal open message onClose />`, `<NameSetModal open onSubmit={name => …} />`, `<SetActionsModal open onAction={a => …} />`. Conditionally render them. This removes `document.querySelector('.modal')`, the EventAggregator round-trip, and the `FIXME`.

4. **Explicit navigation state.** Pass the shuffled card array via router state (`navigate('/test', { state: { cards } })`) or a store, never by mutating a route config. Always navigate to named destinations, never `history.back()`.

5. **Fix the Card model.** Either commit to `{ hint: string; answer: string }`, or actually implement multiple accepted answers (which would be a genuine feature — accept any of several spellings). Don't keep the vestigial arrays.

6. **Trophies as data, not a class hierarchy.** Three counters (`tested`, `passed`, `failed`) plus a declarative table of thresholds, and a `Set<string>` of already-notified trophy ids. Same behavior, a fraction of the code, and trivially serializable.

7. **Accessibility pass.** The current app has: viewport-unit font sizes that ignore user preferences, `<div click.delegate>` used as buttons on the Menu and modal menus, no focus management when modals open, no `aria-live` for the correct/incorrect feedback, and color as the sole error signal. All are cheap to fix in a rebuild and expensive to retrofit later.

8. **Add real tests.** At minimum: characterization tests for `calcDist` + marking (capture current output for a set of input/answer pairs *before* refactoring), storage round-trip tests, trophy threshold tests, and a Playwright run of the full create → test → trophy flow.

### 14.4 Suggested build order

1. Scaffold Vite + TS + router; port the storage repository and the `Card` model; write its tests.
2. Port `calcDist` **verbatim**, wrap it in characterization tests, *then* refactor it to return a structured diff.
3. Build the Tester screen (the product's whole value) against seeded fixture data.
4. Build Menu, Loader, Creator; wire up import/export with the legacy format.
5. Port the trophy system as data.
6. Add animation last — it's polish, and doing it last keeps you from rebuilding the CSS-class-as-logic coupling.
7. Layer on About (changelog from data), PWA manifest/service worker, and analytics if wanted.

---

## 15. Open Questions for the Author

### Resolved by driving production — no answer needed

| Was | Finding |
|---|---|
| Does Tester's Back on the first card exit? | ✅ **Yes** — it leaves the test and returns to the Menu. Confirmed. Still worth deciding whether that's the behavior you *want* (see below). |
| What happens on a wrong answer? | ✅ Unlimited retries; the typed text **stays in the box** (the user must clear it); `failed` increments **per attempt**; `tested` and the progress bar don't move. |
| Is `img/ball.svg` used? | ✅ **No** — it is deployed (dist copies `img/*` wholesale) but appears nowhere in `app-bundle.js`. It's an orphan; drop it. |
| Was the Android app ever published? | ✅ **No** — `com.kszapps.hmwt` 404s on the Play Store. So `hmwt.keystore` never signed a shipped artifact, which lowers the urgency considerably. It still shouldn't live in a public repo, but there's nothing deployed to protect. |
| Is production the same as this commit? | ✅ **Yes**, byte-for-byte on `index.html`, fingerprint-exact on `app-bundle.js`. |
| Does the export format match the code? | ✅ Confirmed end-to-end: filename `<Set Name>.cards`, body is the verbatim `localStorage` JSON. Spaces in set names survive fine. |

### Still open — your answers change the rebuild

1. **Multiple answers per card** — `Card.definitions` / `Card.answers` are arrays that only ever hold one element. Planned multi-answer support (accept any of several spellings), or vestigial? Decides the data model. *My recommendation: implement it for real — it's a genuine feature and the data already has the shape.*
2. **The `.cards` file format** — do real users have exported `.cards` files worth staying compatible with, or is a new versioned format with a one-time importer acceptable?
3. **Settings** — placeholder since 2017. What did you want here? Case-insensitivity is currently hard-coded (v0.2.0); making it a toggle is the obvious first candidate, along with default hint-side and cards-per-test.
4. **Trophy rewards** — commit `fdc4108f` / the v0.0.41 changelog mention "a reward system linked to the trophies." Did that go anywhere? **Note there is no screen that lists trophies** — 24 trophies exist and the only way to ever see one is a 2-second toast you might miss. A trophies screen is close to free and would make the whole system visible.
5. **Native app** — still a goal? Decides PWA-only vs. Capacitor. ⚠️ Note the name is now contested: there's a `VocabCards` on Google Play (`com.mertyigit0.vocabcards`) and one on the App Store (`id1116991036`). Worth checking before committing to store branding.
6. **Firebase** — keep analytics? Any interest in optional cloud sync? (That's the single biggest possible feature addition, and the only reason you'd need Auth.)
7. **Tester Back on the first card** — confirmed to exit the test. *Intentional*, or should it be a no-op / disabled button?
8. **Failed-card policy** — should there be max-attempts / reveal-answer? Should failed cards be re-queued at the end of the set? Should the input auto-clear on a wrong answer? (Right now the user retypes over their own wrong text.)
9. **Empty-set soft-lock (bug #1)** — this is live on production right now and bricks the UI until reload. Want me to ship a minimal one-line fix to the current Aurelia app while the rebuild is planned, or leave it and fix it only in the rebuild?
10. **Duplicate set names** — confirmed to silently overwrite. Should the rebuild block duplicates, auto-suffix (`My Set (2)`), or prompt to merge/replace?

---

*Generated from a full read of `hmwt_app/src`, `aurelia_project`, build configuration, and git history, then cross-checked by driving the live production site at vocabcards.com in headless Chromium. Every behavior described was traced to source; behaviors marked ✅ were additionally confirmed against the running app. The one inference I could not verify (the `BehaviorPropertyObserver` micro-task explanation for the `FIXME`) is flagged inline in §13.*
