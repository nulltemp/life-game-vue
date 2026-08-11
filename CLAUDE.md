# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

This project uses `npm` (see scripts in package.json) but `yarn.lock` is present — check which lockfile is current before adding dependencies.

- `npm run dev` — start Vite dev server
- `npm run build` — type-check (`vue-tsc`) then production build
- `npm run test:unit` — run Vitest unit tests (jsdom environment, rooted at `src/`)
- `npm run test:unit -- src/components/__tests__/LifeGame.test.ts` — run a single unit test file
- `npm run test:e2e:dev` — run Cypress against the Vite dev server (interactive, opens Cypress UI)
- `npm run test:e2e` — build, then run Cypress headless against the preview server (used in CI)
- `npm run lint` — ESLint with `--fix` over `.vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts`
- `npm run type-check` — `vue-tsc --noEmit` only

## Architecture

This is a small single-page Vue 3 + Vuetify + TypeScript app implementing Conway's Game of Life. Pinia is installed and registered in `src/main.ts` but no store is currently defined — all state lives in component-local `ref`s.

- `src/main.ts` — app entry; registers Pinia and Vuetify (full `components`/`directives` import, not tree-shaken).
- `src/App.vue` — root component; just composes `LifeGame` and `Note`.
- `src/components/LifeGame.vue` — the entire game: holds the grid state (`dataMap`, a `number[][]` of 0/1), grid resize logic (`changeDataMapSize`), neighbor counting (`count`), the generation step (`update`), and simulation start/stop (`changeStartStatus`/`stopStatus`). The simulation loop is a self-rescheduling `setTimeout` inside `update()` (not `setInterval`), gated by the `isStarted` ref. The timer handle is held in a module-scoped `timerId` and explicitly `clearTimeout`'d in `changeStartStatus`/`stopStatus` before any (re)start, to avoid duplicate concurrent loops from rapid stop/start toggling.
- `src/components/Note.vue` — static GitHub link card.
- `@` path alias resolves to `src/` (configured in `vite.config.ts`).

### Grid semantics

- `dataMap` is row-major: `dataMap[i][j]` where `i` is row (height), `j` is column (width).
- Cells are `0` (dead) or `1` (alive), not booleans.
- Resizing (`changeDataMapSize`) mutates `dataMap` in place via `.length` truncation/extension rather than replacing the array — new cells default to `0`. Height/width are clamped to `[1, 100]` via `clampSize` before use, to guard against `RangeError` on negative sizes and runaway grids on very large ones.
- Grid CSS columns are driven by `v-bind(width)` in the component's `<style>` block, so the visual column count follows the `width` ref directly.

### Testing structure

- Unit tests (`src/components/__tests__/*.test.ts`, Vitest) currently duplicate the `count`/`update` logic in plain object literals rather than mounting the component and exercising its real methods — when changing grid/simulation logic in `LifeGame.vue`, keep these duplicated implementations in sync or refactor them to test the component directly.
- E2E tests (`cypress/e2e/*.cy.ts`) drive the real UI: grid cell count is asserted via `.box` element count, cell state via `.death`/`.live` classes, and the Height/Width inputs via `input[label="..."]` selectors (Vuetify renders the label as an attribute on the input).
