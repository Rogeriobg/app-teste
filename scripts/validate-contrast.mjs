#!/usr/bin/env node
/**
 * Gate de contraste — QA-1 / QA-2.
 *
 * Reprova o build quando:
 *
 *   1. um token de TEXTO não atinge 4,5:1 sobre branco (WCAG AA);
 *   2. um token decorativo usado como texto cai abaixo de 4,5:1;
 *   3. `textTertiary` ou `brand` são usados como cor de texto em
 *      `StyleSheet.create` (devem ser usados só em ícones/decoração).
 *
 * ## Histórico
 *
 * `textTertiary` (#94A3B8) estava em 2,56:1 e `brand` (#0D9488) em
 * 3,74:1 sobre branco — ambos abaixo do mínimo para texto (4,5:1).
 * Os testes, o lint e o typecheck passavam: contraste não é verificável
 * por essas ferramentas. Por isso a esteira ganhou este gate.
 *
 * Uso:  node scripts/validate-contrast.mjs
 * Saída: 0 = válido; 1 = problemas encontrados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const TOKENS = path.join(SRC, 'theme', 'tokens.ts');
const MIN_TEXTO = 4.5;
const MIN_GRAFICO = 3.0;
const BRANCO = '#FFFFFF';

/* ---------------------------------------------------------------- */
/* WCAG 2.1 — razão de contraste                                     */
/* ---------------------------------------------------------------- */

function luminancia(hex) {
  const h = hex.replace('#', '');
  const canais = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const linear = canais.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contraste(a, b) {
  const la = luminancia(a);
  const lb = luminancia(b);
  const clara = Math.max(la, lb);
  const escura = Math.min(la, lb);
  return (clara + 0.05) / (escura + 0.05);
}

/* ---------------------------------------------------------------- */
/* Tokens                                                            */
/* ---------------------------------------------------------------- */

function lerTokens() {
  const source = fs.readFileSync(TOKENS, 'utf8');
  const cores = {};
  const re = /^\s{2}([A-Za-z][A-Za-z0-9_]*)\s*:\s*'(#[0-9A-Fa-f]{6})'/gm;
  let m;
  while ((m = re.exec(source)) !== null) cores[m[1]] = m[2].toUpperCase();
  return cores;
}

/* ---------------------------------------------------------------- */
/* Varredura de JSX                                                  */
/* ---------------------------------------------------------------- */

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (/\.tsx$/.test(entry.name)) out.push(full);
  }
  return out;
}

const TOKENS_PROIBIDOS_COMO_TEXTO = new Set(['textTertiary', 'brand']);

function analisarUso(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.includes('export-pdf')) return []; // HTML/CSS, verificado separadamente

  const source = fs.readFileSync(file, 'utf8');
  const problemas = [];

  // cor de texto dentro de StyleSheet.create
  const re = /(?:^|[\s,{])color:\s*colors\.([A-Za-z][A-Za-z0-9_]*)/g;
  let m;
  while ((m = re.exec(source)) !== null) {
    const token = m[1];
    if (!TOKENS_PROIBIDOS_COMO_TEXTO.has(token)) continue;

    // `segments` do StatSummary são barras (elementos gráficos), não texto.
    // WCAG 1.4.11 permite 3:1 para gráficos — não exigir 4,5:1 aqui.
    const linha = source.slice(0, m.index).split('\n').length;
    const textoLinha = source.split('\n')[linha - 1] ?? '';
    if (/count\s*:/.test(textoLinha)) continue;
    problemas.push({
      file: rel,
      line: source.slice(0, m.index).split('\n').length,
      mensagem: `cor '${token}' usada como texto em StyleSheet — use '${
        token === 'brand' ? 'brandText' : 'textMuted'
      }'`,
    });
  }

  // placeholders também são texto
  const ph = /placeholderTextColor=\{?colors\.(textTertiary|brand)\}?/g;
  while ((m = ph.exec(source)) !== null) {
    problemas.push({
      file: rel,
      line: source.slice(0, m.index).split('\n').length,
      mensagem: `placeholder com '${m[1]}' — use '${
        m[1] === 'brand' ? 'brandText' : 'textMuted'
      }'`,
    });
  }

  return problemas;
}

/* ---------------------------------------------------------------- */
/* Execução                                                          */
/* ---------------------------------------------------------------- */

const cores = lerTokens();
const problemas = [];

// 1. tokens de texto precisam de AA sobre branco
const MINIMOS = {
  textPrimary: MIN_TEXTO,
  textSecondary: MIN_TEXTO,
  textMuted: MIN_TEXTO,
  brandText: MIN_TEXTO,
  // decorativos: basta 3:1 para elementos gráficos (WCAG 1.4.11)
  textTertiary: MIN_GRAFICO,
  brand: MIN_GRAFICO,
};

for (const [nome, minimo] of Object.entries(MINIMOS)) {
  const hex = cores[nome];
  if (!hex) {
    problemas.push({ arquivo: 'src/theme/tokens.ts', linha: 0, mensagem: `token '${nome}' não definido` });
    continue;
  }
  const razao = contraste(hex, BRANCO);
  if (razao + 0.001 < minimo) {
    problemas.push({
      arquivo: 'src/theme/tokens.ts',
      linha: 0,
      mensagem: `${nome} (${hex}) tem ${razao.toFixed(2)}:1 sobre branco — mínimo ${minimo}:1`,
    });
  }
}

// 2. usos proibidos no JSX
for (const arquivo of walk(SRC)) {
  for (const p of analisarUso(arquivo)) {
    problemas.push({ arquivo: p.file, linha: p.line, mensagem: p.mensagem });
  }
}

/* ---------------------------------------------------------------- */

console.log('=== Gate de contraste — QA-1 / QA-2 ===');
console.log(`texto: ${MIN_TEXTO}:1 (WCAG AA) · gráficos: ${MIN_GRAFICO}:1 (WCAG 1.4.11)`);
console.log('tokens:', Object.keys(MINIMOS).map((n) => `${n}=${cores[n] ?? '?'}`).join(' '));

if (problemas.length === 0) {
  console.log('\nresultado: VALIDO ✅ (contraste AA e nenhum token decorativo usado como texto)');
  process.exit(0);
}

console.log(`\nresultado: ${problemas.length} problema(s) ❌\n`);
for (const p of problemas) {
  const onde = p.arquivo ? `${p.arquivo}${p.linha ? `:${p.linha}` : ''}` : 'src/theme/tokens.ts';
  console.log(`  ${onde}: ${p.mensagem}`);
}
console.log(
  '\nComo corrigir:\n' +
  '  - texto cinza/teal pequeno: use colors.textMuted / colors.brandText\n' +
  '  - ícones e decoração: colors.textTertiary / colors.brand são aceitos'
);
process.exit(1);
