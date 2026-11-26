import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import Note from '@/components/Note.vue'

// Mock CSS
vi.mock('*.css', () => ({}))

const LINKS = [
  { text: 'View on GitHub', href: 'https://github.com/nulltemp/life-game-vue' },
  { text: 'Support on Ko-fi', href: 'https://ko-fi.com/nulltemp' },
  { text: 'Privacy Policy', href: 'https://nulltemp.com/privacy/' },
]

describe('Note.vue', () => {
  it('renders the GitHub, Ko-fi and Privacy Policy links opening safely in a new tab', () => {
    const wrapper = mount(Note, {
      global: { plugins: [createVuetify()] },
    })

    const anchors = wrapper.findAll('a')
    expect(anchors).toHaveLength(LINKS.length)

    for (const { text, href } of LINKS) {
      const anchor = anchors.find((a) => a.text().includes(text))
      expect(anchor, text).toBeDefined()
      expect(anchor!.attributes('href')).toBe(href)
      expect(anchor!.attributes('target')).toBe('_blank')
      expect(anchor!.attributes('rel')?.split(/\s+/)).toContain('noopener')
    }

    wrapper.unmount()
  })
})
