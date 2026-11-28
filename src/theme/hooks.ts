import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './context';
import { scaled } from './font';

/**
 * Overrides de COR para estilos de rota.
 *
 * ## Por que existe
 *
 * `validate:layout`, `validate:touch` e `validate:contrast` leem os objetos
 * literais de `StyleSheet.create` — se as cores virassem funções
 * (`createStyles(theme)`), os 3 gates quebrariam (risco A5 da arquitetura).
 *
 * Então o layout continua ESTÁTICO no `StyleSheet.create` da rota e as
 * cores vêm daqui, aplicadas no array de `style`:
 *
 * ```tsx
 * <View style={[styles.container, css.page]}>
 * ```
 */
export function useThemeStyles() {
  const { theme, fontScale } = useTheme();
  const c = theme.colors;

  return useMemo(
    () =>
      StyleSheet.create({
        /** fundo da página */
        page: { backgroundColor: c.background },
        /** fundo de cards/modais */
        surface: { backgroundColor: c.surface },
        /** superfície secundária (tiles internos, inputs) */
        surfaceInner: { backgroundColor: c.surfaceInner },
        /** texto principal */
        text: { color: c.text },
        /** texto secundário */
        textSecondary: { color: c.textSecondary },
        /** cor primária como texto */
        primary: { color: c.primary },
        /** cor primária como fundo */
        primaryBg: { backgroundColor: c.primary },
        /** texto sobre a primária (legibilidade calculada por luminância) */
        onPrimary: { color: c.onPrimary },
        /** tom de card do tema */
        cardTint: { backgroundColor: c.cardTint },
        /** borda de card do tema */
        cardBorder: { borderColor: c.cardBorder },
        /** fundo suave da primária (chips, tabs ativos) */
        primarySoft: { backgroundColor: c.primarySoft },
        /** borda suave da primária */
        primaryBorder: { borderColor: c.primaryBorder },

        /**
         * Escalas de texto (P7) — aplicar no array de style:
         * `style={[styles.foo, css.fontBody]}`
         *
         * `scaled` preserva `numberOfLines`/`minWidth: 0` dos estilos
         * originais (vindo do array), só ajusta fontSize/lineHeight.
         */
        fontDisplay: scaled({ fontSize: 30, lineHeight: 36 }, fontScale),
        fontTitle1: scaled({ fontSize: 24, lineHeight: 30 }, fontScale),
        fontTitle2: scaled({ fontSize: 19, lineHeight: 26 }, fontScale),
        fontHeadline: scaled({ fontSize: 16, lineHeight: 22 }, fontScale),
        fontBody: scaled({ fontSize: 14, lineHeight: 20 }, fontScale),
        fontCaption: scaled({ fontSize: 12, lineHeight: 16 }, fontScale),
      }),
    [
      c.background,
      c.surface,
      c.surfaceInner,
      c.text,
      c.textSecondary,
      c.primary,
      c.onPrimary,
      c.primarySoft,
      c.primaryBorder,
      c.cardTint,
      c.cardBorder,
      fontScale,
    ]
  );
}
