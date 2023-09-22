<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { SubPanelProps } from './types'
const props = withDefaults(defineProps<SubPanelProps>(), {
  collapsed: false
})

const $el = ref<HTMLElement>(null as any)
const content = ref<HTMLElement>(null as any)

const emit = defineEmits<{
  (e: 'update:collapsed', value: boolean): void,
  (e: 'collapsed'): void,
  (e: 'expanded'): void,
}>()

defineExpose({ $el })

const toggle = () => {
  emit('update:collapsed', !props.collapsed)
}

const collapsedWatcher = watch(() => props.collapsed, (v) => {
  if (v) {
    emit('collapsed')
  } else {
    emit('expanded')
  }
})

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
    <span>{{ title }}</span>
  </div>
  <div class="content is-flex is-flex-direction-column" ref="content">
  </div>
</div>
</template>

<style lang="scss" scoped>
.sub-panel-root {
  flex-direction: column;
  flex: 1;
  transition: flex-grow 0.1s linear, min-height 0.1s linear;
  .panel-title {
    height: var(--panel-title-height);
    background-color: var(--sub-panel-title-bg);
    color: var(--sub-panel-title-color);
    font-size: 1em;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
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
