import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import LifeGame from '@/components/LifeGame.vue'

// Mock CSS
vi.mock('*.css', () => ({}))
vi.mock('vuetify/styles', () => ({}))

// Vuetify relies on ResizeObserver, which jsdom does not provide
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const mountLifeGame = () =>
  mount(LifeGame, {
    global: { plugins: [createVuetify({ components, directives })] },
  })

const liveIndexes = (wrapper: ReturnType<typeof mountLifeGame>) =>
  wrapper
    .findAll('.box')
    .map((box, index) => (box.classes('live') ? index : -1))
    .filter((index) => index >= 0)

describe('LifeGame.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders a 10x10 grid with the initial glider', () => {
    const wrapper = mountLifeGame()
    expect(wrapper.findAll('.box')).toHaveLength(100)
    expect(liveIndexes(wrapper)).toEqual([12, 23, 31, 32, 33])
  })

  it('toggles a cell on click', async () => {
    const wrapper = mountLifeGame()
    const first = wrapper.findAll('.box')[0]
    expect(first.classes()).toContain('death')

    await first.trigger('click')
    expect(wrapper.findAll('.box')[0].classes()).toContain('live')

    await wrapper.findAll('.box')[0].trigger('click')
    expect(wrapper.findAll('.box')[0].classes()).toContain('death')
  })

  it('advances generations while started and stops on stop', async () => {
    const wrapper = mountLifeGame()
    const startButton = () =>
      wrapper.findAll('button').find((b) => /start|stop/.test(b.text()))!

    await startButton().trigger('click')
    expect(startButton().text()).toBe('stop')
    expect(wrapper.text()).toContain('Generation: 1')
    // Glider after 1 generation
    expect(liveIndexes(wrapper)).toEqual([21, 23, 32, 33, 42])

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('Generation: 2')

    await startButton().trigger('click')
    expect(startButton().text()).toBe('start')
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.text()).toContain('Generation: 2')
  })

  it('clears the grid and resets the generation counter', async () => {
    const wrapper = mountLifeGame()
    const startButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'start')!
    await startButton.trigger('click')

    const clearButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Clear')!
    await clearButton.trigger('click')

    expect(liveIndexes(wrapper)).toEqual([])
    expect(wrapper.text()).toContain('Generation: 0')
  })

  it('keeps the grid columns until the Width input is committed', async () => {
    const wrapper = mountLifeGame()
    const columns = () =>
      wrapper.find<HTMLElement>('.map').element.style.gridTemplateColumns
    const widthInput = wrapper
      .findAll('.v-text-field')
      .find((field) => field.text().includes('Width'))!
      .find('input')
    expect(columns()).toBe('repeat(10, 1fr)')

    // Typing alone must not reflow the existing cells
    // (set the value by hand: setValue() also fires change, which commits it)
    ;(widthInput.element as HTMLInputElement).value = '5'
    await widthInput.trigger('input')
    expect(columns()).toBe('repeat(10, 1fr)')
    expect(wrapper.findAll('.box')).toHaveLength(100)

    await widthInput.trigger('change')
    expect(columns()).toBe('repeat(5, 1fr)')
    expect(wrapper.findAll('.box')).toHaveLength(50)
  })
})
