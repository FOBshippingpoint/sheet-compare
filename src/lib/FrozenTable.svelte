<script lang="ts">
  import { onDestroy } from 'svelte'
  import { clamp, nearestOffsetIndex } from './freezeMath'
  import { getI18n } from './i18n/i18n.svelte'
  import {
    columnMetrics,
    defaultColumnWidth,
    indexesForRange,
    rangeGuardColumns,
    rangeGuardRows,
    rangeNeedsUpdate,
    rowHeight,
    scrollIdleDelay,
    visibleRange,
  } from './virtualTable'
  import type { TableCell } from './types'
  import type { VisibleRange } from './virtualTable'

  type Props = {
    ariaLabel: string
    rowCount: number
    columnCount: number
    cellAt: (rowIndex: number, columnIndex: number) => TableCell
    columnWidths?: number[]
    frozenRows?: number
    frozenCols?: number
    adjustable?: boolean
  }

  let {
    ariaLabel,
    rowCount,
    columnCount,
    cellAt,
    columnWidths,
    frozenRows = $bindable(1),
    frozenCols = $bindable(0),
    adjustable = true,
  }: Props = $props()

  let scrollport = $state<HTMLDivElement | null>(null)
  let viewportWidth = $state(1)
  let viewportHeight = $state(1)
  let rangeScrollLeft = $state(0)
  let rangeScrollTop = $state(0)
  let handleVisible = $state(false)
  let handleFocused = $state(false)
  let dragging = $state(false)
  let scrollLeft = 0
  let scrollTop = 0
  let rangeFrame = 0
  let rangeIdleTimer = 0
  let pendingRangeLeft = 0
  let pendingRangeTop = 0

  const widths = $derived(
    Array.from({ length: columnCount }, (_, index) => columnWidths?.[index] ?? defaultColumnWidth),
  )
  const metrics = $derived(columnMetrics(widths))
  const rowOffsets = $derived(Array.from({ length: rowCount + 1 }, (_, index) => index * rowHeight))
  const rowRange = $derived(visibleRange(rangeScrollTop, viewportHeight, rowHeight, rowCount))
  const columnRange = $derived(
    columnRangeFor(rangeScrollLeft, viewportWidth, metrics.offsets, columnCount),
  )
  const visibleRows = $derived(indexesForRange(rowRange, frozenRows))
  const visibleColumns = $derived(indexesForRange(columnRange, frozenCols))
  const visibleHandle = $derived(adjustable && (handleVisible || handleFocused || dragging))
  const handleX = $derived(metrics.offsets[clamp(0, frozenCols, metrics.offsets.length - 1)] ?? 0)
  const handleY = $derived(rowOffsets[clamp(0, frozenRows, rowOffsets.length - 1)] ?? 0)
  const i18n = getI18n()
  const t = i18n.t.bind(i18n)
  const handleLabel = $derived(
    t('Frozen rows {frozenRows}, frozen columns {frozenCols}', { frozenRows, frozenCols }),
  )
  const adjustFrozenRowsAndColumns = $derived(
    t('Adjust frozen rows and columns. {handleLabel}', { handleLabel }),
  )

  onDestroy(() => {
    if (rangeFrame) cancelAnimationFrame(rangeFrame)
    if (rangeIdleTimer) clearTimeout(rangeIdleTimer)
  })

  $effect(() => {
    if (!scrollport) return

    const observer = new ResizeObserver(([entry]) => {
      viewportWidth = entry.contentRect.width
      viewportHeight = entry.contentRect.height
    })

    observer.observe(scrollport)

    return () => observer.disconnect()
  })

  function updateScroll(event: Event) {
    const target = event.currentTarget as HTMLDivElement

    scrollLeft = target.scrollLeft
    scrollTop = target.scrollTop
    queueRangeUpdate(target.scrollLeft, target.scrollTop, rangeUpdateNeeded(target.scrollLeft, target.scrollTop))
  }

  function queueRangeUpdate(left: number, top: number, immediate = true) {
    pendingRangeLeft = left
    pendingRangeTop = top

    if (!immediate) {
      if (rangeIdleTimer) clearTimeout(rangeIdleTimer)
      rangeIdleTimer = window.setTimeout(() => {
        rangeIdleTimer = 0
        scheduleRangeUpdate()
      }, scrollIdleDelay)
      return
    }

    if (rangeIdleTimer) {
      clearTimeout(rangeIdleTimer)
      rangeIdleTimer = 0
    }
    scheduleRangeUpdate()
  }

  function scheduleRangeUpdate() {
    if (rangeFrame) return

    rangeFrame = requestAnimationFrame(() => {
      rangeFrame = 0
      rangeScrollLeft = pendingRangeLeft
      rangeScrollTop = pendingRangeTop
    })
  }

  function rangeUpdateNeeded(left: number, top: number) {
    return (
      rangeNeedsUpdate(top, viewportHeight, rowRange, rowOffsets, rangeGuardRows) ||
      rangeNeedsUpdate(left, viewportWidth, columnRange, metrics.offsets, rangeGuardColumns)
    )
  }

  function updateHover(event: PointerEvent) {
    if (dragging || !adjustable) return

    const point = pointerToScrollportPoint(event)
    handleVisible = Math.hypot(point.x - handleX, point.y - handleY) < 40
  }

  function startDrag(event: PointerEvent) {
    dragging = true
    handleVisible = true
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function drag(event: PointerEvent) {
    if (!dragging) return

    const point = pointerToTablePoint(event)
    frozenRows = nearestOffsetIndex(rowOffsets, point.y)
    frozenCols = nearestOffsetIndex(metrics.offsets, point.x)
  }

  function endDrag(event: PointerEvent) {
    if (!dragging) return

    dragging = false
    ;(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId)
  }

  function changeFreeze(event: KeyboardEvent) {
    if (event.key === 'ArrowUp') frozenRows = clamp(0, frozenRows - 1, rowCount)
    else if (event.key === 'ArrowDown') frozenRows = clamp(0, frozenRows + 1, rowCount)
    else if (event.key === 'ArrowLeft') frozenCols = clamp(0, frozenCols - 1, columnCount)
    else if (event.key === 'ArrowRight') frozenCols = clamp(0, frozenCols + 1, columnCount)
    else if (event.key === 'Home') {
      frozenRows = 0
      frozenCols = 0
    } else {
      return
    }

    handleVisible = true
    event.preventDefault()
  }

  function pointerToScrollportPoint(event: PointerEvent) {
    if (!scrollport) return { x: 0, y: 0 }

    const rect = scrollport.getBoundingClientRect()

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function pointerToTablePoint(event: PointerEvent) {
    const point = pointerToScrollportPoint(event)

    return {
      x: point.x + scrollLeft,
      y: point.y + scrollTop,
    }
  }

  function rowStyle(rowIndex: number) {
    const top = rowOffsets[rowIndex]
    const position = rowIndex < frozenRows ? 'sticky' : 'absolute'

    return `
      position: ${position};
      top: ${top}px;
      width: ${metrics.totalWidth}px;
      height: ${rowHeight}px;
    `
  }

  function cellStyle(columnIndex: number) {
    const left = metrics.offsets[columnIndex]
    const frozenColumn = columnIndex < frozenCols
    const position = frozenColumn ? 'sticky' : 'absolute'
    const top = frozenColumn ? '' : 'top: 0;'

    return `
      position: ${position};
      left: ${left}px;
      ${top}
      width: ${widths[columnIndex]}px;
      height: ${rowHeight}px;
    `
  }

  function cellClass(cell: TableCell, rowIndex: number, columnIndex: number) {
    return {
      cell: true,
      ...(cell.rowKind ? { [cell.rowKind]: true } : {}),
      [cell.kind]: cell.kind,
      'frozen-row': rowIndex < frozenRows,
      'frozen-col': columnIndex < frozenCols,
      'frozen-corner': rowIndex < frozenRows && columnIndex < frozenCols,
      'freeze-border-bottom': frozenRows && rowIndex === frozenRows - 1,
      'freeze-border-right': frozenCols && columnIndex === frozenCols - 1,
    }
  }

  function columnRangeFor(
    offset: number,
    viewportSize: number,
    offsets: number[],
    count: number,
  ): VisibleRange {
    let start = 0
    let end = count

    while (start < count && offsets[start + 1] < offset) start++
    while (end > start && offsets[end - 1] > offset + viewportSize) end--

    return {
      start: clamp(0, start - 2, count),
      end: clamp(start, end + 2, count),
    }
  }
</script>

<div class="frozen-table-shell">
  <div
    class="frozen-scroll"
    role="table"
    aria-label={ariaLabel}
    bind:this={scrollport}
    onscroll={updateScroll}
    onpointermove={updateHover}
  >
    <div
      class="virtual-canvas"
      style:width={`${metrics.totalWidth}px`}
      style:height={`${rowCount * rowHeight}px`}
    >
      {#each visibleRows as rowIndex (rowIndex)}
        <div
          role="row"
          class={{ 'virtual-row': true, 'frozen-row-band': rowIndex < frozenRows }}
          style={rowStyle(rowIndex)}
        >
          {#each visibleColumns as columnIndex (columnIndex)}
            {@const cell = cellAt(rowIndex, columnIndex)}
            <div
              role="cell"
              data-row-index={rowIndex}
              data-column-index={columnIndex}
              class={cellClass(cell, rowIndex, columnIndex)}
              style={cellStyle(columnIndex)}
              title={cell.title}
            >
              {#if cell.segments}
                {#each cell.segments as segment, segmentIndex (segmentIndex)}
                  <span class={segment.kind}>{segment.text}</span>
                {/each}
              {:else}
                {cell.text}
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>

  {#if adjustable}
    <div class="freeze-overlay" aria-hidden="true">
      <div
        class={{ 'freeze-line': true, horizontal: true, visible: visibleHandle }}
        style:top={`${handleY}px`}
      ></div>
      <div
        class={{ 'freeze-line': true, vertical: true, visible: visibleHandle }}
        style:left={`${handleX}px`}
      ></div>
    </div>
    <button
      type="button"
      class={{ 'freeze-handle': true, visible: visibleHandle, dragging }}
      style:left={`${handleX}px`}
      style:top={`${handleY}px`}
      aria-label={adjustFrozenRowsAndColumns}
      onpointerdown={startDrag}
      onpointermove={drag}
      onpointerup={endDrag}
      onpointercancel={endDrag}
      onkeydown={changeFreeze}
      onfocus={() => {
        handleFocused = true
      }}
      onblur={() => {
        handleFocused = false
      }}
    ></button>
  {/if}
</div>

<style>
  .frozen-table-shell {
    position: relative;
    inline-size: 100%;
    max-inline-size: 100%;
    min-inline-size: 0;
    min-height: 0;
    flex: 1;
    background: var(--surface-lowest);
    overflow: hidden;
  }

  .frozen-scroll {
    inline-size: 100%;
    max-inline-size: 100%;
    min-inline-size: 0;
    block-size: 100%;
    overflow: auto;
    background: var(--surface-lowest);
    font: 12px/16px var(--sans);
    font-variant-numeric: tabular-nums;
  }

  .virtual-canvas {
    position: relative;
    min-inline-size: 100%;
    min-block-size: 100%;
  }

  .virtual-row {
    left: 0;
  }

  .frozen-row-band {
    z-index: 5;
  }

  .cell {
    display: inline-block;
    box-sizing: border-box;
    vertical-align: top;
    contain: layout paint style;
    padding: 3px 8px;
    border-right: 1px solid var(--outline-variant);
    border-bottom: 1px solid var(--outline-variant);
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--surface-lowest);
  }

  .header-row,
  .label-cell {
    background: var(--surface-low);
    font-weight: 500;
  }

  .frozen-col {
    z-index: 4;
  }

  .frozen-row {
    z-index: 5;
  }

  .frozen-corner {
    z-index: 6;
  }

  .freeze-border-bottom {
    border-bottom-color: var(--outline);
    box-shadow: inset 0 -1px 0 0 var(--outline);
  }

  .freeze-border-right {
    border-right-color: var(--outline);
    box-shadow: inset -1px 0 0 0 var(--outline);
  }

  .freeze-border-bottom.freeze-border-right {
    border-bottom-color: var(--outline);
    border-right-color: var(--outline);
    box-shadow: inset -1px -1px 0 0 var(--outline);
  }

  .insert {
    background: var(--add-bg);
  }

  .delete {
    background: var(--del-bg);
  }

  .update {
    background: var(--mod-bg);
  }

  .schema,
  .omitted,
  .reorder {
    background: var(--surface-low);
    color: var(--on-surface-variant);
  }

  .action-cell,
  .order-cell,
  .label-cell {
    text-align: center;
    font-family: var(--mono);
    font-weight: 600;
  }

  .left {
    color: var(--del-text);
    text-decoration: line-through;
  }

  .separator {
    margin: 0 4px;
    color: var(--mod-text);
    font-family: var(--mono);
    font-weight: 600;
  }

  .right {
    color: var(--add-text);
  }

  .freeze-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 20;
  }

  .freeze-line {
    position: absolute;
    background: var(--primary);
    opacity: 0;
    transition: opacity 0.12s ease;
  }

  .freeze-line.visible {
    opacity: 1;
  }

  .freeze-line.horizontal {
    left: 0;
    right: 0;
    height: 2px;
    transform: translateY(-50%);
  }

  .freeze-line.vertical {
    top: 0;
    bottom: 0;
    width: 2px;
    transform: translateX(-50%);
  }

  .freeze-handle {
    position: absolute;
    inline-size: 24px;
    block-size: 24px;
    min-inline-size: 24px;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    opacity: 0;
    transform: translate(-50%, -50%);
    transition:
      opacity 0.12s ease,
      transform 0.12s ease;
    cursor: grab;
    touch-action: none;
    z-index: 21;
  }

  .freeze-handle::before {
    content: "";
    display: block;
    inline-size: 12px;
    block-size: 12px;
    margin: 6px;
    border-radius: 999px;
    background: var(--primary);
  }

  .freeze-handle.visible,
  .freeze-handle:focus-visible {
    opacity: 1;
  }

  .freeze-handle.dragging {
    cursor: grabbing;
    transform: translate(-50%, -50%) scale(1.15);
  }
</style>
