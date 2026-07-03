<template>
  <div id="app">
    <OBDisasterRecoveryDashboard />
  </div>
</template>

<script setup>
import OBDisasterRecoveryDashboard from './components/OBDisasterRecoveryDashboard.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #1a1a2e;
  overflow-x: hidden;
}

#app {
  min-height: 100vh;
  width: 100%;
}
</style>
