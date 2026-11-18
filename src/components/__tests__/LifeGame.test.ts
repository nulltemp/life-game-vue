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
    // Fake only the APIs the simulation loop uses, so getTimerCount() isn't
    // inflated by setImmediate calls made internally by Vuetify/jsdom on mount
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
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

  it('stops the simulation timer on unmount', async () => {
    const wrapper = mountLifeGame()
    const startButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'start')!
    await startButton.trigger('click')
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
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

  it.each(['Height', 'Width'])(
    'keeps the grid and restores the size when %s is left blank',
    async (label) => {
      const wrapper = mountLifeGame()
      const input = wrapper
        .findAll('.v-text-field')
        .find((field) => field.text().includes(label))!
        .find('input')

      // Set the value by hand: setValue() fires change in the same tick as input,
      // so the blank value would never reach the field's props
      ;(input.element as HTMLInputElement).value = ''
      await input.trigger('input')
      await input.trigger('change')

      expect(wrapper.findAll('.box')).toHaveLength(100)
      expect(liveIndexes(wrapper)).toEqual([12, 23, 31, 32, 33])
      expect((input.element as HTMLInputElement).value).toBe('10')
    },
  )

  it('does not start on an empty board', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!
    await button('Clear').trigger('click')

    await button('start').trigger('click')
    expect(button('start')).toBeDefined()
    expect(wrapper.text()).toContain('Generation: 0')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stops by itself once the board stops changing', async () => {
    const wrapper = mountLifeGame()
    const startButton = () =>
      wrapper.findAll('button').find((b) => /start|stop/.test(b.text()))!

    // In the 10x10 grid, the initial glider hits the bottom-right corner and
    // settles into a 2x2 block (still life) after 27 generations
    await startButton().trigger('click')
    await vi.advanceTimersByTimeAsync(60_000)

    expect(startButton().text()).toBe('start')
    expect(wrapper.text()).toContain('Generation: 27')
    expect(liveIndexes(wrapper)).toEqual([88, 89, 98, 99])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('advances exactly one generation on Step', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!

    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 1')
    expect(liveIndexes(wrapper)).toEqual([21, 23, 32, 33, 42])
    expect(button('start')).toBeDefined()
    expect(vi.getTimerCount()).toBe(0)

    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 2')
  })

  it('pauses a running simulation on Step', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!

    await button('start').trigger('click')
    expect(wrapper.text()).toContain('Generation: 1')

    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 2')
    expect(button('start')).toBeDefined()
    expect(vi.getTimerCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.text()).toContain('Generation: 2')
  })

  it('does not count a Step that leaves the board unchanged', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!
    await button('Clear').trigger('click')

    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 0')
  })
})
