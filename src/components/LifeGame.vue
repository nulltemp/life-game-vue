<template>
  <v-card class="pa-4 mb-4">
    <v-card-title>Conway's Game of Life</v-card-title>
    <v-card-text>
      <div class="map mb-4">
        <template v-for="(dataList, i) in dataMap" :key="i">
          <template v-for="(data, j) in dataList" :key="j">
            <div class="box" @click="changeDataMapValue(i, j)" :class="data === 1 ? 'live' : 'death'">
            </div>
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
            @change="changeDataMapSize()"
            variant="outlined"
          />
        </v-col>
      </v-row>
      <div class="mb-4">
        <label for="interval-slider">Generation Interval: {{ (interval / 1000).toFixed(1) }}s</label>
        <v-slider
          id="interval-slider"
          v-model="interval"
          @input="stopStatus()"
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
      >
        {{ startButtonMessage }}
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from "vue"

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

const changeDataMapValue = (i: number, j: number) => {
  dataMap.value[i][j] = dataMap.value[i][j] === 1 ? 0 : 1
}

const changeDataMapSize = () => {
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
const startButtonMessage = ref("start")

const count = (i: number, j: number) => {
  var count = 0
  for (var k = i - 1; k <= i + 1; k++) {
    if (k < 0 || k >= dataMap.value.length) {
      continue
    }
    for (var l = j - 1; l <= j + 1; l++) {
      if (l < 0 || l >= dataMap.value[0].length || (k == i && l == j)) {
        continue
      }
      count += dataMap.value[k][l]
    }
  }
  return count
}

const update = () => {
  const newDataMap: number[][] = []
  for (var i = 0; i < dataMap.value.length; i++) {
    newDataMap[i] = []
    for (var j = 0; j < dataMap.value[0].length; j++) {
      switch (dataMap.value[i][j]) {
        case 0: {
          const lifeCount = count(i, j)
          if (lifeCount === 3) {
            newDataMap[i][j] = 1
          } else {
            newDataMap[i][j] = 0
          }
          break
        }
        case 1: {
          const lifeCount = count(i, j)
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

  dataMap.value = newDataMap

  setTimeout(() => {
    if (isStarted.value) {
      update()
    }
  }, interval.value)
}

const changeStartStatus = () => {
  isStarted.value = !isStarted.value
  startButtonMessage.value = isStarted.value ? "stop" : "start"
  if (isStarted.value) {
    update()
  }
}

const stopStatus = () => {
  if (isStarted.value) {
    isStarted.value = false
    startButtonMessage.value = "start"
  }
}
</script>

<style scoped>
.map {
  display: grid;
  grid-template-columns: repeat(v-bind(width), 1fr);
  gap: 0px;
  max-width: 500px;
  margin: 0 auto;
}

.box {
  border: 1px solid #ccc;
  height: 20px;
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
