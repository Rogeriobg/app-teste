#!/usr/bin/env node
/**
 * Gate de áreas de toque — QA-3.
 *
 * Reprova o build quando um alvo de toque tem menos de 44x44 px.
 *
 * ## Por que este gate existe
 *
 * O QA-3 foi registrado no `WORKFLOW_STATE.md` como bug **médio** aberto:
 * `backBtn` 40px, `iconAction` 34px, `iconBtn` ~34px, `viewBtn` ~30px,
 * `logoutBtn` 40px. Todos passaram nos testes, no lint, no typecheck e
 * na inspeção do web — e ainda assim estavam abaixo do mínimo
 * recomendado pela Apple HIG e pelo WCAG 2.5.8 (AA).
 *
 * Regra da esteira: **todo bug encontrado visualmente ganha um gate
 * automático** (AGENTS.md, "Pipeline: bug-first").
 *
 * ## O que é medido
 *
 * Para cada `<TouchableOpacity>`, `<Pressable>` e `<Button>` no JSX:
 *
 *   - a soma de `paddingVertical` × 2 + `minHeight`/`height` deve ser ≥ 44
 *   - a soma de `paddingHorizontal` × 2 + `width`/`minWidth` deve ser ≥ 44
 *
 * Componentes com `hitSlop` compensando a área são aceitos.
 *
 * Uso:  node scripts/validate-touch-targets.mjs
 * Saída: 0 = válido; 1 = alvos pequenos encontrados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const MINIMO = 44;

/* ---------------------------------------------------------------- */
/* Estilos                                                           */
/* ---------------------------------------------------------------- */

function extractStyleEntries(source) {
  const start = source.indexOf('StyleSheet.create(');
  if (start === -1) return new Map();

  const open = source.indexOf('{', start);
  if (open === -1) return new Map();

  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const body = source.slice(open, end + 1);
  const entries = new Map();
  let i = 0;

  while (i < body.length) {
    const keyMatch = /^\s{2}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\{/.exec(body.slice(i));
    if (!keyMatch) {
      const nl = body.indexOf('\n', i);
      if (nl === -1) break;
      i = nl + 1;
      continue;
    }
    const key = keyMatch[1];
    const valueStart = i + keyMatch.index + keyMatch[0].length - 1;
    let d = 0;
    let j = valueStart;
    for (; j < body.length; j++) {
      if (body[j] === '{') d++;
      else if (body[j] === '}') {
        d--;
        if (d === 0) break;
      }
    }
    entries.set(key, body.slice(valueStart, j + 1));
    i = j + 1;
  }

  return entries;
}

/** Espaçamentos nomeados (tokens do projeto) em px. */
const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
};

function spacingValue(snippet, prop) {
  const m = new RegExp(`${prop}\\s*:\\s*(?:spacing\\.([A-Za-z0-9_]+)|(-?[\\d.]+))`).exec(snippet);
  if (!m) return 0;
  if (m[1]) return SPACING[m[1]] ?? 0;
  return Number(m[2]);
}

function dimensionValue(snippet, prop) {
  const m = new RegExp(`(?:^|[\\s,{])${prop}\\s*:\\s*(\\d+(?:\\.\\d+)?)`).exec(snippet);
  return m ? Number(m[1]) : 0;
}

/* ---------------------------------------------------------------- */
/* Varredura do JSX                                                  */
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

