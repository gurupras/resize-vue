<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'
import SubPanel from '../SubPanel.vue'
import SubPanelTemplate from '../SubPanelTemplate.vue'
import { SubPanelProps } from '../types'

const props = defineProps<{
  children: SubPanelProps[]
}>()

const $el = ref<HTMLElement>(null as any)
const $panelContent = ref<HTMLElement>(null as any)

const resizing = ref<Boolean>(false)
const transitions = ref<Boolean>(false)

const panels = ref<(typeof SubPanel)[]>([])

const findPrevExpandedPanel = (idx: number) => {
  return _findExpandedPanel(idx, (idx: number) => idx - 1)
}

const findNextExpandedPanel = (idx: number) => {
  return _findExpandedPanel(idx, (idx: number) => idx + 1)
}

const _findExpandedPanel = (idx: number, next: (idx: number) => number): ([number, HTMLElement] | null) => {
  let entry: SubPanelProps | undefined
  let curIdx = idx
  do {
    curIdx = next(curIdx)
    entry = props.children[curIdx]
    if (curIdx < 0 || curIdx >= props.children.length) {
      break
    }
    if (!entry.collapsed && panels.value[curIdx]) {
      return [curIdx, panels.value[curIdx].$el]
    }
  } while (entry)
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

const updateCollapsed = (collapse: boolean, idx: number) => {
  props.children[idx].collapsed = collapse
}

defineExpose({
  updateCollapsed
})

const getHeight = (el: HTMLElement) => {
  let height = 0
  let source = ''
  if (el.style.height) {
    height = Number(el.style.height.slice(0, -2))
    source = 'inline'
  } else {
    source = 'scrollHeight'
    height = el.scrollHeight
  }
  return { height, source }
}
const getTotalOccupiedHeight = (skippedPanels = new Set<typeof SubPanel>()) => {
  let totalOccupiedHeight = 0
  for (let idx = 0; idx < panels.value.length; idx++) {
    const panel = panels.value[idx]!
    if (skippedPanels.has(panel)) {
      continue
    }
    const el: HTMLElement = panel.$el
    const { height, source } = getHeight(el)
    console.log(`panel-${idx}: height=${height} source=${source}`)
    totalOccupiedHeight += height
  }
  return totalOccupiedHeight
}

const onCollapseOrExpand = async (collapse: boolean, entry: SubPanelProps, idx: number, initialMount = false) => {
  // If this is the last expanded entry, find the entry above it that is expanded and add all of its flex to that
  transitions.value = true
  if (collapse) {
    onCollapse(entry, idx)
  } else {
    onExpand(entry, idx, initialMount)
  }
}

const onCollapse = async (entry: SubPanelProps, idx: number) => {
  const collapsedPanel: typeof SubPanel = panels.value[idx]
  const collapsedPanelEl: HTMLElement = collapsedPanel.$el

  let siblingExpandedPanel: HTMLElement
  const heightBeforeCollapse = collapsedPanelEl.scrollHeight
  const collapsedPanelMinHeight = 24 // FIXME: This should not be hard-coded
  const nextExpandedResult = findNextExpandedPanel(idx)
  if (nextExpandedResult === null) {
    const result = findPrevExpandedPanel(idx)
    if (result === null) {
      collapsedPanelEl.style.height = `${collapsedPanelMinHeight}px`
      return
    }
    ;[, siblingExpandedPanel] = result
  } else {
    // Find the next expanded sub-panel and add all of its flex to that
    ;[, siblingExpandedPanel] = nextExpandedResult
  }
  await nextTick()
  // const collapsedPanelMinHeight = Number(getComputedStyle(collapsedPanelEl).height.slice(0, -2))
  const parent = collapsedPanelEl.parentElement!
  const totalOccupiedHeight = getTotalOccupiedHeight(new Set([collapsedPanel])) + collapsedPanelMinHeight
  const unoccupiedHeight = parent.offsetHeight - totalOccupiedHeight
  if (unoccupiedHeight > 0) {
    siblingExpandedPanel.style.height = `${siblingExpandedPanel.scrollHeight + unoccupiedHeight}px`
  }
  collapsedPanelEl.style.height = `${collapsedPanelMinHeight}px`
}

const onExpand = async (entry: SubPanelProps, idx: number, initialMount = false) => {
  // Algorithm:
  // If there is a user-defined height on this element:
  //   - Check to see if this height + sum of remaining panel heights is > parent height
  //   - If yes, we only try use min-height as space-needed
  //   - If no, space-needed is user-defined height
  // Else:
  //   - Use min-height as the space-needed
  // If there is unoccupied space, set this as its new height minus the current collapsed height
  // Check to see if there is space in expanded panels below idx. If there is, take it.
  // Any remaining space needs to be taken from an expanded panel above idx, in order
  const panel = panels.value[idx]!
  const panelEl: HTMLElement = panel.$el
  if (!panelEl.dataset.userHeight && panelEl.style.height) {
    // This height has been set by the collapse of some panel around it.
    // Replace the height before nextTick so that it doesn't try to take up the space
    panelEl.style.height = `${panelEl.scrollHeight}px`
  }
  const currentCollapsedHeight = panelEl.scrollHeight
  let spaceNeeded = 0
  if (panelEl.dataset.userHeight) {
    // TODO: Implement this
    // spaceNeeded = Number(panelEl.dataset.userHeight)
  } else {
    // spaceNeeded = Number(getComputedStyle(panelEl).minHeight.slice(0, -2)) - currentCollapsedHeight
    spaceNeeded = 124 // FIXME: This should not be hard-coded
  }
  await nextTick()
  console.log(`[expand-${idx}] after nextTick()`)
  const parent = panelEl.parentElement!
  let totalParentHeight = parent.scrollHeight
  if (initialMount) {
    if (parent.scrollHeight > parent.offsetHeight) {
      // Parent height has already increased with this new panel's collapsed height
      // We decrease it here so that it doesn't overflow the parent
      totalParentHeight -= currentCollapsedHeight
    }
  }

  // Because we may have transitions that start off after our nextTick above, we need to
  // exclude this panel's current height while computing total occupied height---it is dynamic.
  // Instead, we add the previously computed collapsed height
  const totalOccupiedHeight = getTotalOccupiedHeight(new Set([panel])) + currentCollapsedHeight
  const unoccupiedHeight = totalParentHeight - totalOccupiedHeight
  console.log(`[expand-${idx}]: totalParentHeight=${totalParentHeight} totalOccupiedHeight=${totalOccupiedHeight} unoccupiedHeight=${unoccupiedHeight}`)
  if (unoccupiedHeight > 0) {
    panelEl.style.height = `${unoccupiedHeight + currentCollapsedHeight}px`
    console.log(`[expand-${idx}]: completed`)
    return
  }

  const claimSpaceFromExpandedPanel = (panelIdx: number, panelEl: HTMLElement, remainingSpaceNeeded: number) => {
    const { height: nextPanelHeight } = getHeight(panelEl)
    // const nextPanelMinHeight = Number(getComputedStyle(panelEl).minHeight.slice(0, -2))
    const nextPanelMinHeight = 148 // FIXME: This should not be hard-coded
    if (nextPanelHeight > nextPanelMinHeight) {
      const diff = nextPanelHeight - nextPanelMinHeight
      const delta = Math.min(diff, remainingSpaceNeeded)
      const result = nextPanelHeight - delta
      panelEl.style.height = `${result}px`
      console.log(`[expand-${idx}]: Changing panel-${panelIdx} height. diff=${diff} delta=${delta} result=${result}`)
      remainingSpaceNeeded -= delta
      // Reset the user-defined height of this panel since we took away height from it
      panelEl.dataset.userHeight = ''
    }
    return remainingSpaceNeeded
  }

  let remainingSpaceNeeded = spaceNeeded - unoccupiedHeight
  let curIdx = idx
  while (remainingSpaceNeeded > 0) {
    const result = findNextExpandedPanel(curIdx)
    if (result === null) {
      // We don't have any more panels below us that is expanded and can give up space for us to occupy
      break
    }
    const [nextIdx, nextPanelEl] = result
    remainingSpaceNeeded = claimSpaceFromExpandedPanel(nextIdx, nextPanelEl, remainingSpaceNeeded)
    curIdx = nextIdx
  }

  while (remainingSpaceNeeded > 0) {
    const result = findPrevExpandedPanel(curIdx)
    if (result === null) {
      // We don't have any more panels above us that is expanded and can give up space for us to occupy
      break
    }
    const [prevIdx, prevPanelEl] = result
    remainingSpaceNeeded = claimSpaceFromExpandedPanel(prevIdx, prevPanelEl, remainingSpaceNeeded)
    curIdx = prevIdx
  }
  panelEl.style.height = `${currentCollapsedHeight + spaceNeeded}px`
  console.log(`[expand-${idx}]: completed`)
}

const computeResizeHandleDisabled = (prev: SubPanelProps | undefined, current: SubPanelProps, next: SubPanelProps | undefined) => {
  if (current.collapsed && next?.collapsed) {
    return true
  }
  return false
}

const currentlyMounting = ref<number>(0)
const onBeforeSubPanelMount = (entry: SubPanelProps, idx: number) => {
  currentlyMounting.value += 1
}

const onSubPanelMounted = async (entry: SubPanelProps, idx: number) => {
  await onCollapseOrExpand(!!entry.collapsed, entry, idx, true)
  await nextTick()
  currentlyMounting.value -= 1
}

const onBeforeSubPanelUnmount = (entry: SubPanelProps, idx: number) => {
  // Find the next panel and trigger onExpand on it
  let nextIdx: number | undefined
  const result = findNextExpandedPanel(idx)
  if (result) {
    ;[nextIdx] = result
  } else {
    const result = findPrevExpandedPanel(idx)
    if (!result) {
      return
    }
    ;[nextIdx] = result
  }
  if (nextIdx === undefined) {
    return
  }
  onExpand(props.children[nextIdx], nextIdx)
}

onMounted(async () => {
  await new Promise<void>(resolve => setTimeout(resolve, 300))
  const resizeObserver = new ResizeObserver(async entries => {
    let foundPanelContent = false
    for (const entry of entries) {
      foundPanelContent = entry.target === $panelContent.value
      if (foundPanelContent) {
        break
      }
    }
    if (!foundPanelContent) {
      return
    }
    const visiblePanelContentHeight = $panelContent.value.offsetHeight
    const totalOccupiedHeight = getTotalOccupiedHeight()
    console.log(`new height=${visiblePanelContentHeight} totalOccupiedHeight=${totalOccupiedHeight}`)
    const diff = visiblePanelContentHeight - totalOccupiedHeight

    if (diff > 0) {
      const result = findPrevExpandedPanel(panels.value.length)
      if (result) {
        const [, lastExpandedPanelEl] = result
        lastExpandedPanelEl.style.height = `${lastExpandedPanelEl.scrollHeight + diff}px`
      }
    } else if (diff < 0) {
      const absDiff = diff * -1
      const shrinkablePanels: typeof SubPanel[] = []
      const shrinkableChildren = props.children.filter((x, idx) => {
        if (x.collapsed) {
          return false
        }
        const panel = panels.value[idx]
        const panelEl: HTMLElement = panel.$el
        if (panelEl.offsetHeight <= 148) { // FIXME: hard-coded height
          return false
        }
        shrinkablePanels.push(panel)
        return true
      })
      const perPanelDiff = Math.floor(absDiff / shrinkableChildren.length) // diff is negative, so we multiply by -1 to make it positive

      let removedHeight = 0
      for (const panel of shrinkablePanels) {
        const panelEl: HTMLElement = panel.$el
        const shrinkableHeight = panelEl.offsetHeight - 148 // FIXME: hard-coded height
        const reduction = Math.min(perPanelDiff, shrinkableHeight)
        if (reduction > 0) {
          panelEl.style.height = `${panelEl.offsetHeight - reduction}px`
          removedHeight += reduction
        }
      }
      // It is possible that we have some remaining pixels to account for (due to Math.floor)
      let remaining = absDiff - removedHeight
      for (const panel of shrinkablePanels.reverse()) {
        if (remaining === 0) {
          break
        }
        const panelEl: HTMLElement = panel.$el
        const shrinkableHeight = panelEl.offsetHeight - 148 // FIXME: hard-coded height
        const reduction = Math.min(remaining, shrinkableHeight)
        if (reduction > 0) {
          panelEl.style.height = `${panelEl.offsetHeight - reduction}px`
          remaining -= reduction
        }
      }
    }
  })
  resizeObserver.observe($panelContent.value, { box: 'device-pixel-content-box' })
})
</script>

<template>
  <div class="panel-root is-flex is-flex-direction-column is-flex-grow-1" :class="{ transitions }" ref="$el">
    <div class="panel-title">Container</div>
    <div class="panel-content-wrapper">
      <div class="panel-content" :class="{'updating': currentlyMounting > 0, resizing, transitions }" ref="$panelContent" @transitionend="transitions = false">
        <SubPanelTemplate v-for="(entry, idx) in children" :key="idx">
          <template v-slot:content>
            <SubPanel ref="panels"
                :data-idx="idx"
                v-bind="entry"
                @update:collapsed="v => updateCollapsed(v, idx)"
                @collapsed="onCollapseOrExpand(true, entry, idx)"
                @expanded="onCollapseOrExpand(false, entry, idx)"
                @before-mount="onBeforeSubPanelMount(entry, idx)"
                @mounted="onSubPanelMounted(entry, idx)"
                @before-unmount="onBeforeSubPanelUnmount(entry, idx)"
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
    </div>
  </div>
</template>

<style lang="scss" scoped>
.panel-root {
  --panel-title-height: 24px;
  background-color: var(--panel-bg);

  &.updating {
    .sub-panel {
      transition: none;
    }
  }

  .transitions {
    .sub-panel {
      transition: height 0.1s ease-in-out;
    }
  }

  .sub-panel {
    // display: block !important;
    width: 100%;
  }

  .panel-title {
    padding: 0 8px;
    height: var(--panel-title-height, 24px);
    background-color: rgb(0, 64, 115);
    color: #fff;
  }

  .panel-content-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .panel-content {
    display: block !important;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    &.updating {
      overflow-y: hidden;
    }

    > .sub-panel + .resize-handle {
      // margin-top: calc(-1 * var(--resize-handle-height));
    }
    > .resize-handle + .sub-panel {
      // margin-top: calc(-1 * var(--resize-handle-height));
    }
  }

  .resize-handle {
    margin-top: calc(-1 * var(--resize-handle-height));
    &:hover {
      background-color: var(--resize-hover-color);
      transition: background-color 0.3s ease-in-out;
      transition-delay: 0.2s;
    }

    .disabled {
      cursor: default;
      user-select: none;
    }
  }

  &.resizing {
    cursor: ns-resize;
  }
}
</style>
