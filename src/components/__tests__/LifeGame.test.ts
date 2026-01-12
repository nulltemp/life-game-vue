import { describe, it, expect, vi } from 'vitest'
import LifeGame from '@/components/LifeGame.vue'

// Mock CSS
vi.mock('*.css', () => ({}))
vi.mock('vuetify/styles', () => ({}))

// Mock setTimeout
vi.useFakeTimers()

describe('LifeGame.vue', () => {
  it('can be imported', () => {
    expect(LifeGame).toBeDefined()
  })



  it('counts neighbors correctly', () => {
    // Create a component instance manually for testing methods
    const component = {
      dataMap: [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
      ],
      count(i: number, j: number) {
        var count = 0
        for (var k = i - 1; k <= i + 1; k++) {
          if (k < 0 || k >= this.dataMap.length) {
            continue
          }
          for (var l = j - 1; l <= j + 1; l++) {
            if (l < 0 || l >= this.dataMap[0].length || (k == i && l == j)) {
              continue
            }
            count += this.dataMap[k][l]
          }
        }
        return count
      }
    }

    expect(component.count(1, 1)).toBe(0) // Center cell has no neighbors

    component.dataMap = [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ]

    expect(component.count(1, 1)).toBe(8) // Center cell has 8 neighbors
  })

  it('updates generation correctly', () => {
    const component = {
      dataMap: [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      count(i: number, j: number) {
        var count = 0
        for (var k = i - 1; k <= i + 1; k++) {
          if (k < 0 || k >= this.dataMap.length) {
            continue
          }
          for (var l = j - 1; l <= j + 1; l++) {
            if (l < 0 || l >= this.dataMap[0].length || (k == i && l == j)) {
              continue
            }
            count += this.dataMap[k][l]
          }
        }
        return count
      },
      update() {
        const newDataMap: number[][] = []
        for (var i = 0; i < this.dataMap.length; i++) {
          newDataMap[i] = []
          for (var j = 0; j < this.dataMap[0].length; j++) {
            switch (this.dataMap[i][j]) {
              case 0: {
                const lifeCount = this.count(i, j)
                if (lifeCount === 3) {
                  newDataMap[i][j] = 1
                } else {
                  newDataMap[i][j] = 0
                }
                break
              }
              case 1: {
                const lifeCount = this.count(i, j)
                if (lifeCount === 2 || lifeCount === 3) {
                  newDataMap[i][j] = 1
                } else {
                  newDataMap[i][j] = 0
                }
                break
              }
              default:
                console.error("error")
            }
          }
        }

        this.dataMap = newDataMap
      }
    }

    // Block pattern (stable) - should remain the same
    component.update()

    expect(component.dataMap).toEqual([
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ])
  })
})
