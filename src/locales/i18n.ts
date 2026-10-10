import en from './en.json';
import de from './de.json';
import he from './he.json';

export type SupportedLocale = 'en' | 'de' | 'he';
export type TranslationKey = keyof typeof en;

const translations: Record<SupportedLocale, Record<string, string>> = {
  en: en as Record<string, string>,
  de: de as Record<string, string>,
  he: he as Record<string, string>
};

const getInitialLocale = (): SupportedLocale => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('preferred_locale') as SupportedLocale;
      if (saved && (saved === 'en' || saved === 'de' || saved === 'he')) {
        return saved;
      }
    } catch (_) {
      // localStorage may be unavailable
    }
  }
  return 'en';
};

let currentLocale: SupportedLocale = getInitialLocale();
const listeners = new Set<(locale: SupportedLocale) => void>();

function applyDocumentAttributes(locale: SupportedLocale) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = locale === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    document.documentElement.classList.toggle('lang-he', locale === 'he');
    if (document.body) {
      document.body.classList.toggle('lang-he', locale === 'he');
    }
  }
}

// Apply on initial script evaluation
applyDocumentAttributes(currentLocale);

export function setLocale(locale: SupportedLocale) {
  if (translations[locale]) {
    currentLocale = locale;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('preferred_locale', locale);
      } catch (_) {}
    }
    applyDocumentAttributes(locale);
    listeners.forEach(fn => fn(locale));
  }
}

export function subscribeLocale(fn: (locale: SupportedLocale) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getLocale(): SupportedLocale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale] || translations.en;
  let text = dict[key] || (translations.en as Record<string, string>)[key] || key;
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), String(value));
    });
  }
  return text;
}

export { en, de, he };
export default en;
