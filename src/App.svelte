<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { summaryChips } from './lib/renderDiff'
  import {
    downloadBlob,
    diffRowsToCsv,
    exportStandaloneHtml,
    loadStandaloneState,
  } from './lib/export'
  import { loadSampleFiles, sampleOptions } from './lib/sample'
  import SourcePreview from './lib/SourcePreview.svelte'
  import DropZone from './lib/DropZone.svelte'
  import FrozenTable from './lib/FrozenTable.svelte'
  import LanguageDropdown from './lib/LanguageDropdown.svelte'
  import LoadingSpinner from './lib/LoadingSpinner.svelte'
  import { createTableWorkerClient } from './lib/workerClient'
  import { createDelayedLoader } from './lib/delayedLoader.svelte'
  import { createI18n, setI18n } from './lib/i18n/i18n.svelte'
  import { columnWidth } from './lib/virtualTable'
  import { diffCell, diffColumnCount } from './lib/tableCells'
  import type { LoadedStandaloneState } from './lib/export'
  import type { CompareOptions, DiffResult, SelectedTableFile, SheetSide, SummaryChipLabel } from './lib/types'
  import type { SampleId } from './lib/sample'

  const defaultOptions = {
    show_unchanged: false,
    show_unchanged_columns: false,
    ignore_whitespace: false,
    ignore_case: false,
    show_order: true,
  } satisfies CompareOptions

  type CompareOptionName = keyof CompareOptions
  type ResizeKind = 'columns' | 'rows'

  const tableWorker = createTableWorkerClient()
  const leftFileLoader = createDelayedLoader()
  const rightFileLoader = createDelayedLoader()
  const sampleLoader = createDelayedLoader()
  const diffLoader = createDelayedLoader()
  const exportHtmlLoader = createDelayedLoader()
  const embeddedState = loadStandaloneState()
  const logoHref = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')?.href ?? '/favicon.svg'

  let left = $state<SelectedTableFile | null>(null)
  let right = $state<SelectedTableFile | null>(null)
  let options = $state<CompareOptions>({ ...defaultOptions })
  let result = $state<DiffResult | null>(null)
  let error = $state('')
  let exportingHtml = $state(false)
  let exportedHtml = $state(false)
  let selectedSampleId = $state('')
  let i18nReady = $state(false)
  let previewSplit = $state(50)
  let verticalSplit = $state(47)
  let diffFrozenRows = $state(2)
  let diffFrozenCols = $state(2)

  let compareLayout = $state<HTMLElement | null>(null)

  const i18n = createI18n(embeddedState?.locale)
  const t = i18n.t.bind(i18n)
  setI18n(i18n)
  void i18n.activate(i18n.locale).then(() => {
    i18nReady = true
  }).catch((reason) => {
    error = messageFor(reason)
  })

  onDestroy(() => {
    i18n.destroy()
    tableWorker.destroy()
    resetLoaders()
  })

  const ready = $derived(Boolean(left && right))
  const selectedFiles = $derived(left && right ? { left, right } : null)
  const chips = $derived(result ? summaryChips(result.summary) : [])
  const noChanges = $derived(result && !result.summary.different)
  const hasUnsavedFiles = $derived(ready && !exportedHtml && !selectedSampleId)
  const diffRowCount = $derived(result?.diffRows.length ?? 0)
  const diffColumnCountValue = $derived(result ? diffColumnCount(result.diffRows) : 0)
  const diffColumnWidths = $derived(
    result
      ? Array.from({ length: diffColumnCount(result.diffRows) }, (_, index) =>
          columnWidth(result?.diffRows ?? [], index, false),
        )
      : [],
  )
  onMount(() => {
    if (embeddedState) void loadEmbeddedState(embeddedState)
  })

  async function loadEmbeddedState(state: LoadedStandaloneState) {
    const load = sampleLoader.start()
    let loaded = false

    try {
      options = { ...defaultOptions, ...state.options }
      if (state.locale) await i18n.activate(state.locale)
      left = await state.left
      right = await state.right
      exportedHtml = true
      loaded = true
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      sampleLoader.stop(load)
    }

    if (loaded) await runWhenReady()
  }

  async function chooseFile(side: SheetSide, file: File) {
    const loader = fileLoader(side)
    const load = loader.start()
    let response

    try {
      error = ''

      response = await tableWorker.parseFile(side, file)
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      loader.stop(load)
    }

    if (!response || response.stale) return

    if (side === 'left') left = response.data.file
    else right = response.data.file

    selectedSampleId = ''
    exportedHtml = false
    await runWhenReady()
  }

  function chooseInputFile(side: SheetSide, event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]

    if (file) void chooseFile(side, file)
  }

  function dropFile(side: SheetSide, event: DragEvent) {
    const file = event.dataTransfer?.files[0]

    if (file) void chooseFile(side, file)
  }

  async function setSheet(side: SheetSide, event: Event) {
    const current = side === 'left' ? left : right
    const select = event.currentTarget as HTMLSelectElement

    if (!current) return

    const loader = fileLoader(side)
    const load = loader.start()
    let response

    try {
      response = await tableWorker.parseFile(side, current.source, select.value)
    } catch (reason) {
      error = messageFor(reason)
      return
    } finally {
      loader.stop(load)
    }

    if (response.stale) return

    if (side === 'left') left = response.data.file
    else right = response.data.file

    await runWhenReady()
  }

  function setOption(name: CompareOptionName, event: Event) {
    const input = event.currentTarget as HTMLInputElement

    options = { ...options, [name]: input.checked }
    void runWhenReady()
  }

  async function runWhenReady() {
    if (!ready) {
      result = null
      return
    }

    const load = diffLoader.start()

    try {
      if (!left || !right) return

      const response = await tableWorker.compareRows(left.rows, right.rows, options)

      if (response.stale) return

      result = response.data.result
    } catch (reason) {
      result = null
      error = messageFor(reason)
    } finally {
      diffLoader.stop(load)
    }
  }

  function exportCsv() {
    if (!result) return

    downloadBlob('sheet-compare-diff.csv', diffRowsToCsv(result.diffRows), 'text/csv;charset=utf-8')
  }

  function downloadSource(selected: SelectedTableFile | null) {
    if (!selected) return

    downloadBlob(selected.name, selected.source, selected.source.type)
  }

  async function loadSample(event: Event) {
    const select = event.currentTarget as HTMLSelectElement
    const id = select.value

    if (!id) return

    const load = sampleLoader.start()
    let sample

    try {
      error = ''
      selectedSampleId = id

      sample = await loadSampleFiles(id)
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      sampleLoader.stop(load)
    }

    if (!sample) return

    left = sample.left
    right = sample.right
    exportedHtml = false
    await runWhenReady()
  }

  async function exportHtml() {
    if (!left || !right) return

    const load = exportHtmlLoader.start()

    try {
      exportingHtml = true

      const html = await exportStandaloneHtml({
        left,
        right,
        options,
        locale: i18n.locale,
      })
      downloadBlob('sheet-compare.html', html, 'text/html;charset=utf-8')
      exportedHtml = true
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      exportingHtml = false
      exportHtmlLoader.stop(load)
    }
  }

  function warnBeforeUnload(event: BeforeUnloadEvent) {
    if (!hasUnsavedFiles) return

    event.preventDefault()
    event.returnValue = ''
  }

  function openChooseFiles(event: MouseEvent) {
    event.preventDefault()

    if (
      hasUnsavedFiles &&
      !window.confirm(t('Discard current work?'))
    ) {
      return
    }

    resetToChooseFiles()
  }

  function resetToChooseFiles() {
    left = null
    right = null
    result = null
    error = ''
    resetLoaders()
    exportedHtml = false
    selectedSampleId = ''
    options = { ...defaultOptions }
    previewSplit = 50
    verticalSplit = 47
    diffFrozenRows = 2
    diffFrozenCols = 2
  }

  function startResize(kind: ResizeKind, event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement

    handle.setPointerCapture(event.pointerId)

    if (!compareLayout) return

    const rect = compareLayout.getBoundingClientRect()

    function move(pointerEvent: PointerEvent) {
      if (kind === 'columns') {
        previewSplit = clamp(25, ((pointerEvent.clientX - rect.left) / rect.width) * 100, 75)
      } else {
        verticalSplit = clamp(25, ((pointerEvent.clientY - rect.top) / rect.height) * 100, 72)
      }
    }

    function stop() {
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', stop)
    }

    addEventListener('pointermove', move)
    addEventListener('pointerup', stop)
  }

  function clamp(min: number, value: number, max: number) {
    return Math.min(max, Math.max(min, value))
  }

  function messageFor(reason: unknown) {
    return reason instanceof Error ? reason.message : String(reason)
  }

  function fileLoader(side: SheetSide) {
    return side === 'left' ? leftFileLoader : rightFileLoader
  }

  function resetLoaders() {
    leftFileLoader.destroy()
    rightFileLoader.destroy()
    sampleLoader.destroy()
    diffLoader.destroy()
    exportHtmlLoader.destroy()
  }

  function sampleLabel(id: SampleId) {
    if (id === 'registration-xlsx') return t('Registration results XLSX')
    return t('Exam results CSV')
  }

  function summaryLabel(label: SummaryChipLabel) {
    const labelMap: Record<SummaryChipLabel, string> = {
      rowInserts: 'row inserts',
      rowDeletes: 'row deletes',
      rowUpdates: 'row updates',
      rowReorders: 'row reorders',
      columnInserts: 'column inserts',
      columnDeletes: 'column deletes',
      columnRenames: 'column renames',
      columnReorders: 'column reorders',
    };

    return t(labelMap[label]);
  }

  const countFormat = $derived(new Intl.NumberFormat(i18n.locale))

