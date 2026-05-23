<script lang="ts">
  import LoadingSpinner from './LoadingSpinner.svelte'
  import TablePreview from './TablePreview.svelte'
  import { getI18n } from './i18n/i18n.svelte'
  import type { SelectedTableFile } from './types'

  type Props = {
    title: string
    input: SelectedTableFile
    pending?: boolean
    loading?: string
    onchange: (event: Event) => void
    ondownload: () => void
    onsheet: (event: Event) => void
  }

  let { title, input, pending = false, loading = '', onchange, ondownload, onsheet }: Props = $props()
  let fileInput = $state<HTMLInputElement | null>(null)

  const titleId = $derived(`${title.toLowerCase()}-preview-title`)
  const i18n = getI18n()
  const t = i18n.t.bind(i18n)
  const fileSize = $derived(new Intl.NumberFormat(i18n.locale).format(Math.ceil(input.size / 1024)))
  const sheetLabel = $derived(t('Sheet'))
  const selectedSheet = $derived(
    t('{sheetLabel}: {sheetName}', { sheetLabel, sheetName: input.sheetName }),
  )
</script>

<section class="preview" aria-labelledby={titleId}>
  <header>
    <h2 id={titleId}>{title}</h2>
    <p title={input.name}>{input.name} ({fileSize} KB)</p>
    {#if input.sheets.length > 1}
      <label class="sheet">
        {sheetLabel}
        <select value={input.sheetName} onchange={onsheet}>
          {#each input.sheets as sheet (sheet.name)}
            <option value={sheet.name}>
              {sheet.name} ({sheet.rowCount} x {sheet.columnCount})
            </option>
          {/each}
        </select>
      </label>
    {:else}
      <p class="sheet" title={input.sheetName}>{selectedSheet}</p>
    {/if}
    <menu>
      <li>
        <button type="button" disabled={pending} aria-label={loading || t('Replace File')} onclick={() => fileInput?.click()}>
          {#if loading}
            <LoadingSpinner label={loading} />
          {:else}
            {t('Replace File')}
          {/if}
        </button>
      </li>
      <li><button type="button" onclick={ondownload}>{t('Download')}</button></li>
    </menu>
    <input
      bind:this={fileInput}
      aria-label={t('{title} replacement file', { title })}
      type="file"
      accept=".csv,.xlsx"
      disabled={pending}
      {onchange}
    />
  </header>

  <TablePreview rows={input.rows} />
</section>
