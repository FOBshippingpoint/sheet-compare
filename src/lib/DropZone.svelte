<script lang="ts">
  import LoadingSpinner from './LoadingSpinner.svelte'
  import type { SelectedTableFile } from './types'

  type Props = {
    title: string
    description: string
    accept: string
    file: SelectedTableFile | null
    pending?: boolean
    loading?: string
    onchange: (event: Event) => void
    ondrop: (event: DragEvent) => void
  }

  let { title, description, accept, file, pending = false, loading = '', onchange, ondrop }: Props = $props()
  let fileInput = $state<HTMLInputElement | null>(null)
  let dragging = $state(false)
</script>

<label
  class={{ dropzone: true, dragging }}
  ondragover={(event) => {
    if (pending) return
    event.preventDefault()
    dragging = true
  }}
  ondragleave={() => {
    dragging = false
  }}
  ondrop={(event) => {
    event.preventDefault()
    dragging = false
    if (pending) return
    ondrop(event)
  }}
>
  <h2>{title}</h2>
  {#if file}
    <p class="loaded-file">{file.name} ({Math.ceil(file.size / 1024)} KB)</p>
  {:else}
    <p>{description}</p>
  {/if}
  <button type="button" disabled={pending} aria-label={loading || 'Browse Files'} onclick={() => fileInput?.click()}>
    {#if loading}
      <LoadingSpinner label={loading} />
    {:else}
      Browse Files
    {/if}
  </button>
  <input
    bind:this={fileInput}
    aria-label={`${title} selector`}
    type="file"
    disabled={pending}
    {accept}
    {onchange}
  />
</label>
