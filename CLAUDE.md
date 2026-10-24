# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses `npm` (`package-lock.json` is the only lockfile).

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`vue-tsc`) then production build
- `npm run test:unit` — run Vitest unit tests (jsdom environment, rooted at `src/`)
- `npm run test:unit -- src/utils/__tests__/life.test.ts` — run a single unit test file
- `npm run test:e2e:dev` — run Cypress against the Vite dev server (interactive, opens Cypress UI)
- `npm run test:e2e` — run Cypress headless against the preview server (run `npm run build` first)
- `npm run lint` — `eslint . --fix` (flat config in `eslint.config.mjs`, includes Prettier)
- `npm run type-check` — `vue-tsc --noEmit` only

## Architecture

This is a small single-page Vue 3 + Vuetify + TypeScript app implementing Conway's Game of Life. Pinia is installed and registered in `src/main.ts` but no store is currently defined — all state lives in component-local `ref`s.

- `src/main.ts` — app entry; registers Pinia and Vuetify (full `components`/`directives` import, not tree-shaken).
- `src/App.vue` — root component; just composes `LifeGame` and `Note`.
- `src/utils/life.ts` — pure Game of Life rules: `countNeighbors(grid, i, j)` and `nextGeneration(grid)` (returns a new grid, does not mutate the input). Cells outside the grid count as dead (no wraparound).
- `src/components/LifeGame.vue` — the game UI and state: holds the grid state (`dataMap`, a `number[][]` of 0/1), grid resize logic (`changeDataMapSize`), the generation step (`update`, which calls `nextGeneration`), and simulation start/stop (`changeStartStatus`/`stopStatus`). The simulation loop is a self-rescheduling `setTimeout` inside `update()` (not `setInterval`), gated by the `isStarted` ref. The timer handle is held in a module-scoped `timerId` and explicitly `clearTimeout`'d in `changeStartStatus`/`stopStatus` before any (re)start, to avoid duplicate concurrent loops from rapid stop/start toggling.
- `src/components/Note.vue` — static GitHub link card.
- `@` path alias resolves to `src/` (configured in `vite.config.ts`).

### Grid semantics

- `dataMap` is row-major: `dataMap[i][j]` where `i` is row (height), `j` is column (width).
- Cells are `0` (dead) or `1` (alive), not booleans.
- Resizing (`changeDataMapSize`) mutates `dataMap` in place via `.length` truncation/extension rather than replacing the array — new cells default to `0`. Height/width are clamped to `[1, 100]` via `clampSize` before use, to guard against `RangeError` on negative sizes and runaway grids on very large ones.
- Grid CSS columns are driven by `v-bind(width)` in the component's `<style>` block, so the visual column count follows the `width` ref directly.

### Testing structure

- Unit tests (Vitest) exercise the real code:
  - `src/utils/__tests__/life.test.ts` tests the rules in `src/utils/life.ts` with known patterns (block, blinker, glider).
  - `src/components/__tests__/LifeGame.test.ts` mounts `LifeGame.vue` with Vuetify via `@vue/test-utils` and uses fake timers to drive the simulation loop. It stubs `ResizeObserver` (missing in jsdom), and `vite.config.ts` sets `test.server.deps.inline: ['vuetify']` so Vuetify's `.css` imports load under Vitest.
  - Put new grid/rule logic in `src/utils/life.ts` and test it there; keep component tests for UI wiring.
- E2E tests (`cypress/e2e/*.cy.ts`) drive the real UI: grid cell count is asserted via `.box` element count, cell state via `.death`/`.live` classes, and the Height/Width inputs via `cy.contains('.v-text-field', '<label>').find('input')` (Vuetify does not put the label on the `<input>`). Grid resize fires on the input's `change` event, so tests `.blur()` after typing.
- `test:e2e` / `test:e2e:dev` bind the server to `127.0.0.1:4173` explicitly (matching `baseUrl` in `cypress.config.ts`); on Windows `localhost` may resolve to `::1` and `start-server-and-test` would time out. If Cypress fails with `bad option: --smoke-test`, the shell has `ELECTRON_RUN_AS_NODE` set (e.g. inherited from VS Code) — unset it.

## Deployment and CI

- The app is hosted on Cloudflare (https://life-game-vue.nulltemp.com/); the production build is `npm run build` → `dist/`.
- There is no CI: GitHub Actions is not used and there is no `.github/workflows`. Run `npm run lint`, `npm run type-check` and `npm run test:unit` locally before pushing, since nothing runs them automatically.
