import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './context';

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
  const { theme } = useTheme();
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
        /** fundo suave da primária (chips, tabs ativos) */
        primarySoft: { backgroundColor: c.primarySoft },
        /** borda suave da primária */
        primaryBorder: { borderColor: c.primaryBorder },
      }),
    [
      c.background,
      c.surface,
      c.surfaceInner,
      c.text,
      c.textSecondary,
      c.primary,
      c.primarySoft,
      c.primaryBorder,
    ]
  );
}
