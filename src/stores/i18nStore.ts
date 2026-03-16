import { create } from 'zustand';

type Messages = Record<string, string>;

type I18nState = {
  locale: string;
  messages: Messages;
  loading: boolean;
  load: (locale?: string) => Promise<void>;
  t: (key: string, fallback?: string) => string;
};

const DEFAULT_LOCALE = 'pt-BR';

/**
 * i18n store — carrega traduções de arquivos JSON estáticos em /public/locales/.
 *
 * Vantagens dessa abordagem:
 *  - Não depende do backend (sem deploy backend para mudar textos).
 *  - Não precisa rebuild do frontend: basta editar o JSON em public/locales/.
 *  - Em Docker dev com bind mount, a mudança é instantânea.
 *  - Em produção (nginx), basta trocar o JSON no servidor estático.
 */
export const useI18nStore = create<I18nState>((set, get) => ({
  locale: DEFAULT_LOCALE,
  messages: {},
  loading: false,

  load: async (locale?: string) => {
    const targetLocale = locale ?? DEFAULT_LOCALE;
    set({ loading: true });
    try {
      // Busca o JSON estático servido diretamente pelo Vite/nginx
      const res = await fetch(`/locales/${targetLocale}.json`);
      if (res.ok) {
        const messages: Messages = await res.json();
        set({ locale: targetLocale, messages });
      } else {
        console.warn(`[i18n] Locale file not found: /locales/${targetLocale}.json`);
      }
    } catch (e) {
      console.warn('[i18n] Failed to load translations', e);
    } finally {
      set({ loading: false });
    }
  },

  t: (key: string, fallback?: string) => {
    return get().messages[key] ?? fallback ?? key;
  },
}));

export default useI18nStore;
