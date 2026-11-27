/**
 * Cálculo de contraste WCAG 2.1.
 *
 * Esta é a implementação de produção das mesmas funções usadas em
 * `scripts/validate-contrast.mjs` — a matemática é idêntica para que o
 * gate do CI e o app nunca discordem do que é "legível".
 */

/** Converte um canal sRGB (0–255) em luminância linear. */
const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

/** Luminância relativa de uma cor `#RRGGBB`. */
export const luminance = (hex: string): number => {
  const value = parseInt(hex.replace('#', ''), 16);
  return (
    0.2126 * channel((value >> 16) & 255) +
    0.7152 * channel((value >> 8) & 255) +
    0.0722 * channel(value & 255)
  );
};

/** Razão de contraste entre duas cores (1:1 a 21:1). */
export const contrastRatio = (a: string, b: string): number => {
  const [clara, escura] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clara + 0.05) / (escura + 0.05);
};

/**
 * Escolhe branco ou preto — o que tiver MAIOR contraste com `bg`.
 *
 * Propriedade matemática: para qualquer cor, `max(cr(bg,branco),
 * cr(bg,preto)) >= 4,5:1`. Nenhuma cor personalizada pode gerar um
 * `onPrimary` ilegível, então o app nunca precisa recusar uma primária.
 */
export const getReadableTextColor = (bg: string): string => {
  const branco = contrastRatio(bg, '#FFFFFF');
  const preto = contrastRatio(bg, '#000000');
  return branco >= preto ? '#FFFFFF' : '#000000';
};

/**
 * Croma (max - min dos canais), de 0 a 1.
 *
 * Usado no lugar da saturação HSL pura: para cores **quase brancas**, a
 * fórmula HSL amplifica a saturação artificialmente (#FAF8F5 dá ~33%
 * HSL, embora seja um fundo perfeitamente suave). O croma mede o que a
 * regra "tons suaves" realmente quer dizer.
 */
export const chroma = (hex: string): number => {
  const value = parseInt(hex.replace('#', ''), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  return Math.max(r, g, b) - Math.min(r, g, b);
};

/**
 * DP2 / R14 — fundo "claro suave" verificável.
 *
 * Limites: luminância WCAG >= 0,6 e **croma <= 0,12** (ver `chroma`).
 * O seletor Personalizado (P8) usa esta função para bloquear fundos
 * escuros/vibrantes — impede que o tema escuro volte pelo seletor.
 */
export const isSoftLightBackground = (hex: string): boolean =>
  luminance(hex) >= 0.6 && chroma(hex) <= 0.12;
