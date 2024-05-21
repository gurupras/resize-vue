<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { ref } from 'vue'
import PixelPanel from './components/pixel-resize/Panel.vue'

const children = ref<any>([{
  title: 'Child 1',
  collapsed: false
}, {
  title: 'Child 2',
  collapsed: false
}, {
  title: 'Child 3',
  collapsed: false
}])

</script>

<template>
<div>
  <div class="container">
    <div class="section">
      <div class="panel-container">
        <PixelPanel :children="children"/>
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss">
@import './stories/panel-styles.scss';

.panel-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 90vh;
  overflow: hidden;
}
</style>
