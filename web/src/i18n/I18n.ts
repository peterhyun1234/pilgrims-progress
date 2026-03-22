import koData from './ko.json';
import enData from './en.json';

type TranslationData = Record<string, string>;

export class I18n {
  private lang: 'ko' | 'en' = 'ko';
  private translations: Record<string, TranslationData> = {
    ko: koData as TranslationData,
    en: enData as TranslationData,
  };

  setLanguage(lang: 'ko' | 'en'): void {
    this.lang = lang;
  }

  t(key: string, fallback?: string): string {
    return this.translations[this.lang]?.[key] ?? fallback ?? key;
  }

  getLanguage(): 'ko' | 'en' {
    return this.lang;
  }
}
