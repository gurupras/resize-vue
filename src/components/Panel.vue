<script setup lang="ts">
import { ref } from 'vue'
import SubPanel from './SubPanel.vue'
import SubPanelTemplate from './SubPanelTemplate.vue'
import { SubPanelProps } from './types'

const props = defineProps<{
  children: SubPanelProps[]
}>()

const resizing = ref<Boolean>(false)

const panels = ref<(typeof SubPanel)[]>([])

const getFlexGrow = (el: HTMLElement) => {
  const inline = el.style.flexGrow
  if (inline !== '') {
    return Number(inline)
  }
  return 1
}

const findPrevExpandedPanel = (idx: number) => {
  return _findExpandedPanel(idx, (idx: number) => idx - 1)
}

const findNextExpandedPanel = (idx: number) => {
  return _findExpandedPanel(idx, (idx: number) => idx + 1)
}

const _findExpandedPanel = (idx: number, next: (idx: number) => number): ([number, HTMLElement] | null) => {
  let curIdx = idx
  let entry = props.children[curIdx]
  while (entry) {
    curIdx = next(curIdx)
    entry = props.children[curIdx]
    if (curIdx < 0 || curIdx === props.children.length) {
      break
    }
    if (!entry.collapsed) {
      // The panel may not be collapsed but still have a flex-grow of 0. If it is, we treat it as though it is collapsed
      const panel: HTMLElement = panels.value[curIdx].$el
      const panelFlexGrow = getFlexGrow(panel)
      if (panelFlexGrow !== 0) {
        return [curIdx, panels.value[curIdx].$el]
      }
    }
  }
  return null
}

const { onResizeStart, onResize } = getResizeMethods()

function getResizeMethods () {
  let prevPanel: HTMLElement
  let nextPanel: HTMLElement | null
  let nextPanelIdx: number

  let prevCSS: CSSStyleDeclaration
  let nextCSS: CSSStyleDeclaration

  let prevSizeOld: number
  let nextSizeOld: number
  let totalSizeOld: number

  let prevFlexGrowOld: number
  let nextFlexGrowOld: number
  let totalFlexGrowOld: number

  let lastPosition: number

  const sizeProp = 'offsetHeight'
  const positionProp = 'pageY'

  const onResizeStart = (e: MouseEvent, idx: number) => {
    resizing.value = true

    lastPosition = e[positionProp]
  }

  const onResize = (e: MouseEvent, idx: number) => {
    prevPanel = panels.value[idx].$el
    const result = findNextExpandedPanel(idx)

    if (!result) {
      return
    }

    ;[nextPanelIdx, nextPanel] = result

    prevCSS = window.getComputedStyle(prevPanel)
    nextCSS = window.getComputedStyle(nextPanel!)

    prevSizeOld = prevPanel[sizeProp] as number
    nextSizeOld = nextPanel![sizeProp] as number
    totalSizeOld = prevSizeOld + nextSizeOld

    prevFlexGrowOld = Number(prevCSS.flexGrow)
    nextFlexGrowOld = Number(nextCSS.flexGrow)
    totalFlexGrowOld = prevFlexGrowOld + nextFlexGrowOld

    const newPosition = e[positionProp]
    const diff = newPosition - lastPosition

    prevSizeOld += diff
    nextSizeOld -= diff

    if (prevSizeOld < 0) {
      // props.children[idx].collapsed = true
      prevSizeOld = 0
    } else {
      // props.children[idx].collapsed = false
    }
    if (nextSizeOld < 0) {
      // props.children[nextPanelIdx].collapsed = true
      nextSizeOld = 0
    } else {
      // props.children[nextPanelIdx].collapsed = false
    }

    const prevFlexGrowNew = totalFlexGrowOld * (prevSizeOld / totalSizeOld)
    const nextFlexGrowNew = totalFlexGrowOld * (nextSizeOld / totalSizeOld)

    prevPanel.style.flexGrow = `${prevFlexGrowNew}`
    nextPanel!.style.flexGrow = `${nextFlexGrowNew}`

    lastPosition = newPosition
  }
  return {
    onResizeStart,
    onResize
  }
}

const onCollapseOrExpand = (collapse: boolean, entry: SubPanelProps, idx: number) => {
  // If this is the last expanded entry, find the entry above it that is expanded and add all of its flex to that
  let siblingExpandedPanel: HTMLElement
  const nextExpandedResult = findNextExpandedPanel(idx)
  if (nextExpandedResult === null) {
    const result = findPrevExpandedPanel(idx)
    if (result === null) {
      return
    }
    ;[, siblingExpandedPanel] = result
  } else {
    // Find the next expanded sub-panel and add all of its flex to that
    ;[, siblingExpandedPanel] = nextExpandedResult
  }
  const collapsedPanel: HTMLElement = panels.value[idx].$el

  const siblingExpandedPanelCSS = window.getComputedStyle(siblingExpandedPanel)

  const siblingExpandedPanelFlexGrow = Number(siblingExpandedPanelCSS.flexGrow)

  let newFlexGrow: number
  if (collapse) {
    const collapsedPanelCSS = window.getComputedStyle(collapsedPanel)
    const collapsedPanelFlexGrow = Number(collapsedPanelCSS.flexGrow)
    newFlexGrow = collapsedPanelFlexGrow + siblingExpandedPanelFlexGrow
  } else {
    const collapsedPanelFlexGrow = getFlexGrow(collapsedPanel)
    newFlexGrow = siblingExpandedPanelFlexGrow - collapsedPanelFlexGrow
  }
  siblingExpandedPanel.style.flexGrow = `${newFlexGrow}`
  entry.collapsed = collapse
}

const computeResizeHandleDisabled = (prev: SubPanelProps | undefined, current: SubPanelProps, next: SubPanelProps | undefined) => {
  if (current.collapsed && next?.collapsed) {
    return true
  }
  return false
}
</script>

<template>
  <div class="panel-root is-flex is-flex-direction-column is-flex-grow-1" :class="{ resizing }">
    <div class="panel-title">Container</div>
    <SubPanelTemplate v-for="(entry, idx) in children" :key="idx">
      <template v-slot:content>
        <SubPanel ref="panels"
            v-bind="entry"
            @update:collapsed="v => onCollapseOrExpand(v, entry, idx)"
            class="sub-panel"/>
      </template>
      <template v-slot:after>
        <ResizeHandle class="resize-handle"
            :class="{ disabled: computeResizeHandleDisabled(children[idx - 1], children[idx], children[idx + 1])}"
            v-if="idx !== children.length - 1"
            @resizestart="e => onResizeStart(e, idx)"
            @resize="e => onResize(e, idx)"
            @resizeend="resizing = false"/>
      </template>
    </SubPanelTemplate>
  </div>
</template>

<style lang="scss" scoped>
.panel-root {
  --panel-title-height: 24px;

  .panel-title {
    padding: 0 8px;
    height: var(--panel-title-height, 24px);
    background-color: rgb(0, 64, 115);
    color: #fff;
  }

  .resize-handle {
    &:hover {
      background-color: var(--resize-hover-color);
      transition: background-color 0.2s ease-in-out;
      transition-delay: 0.3s;
    }

    .disabled {
      cursor: default;
      user-select: none;
    }
  }

  > .sub-panel + .resize-handle, > .resize-handle + .sub-panel {
    margin-top: calc(-0.5 * 6px);
  }

  &.resizing {
    .sub-panel {
      transition: none;
    }
  }
}
</style>
