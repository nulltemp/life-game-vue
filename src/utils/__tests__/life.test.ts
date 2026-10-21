import { describe, it, expect } from 'vitest'
import { countNeighbors, nextGeneration } from '@/utils/life'

describe('countNeighbors', () => {
  it('does not count the cell itself', () => {
    const grid = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ]
    expect(countNeighbors(grid, 1, 1)).toBe(0)
  })

  it('counts all 8 neighbors', () => {
    const grid = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]
    expect(countNeighbors(grid, 1, 1)).toBe(8)
  })

  it('treats cells outside the grid as dead', () => {
    const grid = [
      [1, 1],
      [1, 1],
    ]
    expect(countNeighbors(grid, 0, 0)).toBe(3)
    expect(countNeighbors(grid, 1, 1)).toBe(3)
  })
})

describe('nextGeneration', () => {
  it('keeps a block (still life) unchanged', () => {
    const block = [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ]
    expect(nextGeneration(block)).toEqual(block)
  })

  it('oscillates a blinker with period 2', () => {
    const horizontal = [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ]
    const vertical = [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ]
    expect(nextGeneration(horizontal)).toEqual(vertical)
    expect(nextGeneration(vertical)).toEqual(horizontal)
  })

  it('kills a cell by underpopulation and overpopulation', () => {
    expect(nextGeneration([[1]])).toEqual([[0]])
    const crowded = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]
    expect(nextGeneration(crowded)).toEqual([
      [1, 0, 1],
      [0, 0, 0],
      [1, 0, 1],
    ])
  })

  it('moves a glider one cell diagonally after 4 generations', () => {
    let grid = [
      [0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ]
    for (let n = 0; n < 4; n++) {
      grid = nextGeneration(grid)
    }
    expect(grid).toEqual([
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
    ])
  })

  it('does not mutate the input grid', () => {
    const grid = [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ]
    const copy = grid.map((row) => [...row])
    nextGeneration(grid)
    expect(grid).toEqual(copy)
  })
})
