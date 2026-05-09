<script>
  let { title, description, accept, file, onchange, ondrop } = $props()
  let fileInput = $state(null)
  let dragging = $state(false)
</script>

<label
  class={{ dropzone: true, dragging }}
  ondragover={(event) => {
    event.preventDefault()
    dragging = true
  }}
  ondragleave={() => {
    dragging = false
  }}
  ondrop={(event) => {
    event.preventDefault()
    dragging = false
    ondrop(event)
  }}
>
  <h2>{title}</h2>
  {#if file}
    <p class="loaded-file">{file.file.name} ({Math.ceil(file.file.size / 1024)} KB)</p>
  {:else}
    <p>{description}</p>
  {/if}
  <button type="button" onclick={() => fileInput.click()}>Browse Files</button>
  <input
    bind:this={fileInput}
    aria-label={`${title} file`}
    type="file"
    {accept}
    {onchange}
  />
</label>
