import koData from './ko.json';
import enData from './en.json';

type TranslationData = Record<string, string>;

export class I18n {
  private currentLang: 'ko' | 'en' = 'ko';
  private translations: Record<string, TranslationData> = {
    ko: koData,
    en: enData,
  };

  get language(): 'ko' | 'en' {
    return this.currentLang;
  }

  setLanguage(lang: 'ko' | 'en'): void {
    this.currentLang = lang;
  }

  t(key: string, params?: Record<string, string>): string {
    let text = this.translations[this.currentLang]?.[key]
      ?? this.translations['en']?.[key]
      ?? key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, v);
      }
    }

    return text;
  }
}
