<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { SubPanelProps } from './types'
const props = withDefaults(defineProps<SubPanelProps>(), {
  collapsed: false
})

const $el = ref<HTMLElement>(null as any)
const content = ref<HTMLElement>(null as any)

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void
}>()

defineExpose({ $el })

const toggle = () => {
  emit('update:collapsed', !props.collapsed)
}

onMounted(() => {
})
</script>

<template>
<div class="sub-panel-root is-flex" :class="{ collapsed }" ref="$el">
  <div class="panel-title" @click="toggle">
    <span class="icon">
      <i-mdi-chevron-right v-if="collapsed"/>
      <i-mdi-chevron-down v-else/>
    </span>
    {{ title }}
  </div>
  <div class="content is-flex is-flex-direction-column" ref="content">
  </div>
</div>
</template>

<style lang="scss" scoped>
.sub-panel-root {
  flex-direction: column;
  flex: 1;
  background-color: #6e6e6e;
  transition: flex-grow 0.1s linear;
  .panel-title {
    height: 23px;
    background-color: #8e8e8e;
    color: #000;
    cursor: pointer;
    display: inline-flex;
    user-select: none;
    .icon {
      margin-right: 4px;
    }
  }

  .content {
    flex-grow: 1;
  }

  &.collapsed {
    flex-grow: 0 !important;
  }
}
</style>
