<script>
  import FrozenTable from './FrozenTable.svelte'
  import { columnWidth } from './virtualTable.js'
  import { sourceCell, sourceColumnCount } from './tableCells.js'

  let { rows } = $props()
  let frozenRows = $state(1)
  let frozenCols = $state(1)

  const rowCount = $derived(rows.length + 1)
  const columnCount = $derived(sourceColumnCount(rows))
  const columnWidths = $derived(
    Array.from({ length: columnCount }, (_, index) => columnWidth(rows, index - 1, index === 0)),
  )
</script>

<FrozenTable
  ariaLabel="Sheet preview table"
  {rowCount}
  {columnCount}
  {columnWidths}
  cellAt={(rowIndex, columnIndex) => sourceCell(rows, rowIndex, columnIndex)}
  bind:frozenRows
  bind:frozenCols
/>
