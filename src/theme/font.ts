import type { TextStyle } from 'react-native';
import type { FontScale } from './types';

/**
 * Multiplicadores da escala de fonte (decisão do planner).
 *
 * `Grande = 1,125` é conservador de propósito: 1,2 estouraria headers
 * longos ("Relatórios de ...") em telas de 360dp (risco R9).
 */
export const FONT_SCALE: Record<FontScale, number> = {
  small: 0.9,
  default: 1,
  large: 1.125,
};

/** Aplica a escala a um estilo de texto. */
export const scaled = (base: TextStyle, scale: FontScale): TextStyle => {
  const fator = FONT_SCALE[scale];
  return {
    ...base,
    fontSize: Math.round((base.fontSize ?? 14) * fator),
    ...(base.lineHeight != null
      ? { lineHeight: Math.round(base.lineHeight * fator) }
      : {}),
  };
};
