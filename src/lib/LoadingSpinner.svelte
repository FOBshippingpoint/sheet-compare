<script>
  let { label } = $props()
</script>

<span class="loading-spinner" role="status" aria-live="polite" aria-label={label}>
  <span class="spinner" aria-hidden="true"></span>
  <span>{label}</span>
</span>

<style>
  .loading-spinner {
    min-inline-size: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: inherit;
    white-space: nowrap;
  }

  .spinner {
    inline-size: 12px;
    block-size: 12px;
    flex: 0 0 auto;
    border: 2px solid var(--outline-variant);
    border-block-start-color: currentColor;
    border-radius: 999px;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(1turn);
    }
  }
</style>
