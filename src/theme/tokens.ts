/**
 * Tokens de design do PsiApp.
 *
 * A **estrutura** (raios, espaçamentos, sombras, hierarquia de um stat card)
 * segue o recipe do BoardUI — ver `stat-cards` e `theme` do registry
 * (https://www.boardui.com/r/stat-cards.json).
 *
 * As **cores de marca** são preservadas do projeto (teal `#0D9488`,
 * fundo `#F4FBF7`, texto `#133E2B`), conforme a regra de preservar a
 * identidade visual do app.
 */

/** Raios — BoardUI: rounded-2xl 16 · rounded-2lg 12 · rounded-lg 8 · rounded-md 6 */
export const radius = {
  md: 6,
  sm: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  pill: 999,
} as const;

/** Espaçamentos — BoardUI usa escala de 4px (p-1.5 = 6, gap-2.5 = 10, gap-4 = 16) */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
} as const;

/**
 * Cores semânticas.
 *
 * `surface`   → fundo de página
 * `card`      → superfície primária (cards)
 * `cardInner` → superfície secundária (tiles internos, como o footer do stat card)
 * `tile`      → tile de ícone (BoardUI: `--color-stat-card-icon-background`)
 * `border`    → borda de card (BoardUI: `--color-border-button-default`)
 * `separator` → divisória (BoardUI: `--color-separator-border`)
 */
export const colors = {
  surface: '#F4FBF7',
  card: '#FFFFFF',
  cardInner: '#F8FAFC',
  tile: '#FFFFFF',
  border: '#E2E8F0',
  separator: '#E2E8F0',

  textPrimary: '#133E2B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',

  brand: '#0D9488',
  brandSoft: '#E6F4ED',
  brandBorder: '#D1EFE2',

  success: '#0D9488',
  successSoft: '#D1FAE5',
  successBorder: '#BBF7D0',

  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  warningBorder: '#FCD34D',

  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
  dangerBorder: '#FECACA',

  muted: '#94A3B8',
  mutedSoft: '#F3F4F6',
  mutedBorder: '#E5E7EB',

  info: '#2563EB',
  infoSoft: '#EFF6FF',
  infoBorder: '#DBEAFE',

  /* --- Tokens adicionados na etapa 3 (A2: tokenização) -------------------
   * Cobrem as cores que o app usava como hex literal e que ainda não
   * tinham lugar no design system: campos de formulário, texto sobre
   * fundo de marca, superfície neutra, overlay de modal e tom de conteúdo.
   * ------------------------------------------------------------------- */

  /** Fundo de campo de formulário */
  inputBg: '#F8FAFC',
  /** Borda de campo de formulário */
  inputBorder: '#CBD5E1',
  /** Texto digitado em campo de formulário */
  inputText: '#1E293B',
  /** Rótulo de campo de formulário */
  labelText: '#475569',
  /** Texto sobre fundo de marca (teal) */
  textOnBrand: '#FFFFFF',
  /** Texto sobre fundo destrutivo */
  textOnDanger: '#FFFFFF',
  /** Superfície neutra (botão secundário, separador interno) */
  mutedSurface: '#F1F5F9',
  /** Overlay escurecido atrás do modal */
  overlay: 'rgba(0,0,0,0.45)',
  /** Sombra neutra (modal) */
  shadowNeutral: '#000000',
  /** Corpo de texto dentro de card */
  contentMuted: '#374151',
  /** Divisória interna suave */
  dividerSoft: '#F1F5F9',
  /** Cinza de conteúdo secundário em card (ex.: "Sessão de Acompanhamento") */
  contentSecondary: '#6B7280',
} as const;

/** Sombra de card — BoardUI: `--shadow-card: 0 1px 1px 0 rgb(0 0 0 / 0.05)` */
export const shadowCard = {
  shadowColor: '#0F766E',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 1,
} as const;

/** Sombra de card com mais presença (cards de destaque) */
export const shadowRaised = {
  shadowColor: '#0F766E',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 10,
  elevation: 3,
} as const;

/** Tipografia — BoardUI usa utilidades compostas (ex.: `text-title-1-medium`) */
export const typography = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.6 },
  title1: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4 },
  title2: { fontSize: 19, fontWeight: '700' as const, letterSpacing: -0.2 },
  headline: { fontSize: 16, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '500' as const },
  bodyRegular: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
} as const;

/** Matiz de um stat card (BoardUI: `StatTone`) */
export type StatTone = 'brand' | 'success' | 'warning' | 'muted' | 'info';

export const toneColors: Record<
  StatTone,
  { bg: string; border: string; fg: string; soft: string }
> = {
  brand: { bg: colors.card, border: colors.brandBorder, fg: colors.brand, soft: colors.brandSoft },
  success: { bg: colors.card, border: colors.successBorder, fg: colors.success, soft: colors.successSoft },
  warning: { bg: colors.card, border: colors.warningBorder, fg: colors.warning, soft: colors.warningSoft },
  muted: { bg: colors.card, border: colors.mutedBorder, fg: colors.muted, soft: colors.mutedSoft },
  info: { bg: colors.card, border: colors.infoBorder, fg: colors.info, soft: colors.infoSoft },
};
