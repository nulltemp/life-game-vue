https://life-game-vue.nulltemp.com/

# Conway's Game of Life - Vue.js Implementation

A modern implementation of Conway's Game of Life using Vue 3, Vuetify, and TypeScript. This interactive web application allows users to simulate the classic cellular automaton with a clean, responsive interface.

## Features

- **Interactive Grid**: Click cells to toggle their state (alive/dead), or drag to draw/erase several at once
- **Dynamic Resizing**: Adjust grid height and width in real-time
- **Simulation Controls**: Start/stop the evolution with customizable generation intervals
- **Responsive Design**: Built with Vuetify for a modern Material Design UI
- **TypeScript Support**: Full type safety with Vue 3 Composition API
- **Testing Suite**: Unit tests with Vitest and E2E tests with Cypress

## How to Play

1. Click on grid cells to set initial living cells (blue = alive, white = dead), or drag across them to draw (dragging from a live cell erases)
2. Adjust grid dimensions using the Height and Width inputs
3. Set the generation interval speed (0.1s to 1.0s)
4. Click "Start" to begin the simulation
5. Click "Stop" to pause the evolution
6. Click "Step" to advance one generation at a time (pauses a running simulation)

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
