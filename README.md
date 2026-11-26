https://life-game-vue.nulltemp.com/

# Conway's Game of Life - Vue.js Implementation

A modern implementation of Conway's Game of Life using Vue 3, Vuetify, and TypeScript. This interactive web application allows users to simulate the classic cellular automaton with a clean, responsive interface.

## Features

- **Interactive Grid**: Click cells to toggle their state (alive/dead), or drag to draw/erase several at once
- **Keyboard Support**: Tab to the board, move between cells with the arrow keys (Home/End, Ctrl+Home/End for the corners), and toggle a cell with Enter or Space
- **Dynamic Resizing**: Adjust grid height and width (up to 100 × 100)
- **Simulation Controls**: Start/Stop the evolution with a customizable generation interval, or Step one generation at a time
- **Random / Clear**: Fill the board randomly or start over with an empty one
- **Auto-Stop**: The simulation stops by itself once the board stops changing, with a message saying so
- **Light/Dark Theme**: The board follows the system's light/dark theme
- **Responsive Design**: Built with Vuetify for a modern Material Design UI
- **TypeScript Support**: Full type safety with Vue 3 Composition API
- **Testing Suite**: Unit tests with Vitest and E2E tests with Cypress

## How to Play

- Click a cell to toggle it between alive (blue) and dead, or drag across the board to draw (starting on a live cell erases instead). The board's colors follow the light/dark theme.
- With the keyboard, Tab to the board, move between cells with the arrow keys, and press Enter or Space to toggle a cell.
- Use Random to fill the board, or Clear to start over.
- Change Height and Width to resize the grid (up to 100 × 100); this resets the generation counter.
- Set the generation interval with the slider (0.1s to 1.0s).
- Press Start to run the simulation and Stop to pause it.
- Press Step to advance one generation at a time (it pauses a running simulation).
- The simulation stops by itself once the board stops changing, and a message says so (Start and Step show it too on such a board).

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, the [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) extension makes the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit

# watch mode
npm run test:unit:watch
```

### Run End-to-End Tests with [Cypress](https://www.cypress.io/)

```sh
npm run test:e2e:dev
```

This runs the end-to-end tests against the Vite development server.
It is much faster than the production build.

But it's still recommended to test the production build with `test:e2e` before deploying (e.g. in CI environments):

```sh
npm run build
npm run test:e2e
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
