<template>
  <div>
    <div class="map">
      <template v-for="(dataList, index) in dataMap" :key="index">
        <template v-for="(data, index) in dataList" :key="index">
          <div class="box">
            {{ data }}
          </div>
        </template>
      </template>
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
    update()
  }, 1000)
}

update()
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
