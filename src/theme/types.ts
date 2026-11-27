import type { StatusBarStyle } from 'expo-status-bar';

/**
 * Escala de tamanho de fonte.
 *
 * É um item de **acessibilidade** (decisão DP3 do planner), não enfeite.
 * Os multiplicadores vivem em `font.ts`.
 */
export type FontScale = 'small' | 'default' | 'large';

/**
 * Cores controladas pelo tema.
 *
 * `tokens.ts` continua sendo a fonte das escalas (raios, espaçamentos,
 * sombras) e das cores de **status** (`success/warning/danger/info`), que
 * NÃO mudam com o tema — só esta lista é trocada.
 */
export interface ThemeColors {
  /** Fundo da tela. */
  background: string;
  /** Superfície de cards e modais. */
  surface: string;
  /** Cor primária (botões, ícones de destaque, links). */
  primary: string;
  /**
   * Texto sobre a primária.
   *
   * **Nunca gravado à mão**: é derivado por `getReadableTextColor(primary)`
   * no `ThemeProvider`, para nenhuma cor personalizada gerar botão ilegível.
   */
  onPrimary: string;
  /** Texto principal. */
  text: string;
  /** Texto secundário (metadados, legendas). */
  textSecondary: string;
  /**
   * Superfície secundária (tiles internos, fundo de inputs).
   * Derivada de `surface` + `background` no `buildTheme`.
   */
  surfaceInner: string;
  /**
   * Fundo suave da cor primária (chips, ícones, tiles).
   * Derivada de `primary` + `surface` no `buildTheme`.
   */
  primarySoft: string;
  /** Borda suave derivada da primária. */
  primaryBorder: string;
  /** Estilo dos ícones da StatusBar. Com 4 presets claros, sempre `'dark'`. */
  statusBar: StatusBarStyle;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

/**
 * Cores de um preset **antes** da resolução.
 *
 * `onPrimary` não aparece aqui: é calculado no `ThemeProvider` a partir da
 * primária. Assim uma cor personalizada nunca fica com texto ilegível.
 */
export type PresetColors = Omit<
  ThemeColors,
  'onPrimary' | 'surfaceInner' | 'primarySoft' | 'primaryBorder'
>;

export interface Preset {
  id: string;
  name: string;
  colors: PresetColors;
}

/**
 * Estado persistido do tema.
 *
 * Guardado em AsyncStorage sob `@psi_app_theme_v1` (decisão D1).
 */
export interface ThemeState {
  presetId: string;
  custom?: {
    /** Cor primária escolhida pelo usuário (P8). */
    primary?: string;
    /** Cor de fundo — restrita a tons claros suaves (DP2 / R14). */
    background?: string;
  };
  fontScale: FontScale;
}

/** Valor exposto por `useTheme()`. */
export interface ThemeContextValue {
  /** Tema ativo (já com `onPrimary` calculado). */
  theme: Theme;
  fontScale: FontScale;
  /** Troca para um preset pelo id. */
  setPreset: (id: string) => void;
  /** Ajusta cores personalizadas sobre o preset atual. */
  setCustom: (partial: NonNullable<ThemeState['custom']>) => void;
  /** Define a escala de fonte. */
  setFontScale: (scale: FontScale) => void;
  /** Volta a Acolhimento + fonte Padrão (P9). */
  resetTheme: () => void;
  /** `false` até o AsyncStorage terminar de carregar (D1 / A1). */
  ready: boolean;
}

/** Estado padrão, usado até a persistência carregar. */
export const DEFAULT_THEME_STATE: ThemeState = {
  presetId: 'acolhimento',
  fontScale: 'default',
};
