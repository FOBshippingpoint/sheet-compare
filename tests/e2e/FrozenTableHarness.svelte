<script lang="ts">
  import FrozenTable from '../../src/lib/FrozenTable.svelte'
  import { defaultColumnWidth } from '../../src/lib/virtualTable'
  import type { TableCell } from '../../src/lib/types'

  const rowCount = 800
  const columnCount = 90
  let { initialFrozenRows = 1, initialFrozenCols = 1 }: { initialFrozenRows?: number; initialFrozenCols?: number } = $props()
  let frozenRows = $state(1)
  let frozenCols = $state(1)
  let initialized = false

  const columnWidths = Array.from({ length: columnCount }, (_, index) =>
    index === 0 ? 56 : defaultColumnWidth + 96,
  )

  $effect(() => {
    if (initialized) return

    frozenRows = initialFrozenRows
    frozenCols = initialFrozenCols
    initialized = true
  })

  function cellAt(rowIndex: number, columnIndex: number): TableCell {
    const header = rowIndex === 0
    const label = columnIndex === 0
    const text = header
      ? label
        ? '#'
        : `Very long header ${columnIndex} with enough text to expose scroll jitter`
      : label
        ? String(rowIndex)
        : `Row ${rowIndex} column ${columnIndex}`

    return {
      text,
      title: text,
      rowKind: header ? 'header-row' : 'body-row',
      kind: label ? 'label-cell' : header ? 'header-cell' : 'body-cell',
    }
  }
</script>

<section aria-label="Frozen table harness">
  <FrozenTable
    ariaLabel="Standalone frozen table"
    {rowCount}
    {columnCount}
    {columnWidths}
    {cellAt}
    bind:frozenRows
    bind:frozenCols
  />
</section>

<style>
  section {
    width: 720px;
    height: 360px;
    display: flex;
  }
</style>
