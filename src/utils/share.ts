// Encodes a board into a URL hash (`w=<width>&h=<height>&c=<cells>`) and back,
// so a drawn pattern can be shared as a link. The cells are one bit each,
// row-major from the top-left cell, most significant bit first, packed into
// bytes (the last byte padded with zeros) and written as base64url without
// padding: a 100x100 board takes about 1,700 characters. The hash is never sent
// to the server, so it doesn't affect the canonical URL or caching.

export const MIN_SHARE_SIZE = 1
export const MAX_SHARE_SIZE = 100

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromBase64Url = (text: string): Uint8Array | null => {
  // A length of 1 (mod 4) can't come from any byte sequence
  if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) {
    return null
  }
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/')
  try {
    const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

// Plain decimal digits within the allowed size only
const parseSize = (value: string | null): number | null => {
  if (value === null || !/^\d{1,3}$/.test(value)) {
    return null
  }
  const size = Number(value)
  return size >= MIN_SHARE_SIZE && size <= MAX_SHARE_SIZE ? size : null
}

/** The hash (without the leading `#`) describing `grid` (rows of 0/1). */
export const encodeBoard = (grid: number[][]): string => {
  const height = grid.length
  const width = grid[0]?.length ?? 0
  const bytes = new Uint8Array(Math.ceil((width * height) / 8))
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (grid[i][j] === 1) {
        const bit = i * width + j
        bytes[bit >> 3] |= 0x80 >> (bit & 7)
      }
    }
  }
  return `w=${width}&h=${height}&c=${toBase64Url(bytes)}`
}

/**
 * The board described by `hash` (with or without the leading `#`), or `null`
 * if it isn't a valid board: a size outside 1..100, cells of the wrong length,
 * or set padding bits.
 */
export const decodeBoard = (hash: string): number[][] | null => {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const width = parseSize(params.get('w'))
  const height = parseSize(params.get('h'))
  const cells = params.get('c')
  if (width === null || height === null || cells === null) {
    return null
  }
  const bytes = fromBase64Url(cells)
  const cellCount = width * height
  if (!bytes || bytes.length !== Math.ceil(cellCount / 8)) {
    return null
  }
  const bitAt = (bit: number) => (bytes[bit >> 3] >> (7 - (bit & 7))) & 1
  for (let bit = cellCount; bit < bytes.length * 8; bit++) {
    if (bitAt(bit) !== 0) {
      return null
    }
  }
  return Array.from({ length: height }, (_, i) =>
    Array.from({ length: width }, (_, j) => bitAt(i * width + j)),
  )
}
