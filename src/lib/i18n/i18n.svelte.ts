import { i18n as lingui } from "@lingui/core";
import type { Messages } from "@lingui/core";
import { createContext } from "svelte";
import { messages as enMessages } from "./locales/en.po";
import { messages as zhTwMessages } from "./locales/zh-TW.po";
import { resolveLocale, type SupportedLocale } from "./locale";

const storageKey = "sheet-compare-locale";

const catalogs: Record<SupportedLocale, Messages> = {
  en: enMessages,
  "zh-TW": zhTwMessages,
};

export type I18nContext = {
  readonly locale: SupportedLocale;
  activate(locale: SupportedLocale): Promise<void>;
  t(message: string, values?: Record<string, unknown>): string;
};

export const [getI18n, setI18n] = createContext<I18nContext>();

class I18nRuntime implements I18nContext {
  locale = $state<SupportedLocale>("en");
  #activation = 0;
  #unsubscribe = lingui.on("change", () => {
    this.#trigger += 1;
  });

  // Reactive trigger, when lingui change, update the value to fire translation
  #trigger = $state(0);

  constructor(locale = initialLocale()) {
    this.locale = locale;
  }

  async activate(locale: SupportedLocale) {
    const activation = ++this.#activation;

    if (activation !== this.#activation) return;

    lingui.loadAndActivate({ locale, messages: catalogs[locale] });
    this.locale = locale;
    localStorage?.setItem(storageKey, locale);
    if (document) {
      document.documentElement.lang = locale;
    }
  }

  t(message: string, values?: Record<string, unknown>) {
    this.#trigger;

    return lingui._(message, values);
  }

  destroy() {
    this.#unsubscribe();
  }
}

export function createI18n(locale = initialLocale()) {
  return new I18nRuntime(locale);
}

export function initialLocale(): SupportedLocale {
  return resolveLocale({
    savedLocale: localStorage?.getItem(storageKey) ?? null,
    languages: navigator.languages.length ? navigator.languages : [navigator.language],
  });
}
