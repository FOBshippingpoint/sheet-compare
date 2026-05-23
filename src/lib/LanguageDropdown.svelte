<script lang="ts">
  import { getI18n } from './i18n/i18n.svelte'
  import { supportedLocales, type SupportedLocale } from './i18n/locale'

  const i18n = getI18n()
  const t = i18n.t.bind(i18n)
  const localeOptions = $derived(
    supportedLocales.map((locale) => ({
      locale,
      label: new Intl.DisplayNames([i18n.locale], { type: 'language', style: 'short' }).of(locale) ?? locale,
    })),
  )

  function setLocale(event: Event) {
    const select = event.currentTarget as HTMLSelectElement

    void i18n.activate(select.value as SupportedLocale)
  }
</script>

<label class="language-picker">
  {t('Language')}
  <select value={i18n.locale} onchange={setLocale}>
    {#each localeOptions as option (option.locale)}
      <option value={option.locale}>{option.label}</option>
    {/each}
  </select>
</label>
