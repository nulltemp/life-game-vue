<template>
  <v-card class="pa-4 mb-4">
    <v-card-title tag="h1">Conway's Game of Life</v-card-title>
    <v-card-text>
      <div
        class="map"
        :class="{ 'no-border': isDense }"
        :style="{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          maxWidth: `${mapMaxWidth}px`,
        }"
        @pointerdown="startPaint"
        @pointermove="continuePaint"
      >
        <template v-for="(dataList, i) in dataMap" :key="i">
          <template v-for="(data, j) in dataList" :key="j">
            <div
              class="box"
              :data-i="i"
              :data-j="j"
              :class="data === 1 ? 'live' : 'death'"
            ></div>
          </template>
        </template>
      </div>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="height"
            @focus="stopStatus()"
            label="Height"
            type="number"
            :min="MIN_SIZE"
            :max="MAX_SIZE"
            @change="changeDataMapSize()"
            variant="outlined"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="width"
            @focus="stopStatus()"
            label="Width"
            type="number"
            :min="MIN_SIZE"
            :max="MAX_SIZE"
            @change="changeDataMapSize()"
            variant="outlined"
          />
        </v-col>
      </v-row>
      <div class="mb-4">
        <label for="interval-slider"
          >Generation Interval: {{ (interval / 1000).toFixed(1) }}s</label
        >
        <v-slider
          id="interval-slider"
          v-model="interval"
          :min="100"
          :max="1000"
          :step="100"
          thumb-label
        />
      </div>
      <v-btn
        @click="changeStartStatus"
        :color="isStarted ? 'red' : 'primary'"
        size="large"
        block
        class="mb-2"
      >
        {{ startButtonMessage }}
      </v-btn>
      <v-row density="compact">
        <v-col cols="4">
          <v-btn @click="stepOnce" size="large" variant="outlined" block>
            Step
          </v-btn>
        </v-col>
        <v-col cols="4">
          <v-btn @click="randomize" size="large" variant="outlined" block>
            Random
          </v-btn>
        </v-col>
        <v-col cols="4">
          <v-btn @click="clear" size="large" variant="outlined" block>
            Clear
          </v-btn>
        </v-col>
      </v-row>
      <div class="text-center mt-2">Generation: {{ generation }}</div>
      <!-- Always rendered so screen readers pick up the message when it appears -->
      <div class="text-center text-medium-emphasis" role="status">
        <span v-if="isUnchanging" class="unchanging-message">{{
          UNCHANGING_MESSAGE
        }}</span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { isSameGrid, nextGeneration } from '@/utils/life'

const dataMap = ref([
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
])

const width = ref(10)
const height = ref(10)
const interval = ref(1000) // in milliseconds

const MIN_SIZE = 1
const MAX_SIZE = 100

// Grid columns follow the actual cell data, not the Width input, so the layout
// stays intact while the user is still typing (the grid resizes on change)
const columns = computed(() => dataMap.value[0]?.length ?? MIN_SIZE)
// Cells are square, so shrink the board's width for tall grids to keep the
// whole board within MAP_SIZE x MAP_SIZE pixels
const MAP_SIZE = 500
const mapMaxWidth = computed(
  () =>
    (MAP_SIZE * columns.value) / Math.max(columns.value, dataMap.value.length),
)

// On large grids a 1px border would take up most of each cell, so drop it
// once either side has more than DENSE_SIZE cells
const DENSE_SIZE = 40
const isDense = computed(
  () => Math.max(columns.value, dataMap.value.length) > DENSE_SIZE,
)

// Blank or invalid input keeps the current size: Number('') is 0, which would
// otherwise clamp to MIN_SIZE and discard the cells outside of it
const clampSize = (value: number | string, current: number): number => {
  const size = value === '' ? NaN : Number(value)
  if (!Number.isFinite(size)) {
    return current
  }
  return Math.min(Math.max(Math.trunc(size), MIN_SIZE), MAX_SIZE)
}

// Drag painting: pressing on a cell flips it, and every cell the pointer then
// passes over while still pressed gets that same value, until it is released.
// A single pair of handlers on .map finds the cell under the pointer, so cells
// need no listeners of their own
let paintValue: number | null = null

// The cell under the pointer. Touch pointers stay captured by the element they
// went down on, so look it up by position rather than trusting event.target
const cellAt = (event: PointerEvent): [number, number] | null => {
  const hit =
    typeof document.elementFromPoint === 'function'
      ? document.elementFromPoint(event.clientX, event.clientY)
      : null
  const element = (hit ?? event.target) as HTMLElement | null
  const i = Number(element?.dataset?.i)
  const j = Number(element?.dataset?.j)
  if (!Number.isInteger(i) || !Number.isInteger(j) || !dataMap.value[i]) {
    return null
  }
  return j < dataMap.value[i].length ? [i, j] : null
}

const paintCell = (i: number, j: number, value: number) => {
  if (dataMap.value[i][j] === value) {
    return
  }
  isUnchanging.value = false
  dataMap.value[i][j] = value
}

