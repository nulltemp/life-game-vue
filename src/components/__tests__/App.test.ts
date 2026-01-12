import { describe, it, expect, vi } from 'vitest'
import App from '@/App.vue'

// Mock CSS
vi.mock('*.css', () => ({}))
vi.mock('vuetify/styles', () => ({}))

describe('App.vue', () => {
  it('can be imported', () => {
    expect(App).toBeDefined()
  })
})
