export type Cell = [number, number]

// The cells on a straight line from `from` to `to` (both included, in order),
// by Bresenham's algorithm. Consecutive cells touch (8-connected), so painting
// all of them leaves no gaps
export const cellsOnLine = (from: Cell, to: Cell): Cell[] => {
  let [i, j] = from
  const [toI, toJ] = to
  const di = Math.abs(toI - i)
  const dj = Math.abs(toJ - j)
  const stepI = i < toI ? 1 : -1
  const stepJ = j < toJ ? 1 : -1
  let error = dj - di
  const cells: Cell[] = [[i, j]]
  while (i !== toI || j !== toJ) {
    const doubled = 2 * error
    if (doubled > -di) {
      error -= di
      j += stepJ
    }
    if (doubled < dj) {
      error += dj
      i += stepI
    }
    cells.push([i, j])
  }
  return cells
}
