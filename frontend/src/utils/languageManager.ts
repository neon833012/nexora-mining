import { LanguageCode } from '../types/mining';

export const GT_LANGUAGE_MAP: Record<LanguageCode, string> = {
  en: 'en',
  hi: 'hi',
  ur: 'ur',
  es: 'es',
  ar: 'ar',
  zh: 'zh-CN',
  ru: 'ru',
  fr: 'fr',
  de: 'de',
  pt: 'pt',
  ja: 'ja',
  ko: 'ko',
  it: 'it',
  tr: 'tr',
  vi: 'vi',
  id: 'id',
  th: 'th',
  nl: 'nl',
  pl: 'pl',
  bn: 'bn',
  te: 'te',
  mr: 'mr',
  ta: 'ta',
  fa: 'fa',
  sw: 'sw'
};

export const getSavedLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem('neon_user_language') as LanguageCode;
    if (saved && GT_LANGUAGE_MAP[saved]) {
      return saved;
    }
    // Also check if googtrans cookie is set
    const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
    if (match && match[1]) {
      const gtTarget = match[1];
      for (const [code, gt] of Object.entries(GT_LANGUAGE_MAP)) {
        if (gt === gtTarget) return code as LanguageCode;
      }
    }
  } catch {
    // ignore
  }
  return 'en';
};

export const setGoogleTranslateCookie = (gtTarget: string) => {
  const hostname = window.location.hostname;

  if (!gtTarget || gtTarget === 'en') {
    const expire = 'expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    document.cookie = `googtrans=; ${expire} path=/;`;
    document.cookie = `googtrans=/en/en; ${expire} path=/;`;
    document.cookie = `googtrans=/auto/en; ${expire} path=/;`;
    if (hostname && !hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const parts = hostname.split('.');
      while (parts.length >= 2) {
        const d = '.' + parts.join('.');
        document.cookie = `googtrans=; ${expire} path=/; domain=${d};`;
        document.cookie = `googtrans=/en/en; ${expire} path=/; domain=${d};`;
        parts.shift();
      }
    }
    return;
  }

  // Set host-only cookies (standard across localhost and IPs)
  document.cookie = `googtrans=/en/${gtTarget}; path=/;`;
  document.cookie = `googtrans=/auto/${gtTarget}; path=/;`;

  // Also set for domain parts if not localhost/IP
  if (hostname && !hostname.includes('localhost') && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    const parts = hostname.split('.');
    while (parts.length >= 2) {
      const d = '.' + parts.join('.');
      document.cookie = `googtrans=/en/${gtTarget}; path=/; domain=${d};`;
      document.cookie = `googtrans=/auto/${gtTarget}; path=/; domain=${d};`;
      parts.shift();
    }
  }
};

export const retriggerGoogleTranslate = () => {
  try {
    const lang = getSavedLanguage();
    if (!lang || lang === 'en') return;
    const gtTarget = GT_LANGUAGE_MAP[lang] || lang;

    // Refresh cookies
    setGoogleTranslateCookie(gtTarget);

    // Trigger select element change if available
    const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (combo) {
      if (combo.value !== gtTarget) {
        combo.value = gtTarget;
      }
      combo.dispatchEvent(new Event('change', { bubbles: true }));
    }
  } catch (e) {
    console.error('Error re-triggering Google Translate:', e);
  }
};

export const applyLanguageChange = (langCode: LanguageCode, onComplete?: () => void) => {
  try {
    localStorage.setItem('neon_user_language', langCode);
  } catch {
    // ignore
  }

  const gtTarget = GT_LANGUAGE_MAP[langCode] || langCode;
  setGoogleTranslateCookie(gtTarget);

  // Check if Google Translate .goog-te-combo is already in DOM
  const combo = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (combo) {
    combo.value = gtTarget;
    combo.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Trigger smooth reload to guarantee 100% full-page deep translation across all DOM nodes
  setTimeout(() => {
    if (onComplete) onComplete();
    window.location.reload();
  }, 120);
};
