<script>
  import FrozenTable from './FrozenTable.svelte'
  import { sheetRowsToTable } from './tableModel.js'

  let { rows } = $props()
  let frozenRows = $state(1)
  let frozenCols = $state(1)

  const table = $derived(sheetRowsToTable(rows))
</script>

<FrozenTable ariaLabel="Sheet preview table" {table} bind:frozenRows bind:frozenCols />
