<script setup lang="ts">
import LifeGame from "./components/LifeGame.vue"
import Note from "./components/Note.vue"
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <LifeGame />
        <Note />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped></style>
