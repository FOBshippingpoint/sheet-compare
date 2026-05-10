<script>
  import { tick } from 'svelte'
  import { clamp, nearestOffsetIndex, offsetsFor } from './freezeMath.js'

  let {
    ariaLabel,
    table,
    frozenRows = $bindable(1),
    frozenCols = $bindable(0),
    adjustable = true,
  } = $props()

  let shell = $state(null)
  let scrollport = $state(null)
  let tableElement = $state(null)
  let rowOffsets = $state([0])
  let colOffsets = $state([0])
  let scrollLeft = $state(0)
  let scrollTop = $state(0)
  let handleVisible = $state(false)
  let handleFocused = $state(false)
  let dragging = $state(false)

  const rows = $derived([...table.headerRows, ...table.bodyRows])
  const maxRows = $derived(rows.length)
  const maxCols = $derived(rows[0]?.cells.length ?? 0)
  const visibleHandle = $derived(adjustable && (handleVisible || handleFocused || dragging))
  const handleX = $derived(colOffsets[clamp(0, frozenCols, colOffsets.length - 1)] ?? 0)
  const handleY = $derived(rowOffsets[clamp(0, frozenRows, rowOffsets.length - 1)] ?? 0)
  const handleLabel = $derived(`Frozen rows ${frozenRows}, frozen columns ${frozenCols}`)

  $effect(() => {
    table
    void measure()

    const observer = new ResizeObserver(() => void measure())

    if (tableElement) observer.observe(tableElement)
    if (scrollport) observer.observe(scrollport)

    return () => observer.disconnect()
  })

  async function measure() {
    await tick()

    const renderedRows = Array.from(tableElement?.rows ?? [])
    const firstRowCells = Array.from(renderedRows[0]?.children ?? [])

    rowOffsets = offsetsFor(renderedRows.map((row) => row.getBoundingClientRect().height))
    colOffsets = offsetsFor(firstRowCells.map((cell) => cell.getBoundingClientRect().width))
    frozenRows = clamp(0, frozenRows, renderedRows.length)
    frozenCols = clamp(0, frozenCols, firstRowCells.length)
  }

  function updateScroll() {
    scrollLeft = scrollport.scrollLeft
    scrollTop = scrollport.scrollTop
  }

  function updateHover(event) {
    if (dragging || !adjustable) return

    const point = pointerToScrollportPoint(event)
    handleVisible = Math.hypot(point.x - handleX, point.y - handleY) < 40
  }

  function startDrag(event) {
    dragging = true
    handleVisible = true
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  function drag(event) {
    if (!dragging) return

    const point = pointerToTablePoint(event)
    frozenRows = nearestOffsetIndex(rowOffsets, point.y)
    frozenCols = nearestOffsetIndex(colOffsets, point.x)
  }

  function endDrag(event) {
    if (!dragging) return

    dragging = false
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function changeFreeze(event) {
    if (event.key === 'ArrowUp') frozenRows = clamp(0, frozenRows - 1, maxRows)
    else if (event.key === 'ArrowDown') frozenRows = clamp(0, frozenRows + 1, maxRows)
    else if (event.key === 'ArrowLeft') frozenCols = clamp(0, frozenCols - 1, maxCols)
    else if (event.key === 'ArrowRight') frozenCols = clamp(0, frozenCols + 1, maxCols)
    else if (event.key === 'Home') {
      frozenRows = 0
      frozenCols = 0
    } else {
      return
    }

    handleVisible = true
    event.preventDefault()
  }

  function pointerToScrollportPoint(event) {
    const rect = scrollport.getBoundingClientRect()

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function pointerToTablePoint(event) {
    const point = pointerToScrollportPoint(event)

    return {
      x: point.x + scrollLeft,
      y: point.y + scrollTop,
    }
  }

  function cellStyle(rowIndex, cellIndex) {
    const rules = []

    if (rowIndex < frozenRows) rules.push(`top: ${rowOffsets[rowIndex] ?? 0}px`)
    if (cellIndex < frozenCols) rules.push(`left: ${colOffsets[cellIndex] ?? 0}px`)

    return rules.join('; ')
  }

  function cellClass(row, rowIndex, cell, cellIndex) {
    return {
      [row.kind]: row.kind,
      [cell.kind]: cell.kind,
      'frozen-row': rowIndex < frozenRows,
      'frozen-col': cellIndex < frozenCols,
      'frozen-corner': rowIndex < frozenRows && cellIndex < frozenCols,
      'freeze-border-bottom': frozenRows && rowIndex === frozenRows - 1,
      'freeze-border-right': frozenCols && cellIndex === frozenCols - 1,
    }
  }
</script>

<div class="frozen-table-shell" bind:this={shell}>
  <div
    class="frozen-scroll"
    role="region"
    aria-label={ariaLabel}
    bind:this={scrollport}
    onscroll={updateScroll}
    onpointermove={updateHover}
  >
    <table bind:this={tableElement}>
      <thead>
        {#each table.headerRows as row, rowIndex (row.id)}
          <tr class={row.kind}>
            {#each row.cells as cell, cellIndex (cell.id)}
              <th
                class={cellClass(row, rowIndex, cell, cellIndex)}
                style={cellStyle(rowIndex, cellIndex)}
                title={cell.title}
              >
                {cell.text}
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody>
        {#each table.bodyRows as row, bodyRowIndex (row.id)}
          {@const rowIndex = table.headerRows.length + bodyRowIndex}
          <tr class={row.kind}>
            {#each row.cells as cell, cellIndex (cell.id)}
              <td
                class={cellClass(row, rowIndex, cell, cellIndex)}
                style={cellStyle(rowIndex, cellIndex)}
                title={cell.title}
              >
                {#if cell.segments}
                  {#each cell.segments as segment, segmentIndex (segmentIndex)}
                    <span class={segment.kind}>{segment.text}</span>
                  {/each}
                {:else}
                  {cell.text}
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
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
      aria-label={`Adjust frozen rows and columns. ${handleLabel}`}
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
    min-height: 0;
    flex: 1;
    background: var(--surface-lowest);
    overflow: hidden;
  }

  .frozen-scroll {
    block-size: 100%;
    overflow: auto;
    background: var(--surface-lowest);
  }

  table {
    border-collapse: separate;
    border-spacing: 0;
    width: 100%;
    white-space: nowrap;
    font: 12px/16px var(--sans);
    font-variant-numeric: tabular-nums;
  }

  th,
  td {
    height: 24px;
    padding: 2px 8px;
    border-right: 1px solid var(--outline-variant);
    border-bottom: 1px solid var(--outline-variant);
    text-align: left;
    vertical-align: middle;
    background: var(--surface-lowest);
  }

  th {
    background: var(--surface-low);
    font-weight: 500;
  }

  .frozen-row,
  .frozen-col,
  .frozen-corner {
    position: sticky;
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
  .order-cell {
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
