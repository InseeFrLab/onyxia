# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands use **Yarn** (not npm).

```bash
yarn dev              # Start dev server (processes env YAML first via scripts/unyamlify-env-local.ts)
yarn build            # Type-check (tsc) then build for production
yarn test             # Run all tests once (Vitest, non-watch)
yarn format           # Format all .ts/.tsx/.json/.md files with Prettier
yarn format:check     # Check formatting without writing
yarn storybook        # Launch Storybook on port 6006
```

**Run a single test file:**

```bash
yarn vitest run src/core/usecases/launcher/decoupledLogic/computeHelmValues.test.ts
```

**Run tests matching a name pattern:**

```bash
yarn vitest run --reporter=verbose -t "pattern"
```

Pre-commit hooks run `eslint --fix` and `prettier --write` via lint-staged.

## Architecture

Onyxia Web is a React SPA — a data science platform portal for launching Kubernetes services (Helm charts), browsing catalogs, managing S3 files, managing Vault secrets, and querying data via DuckDB. It is deployed as static files served by nginx.

### Core principles

- **React is only for rendering.** Business logic is React-agnostic and lives in `src/core/`. The `src/ui/` layer is strictly for React components and hooks.
- **Unidirectional dependencies.** `src/core/` never imports from `src/ui/`, not even for types.
- **Reactive over promise-based.** Thunks update observable state; the UI reacts to state changes. Prefer dispatching actions and reading state over returning values from thunks.
- **Constants outside Redux state.** Values that don't change are not stored in state — they are retrieved from thunks when needed, to avoid unnecessary re-renders.

### `src/core/` — Business logic

Follows a clean-architecture / ports-and-adapters pattern using the `clean-architecture` npm package (a Redux-like store without Redux).

- **`ports/`** — TypeScript interfaces defining contracts for external dependencies (`OnyxiaApi`, `Oidc`, `S3Client`, `SecretsManager`, `SqlOlap`).
- **`adapters/`** — Concrete implementations: `onyxiaApi/` (axios-based HTTP), `oidc/` (oidc-spa), `s3Client/` (AWS SDK v3), `secretManager/` (Vault), `sqlOlap/` (DuckDB WASM). Each adapter has a mock counterpart for dev/testing.
- **`usecases/`** — One folder per feature (20+ total: `catalog`, `launcher`, `serviceManagement`, `fileExplorer`, `secretExplorer`, `dataExplorer`, etc.). Each usecase follows the pattern:
    - `state.ts` — state shape + `createUsecaseActions` (slice-like)
    - `thunks.ts` — async side effects, accesses adapters via `createUsecaseContextApi`
    - `selectors.ts` — memoized state derivations
    - `index.ts` — re-exports all three
- **`bootstrap.ts`** — Wires adapters together and creates the core store.
- **`index.ts`** — Exports `useCoreState`, `getCore`, `createReactApi` bindings consumed by `src/ui/`.

**Complex use-cases** (especially `launcher/`) have a `decoupledLogic/` subfolder with pure functions and no framework dependencies — this is where most unit tests live.

### `src/ui/` — React layer

- **`App/`** — Root layout: Header, LeftBar, Main, Footer. `App.tsx` triggers core bootstrap; `Main.tsx` is the route-based page switcher.
- **`pages/`** — One folder per route/page. Each page exports `routeDefs` (via `type-route`'s `defineRoute`) and `routeGroup`. All are merged in `pages/index.ts`.
- **`routes.tsx`** — Router instantiation. Navigation uses `routes.catalog(...).push()` or `session.push()`.
- **`i18n/`** — i18nifty setup. Translation keys are declared at the component level via `declareComponentKeys`, collected into a `ComponentKey` union in `i18n/types.ts`. Nine languages: en, fr, zh-CN, no, fi, nl, it, es, de.
- **`theme/`** — onyxia-ui theme setup (palette, fonts, favicon).
- **`shared/`** — Reusable components (CommandBar, CodeBlock, SettingField, etc.).

### Key patterns

**Consuming core state in React:**

```ts
import { useCoreState, getCore } from "core";
const helmReleases = useCoreState(state => state.serviceManagement.helmReleases);
await getCore().dispatch(usecases.serviceManagement.thunks.initialize());
```

**Styling — tss-react** (not plain CSS modules):

```ts
import { tss } from "tss";
const useStyles = tss.withName({ MyComponent }).create(({ theme }) => ({ ... }));
const { classes, cx } = useStyles();
```

**Absolute imports** — `tsconfig.json` sets `baseUrl: "src"`, so use `import { foo } from "core/usecases/catalog"` (not relative paths).

**Environment variables** — All env vars are centrally parsed and validated in `src/env.ts`. The `index.html` is an EJS template processed by `vite-envs` at build time.

**Authentication** — OIDC init (`oidc-spa`) happens before React renders, in `main.tsx`. Use the `Oidc` port interface, not the adapter directly.

**Plugin system** — `src/pluginSystem.ts` exposes `window.onyxia` after boot and fires an `"onyxiaready"` `CustomEvent`, allowing external JS to interact with core state, routes, theme, and i18n.

**Keycloak theme** — `src/keycloak-theme/` is a Keycloakify login theme that shares env and i18n infrastructure with the main app. Build with `yarn build-keycloak-theme`.

## Key libraries

| Library              | Role                                                         |
| -------------------- | ------------------------------------------------------------ |
| `onyxia-ui`          | In-house design system on top of MUI v6                      |
| `type-route`         | Strongly-typed client-side router                            |
| `i18nifty`           | Component-level i18n                                         |
| `clean-architecture` | Redux-like store (ports/usecases pattern)                    |
| `oidc-spa`           | OIDC/OAuth2 authentication                                   |
| `keycloakify`        | Keycloak login theme from React components                   |
| `tss-react`          | CSS-in-JS bound to onyxia-ui theme                           |
| `vite-envs`          | Env var injection into EJS `index.html` at build time        |
| DuckDB WASM          | In-browser SQL OLAP queries (`dataExplorer`, `sqlOlapShell`) |
