import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { getReadableTextColor, mixColors } from './contrast';
import { getPreset, DEFAULT_PRESET_ID } from './presets';
import { loadTheme, saveTheme } from './storage';
import {
  DEFAULT_THEME_STATE,
  type FontScale,
  type Theme,
  type ThemeContextValue,
  type ThemeState,
} from './types';

/**
 * Tema de fallback para uso sem provider.
 *
 * Componentes isolados (testes, Storybook) e telas renderizadas antes do
 * provider carregar não podem receber `theme === undefined` — isso
 * quebraria 95 testes de uma vez e seria um crash em runtime se algum
 * componente escapasse do provider.
 *
 * O fallback é o preset padrão com `onPrimary` calculado pela mesma
 * função de produção. Não é um "tema falso": é exatamente o Acolhimento.
 */
const FALLBACK_THEME: Theme = buildTheme(DEFAULT_THEME_STATE);

const noop = () => {};

const ThemeContext = createContext<ThemeContextValue>({
  theme: FALLBACK_THEME,
  fontScale: DEFAULT_THEME_STATE.fontScale,
  setPreset: noop,
  setCustom: noop,
  setFontScale: noop,
  resetTheme: noop,
  applyTheme: noop,
  ready: true,
});

/**
 * Monta o tema efetivo: preset + overrides personalizados + `onPrimary`
 * calculado. Nunca devolve `onPrimary` gravado à mão.
 */
function buildTheme(state: ThemeState): Theme {
  const preset = getPreset(state.presetId);
  const primary = state.custom?.primary ?? preset.colors.primary;
  const background = state.custom?.background ?? preset.colors.background;

  const surface = preset.colors.surface;

  return {
    ...preset,
    colors: {
      ...preset.colors,
      primary,
      background,
      onPrimary: getReadableTextColor(primary),
      // Derivadas: mantêm a coerência do preset sem exigir que cada tema
      // defina dezenas de tons. Ajustes de arquitetura do M2.
      surfaceInner: mixColors(surface, background, 0.45),
      primarySoft: mixColors(surface, primary, 0.12),
      primaryBorder: mixColors(surface, primary, 0.3),
    },
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ThemeState>(DEFAULT_THEME_STATE);
  const [ready, setReady] = useState(false);

  /**
   * D1: carrega o tema antes da primeira renderização visível.
   *
   * `SplashScreen.preventAutoHideAsync()` é chamado em escopo global no
   * `_layout.tsx` (doc SDK 58). Até `ready` ser true, o provider devolve
   * `null` — nenhum frame com tema errado aparece.
   */
  useEffect(() => {
    let mounted = true;
    loadTheme()
      .then((saved) => {
        if (!mounted) return;
        setState(saved);
      })
      .catch(() => {
        // loadTheme já trata erros; aqui só garantimos o hide
      })
      .finally(() => {
        if (!mounted) return;
        setReady(true);
        void SplashScreen.hideAsync();
      });

    return () => {
      mounted = false;
    };
  }, []);

  /** Persiste e atualiza o estado (o que o usuário vê muda na hora). */
  const update = useCallback((next: ThemeState) => {
    setState(next);
    void saveTheme(next);
  }, []);

  const setPreset = useCallback(
    (id: string) => {
      setState((atual) => {
        const prox: ThemeState = { ...atual, presetId: id };
        void saveTheme(prox);
        return prox;
      });
    },
    []
  );

  const setCustom = useCallback(
    (partial: NonNullable<ThemeState['custom']>) => {
      setState((atual) => {
        const prox: ThemeState = {
          ...atual,
          custom: { ...atual.custom, ...partial },
        };
        void saveTheme(prox);
        return prox;
      });
    },
    []
  );

  const setFontScale = useCallback((fontScale: FontScale) => {
    setState((atual) => {
      const prox: ThemeState = { ...atual, fontScale };
      void saveTheme(prox);
      return prox;
    });
  }, []);

  /**
   * Aplica várias mudanças de uma vez com UMA gravação.
   *
   * Sem isso, `aplicar` da tela de Aparência chamava setPreset → setCustom →
   * setFontScale em sequência; cada `saveTheme` assíncrono podia vencer com
   * um estado parcial (a fonte "large" era perdida). Preferir esta função
   * para mudanças atômicas do tema.
   */
  const applyTheme = useCallback((next: ThemeState) => {
    setState(next);
    void saveTheme(next);
  }, []);

  const resetTheme = useCallback(() => {
    update({
      presetId: DEFAULT_PRESET_ID,
      fontScale: DEFAULT_THEME_STATE.fontScale,
    });
  }, [update]);

  const theme = useMemo(() => buildTheme(state), [state]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      fontScale: state.fontScale,
      setPreset,
      setCustom,
      setFontScale,
      resetTheme,
      applyTheme,
      ready,
    }),
    [theme, state.fontScale, setPreset, setCustom, setFontScale, resetTheme, applyTheme, ready]
  );

  if (!ready) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeContextValue => useContext(ThemeContext);

/**
 * Override LOCAL de tema — usado pela prévia da tela `/appearance` (P6).
 *
 * Sem isso, tocar num preset na tela mudaria o app inteiro, violando
 * "prévia antes de aplicar" (DP3).
 */
export function ThemeScope({
  theme,
  fontScale,
  children,
}: {
  theme: Theme;
  fontScale: FontScale;
  children: React.ReactNode;
}) {
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      fontScale,
      // A prévia é somente leitura: setters alertam em dev se alguém
      // tentar mudar o tema global a partir dela (risco A2).
      setPreset: () => {
        if (__DEV__) {
          console.warn('[ThemeScope] prévia é somente leitura; use Aplicar tema');
        }
      },
      setCustom: () => {
        if (__DEV__) {
          console.warn('[ThemeScope] prévia é somente leitura; use Aplicar tema');
        }
      },
      setFontScale: () => {
        if (__DEV__) {
          console.warn('[ThemeScope] prévia é somente leitura; use Aplicar tema');
        }
      },
      resetTheme: () => {
        if (__DEV__) {
          console.warn('[ThemeScope] prévia é somente leitura; use Aplicar tema');
        }
      },
      applyTheme: () => {
        if (__DEV__) {
          console.warn('[ThemeScope] prévia é somente leitura; use Aplicar tema');
        }
      },
      ready: true,
    }),
    [theme, fontScale]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
