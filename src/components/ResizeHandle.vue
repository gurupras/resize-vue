<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'resizestart', value: MouseEvent): void,
  (e: 'resize', value: MouseEvent): void,
  (e: 'resizeend', value: MouseEvent): void
}>()

const onMouseDown = (e: MouseEvent) => {
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  emit('resizestart', e)
}

const onMouseMove = (e: MouseEvent) => {
  e.preventDefault()
  emit('resize', e)
}

const onMouseUp = (e: MouseEvent) => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  emit('resizeend', e)
}
</script>

<template>
  <div class="resize-handle-root" @mousedown="onMouseDown">
  </div>
</template>

<style lang="scss" scoped>
.resize-handle-root {
  height: var(--resize-handle-height);
  cursor: ns-resize;
  width: 100%;
  z-index: 1;
}
</style>
