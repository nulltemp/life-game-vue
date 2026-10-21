export type Grid = number[][]

// Counts live cells among the 8 neighbors of (i, j). Cells outside the grid are treated as dead.
export const countNeighbors = (grid: Grid, i: number, j: number): number => {
  let count = 0
  for (let k = i - 1; k <= i + 1; k++) {
    if (k < 0 || k >= grid.length) {
      continue
    }
    for (let l = j - 1; l <= j + 1; l++) {
      if (l < 0 || l >= grid[k].length || (k === i && l === j)) {
        continue
      }
      count += grid[k][l]
    }
  }
  return count
}

// Returns the next generation as a new grid; the input grid is not modified.
export const nextGeneration = (grid: Grid): Grid =>
  grid.map((row, i) =>
    row.map((cell, j) => {
      const lifeCount = countNeighbors(grid, i, j)
      if (cell === 1) {
        return lifeCount === 2 || lifeCount === 3 ? 1 : 0
      }
      return lifeCount === 3 ? 1 : 0
    }),
  )
