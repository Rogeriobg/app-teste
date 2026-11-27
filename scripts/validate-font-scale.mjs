#!/usr/bin/env node
/**
 * Gate do P7 — tamanho de fonte.
 *
 * Verifica estaticamente que:
 *   1. `FONT_SCALE` tem os 3 níveis com multiplicadores conservadores;
 *   2. a escala MAIXMA (1,125) não faz nenhuma fonte base ultrapassar
 *      o limite que estouraria headers em 360dp (risco R9);
 *   3. `scaled()` preserva `lineHeight` proporcional.
 *
 * A medição em DOM (360/430 × 3 escalas) é da fase 4b e roda no aparelho;
 * este gate pega regressões de configuração antes disso.
 *
 * Uso:  node scripts/validate-font-scale.mjs
 * Saída: 0 = válido; 1 = problemas.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTE = path.join(ROOT, 'src', 'theme', 'font.ts');
const MAX_FONTE_HEADER = 28; // 24px * 1,125 = 27 — ainda cabe em 360dp

const source = fs.readFileSync(FONTE, 'utf8');
const problemas = [];

const valores = {};
for (const nivel of ['small', 'default', 'large']) {
  const m = new RegExp(`${nivel}\\s*:\\s*([\\d.]+)`).exec(source);
  if (!m) {
    problemas.push(`escala '${nivel}' não encontrada em font.ts`);
  } else {
    valores[nivel] = Number(m[1]);
  }
}

if (Object.keys(valores).length === 3) {
  if (!(valores.small < valores.default && valores.default < valores.large)) {
    problemas.push(
      `escalas fora de ordem: small=${valores.small}, default=${valores.default}, large=${valores.large}`
    );
  }
  const maiorFonteBase = 24; // title1
  const resultante = maiorFonteBase * valores.large;
  if (resultante > MAX_FONTE_HEADER) {
    problemas.push(
      `fonte Grande (${valores.large}x) leva title1 de 24px para ${resultante}px — limite ${MAX_FONTE_HEADER}px (R9)`
    );
  }
}

if (!/lineHeight\s*\*\s*fator|fator\s*\*\s*\([^)]*lineHeight|lineHeight:\s*Math\.round/.test(source)) {
  problemas.push('scaled() não ajusta lineHeight proporcionalmente à fonte');
}

console.log('=== Gate do P7 - escala de fonte ===');
console.log('escalas:', Object.entries(valores).map(([k, v]) => `${k}=${v}x`).join(' '));
console.log(`limite de header em 360dp: ${MAX_FONTE_HEADER}px`);

if (problemas.length === 0) {
  console.log('\nresultado: VALIDO ✅ (3 escalas conservadoras, lineHeight proporcional)');
  process.exit(0);
}

console.log(`\nresultado: ${problemas.length} problema(s) ❌`);
for (const p of problemas) console.log(`  ${p}`);
process.exit(1);
