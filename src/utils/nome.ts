/**
 * Formatação de nomes para exibição.
 */

/** Títulos que já indicam o grau do profissional. */
const TITULO_REGEX = /^(dr|dra|drs|dra\.?|dom|dona)\b\.?/i;

/**
 * Garante que o nome exibido tenha um título ("Dr(a).") sem duplicar
 * quando o nome já vem com um (ex.: seed "Dr(a). Psicólogo(a)").
 *
 * @example formatarNome('Dr(a). Psicólogo(a)') -> 'Dr(a). Psicólogo(a)'
 * @example formatarNome('Ana Costa')            -> 'Dr(a). Ana Costa'
 */
export function formatarNome(nome?: string | null): string {
  const limpo = (nome ?? '').trim();
  if (!limpo) return 'Dr(a). Psicólogo(a)';
  if (TITULO_REGEX.test(limpo)) return limpo;
  return `Dr(a). ${limpo}`;
}
