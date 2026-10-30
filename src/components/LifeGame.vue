<template>
  <v-card class="pa-4 mb-4">
    <v-card-title tag="h1">Conway's Game of Life</v-card-title>
    <v-card-text>
      <div
        class="map"
        :style="{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          maxWidth: `${mapMaxWidth}px`,
        }"
      >
        <template v-for="(dataList, i) in dataMap" :key="i">
          <template v-for="(data, j) in dataList" :key="j">
            <div
              class="box"
              @click="changeDataMapValue(i, j)"
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
      <v-row dense>
        <v-col cols="6">
          <v-btn @click="randomize" size="large" variant="outlined" block>
            Random
          </v-btn>
        </v-col>
        <v-col cols="6">
          <v-btn @click="clear" size="large" variant="outlined" block>
            Clear
          </v-btn>
        </v-col>
      </v-row>
      <div class="text-center mt-2">Generation: {{ generation }}</div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { nextGeneration } from '@/utils/life'

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

// Blank or invalid input keeps the current size: Number('') is 0, which would
// otherwise clamp to MIN_SIZE and discard the cells outside of it
const clampSize = (value: number | string, current: number): number => {
  const size = value === '' ? NaN : Number(value)
  if (!Number.isFinite(size)) {
    return current
  }
  return Math.min(Math.max(Math.trunc(size), MIN_SIZE), MAX_SIZE)
}

const changeDataMapValue = (i: number, j: number) => {
  dataMap.value[i][j] = dataMap.value[i][j] === 1 ? 0 : 1
}

const changeDataMapSize = () => {
  width.value = clampSize(width.value, dataMap.value[0].length)
  height.value = clampSize(height.value, dataMap.value.length)

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
const startButtonMessage = computed(() => (isStarted.value ? 'stop' : 'start'))
const generation = ref(0)
let timerId: ReturnType<typeof setTimeout> | null = null

const update = () => {
  dataMap.value = nextGeneration(dataMap.value)
  generation.value++

  timerId = setTimeout(update, interval.value)
}

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

// Stop the self-rescheduling timer so it doesn't keep running after unmount
onUnmounted(() => stopStatus())

const randomize = () => {
  stopStatus()
  for (let i = 0; i < dataMap.value.length; i++) {
    for (let j = 0; j < dataMap.value[i].length; j++) {
      dataMap.value[i][j] = Math.random() < 0.5 ? 1 : 0
    }
  }
  generation.value = 0
}

const clear = () => {
  stopStatus()
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
  gap: 0px;
  margin: 0 auto 24px;
}

.box {
  border: 1px solid #ccc;
  aspect-ratio: 1;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.box:hover {
  opacity: 0.8;
}

.live {
  background: #1976d2;
}

.death {
  background: #fff;
}
</style>
