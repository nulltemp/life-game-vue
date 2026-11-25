import { describe, it, expect } from 'vitest'
import { cellsOnLine } from '@/utils/line'

describe('cellsOnLine', () => {
  it('returns just the cell for a zero-length line', () => {
    expect(cellsOnLine([2, 3], [2, 3])).toEqual([[2, 3]])
  })

  it('covers horizontal and vertical lines in either direction', () => {
    expect(cellsOnLine([1, 0], [1, 3])).toEqual([
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ])
    expect(cellsOnLine([3, 2], [0, 2])).toEqual([
      [3, 2],
      [2, 2],
      [1, 2],
      [0, 2],
    ])
  })

  it('covers diagonals', () => {
    expect(cellsOnLine([0, 0], [3, 3])).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ])
    expect(cellsOnLine([3, 0], [0, 3])).toEqual([
      [3, 0],
      [2, 1],
      [1, 2],
      [0, 3],
    ])
  })

  it('leaves no gaps on shallow and steep lines', () => {
    for (const [from, to] of [
      [
        [0, 0],
        [2, 9],
      ],
      [
        [9, 1],
        [0, 4],
      ],
      [
        [5, 7],
        [1, 0],
      ],
    ] as [[number, number], [number, number]][]) {
      const cells = cellsOnLine(from, to)
      expect(cells[0]).toEqual(from)
      expect(cells[cells.length - 1]).toEqual(to)
      expect(cells).toHaveLength(
        Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1])) + 1,
      )
      for (let k = 1; k < cells.length; k++) {
        expect(Math.abs(cells[k][0] - cells[k - 1][0])).toBeLessThanOrEqual(1)
        expect(Math.abs(cells[k][1] - cells[k - 1][1])).toBeLessThanOrEqual(1)
      }
    }
  })
})
