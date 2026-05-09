<script>
  import { rowsForSelectedSheet } from './files.js'
  import TablePreview from './TablePreview.svelte'

  let { title, input, onchange, ondownload, onsheet } = $props()
  let fileInput = $state(null)

  const titleId = $derived(`${title.toLowerCase()}-preview-title`)
  const rows = $derived(rowsForSelectedSheet(input).slice(0, 50))
</script>

<article class="preview" aria-labelledby={titleId}>
  <header>
    <h2 id={titleId}>{title}</h2>
    <p>{input.file.name} ({Math.ceil(input.file.size / 1024)} KB)</p>
    {#if input.file.sheets.length > 1}
      <label class="sheet">
        Sheet
        <select value={input.sheetName} onchange={onsheet}>
          {#each input.file.sheets as sheet (sheet.name)}
            <option value={sheet.name}>
              {sheet.name} ({sheet.rowCount} x {sheet.columnCount})
            </option>
          {/each}
        </select>
      </label>
    {:else}
      <p class="sheet">Sheet: {input.sheetName}</p>
    {/if}
    <menu>
      <li><button type="button" onclick={() => fileInput.click()}>Replace File</button></li>
      <li><button type="button" onclick={ondownload}>Download</button></li>
    </menu>
    <input
      bind:this={fileInput}
      aria-label={`${title} replacement file`}
      type="file"
      accept=".csv,.xlsx"
      {onchange}
    />
  </header>

  <TablePreview {rows} />
</article>
