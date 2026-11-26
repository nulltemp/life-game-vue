import { describe, it, expect } from 'vitest'
import { decodeBoard, encodeBoard } from '@/utils/share'

const glider = [
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [1, 1, 1, 0],
]

describe('encodeBoard / decodeBoard', () => {
  it('round-trips a board', () => {
    const hash = encodeBoard(glider)
    expect(hash).toMatch(/^w=4&h=3&c=[A-Za-z0-9_-]+$/)
    expect(decodeBoard(hash)).toEqual(glider)
    expect(decodeBoard(`#${hash}`)).toEqual(glider)
  })

  it('encodes cells row-major, most significant bit first', () => {
    // 0100 0010 | 1110 (0000 padding) -> 0x42 0xe0
    expect(encodeBoard(glider)).toBe('w=4&h=3&c=QuA')
  })

  it('round-trips a 1x1 board and a full 100x100 random board', () => {
    expect(decodeBoard(encodeBoard([[1]]))).toEqual([[1]])
    expect(decodeBoard(encodeBoard([[0]]))).toEqual([[0]])
    const big = Array.from({ length: 100 }, () =>
      Array.from({ length: 100 }, () => (Math.random() < 0.5 ? 1 : 0)),
    )
    const hash = encodeBoard(big)
    expect(hash.length).toBeLessThan(1700)
    expect(decodeBoard(hash)).toEqual(big)
  })

  it('round-trips a non-square board', () => {
    const board = [
      [1, 0, 1, 1, 0, 0, 0, 1, 1],
      [0, 1, 1, 0, 1, 0, 1, 0, 0],
    ]
    expect(decodeBoard(encodeBoard(board))).toEqual(board)
  })

  it.each([
    ['', 'empty'],
    ['w=4&h=3', 'missing cells'],
    ['h=3&c=QuA', 'missing width'],
    ['w=0&h=3&c=', 'zero width'],
    ['w=101&h=1&c=' + 'A'.repeat(17), 'width over 100'],
    ['w=4.0&h=3&c=QuA', 'non-integer width'],
    ['w=-4&h=3&c=QuA', 'negative width'],
    ['w=4&h=3&c=Qu', 'too few cells'],
    ['w=4&h=3&c=QuAA', 'too many cells'],
    ['w=4&h=3&c=Qu+', 'non-base64url character'],
    ['w=4&h=3&c=QuE', 'set padding bits'],
    ['w=4&h=3&c=Q', 'impossible base64 length'],
  ])('rejects %j (%s)', (hash) => {
    expect(decodeBoard(hash)).toBeNull()
  })
})