const startPaint = (event: PointerEvent) => {
  // Only the primary button draws (touch and pen report 0 too)
  if (event.button > 0) {
    return
  }
  const cell = cellAt(event)
  if (!cell) {
    return
  }
  const [i, j] = cell
  paintValue = dataMap.value[i][j] === 1 ? 0 : 1
  paintCell(i, j, paintValue)
}

const continuePaint = (event: PointerEvent) => {
  if (paintValue === null) {
    return
  }
  const cell = cellAt(event)
  if (cell) {
    paintCell(cell[0], cell[1], paintValue)
  }
}

// Listen on window so releasing the pointer outside the board also ends it
const endPaint = () => {
  paintValue = null
}
onMounted(() => {
  window.addEventListener('pointerup', endPaint)
  window.addEventListener('pointercancel', endPaint)
})
onUnmounted(() => {
  window.removeEventListener('pointerup', endPaint)
  window.removeEventListener('pointercancel', endPaint)
})

const changeDataMapSize = () => {
  isUnchanging.value = false
  width.value = clampSize(width.value, dataMap.value[0].length)
  height.value = clampSize(height.value, dataMap.value.length)

  // A resize changes the board (cells may be cut off), so restart the count
  // like Random and Clear do; committing the same size keeps it
  if (
    width.value !== dataMap.value[0].length ||
    height.value !== dataMap.value.length
  ) {
    generation.value = 0
  }

  if (width.value !== dataMap.value[0].length) {
    for (let i = 0; i < dataMap.value.length; i++) {
      if (width.value < dataMap.value[i].length) {
        dataMap.value[i].length = width.value
      } else {
        const prevWidth = dataMap.value[i].length
        dataMap.value[i].length = width.value
        for (let j = prevWidth; j < width.value; j++) {
          dataMap.value[i][j] = 0
        }
      }
    }
  }
  if (height.value !== dataMap.value.length) {
    if (height.value < dataMap.value.length) {
      dataMap.value.length = height.value
    } else {
      const prevHeight = dataMap.value.length
      dataMap.value.length = height.value
      for (let i = prevHeight; i < height.value; i++) {
        dataMap.value[i] = []
        for (let j = 0; j < width.value; j++) {
          dataMap.value[i][j] = 0
        }
      }
    }
  }
}

const isStarted = ref(false)
const startButtonMessage = computed(() => (isStarted.value ? 'Stop' : 'Start'))
const generation = ref(0)
// Shown when Start/Step found (or a running simulation reached) a board whose
// next generation is the same; cleared whenever the board is edited
const UNCHANGING_MESSAGE = 'The board is no longer changing.'
const isUnchanging = ref(false)
let timerId: ReturnType<typeof setTimeout> | null = null

// Advances one generation. Returns false (and leaves the board and counter
// as they are) if the board no longer changes (all dead or only still lifes)
const step = (): boolean => {
  const next = nextGeneration(dataMap.value)
  if (isSameGrid(next, dataMap.value)) {
    isUnchanging.value = true
    return false
  }
  isUnchanging.value = false
  dataMap.value = next
  generation.value++
  return true
}

const update = () => {
  if (!step()) {
    stopStatus()
    return
  }
  timerId = setTimeout(update, interval.value)
}

// Moving the Generation Interval slider while running reschedules the pending
// generation with the new interval, instead of waiting out the old one
watch(interval, () => {
  if (!isStarted.value || timerId === null) {
    return
  }
  clearTimeout(timerId)
  timerId = setTimeout(update, interval.value)
})

const changeStartStatus = () => {
  isStarted.value = !isStarted.value
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }
  if (isStarted.value) {
    update()
  }
}

const stopStatus = () => {
  if (timerId !== null) {
    clearTimeout(timerId)
    timerId = null
  }
  isStarted.value = false
}

// Step button: pause a running simulation, then advance exactly one generation
const stepOnce = () => {
  stopStatus()
  step()
}

// Stop the self-rescheduling timer so it doesn't keep running after unmount
onUnmounted(() => stopStatus())

const randomize = () => {
  stopStatus()
  isUnchanging.value = false
  for (let i = 0; i < dataMap.value.length; i++) {
    for (let j = 0; j < dataMap.value[i].length; j++) {
      dataMap.value[i][j] = Math.random() < 0.5 ? 1 : 0
    }
  }
  generation.value = 0
}

const clear = () => {
  stopStatus()
  isUnchanging.value = false
  for (let i = 0; i < dataMap.value.length; i++) {
    for (let j = 0; j < dataMap.value[i].length; j++) {
      dataMap.value[i][j] = 0
    }
  }
  generation.value = 0
}
</script>

<style scoped>
.map {
  display: grid;
  /* Dragging on the board draws instead of scrolling the page */
  touch-action: none;
  user-select: none;
  gap: 0px;
  margin: 0 auto 24px;
}

.box {
  border: 1px solid #ccc;
  aspect-ratio: 1;
  cursor: pointer;
}

.no-border .box {
  border: none;
}

/* Only on devices that really hover: on touch, :hover sticks after a tap */
@media (hover: hover) {
  .box:hover {
    opacity: 0.8;
  }
}

.live {
  background: #1976d2;
}

.death {
  background: #fff;
}
</style>