</script>

<svelte:window onbeforeunload={warnBeforeUnload} />

<svelte:head>
  <title>{i18nReady ? t('Sheet Compare') : 'Sheet Compare'}</title>
</svelte:head>

<main>
  {#if i18nReady}
  <header class="topbar">
    <div class="title-row">
      <img class="logo" src={logoHref} alt="" aria-hidden="true" />
      <h1><a href="/" onclick={openChooseFiles}>{t('Sheet Compare')}</a></h1>
    </div>
    <nav aria-label={t('Top actions')}>
      <LanguageDropdown />
      <label class="sample-picker">
        {t('Sample')}
        <select bind:value={selectedSampleId} disabled={sampleLoader.pending} onchange={loadSample}>
          <option value="">{t('Load sample...')}</option>
          {#each sampleOptions as sample (sample.id)}
            <option value={sample.id}>{sampleLabel(sample.id)}</option>
          {/each}
        </select>
        {#if sampleLoader.visible}
          <LoadingSpinner label={t('Loading sample')} />
        {/if}
      </label>
      {#if ready}
        <button type="button" onclick={exportCsv} disabled={!result}>{t('Export CSV')}</button>
        <button type="button" class="primary export-html" onclick={exportHtml} disabled={exportingHtml}>
          {#if exportHtmlLoader.visible}
            <LoadingSpinner label={t('Exporting')} />
          {:else}
            {t('Export HTML')}
          {/if}
        </button>
      {/if}
    </nav>
  </header>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if !ready}
    <section class="upload" aria-label={t('Choose files')}>
      <DropZone
        title={t('Left Sheet File')}
        description={t('CSV or XLSX')}
        accept=".csv,.xlsx"
        file={left}
        pending={leftFileLoader.pending}
        loading={leftFileLoader.visible ? t('Loading') : ''}
        onchange={(event) => chooseInputFile('left', event)}
        ondrop={(event) => dropFile('left', event)}
      />
      <p class="versus">{t('vs.')}</p>
      <DropZone
        title={t('Right Sheet File')}
        description={t('CSV or XLSX')}
        accept=".csv,.xlsx"
        file={right}
        pending={rightFileLoader.pending}
        loading={rightFileLoader.visible ? t('Loading') : ''}
        onchange={(event) => chooseInputFile('right', event)}
        ondrop={(event) => dropFile('right', event)}
      />
    </section>
  {:else if selectedFiles}
    <section
      class="compare-layout"
      bind:this={compareLayout}
      style:--preview-split={`${previewSplit}%`}
      style:--vertical-split={`${verticalSplit}%`}
    >
      <section class="previews" aria-label={t('Source previews')}>
        <SourcePreview
          title={t('Left')}
          input={selectedFiles.left}
          pending={leftFileLoader.pending}
          loading={leftFileLoader.visible ? t('Loading') : ''}
          onchange={(event) => chooseInputFile('left', event)}
          ondownload={() => downloadSource(selectedFiles.left)}
          onsheet={(event) => setSheet('left', event)}
        />
        <button
          type="button"
          class="split-handle split-handle-columns"
          aria-label={t('Resize source preview panes')}
          onpointerdown={(event) => startResize('columns', event)}
        ></button>
        <SourcePreview
          title={t('Right')}
          input={selectedFiles.right}
          pending={rightFileLoader.pending}
          loading={rightFileLoader.visible ? t('Loading') : ''}
          onchange={(event) => chooseInputFile('right', event)}
          ondownload={() => downloadSource(selectedFiles.right)}
          onsheet={(event) => setSheet('right', event)}
        />
      </section>

      <button
        type="button"
        class="split-handle split-handle-rows"
        aria-label={t('Resize source and diff panes')}
        onpointerdown={(event) => startResize('rows', event)}
      ></button>

      {#if result}
        <section class="results-toolbar" aria-label={t('Compare results')}>
          <div class="summary-chips" aria-label={t('Diff summary')}>
            {#each chips as chip (chip.labelKey)}
              <output class={chip.kind}>
                <b>{chip.marker}</b>
                {countFormat.format(chip.count)} {summaryLabel(chip.labelKey)}
              </output>
            {/each}
          </div>

          <section class="options" aria-label={t('Compare options')}>
            <label>
              <input
                type="checkbox"
                checked={options.show_order}
                onchange={(event) => setOption('show_order', event)}
              />
              {t('Show order')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.show_unchanged}
                onchange={(event) => setOption('show_unchanged', event)}
              />
              {t('Show unchanged rows')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.show_unchanged_columns}
                onchange={(event) => setOption('show_unchanged_columns', event)}
              />
              {t('Show unchanged columns')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.ignore_whitespace}
                onchange={(event) => setOption('ignore_whitespace', event)}
              />
              {t('Ignore whitespace')}
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.ignore_case}
                onchange={(event) => setOption('ignore_case', event)}
              />
              {t('Ignore case')}
            </label>
          </section>
        </section>

      {/if}

      {#if result || diffLoader.visible}
        <section class="diff" aria-label={t('Diff table')}>
          {#if result}
            {#if noChanges}
              <p class="no-changes">{t('No changes found')}</p>
            {:else}
              <FrozenTable
                ariaLabel={t('Diff data table')}
                rowCount={diffRowCount}
                columnCount={diffColumnCountValue}
                columnWidths={diffColumnWidths}
                cellAt={(rowIndex, columnIndex) => diffCell(result?.diffRows ?? [], rowIndex, columnIndex)}
                bind:frozenRows={diffFrozenRows}
                bind:frozenCols={diffFrozenCols}
              />
            {/if}
          {/if}

          {#if diffLoader.visible}
            <div class="diff-loading">
              <LoadingSpinner label={t('Diffing')} />
            </div>
          {/if}
        </section>
      {/if}
    </section>
  {/if}
  {/if}

</main>
