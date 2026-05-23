<script lang="ts">
  import { onDestroy } from 'svelte'
  import FrozenTable from '../../src/lib/FrozenTable.svelte'
  import { createI18n, setI18n } from '../../src/lib/i18n/i18n.svelte'
  import { defaultColumnWidth } from '../../src/lib/virtualTable'
  import type { TableCell } from '../../src/lib/types'

  const rowCount = 800
  const columnCount = 90
  let { initialFrozenRows = 1, initialFrozenCols = 1 }: { initialFrozenRows?: number; initialFrozenCols?: number } = $props()
  let frozenRows = $state(1)
  let frozenCols = $state(1)
  let i18nReady = $state(false)
  let initialized = false

  const i18n = createI18n('en')
  setI18n(i18n)
  void i18n.activate('en').then(() => {
    i18nReady = true
  })

  onDestroy(() => {
    i18n.destroy()
  })

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
  {#if i18nReady}
  <FrozenTable
    ariaLabel="Standalone frozen table"
    {rowCount}
    {columnCount}
    {columnWidths}
    {cellAt}
    bind:frozenRows
    bind:frozenCols
  />
  {/if}
</section>

<style>
  section {
    width: 720px;
    height: 360px;
    display: flex;
  }
</style>
