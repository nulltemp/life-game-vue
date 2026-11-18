# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses `npm` (`package-lock.json` is the only lockfile).

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`vue-tsc`) then production build
- `npm run test:unit` — run Vitest unit tests once and exit (`vitest run`, jsdom environment, rooted at `src/`)
- `npm run test:unit:watch` — same, in watch mode
- `npm run test:unit -- src/utils/__tests__/life.test.ts` — run a single unit test file
- `npm run test:e2e:dev` — run Cypress against the Vite dev server (interactive, opens Cypress UI)
- `npm run test:e2e` — run Cypress headless against the preview server (run `npm run build` first)
- `npm run lint` — `eslint . --fix` (flat config in `eslint.config.mjs`, includes Prettier)
- `npm run type-check` — `vue-tsc --noEmit` only

## Architecture

This is a small single-page Vue 3 + Vuetify + TypeScript app implementing Conway's Game of Life. Pinia is installed and registered in `src/main.ts` but no store is currently defined — all state lives in component-local `ref`s.

- `src/main.ts` — app entry; registers Pinia and Vuetify (full `components`/`directives` import, not tree-shaken).
- `src/App.vue` — root component; just composes `LifeGame`, `AboutGame` and `Note`.
- `src/utils/life.ts` — pure Game of Life rules: `countNeighbors(grid, i, j)`, `nextGeneration(grid)` (returns a new grid, does not mutate the input) and `isSameGrid(a, b)` (same size and cells). Cells outside the grid count as dead (no wraparound).
- `src/components/LifeGame.vue` — the game UI and state: holds the grid state (`dataMap`, a `number[][]` of 0/1), grid resize logic (`changeDataMapSize`), the generation step (`step`, which applies `nextGeneration` once and returns `false` without changing anything if the board would not change), the simulation loop (`update`, which calls `step`), the Step button (`stepOnce`: `stopStatus()` then `step()`), and simulation start/stop (`changeStartStatus`/`stopStatus`). The simulation loop is a self-rescheduling `setTimeout` inside `update()` (not `setInterval`), gated by the `isStarted` ref. `update()` stops the simulation (`stopStatus()`) when `step()` returns `false`, i.e. the next generation equals the current one (all dead or only still lifes); oscillators such as the blinker keep running. The timer handle is held in a module-scoped `timerId` and explicitly `clearTimeout`'d in `changeStartStatus`/`stopStatus` before any (re)start, to avoid duplicate concurrent loops from rapid stop/start toggling.
- `src/components/AboutGame.vue` — static card explaining the Game of Life rules and how to play (keep its "How to play" list in sync when changing the UI).
- `src/components/Note.vue` — static footer card: GitHub and Ko-fi link buttons, and a Privacy Policy link.
- `@` path alias resolves to `src/` (configured in `vite.config.ts`).

### Grid semantics

- `dataMap` is row-major: `dataMap[i][j]` where `i` is row (height), `j` is column (width).
- Cells are `0` (dead) or `1` (alive), not booleans.
- Resizing (`changeDataMapSize`) mutates `dataMap` in place via `.length` truncation/extension rather than replacing the array — new cells default to `0`. Height/width are clamped to `[1, 100]` via `clampSize` before use, to guard against `RangeError` on negative sizes and runaway grids on very large ones. Blank or invalid input keeps the current size instead of clamping to the minimum, so it can't discard cells.
- Grid CSS columns are an inline `:style` binding driven by the `columns` computed (`dataMap[0].length`), not the `width` ref, so the layout doesn't reflow while the Width input is still being typed (before `change` resizes `dataMap`). Cells are square via `aspect-ratio: 1`, and the board's `maxWidth` (`mapMaxWidth`) shrinks for tall grids so the whole board fits in 500×500px.

### Testing structure

- Unit tests (Vitest) exercise the real code:
  - `src/utils/__tests__/life.test.ts` tests the rules in `src/utils/life.ts` with known patterns (block, blinker, glider).
  - `src/components/__tests__/LifeGame.test.ts` mounts `LifeGame.vue` with Vuetify via `@vue/test-utils` and uses fake timers (only `setTimeout`/`clearTimeout`, so Vuetify/jsdom's internal `setImmediate` calls don't inflate `vi.getTimerCount()`) to drive the simulation loop. It stubs `ResizeObserver` (missing in jsdom), and `vite.config.ts` sets `test.server.deps.inline: ['vuetify']` so Vuetify's `.css` imports load under Vitest.
  - The Vitest root (`src`) and environment (`jsdom`) are set in the `test` block of `vite.config.ts`, not as CLI flags: with `--root src/`, Vitest 5 looks for the config file under `src/` and the `@` alias is lost.
  - Put new grid/rule logic in `src/utils/life.ts` and test it there; keep component tests for UI wiring.
- E2E tests (`cypress/e2e/*.cy.ts`) drive the real UI: grid cell count is asserted via `.box` element count, cell state via `.death`/`.live` classes, and the Height/Width inputs via `cy.contains('.v-text-field', '<label>').find('input')` (Vuetify does not put the label on the `<input>`). Grid resize fires on the input's `change` event, so tests `.blur()` after typing.
- `test:e2e` / `test:e2e:dev` bind the server to `127.0.0.1:4173` explicitly (matching `baseUrl` in `cypress.config.ts`); on Windows `localhost` may resolve to `::1` and `start-server-and-test` would time out. If Cypress fails with `bad option: --smoke-test`, the shell has `ELECTRON_RUN_AS_NODE` set (e.g. inherited from VS Code) — unset it.

## Deployment and CI

- The app is hosted on Cloudflare (https://life-game-vue.nulltemp.com/); the production build is `npm run build` → `dist/`.
- CI is GitHub Actions (`.github/workflows/ci.yml`), run on pushes to `master` and on pull requests: `npm ci` (with `CYPRESS_INSTALL_BINARY=0`), `npx eslint .` (no `--fix`), `npm run type-check`, `npm run test:unit`, `npm run build-only`, on Node 22. E2E tests are not run in CI — run `npm run test:e2e` locally when changing UI.

## Issue tracking

- Issues (bugs, improvement ideas, open questions) are tracked in `docs/issues.md`, **not** GitHub Issues. When asked to record an issue (e.g. 「課題を記録して」), add it to `docs/issues.md` following the format described at the top of that file; do not create a GitHub issue.
- When an issue is resolved, move it to the 「対応済み」 section with the date and commit/PR.
