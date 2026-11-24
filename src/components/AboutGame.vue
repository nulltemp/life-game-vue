<template>
  <v-card class="pa-4 mb-4" tag="section">
    <v-card-title tag="h2">What is Conway's Game of Life?</v-card-title>
    <v-card-text>
      <p class="mb-4">
        Conway's Game of Life is a cellular automaton devised by the
        mathematician John Horton Conway in 1970. It is a zero-player game: you
        set up an initial pattern of live cells, and the board then evolves on
        its own, one generation at a time, following a few simple rules.
      </p>
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Rules</h3>
      <ul class="mb-4 pl-6">
        <li>A live cell with two or three live neighbors survives.</li>
        <li>A dead cell with exactly three live neighbors becomes alive.</li>
        <li>All other live cells die, and all other dead cells stay dead.</li>
      </ul>
      <h3 class="text-subtitle-1 font-weight-bold mb-2">How to play</h3>
      <ul class="pl-6">
        <li>
          Click a cell to toggle it between alive and dead, or drag across the
          board to draw (starting on a live cell erases instead).
        </li>
        <li>
          With the keyboard, Tab to the board, move between cells with the arrow
          keys, and press Enter or Space to toggle a cell.
        </li>
        <li>Use Random to fill the board, or Clear to start over.</li>
        <li>
          Change Height and Width to resize the grid (up to 100 × 100); this
          resets the generation counter.
        </li>
        <li>Press Start to run the simulation and Stop to pause it.</li>
        <li>Press Step to advance one generation at a time.</li>
        <li>
          The simulation stops by itself once the board stops changing, and a
          message says so (Start and Step show it too on such a board).
        </li>
      </ul>
    </v-card-text>
  </v-card>
</template>
