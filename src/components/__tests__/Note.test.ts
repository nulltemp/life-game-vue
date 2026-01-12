import { describe, it, expect, vi } from 'vitest'
import Note from '@/components/Note.vue'

// Mock CSS
vi.mock('*.css', () => ({}))
vi.mock('vuetify/styles', () => ({}))

describe('Note.vue', () => {
  it('can be imported', () => {
    expect(Note).toBeDefined()
  })
})
