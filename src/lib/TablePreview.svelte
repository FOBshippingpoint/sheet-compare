<script lang="ts">
  import FrozenTable from './FrozenTable.svelte'
  import { getI18n } from './i18n/i18n.svelte'
  import { columnWidth } from './virtualTable'
  import { sourceCell, sourceColumnCount } from './tableCells'
  import type { TableRows } from './types'

  let { rows }: { rows: TableRows } = $props()
  let frozenRows = $state(1)
  let frozenCols = $state(1)

  const rowCount = $derived(rows.length + 1)
  const columnCount = $derived(sourceColumnCount(rows))
  const columnWidths = $derived(
    Array.from({ length: columnCount }, (_, index) => columnWidth(rows, index - 1, index === 0)),
  )
  const i18n = getI18n()
  const t = i18n.t.bind(i18n)
</script>

<FrozenTable
  ariaLabel={t('Sheet preview table')}
  {rowCount}
  {columnCount}
  {columnWidths}
  cellAt={(rowIndex, columnIndex) => sourceCell(rows, rowIndex, columnIndex)}
  bind:frozenRows
  bind:frozenCols
/>
