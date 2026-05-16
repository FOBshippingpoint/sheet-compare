<script>
  import { onDestroy } from 'svelte'
  import { summaryChips } from './lib/renderDiff.js'
  import {
    downloadBlob,
    diffRowsToCsv,
    exportStandaloneHtml,
    loadStandaloneState,
  } from './lib/export.js'
  import { loadSampleFiles, sampleOptions } from './lib/sample.js'
  import SourcePreview from './lib/SourcePreview.svelte'
  import DropZone from './lib/DropZone.svelte'
  import FrozenTable from './lib/FrozenTable.svelte'
  import LoadingSpinner from './lib/LoadingSpinner.svelte'
  import { createTableWorkerClient } from './lib/workerClient.js'
  import { createDelayedLoader } from './lib/delayedLoader.svelte.js'
  import { columnWidth } from './lib/virtualTable.js'
  import { diffCell, diffColumnCount } from './lib/tableCells.js'

  const defaultOptions = {
    show_unchanged: false,
    show_unchanged_columns: false,
    ignore_whitespace: false,
    ignore_case: false,
    show_order: true,
  }

  const tableWorker = createTableWorkerClient()
  const leftFileLoader = createDelayedLoader()
  const rightFileLoader = createDelayedLoader()
  const sampleLoader = createDelayedLoader()
  const diffLoader = createDelayedLoader()
  const exportHtmlLoader = createDelayedLoader()

  let left = $state(null)
  let right = $state(null)
  let options = $state({ ...defaultOptions })
  let result = $state(null)
  let error = $state('')
  let exportingHtml = $state(false)
  let exportedHtml = $state(false)
  let selectedSampleId = $state('')
  let previewSplit = $state(50)
  let verticalSplit = $state(47)
  let diffFrozenRows = $state(2)
  let diffFrozenCols = $state(2)

  let compareLayout = $state(null)

  onDestroy(() => {
    tableWorker.destroy()
    resetLoaders()
  })

  const ready = $derived(left && right)
  const chips = $derived(result ? summaryChips(result.summary) : [])
  const noChanges = $derived(result && !result.summary.different)
  const hasUnsavedFiles = $derived(ready && !exportedHtml && !selectedSampleId)
  const diffRowCount = $derived(result?.diffRows.length ?? 0)
  const diffColumnCountValue = $derived(result ? diffColumnCount(result.diffRows) : 0)
  const diffColumnWidths = $derived(
    result
      ? Array.from({ length: diffColumnCountValue }, (_, index) =>
          columnWidth(result.diffRows, index, false),
        )
      : [],
  )

  $effect(() => {
    const state = loadStandaloneState()

    if (state) {
      void loadEmbeddedState(state)
    }
  })

  async function loadEmbeddedState(state) {
    const load = sampleLoader.start()
    let loaded = false

    try {
      options = { ...defaultOptions, ...state.options }
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

  async function chooseFile(side, file) {
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

  function chooseInputFile(side, event) {
    const file = event.currentTarget.files[0]

    if (file) void chooseFile(side, file)
  }

  function dropFile(side, event) {
    const file = event.dataTransfer.files[0]

    if (file) void chooseFile(side, file)
  }

  async function setSheet(side, event) {
    const current = side === 'left' ? left : right
    const loader = fileLoader(side)
    const load = loader.start()
    let response

    try {
      response = await tableWorker.parseFile(side, current.source, event.currentTarget.value)
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

  function setOption(name, event) {
    options = { ...options, [name]: event.currentTarget.checked }
    void runWhenReady()
  }

  async function runWhenReady() {
    if (!ready) {
      result = null
      return
    }

    const load = diffLoader.start()

    try {
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

    downloadBlob('table-compare-diff.csv', diffRowsToCsv(result.diffRows), 'text/csv;charset=utf-8')
  }

  function downloadSource(selected) {
    downloadBlob(selected.name, selected.source, selected.source.type)
  }

  async function loadSample(event) {
    const id = event.currentTarget.value

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

      const html = await exportStandaloneHtml({ left, right, options })
      downloadBlob('table-compare.html', html, 'text/html;charset=utf-8')
      exportedHtml = true
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      exportingHtml = false
      exportHtmlLoader.stop(load)
    }
  }

  function warnBeforeUnload(event) {
    if (!hasUnsavedFiles) return

    event.preventDefault()
    event.returnValue = ''
  }

  function openChooseFiles(event) {
    event.preventDefault()

    if (
      hasUnsavedFiles &&
      !window.confirm('Discard current files? Export first if you want to keep this comparison.')
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

  function startResize(kind, event) {
    event.currentTarget.setPointerCapture(event.pointerId)

    const rect = compareLayout.getBoundingClientRect()

    function move(pointerEvent) {
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

  function clamp(min, value, max) {
    return Math.min(max, Math.max(min, value))
  }

  function messageFor(reason) {
    return reason instanceof Error ? reason.message : String(reason)
  }

  function fileLoader(side) {
    return side === 'left' ? leftFileLoader : rightFileLoader
  }

  function resetLoaders() {
    leftFileLoader.destroy()
    rightFileLoader.destroy()
    sampleLoader.destroy()
    diffLoader.destroy()
    exportHtmlLoader.destroy()
  }

</script>

<svelte:window onbeforeunload={warnBeforeUnload} />

<svelte:head>
  <title>Sheet Compare</title>
</svelte:head>

<main>
  <header class="topbar">
    <div class="title-row">
      <h1><a href="/" onclick={openChooseFiles}>Sheet Compare</a></h1>
    </div>
    <nav aria-label="Top actions">
      <label class="sample-picker">
        Sample
        <select bind:value={selectedSampleId} disabled={sampleLoader.pending} onchange={loadSample}>
          <option value="">Load sample...</option>
          {#each sampleOptions as sample (sample.id)}
            <option value={sample.id}>{sample.label}</option>
          {/each}
        </select>
        {#if sampleLoader.visible}
          <LoadingSpinner label="Loading sample" />
        {/if}
      </label>
      {#if ready}
        <button type="button" onclick={exportCsv} disabled={!result}>Export CSV</button>
        <button type="button" class="primary export-html" onclick={exportHtml} disabled={exportingHtml}>
          {#if exportHtmlLoader.visible}
            <LoadingSpinner label="Exporting" />
          {:else}
            Export HTML
          {/if}
        </button>
      {/if}
    </nav>
  </header>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if !ready}
    <section class="upload" aria-label="Choose files">
      <DropZone
        title="Left Sheet File"
        description="CSV or XLSX"
        accept=".csv,.xlsx"
        file={left}
        pending={leftFileLoader.pending}
        loading={leftFileLoader.visible ? 'Loading' : ''}
        onchange={(event) => chooseInputFile('left', event)}
        ondrop={(event) => dropFile('left', event)}
      />
      <p class="versus">vs.</p>
      <DropZone
        title="Right Sheet File"
        description="CSV or XLSX"
        accept=".csv,.xlsx"
        file={right}
        pending={rightFileLoader.pending}
        loading={rightFileLoader.visible ? 'Loading' : ''}
        onchange={(event) => chooseInputFile('right', event)}
        ondrop={(event) => dropFile('right', event)}
      />
    </section>
  {:else}
    <section
      class="compare-layout"
      bind:this={compareLayout}
      style:--preview-split={`${previewSplit}%`}
      style:--vertical-split={`${verticalSplit}%`}
    >
      <section class="previews" aria-label="Source previews">
        <SourcePreview
          title="Left"
          input={left}
          pending={leftFileLoader.pending}
          loading={leftFileLoader.visible ? 'Loading' : ''}
          onchange={(event) => chooseInputFile('left', event)}
          ondownload={() => downloadSource(left)}
          onsheet={(event) => setSheet('left', event)}
        />
        <button
          type="button"
          class="split-handle split-handle-columns"
          aria-label="Resize source preview panes"
          onpointerdown={(event) => startResize('columns', event)}
        ></button>
        <SourcePreview
          title="Right"
          input={right}
          pending={rightFileLoader.pending}
          loading={rightFileLoader.visible ? 'Loading' : ''}
          onchange={(event) => chooseInputFile('right', event)}
          ondownload={() => downloadSource(right)}
          onsheet={(event) => setSheet('right', event)}
        />
      </section>

      <button
        type="button"
        class="split-handle split-handle-rows"
        aria-label="Resize source and diff panes"
        onpointerdown={(event) => startResize('rows', event)}
      ></button>

      {#if result}
        <section class="results-toolbar" aria-label="Compare results">
          <div class="summary-chips" aria-label="Diff summary">
            {#each chips as chip (chip.label)}
              <output class={chip.kind}>
                <b>{chip.marker}</b>
                {chip.count} {chip.label}
              </output>
            {/each}
          </div>

          <section class="options" aria-label="Compare options">
            <label>
              <input
                type="checkbox"
                checked={options.show_order}
                onchange={(event) => setOption('show_order', event)}
              />
              Show order
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.show_unchanged}
                onchange={(event) => setOption('show_unchanged', event)}
              />
              Show unchanged rows
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.show_unchanged_columns}
                onchange={(event) => setOption('show_unchanged_columns', event)}
              />
              Show unchanged columns
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.ignore_whitespace}
                onchange={(event) => setOption('ignore_whitespace', event)}
              />
              Ignore whitespace
            </label>
            <label>
              <input
                type="checkbox"
                checked={options.ignore_case}
                onchange={(event) => setOption('ignore_case', event)}
              />
              Ignore case
            </label>
          </section>
        </section>

      {/if}

      {#if result || diffLoader.visible}
        <section class="diff" aria-label="Diff table">
          {#if result}
            {#if noChanges}
              <p class="no-changes">No changes found</p>
            {:else}
              <FrozenTable
                ariaLabel="Diff data table"
                rowCount={diffRowCount}
                columnCount={diffColumnCountValue}
                columnWidths={diffColumnWidths}
                cellAt={(rowIndex, columnIndex) => diffCell(result.diffRows, rowIndex, columnIndex)}
                bind:frozenRows={diffFrozenRows}
                bind:frozenCols={diffFrozenCols}
              />
            {/if}
          {/if}

          {#if diffLoader.visible}
            <div class="diff-loading">
              <LoadingSpinner label="Diffing" />
            </div>
          {/if}
        </section>
      {/if}
    </section>
  {/if}

</main>
