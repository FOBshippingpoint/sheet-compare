<script>
  import { loadTableFile } from './lib/files.js'
  import { runDiff } from './lib/diff.js'
  import { diffRowsToView, hasChanges, summaryChips } from './lib/renderDiff.js'
  import {
    downloadBlob,
    diffRowsToCsv,
    exportStandaloneHtml,
    loadStandaloneState,
  } from './lib/export.js'
  import { loadSampleFiles, sampleOptions } from './lib/sample.js'
  import SourcePreview from './lib/SourcePreview.svelte'

  const defaultOptions = {
    show_unchanged: false,
    show_unchanged_columns: false,
    ignore_whitespace: false,
    ignore_case: false,
  }

  let left = $state(null)
  let right = $state(null)
  let options = $state({ ...defaultOptions })
  let result = $state(null)
  let error = $state('')
  let busy = $state('')
  let dragging = $state(null)
  let exportingHtml = $state(false)
  let exportedHtml = $state(false)
  let selectedSampleId = $state('')
  let previewSplit = $state(50)
  let verticalSplit = $state(47)

  let leftInput = $state(null)
  let rightInput = $state(null)
  let compareLayout = $state(null)

  const ready = $derived(left && right)
  const diffView = $derived(result ? diffRowsToView(result.diffRows) : null)
  const chips = $derived(result ? summaryChips(result.summary) : [])
  const noChanges = $derived(result && !hasChanges(result.summary))
  const hasUnsavedFiles = $derived(ready && !exportedHtml && !selectedSampleId)

  $effect(() => {
    const state = loadStandaloneState()

    if (state) {
      void loadEmbeddedState(state)
    }
  })

  async function loadEmbeddedState(state) {
    try {
      busy = 'Loading embedded files'
      options = state.options
      left = await state.left
      right = await state.right
      exportedHtml = true
      result = runDiff(left, right, options)
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      busy = ''
    }
  }

  async function chooseFile(side, file) {
    try {
      error = ''
      busy = `Loading ${side} file`

      const loaded = await loadTableFile(file)
      const selected = { file: loaded, sheetName: loaded.sheets[0].name }

      if (side === 'left') left = selected
      else right = selected

      selectedSampleId = ''
      exportedHtml = false
      runWhenReady()
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      busy = ''
    }
  }

  function chooseInputFile(side, event) {
    const file = event.currentTarget.files[0]

    if (file) void chooseFile(side, file)
  }

  function dropFile(side, event) {
    event.preventDefault()
    dragging = null

    const file = event.dataTransfer.files[0]

    if (file) void chooseFile(side, file)
  }

  function setSheet(side, event) {
    if (side === 'left') left = { ...left, sheetName: event.currentTarget.value }
    else right = { ...right, sheetName: event.currentTarget.value }

    runWhenReady()
  }

  function setOption(name, event) {
    options = { ...options, [name]: event.currentTarget.checked }
    runWhenReady()
  }

  function runWhenReady() {
    if (!ready) {
      result = null
      return
    }

    try {
      busy = 'Diffing'
      result = runDiff(left, right, options)
    } catch (reason) {
      result = null
      error = messageFor(reason)
    } finally {
      busy = ''
    }
  }

  function exportCsv() {
    if (!result) return

    downloadBlob('table-compare-diff.csv', diffRowsToCsv(result.diffRows), 'text/csv;charset=utf-8')
  }

  function downloadSource(selected) {
    downloadBlob(selected.file.name, selected.file.source, selected.file.source.type)
  }

  async function loadSample(event) {
    const id = event.currentTarget.value

    if (!id) return

    try {
      error = ''
      busy = 'Loading sample'
      selectedSampleId = id

      const sample = await loadSampleFiles(id)
      left = sample.left
      right = sample.right
      exportedHtml = false
      result = runDiff(left, right, options)
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      busy = ''
    }
  }

  async function exportHtml() {
    if (!left || !right) return

    try {
      exportingHtml = true

      const html = await exportStandaloneHtml({ left, right, options })
      downloadBlob('table-compare.html', html, 'text/html;charset=utf-8')
      exportedHtml = true
    } catch (reason) {
      error = messageFor(reason)
    } finally {
      exportingHtml = false
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
      !window.confirm('Discard current files? Export HTML first if you want to keep this comparison.')
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
    busy = ''
    dragging = null
    exportedHtml = false
    selectedSampleId = ''
    options = { ...defaultOptions }
    previewSplit = 50
    verticalSplit = 47
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

</script>

<svelte:window onbeforeunload={warnBeforeUnload} />

<svelte:head>
  <title>Sheet Compare</title>
</svelte:head>

<main>
  <header class="topbar">
    <h1><a href="/" onclick={openChooseFiles}>Sheet Compare</a></h1>
    <nav aria-label="Top actions">
      <label class="sample-picker">
        Sample
        <select bind:value={selectedSampleId} onchange={loadSample}>
          <option value="">Load sample...</option>
          {#each sampleOptions as sample (sample.id)}
            <option value={sample.id}>{sample.label}</option>
          {/each}
        </select>
      </label>
      {#if ready}
        <button type="button" onclick={exportCsv} disabled={!result}>Export CSV</button>
        <button type="button" class="primary export-html" onclick={exportHtml} disabled={exportingHtml}>
          {exportingHtml ? 'Exporting...' : 'Export HTML'}
        </button>
      {/if}
    </nav>
  </header>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  {#if busy}
    <p class="status" aria-live="polite">{busy}</p>
  {/if}

  {#if !ready}
    <section class="upload" aria-label="Choose files">
      <section
        class:dragging={dragging === 'left'}
        aria-labelledby="left-title"
        ondragover={(event) => {
          event.preventDefault()
          dragging = 'left'
        }}
        ondragleave={() => (dragging = null)}
        ondrop={(event) => dropFile('left', event)}
      >
        <h2 id="left-title">Left</h2>
        {#if left}
          <p class="loaded-file">{left.file.name} ({Math.ceil(left.file.size / 1024)} KB)</p>
        {:else}
          <p>CSV or XLSX</p>
        {/if}
        <button type="button" onclick={() => leftInput.click()}>Browse Files</button>
        <input
          bind:this={leftInput}
          aria-label="Left file"
          type="file"
          accept=".csv,.xlsx"
          onchange={(event) => chooseInputFile('left', event)}
        />
      </section>

      <p class="versus">vs.</p>

      <section
        class:dragging={dragging === 'right'}
        aria-labelledby="right-title"
        ondragover={(event) => {
          event.preventDefault()
          dragging = 'right'
        }}
        ondragleave={() => (dragging = null)}
        ondrop={(event) => dropFile('right', event)}
      >
        <h2 id="right-title">Right</h2>
        {#if right}
          <p class="loaded-file">{right.file.name} ({Math.ceil(right.file.size / 1024)} KB)</p>
        {:else}
          <p>CSV or XLSX</p>
        {/if}
        <button type="button" onclick={() => rightInput.click()}>Browse Files</button>
        <input
          bind:this={rightInput}
          aria-label="Right file"
          type="file"
          accept=".csv,.xlsx"
          onchange={(event) => chooseInputFile('right', event)}
        />
      </section>
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

      {#if result && diffView}
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

        <section class="diff" aria-label="Diff table">
          {#if noChanges}
            <p class="no-changes">No changes found</p>
          {:else}
            <table>
              <thead>
                <tr>
                  {#each diffView.headers as cell, index (index)}
                    <th>{cell}</th>
                  {/each}
                </tr>
              </thead>
              <tbody>
                {#each diffView.rows as row, rowIndex (rowIndex)}
                  <tr class={row.kind}>
                    {#each row.cells as cell, cellIndex (cellIndex)}
                      <td class={cell.kind}>
                        {#if cell.left !== undefined}
                          <span class="left-value">{cell.left}</span>
                          <span class="separator">{cell.separator}</span>
                          <span class="right-value">{cell.right}</span>
                        {:else}
                          {cell.value}
                        {/if}
                      </td>
                    {/each}
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </section>
      {/if}
    </section>
  {/if}

</main>