function readStyle(attrs) {
  const m = /style=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/.exec(attrs);
  if (!m) return { expr: '', refs: [] };
  const expr = m[1];
  const refs = [...expr.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((x) => x[1]);
  return { expr, refs };
}

/** Componentes cujo alvo de toque é o próprio elemento. */
const TOUCHABLES = new Set(['TouchableOpacity', 'Pressable', 'Button']);

/**
 * O `<Button>` é um componente compartilhado: ele **já** tem
 * `minHeight: 48` e `paddingHorizontal: 16` no próprio estilo. O que o
 * chamador passa é só um ajuste extra — medir apenas isso geraria falsos
 * positivos. O gate verifica o Button uma vez, na origem.
 */
function verifyButtonComponent() {
  const arquivo = path.join(SRC, 'components', 'Button.tsx');
  if (!fs.existsSync(arquivo)) return [];
  const source = fs.readFileSync(arquivo, 'utf8');
  const byKey = extractStyleEntries(source);
  const container = byKey.get('container') ?? '';
  const altura = dimensionValue(container, 'minHeight');
  if (altura >= MINIMO) return [];

  return [{
    file: 'src/components/Button.tsx',
    line: 1,
    tag: 'Button',
    nome: 'container (origem)',
    falhas: [`minHeight ${altura}px`],
  }];
}

function analyseFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.includes('export-pdf')) return [];

  const source = fs.readFileSync(file, 'utf8');
  const byKey = extractStyleEntries(source);
  const problems = [];

  // procura cada elemento tocável no arquivo
  const tagRe = /<(TouchableOpacity|Pressable|Button)\b([^>]*?)(\/?)>/g;
  let m;
  while ((m = tagRe.exec(source)) !== null) {
    const tag = m[1];

    // Button é verificado na origem (verifyButtonComponent)
    if (tag === 'Button') continue;

    const attrs = m[2] || '';

    // hitSlop compensa: área de toque estendida explicitamente
    if (/hitSlop/.test(attrs)) continue;

    const { expr, refs } = readStyle(attrs);
    const valores = refs.map((r) => byKey.get(r) || '').join('\n') + '\n' + expr;
    if (!valores.trim()) continue;

    // overlays transparentes que preenchem a tela (ex.: backdrop do modal)
    // não são alvos de toque — não há o que medir
    if (/absoluteFill/.test(valores)) continue;

    // a altura inclui o espaço do texto/ícone, não só o padding
    const conteudoVertical = Math.max(
      dimensionValue(valores, 'minHeight'),
      dimensionValue(valores, 'height'),
      dimensionValue(valores, 'fontSize') * 1.4,
      18 // altura típica de um ícone lucide
    );
    const altura = spacingValue(valores, 'paddingVertical') * 2 + conteudoVertical;

    // largura é flexível quando o elemento é um row ou ocupa a linha toda
    const larguraFlexivel =
      /(^|[^a-zA-Z])flex\s*:\s*1\b/.test(valores) ||
      /flexGrow\s*:\s*1/.test(valores) ||
      /alignSelf\s*:\s*['"]stretch['"]/.test(valores) ||
      /flexBasis/.test(valores) ||
      /maxWidth\s*:\s*['"]100%['"]/.test(valores) ||
      /flexDirection\s*:\s*['"]row['"]/.test(valores);

    const conteudoHorizontal = Math.max(
      dimensionValue(valores, 'minWidth'),
      dimensionValue(valores, 'width'),
      18
    );
    const largura = spacingValue(valores, 'paddingHorizontal') * 2 + conteudoHorizontal;

    const falhas = [];
    if (!larguraFlexivel && largura < MINIMO) {
      falhas.push(`largura ${largura}px`);
    }
    if (altura < MINIMO) {
      falhas.push(`altura ${altura}px`);
    }
    if (falhas.length === 0) continue;

    const accessibilityLabel = /accessibilityLabel="([^"]+)"/.exec(attrs)?.[1];
    const nome = accessibilityLabel ?? refs.join(', ') ?? '(sem rótulo)';

    problems.push({
      file: rel,
      line: source.slice(0, m.index).split('\n').length,
      tag,
      nome,
      falhas,
    });
  }

  return problems;
}

/* ---------------------------------------------------------------- */

const files = walk(SRC);
const problems = [...verifyButtonComponent(), ...files.flatMap(analyseFile)];

console.log('=== Gate de áreas de toque — QA-3 ===');
console.log(`arquivos analisados: ${files.length}`);
console.log(`mínimo: ${MINIMO}x${MINIMO} px (Apple HIG / WCAG 2.5.8 AA)`);

if (problems.length === 0) {
  console.log('\nresultado: VALIDO ✅ (todos os alvos de toque têm pelo menos 44px)');
  process.exit(0);
}

console.log(`\nresultado: ${problems.length} alvo(s) pequeno(s) ❌\n`);

const byFile = new Map();
for (const p of problems) {
  if (!byFile.has(p.file)) byFile.set(p.file, []);
  byFile.get(p.file).push(p);
}
for (const [file, list] of byFile) {
  console.log(`  ${file}`);
  for (const p of list) {
    console.log(
      `    linha ${p.line}: <${p.tag}> "${p.nome}" — ${p.falhas.join(' e ')} (mínimo ${MINIMO}px)`
    );
  }
  console.log('');
}
console.log(
  'Como corrigir:\n' +
  '  - ícone pequeno: aumente a ÁREA DE TOQUE, não o ícone\n' +
  '  - use width/height 44 ou paddingVertical/Horizontal que some até 44\n' +
  '  - quando não couber, use hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}'
);
process.exit(1);
