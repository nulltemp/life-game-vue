<template>
  <div>
    <div class="map">
      <template v-for="(dataList, i) in dataMap" :key="i">
        <template v-for="(data, j) in dataList" :key="j">
          <div class="box" @click="changeDataMapValue(i, j)">
            {{ data }}
          </div>
        </template>
      </template>
      <v-btn @click="changeStartStatus">{{ startButtonMessage }}</v-btn>
    </div>
  </div>
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

const changeDataMapValue = (i: number, j: number) => {
  dataMap.value[i][j] = dataMap.value[i][j] === 1 ? 0 : 1
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
  }, 1000)
}

const changeStartStatus = () => {
  isStarted.value = !isStarted.value
  startButtonMessage.value = isStarted.value ? "stop" : "start"
  if (isStarted.value) {
    update()
  }
}
</script>

<style scoped>
.map {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
}

.box {
  border: 1px solid #000;
}
</style>
