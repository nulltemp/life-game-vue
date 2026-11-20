import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import App from '@/App.vue'
import LifeGame from '@/components/LifeGame.vue'
import AboutGame from '@/components/AboutGame.vue'
import Note from '@/components/Note.vue'

// Mock CSS
vi.mock('*.css', () => ({}))
vi.mock('vuetify/styles', () => ({}))

// Vuetify relies on ResizeObserver, which jsdom does not provide
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('App.vue', () => {
  it('renders LifeGame, AboutGame and Note', () => {
    const wrapper = mount(App, {
      global: { plugins: [createVuetify()] },
    })

    expect(wrapper.findComponent(LifeGame).exists()).toBe(true)
    expect(wrapper.findComponent(AboutGame).exists()).toBe(true)
    expect(wrapper.findComponent(Note).exists()).toBe(true)

    // Each component's own content is actually rendered
    expect(wrapper.find('.map').exists()).toBe(true)
    expect(wrapper.text()).toContain("What is Conway's Game of Life?")
    expect(wrapper.text()).toContain('View on GitHub')

    wrapper.unmount()
  })
})
