import koData from './ko.json';
import enData from './en.json';

type TranslationData = Record<string, string>;
type InterpolationParams = Record<string, string | number>;

export class I18n {
  private lang: string = 'ko';
  private translations: Map<string, TranslationData> = new Map([
    ['ko', koData as TranslationData],
    ['en', enData as TranslationData],
  ]);

  setLanguage(lang: string): void {
    this.lang = lang;
  }

  /**
   * Translate a key.
   * @param key  Translation key, e.g. 'menu.newGame'
   * @param fallbackOrParams  Optional fallback string OR interpolation params object
   * @param params  Optional interpolation params (when fallback is also provided)
   *
   * Examples:
   *   t('menu.newGame')
   *   t('menu.newGame', 'New Game')          // with fallback
   *   t('save.slot', { slot: 1 })            // with params → "Save Slot 1"
   *   t('save.slot', 'Slot {slot}', { slot: 1 }) // both
   */
  t(
    key: string,
    fallbackOrParams?: string | InterpolationParams,
    params?: InterpolationParams,
  ): string {
    const raw = this.translations.get(this.lang)?.[key];

    let fallback: string | undefined;
    let interpolations: InterpolationParams | undefined;

    if (typeof fallbackOrParams === 'string') {
      fallback = fallbackOrParams;
      interpolations = params;
    } else if (fallbackOrParams !== undefined) {
      interpolations = fallbackOrParams;
    }

    const value = raw ?? fallback ?? key;
    return interpolations ? this.interpolate(value, interpolations) : value;
  }

  getLanguage(): string {
    return this.lang;
  }

  /** Dynamically register a new language (e.g. 'ja', 'zh'). */
  addLanguage(code: string, data: TranslationData): void {
    this.translations.set(code, data);
  }

  get supportedLanguages(): string[] {
    return Array.from(this.translations.keys());
  }

  private interpolate(str: string, params: InterpolationParams): string {
    return str.replace(/\{(\w+)\}/g, (_, key: string) =>
      params[key] !== undefined ? String(params[key]) : `{${key}}`,
    );
  }
}
