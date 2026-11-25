import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
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

const UNCHANGING = 'The board is no longer changing.'

const mountLifeGame = () =>
  mount(LifeGame, {
    global: { plugins: [createVuetify()] },
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

  it('toggles a cell on press', async () => {
    const wrapper = mountLifeGame()
    const press = async (index: number) => {
      await wrapper.findAll('.box')[index].trigger('pointerdown')
      window.dispatchEvent(new Event('pointerup'))
    }
    expect(wrapper.findAll('.box')[0].classes()).toContain('death')

    await press(0)
    expect(wrapper.findAll('.box')[0].classes()).toContain('live')

    await press(0)
    expect(wrapper.findAll('.box')[0].classes()).toContain('death')
  })

  it("paints every cell dragged over with the pressed cell's new value", async () => {
    const wrapper = mountLifeGame()
    const box = (index: number) => wrapper.findAll('.box')[index]

    // Drawing: start on a dead cell, so the whole drag makes cells alive,
    // including one that was already alive (12) which must stay alive
    await box(10).trigger('pointerdown')
    for (const index of [11, 12, 13]) {
      await box(index).trigger('pointermove')
    }
    window.dispatchEvent(new Event('pointerup'))
    // Moving after release paints nothing
    await box(14).trigger('pointermove')
    expect(liveIndexes(wrapper)).toEqual([10, 11, 12, 13, 23, 31, 32, 33])

    // Erasing: start on a live cell, so the drag kills cells
    await box(31).trigger('pointerdown')
    await box(32).trigger('pointermove')
    await box(33).trigger('pointermove')
    window.dispatchEvent(new Event('pointercancel'))
    expect(liveIndexes(wrapper)).toEqual([10, 11, 12, 13, 23])
  })

  it('fills the cells skipped between two pointer positions', async () => {
    const wrapper = mountLifeGame()
    const box = (index: number) => wrapper.findAll('.box')[index]

    // One pointermove from row 5, column 0 straight to row 5, column 4,
    // then diagonally to row 8, column 7
    await box(50).trigger('pointerdown')
    await box(54).trigger('pointermove')
    await box(87).trigger('pointermove')
    window.dispatchEvent(new Event('pointerup'))
    expect(liveIndexes(wrapper)).toEqual([
      12, 23, 31, 32, 33, 50, 51, 52, 53, 54, 65, 76, 87,
    ])

    // A new drag doesn't connect to where the last one ended
    await box(0).trigger('pointerdown')
    await box(2).trigger('pointermove')
    window.dispatchEvent(new Event('pointerup'))
    expect(liveIndexes(wrapper)).toEqual([
      0, 1, 2, 12, 23, 31, 32, 33, 50, 51, 52, 53, 54, 65, 76, 87,
    ])
  })

  it('ignores presses with a non-primary button', async () => {
    const wrapper = mountLifeGame()
    await wrapper.findAll('.box')[0].trigger('pointerdown', { button: 2 })
    expect(wrapper.findAll('.box')[0].classes()).toContain('death')
  })

  it('advances generations while started and stops on stop', async () => {
    const wrapper = mountLifeGame()
    const startButton = () =>
      wrapper.findAll('button').find((b) => /^(Start|Stop)$/.test(b.text()))!

    await startButton().trigger('click')
    expect(startButton().text()).toBe('Stop')
    expect(wrapper.text()).toContain('Generation: 1')
    // Glider after 1 generation
    expect(liveIndexes(wrapper)).toEqual([21, 23, 32, 33, 42])

    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('Generation: 2')

    await startButton().trigger('click')
    expect(startButton().text()).toBe('Start')
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.text()).toContain('Generation: 2')
  })

  it('applies a new interval to the pending generation while running', async () => {
    const wrapper = mountLifeGame()
    const startButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Start')!
    await startButton.trigger('click')
    expect(wrapper.text()).toContain('Generation: 1')

    // Shorten the interval from 1.0s to 0.1s right after a generation
    wrapper
      .findComponent({ name: 'VSlider' })
      .vm.$emit('update:modelValue', 100)
    await wrapper.vm.$nextTick()
    // Still a single loop, not a second one next to the old timer
    expect(vi.getTimerCount()).toBe(1)

    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.text()).toContain('Generation: 2')
    await vi.advanceTimersByTimeAsync(100)
    expect(wrapper.text()).toContain('Generation: 3')
    expect(vi.getTimerCount()).toBe(1)
  })

  it('does not start the simulation when the interval changes while stopped', async () => {
    const wrapper = mountLifeGame()
    wrapper
      .findComponent({ name: 'VSlider' })
      .vm.$emit('update:modelValue', 100)
    await wrapper.vm.$nextTick()
    expect(vi.getTimerCount()).toBe(0)
    await vi.advanceTimersByTimeAsync(1000)
    expect(wrapper.text()).toContain('Generation: 0')
  })

  it('stops the simulation timer on unmount', async () => {
    const wrapper = mountLifeGame()
    const startButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Start')!
    await startButton.trigger('click')
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('clears the grid and resets the generation counter', async () => {
    const wrapper = mountLifeGame()
    const startButton = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Start')!
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

  it('resets the generation counter when the grid is resized', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!
    const widthInput = wrapper
      .findAll('.v-text-field')
      .find((field) => field.text().includes('Width'))!
      .find('input')

    await button('Step').trigger('click')
    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 2')

    // Committing the current size again changes nothing
    await widthInput.setValue('10')
    expect(wrapper.text()).toContain('Generation: 2')

    await widthInput.setValue('12')
    expect(wrapper.findAll('.box')).toHaveLength(120)
    expect(wrapper.text()).toContain('Generation: 0')
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

    expect(wrapper.text()).not.toContain(UNCHANGING)
    await button('Start').trigger('click')
    expect(button('Start')).toBeDefined()
    expect(wrapper.text()).toContain('Generation: 0')
    expect(vi.getTimerCount()).toBe(0)
    // Pressing Start did something visible: it says why nothing happened
    expect(wrapper.find('[role="status"]').text()).toBe(UNCHANGING)

    // Editing the board hides the message again
    await wrapper.findAll('.box')[0].trigger('pointerdown')
    window.dispatchEvent(new Event('pointerup'))
    expect(wrapper.text()).not.toContain(UNCHANGING)
  })

  it('stops by itself once the board stops changing', async () => {
    const wrapper = mountLifeGame()
    const startButton = () =>
      wrapper.findAll('button').find((b) => /^(Start|Stop)$/.test(b.text()))!

    // In the 10x10 grid, the initial glider hits the bottom-right corner and
    // settles into a 2x2 block (still life) after 27 generations
    await startButton().trigger('click')
    await vi.advanceTimersByTimeAsync(60_000)

    expect(startButton().text()).toBe('Start')
    expect(wrapper.text()).toContain('Generation: 27')
    expect(liveIndexes(wrapper)).toEqual([88, 89, 98, 99])
    expect(vi.getTimerCount()).toBe(0)
    expect(wrapper.text()).toContain(UNCHANGING)
  })

  it('does not show the message while the board keeps changing', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!

    await button('Start').trigger('click')
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.text()).not.toContain(UNCHANGING)
  })

  it('advances exactly one generation on Step', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!

    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 1')
    expect(liveIndexes(wrapper)).toEqual([21, 23, 32, 33, 42])
    expect(button('Start')).toBeDefined()
    expect(vi.getTimerCount()).toBe(0)

    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 2')
  })

  it('pauses a running simulation on Step', async () => {
    const wrapper = mountLifeGame()
    const button = (text: string) =>
      wrapper.findAll('button').find((b) => b.text() === text)!

    await button('Start').trigger('click')
    expect(wrapper.text()).toContain('Generation: 1')

    await button('Step').trigger('click')
    expect(wrapper.text()).toContain('Generation: 2')
    expect(button('Start')).toBeDefined()
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
    expect(wrapper.text()).toContain(UNCHANGING)

    await button('Random').trigger('click')
    expect(wrapper.text()).not.toContain(UNCHANGING)
  })

  it.each([
    ['Width', '40', false],
    ['Width', '41', true],
    ['Height', '41', true],
  ])(
    'drops cell borders on large grids (%s = %s: %s)',
    async (label, size, noBorder) => {
      const wrapper = mountLifeGame()
      const input = wrapper
        .findAll('.v-text-field')
        .find((field) => field.text().includes(label))!
        .find('input')
      expect(wrapper.find('.map').classes()).not.toContain('no-border')

      await input.setValue(size)
      expect(wrapper.find('.map').classes().includes('no-border')).toBe(
        noBorder,
      )
    },
  )
  it('exposes cells as toggle buttons with their position and state', () => {
    const wrapper = mountLifeGame()
    const cell = wrapper.findAll('.box')[12]
    expect(cell.element.tagName).toBe('BUTTON')
    expect(cell.attributes('aria-label')).toBe('Row 2, column 3')
    expect(cell.attributes('aria-pressed')).toBe('true')
    expect(wrapper.findAll('.box')[0].attributes('aria-pressed')).toBe('false')
  })

  it('makes the board a single tab stop and moves focus with arrow keys', async () => {
    const wrapper = mount(LifeGame, {
      global: { plugins: [createVuetify()] },
      attachTo: document.body,
    })
    const tabbable = () =>
      wrapper.findAll('.box').filter((b) => b.attributes('tabindex') === '0')
    expect(tabbable()).toHaveLength(1)
    expect(tabbable()[0].attributes('aria-label')).toBe('Row 1, column 1')

    const cells = wrapper.findAll('.box')
    await cells[0].trigger('keydown', { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cells[1].element)
    await cells[1].trigger('focus')
    await cells[1].trigger('keydown', { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cells[11].element)
    await cells[11].trigger('focus')
    expect(tabbable()[0].attributes('aria-label')).toBe('Row 2, column 2')
    // Moving stops at the edges
    await cells[0].trigger('keydown', { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cells[0].element)
    await cells[0].trigger('keydown', { key: 'End', ctrlKey: true })
    expect(document.activeElement).toBe(cells[99].element)
    wrapper.unmount()
  })

  it('toggles a cell from the keyboard but not twice on a pointer click', async () => {
    const wrapper = mountLifeGame()
    const cell = () => wrapper.findAll('.box')[0]
    // Enter/Space activate a button with a click whose detail is 0
    await cell().trigger('click')
    expect(cell().classes()).toContain('live')
    await cell().trigger('click')
    expect(cell().classes()).toContain('death')

    // A pointer click follows the pointerdown that already toggled the cell
    await cell().trigger('pointerdown')
    window.dispatchEvent(new Event('pointerup'))
    await cell().trigger('click', { detail: 1 })
    expect(cell().classes()).toContain('live')
  })

  it('labels the interval slider with its visible label', () => {
    const wrapper = mountLifeGame()
    const label = wrapper.find('#interval-slider-label')
    expect(label.text()).toBe('Generation Interval: 1.0s')
    const thumb = wrapper.find('[role="slider"]')
    expect(thumb.attributes('aria-labelledby')).toBe('interval-slider-label')
    expect(thumb.attributes('aria-valuetext')).toBe('1.0s')
  })
})
