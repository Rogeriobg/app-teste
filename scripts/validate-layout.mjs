#!/usr/bin/env node
/**
 * Gate de layout — valida que nenhum elemento pode transbordar a largura da tela.
 *
 * Este gate existe porque o RNTL **não mede geometria**: um teste pode
 * confirmar que o texto "Novo Paciente" existe e ainda assim o botão
 * transbordar a borda da tela. O defeito do header de `/patients` (botão
 * "Novo Paciente" saindo da tela em aparelhos de 360–375pt) passou por
 * 142 testes, `tsc`, `lint` e revisão estática — e só apareceu no aparelho.
 *
 * ## Abordagem
 *
 * Em vez de parsear a árvore JSX (frágil diante de generics do TypeScript),
 * o gate usa **análise de brace-depth**: dentro de um container `row`,
 * conta quantos elementos JSX são filhos **diretos** (isto é, estão no
 * primeiro nível de aninhamento) e inspeciona o `style` de cada um.
 *
 * ## Regras
 *
 * Para cada container cujo estilo declara `flexDirection: 'row'`:
 *
 *   1. **Capacidade de encolher** — o filho precisa declarar
 *      `flexShrink: 1`, `flex: 1` ou `minWidth: 0` (no estilo referenciado
 *      ou inline). Sem isso, o filho mantém a largura intrínseco do texto
 *      e o irmão transborda.
 *   2. **Texto truncável** — um `<Text>` dentro de um `row` precisa de
 *      `numberOfLines`, senão quebra caractere a caractere (o bug do
 *      "nome vertical") ou transborda.
 *   3. **O row precisa de espaço cedível** — se nenhum filho pode encolher,
 *      o row inteiro transborda.
 *
 * Escopo: `src/**` (o `export-pdf.tsx` monta HTML/CSS, não RN).
 *
 * Uso:  node scripts/validate-layout.mjs
 * Saída: 0 = válido; 1 = problemas encontrados.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

/* ---------------------------------------------------------------- */
/* Estilos                                                           */
/* ---------------------------------------------------------------- */

/**
 * Extrai os estilos de primeiro nível do `StyleSheet.create({ ... })`.
 * @returns {Map<string, string>} chave => corpo do estilo
 */
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

const declares = (snippet, prop) =>
  new RegExp(`(^|[\\s{,])['"]?${prop}['"]?\\s*:`).test(snippet);

const flexShrinkZero = (snippet) => /flexShrink\s*:\s*0/.test(snippet);
const minWidthZero = (snippet) => /minWidth\s*:\s*0/.test(snippet);

/* ---------------------------------------------------------------- */
/* Componentes que já tratam encolhimento internamente               */
/* ---------------------------------------------------------------- */

const SELF_SAFE = new Set([
  'StatCard',
  'StatSummary',
  'ActionTile',
  'Chip',
  'Button',
  'Input',
  'Card',
  'AppModal',
  'PatientFormModal',
  'DateTimePicker',
  'StatusBadge',
]);

const RN_TAGS = new Set([
  'View',
  'Text',
  'TextInput',
  'ScrollView',
  'TouchableOpacity',
  'Pressable',
  'Image',
  'ImageBackground',
]);

/**
 * Componentes cujo CONTEÚDO precisa poder encolher.
 *
 * `flex: 1` no texto de um botão faz o botão crescer até a largura do
 * pai — no Yoga nativo isso estica o botão dentro de um `row` e espreme
 * o irmão para fora da tela. No web o CSS mascara o efeito (o botão tem
 * `width: auto`), por isso o defeito só aparecia no aparelho.
 */
const CONTENT_MUST_SHRINK = new Set(['Text', 'TextInput']);

/* ---------------------------------------------------------------- */
/* Análise por brace-depth                                           */
/* ---------------------------------------------------------------- */

/**
 * Encontra os filhos **diretos** de um container JSX, usando brace-depth.
 *
 * @param {string} source
 * @param {number} start índice do primeiro caractere do conteúdo
 * @param {number} end   índice do fim do conteúdo
 * @returns {Array<{tag: string, attrs: string, index: number}>}
 */
function directChildren(source, start, end) {
  const children = [];
  let i = start;
  let depth = 0; // profundidade de chaves dentro do conteúdo

  while (i < end) {
    const ch = source[i];

    // tag JSX apenas no primeiro nível
    if (depth === 0 && ch === '<') {
      const m = /^<([A-Za-z][A-Za-z0-9.]*)/.exec(source.slice(i, i + 40));
      if (m) {
        const tag = m[1];
        // encontra o fim da tag de abertura
        let j = i + m[0].length;
        let d = 0;
        let inStr = null;
        let selfClosing = false;
        for (; j < end; j++) {
          const c = source[j];
          if (inStr) {
            if (c === inStr) inStr = null;
            continue;
          }
          if (c === '"' || c === "'") {
            inStr = c;
            continue;
          }
          if (c === '{') d++;
          else if (c === '}') d--;
          else if (c === '>' && d === 0) {
            selfClosing = source[j - 1] === '/';
            break;
          }
        }
        if (j < end) {
          const attrs = source.slice(i + m[0].length, j - (selfClosing ? 1 : 0));
          children.push({ tag, attrs, index: i });

          if (selfClosing) {
            i = j + 1;
            continue;
          }
          // pula o conteúdo do elemento (contando braces)
          let k = j + 1;
          let bd = 0;
          while (k < end) {
            const c = source[k];
            if (c === '{') bd++;
            else if (c === '}') bd--;
            else if (c === '<' && bd === 0) {
              // pode ser a tag de fechamento
              const close = /^<\/\s*([A-Za-z][A-Za-z0-9.]*)\s*>/.exec(source.slice(k, k + 40));
              if (close && close[1] === tag) {
                k = source.indexOf('>', k) + 1;
                break;
              }
            }
            k++;
          }
          i = k;
          continue;
        }
      }
    }

    if (ch === '{') {
      depth++;
      // comentario JSX {/* ... */}
      if (source.startsWith('{/*', i)) {
        const close = source.indexOf('*/}', i);
        if (close !== -1) {
          i = close + 3;
          depth--;
          continue;
        }
      }
      i++;
      continue;
    }
    if (ch === '}') {
      depth--;
      i++;
      continue;
    }
    i++;
  }

  return children;
}

/** Lê o `style` de um elemento. */
function readStyle(attrs) {
  const m = /style=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/.exec(attrs);
  if (!m) return { expr: '', refs: [] };
  const expr = m[1];
  const refs = [...expr.matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((x) => x[1]);
  return { expr, refs };
}

/* ---------------------------------------------------------------- */
/* Análise por arquivo                                               */
/* ---------------------------------------------------------------- */

function analyseFile(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.includes('export-pdf')) return [];

  const source = fs.readFileSync(file, 'utf8');
  const byKey = extractStyleEntries(source);

  const rowStyleKeys = new Set(
    [...byKey.entries()]
      .filter(([, v]) => declares(v, 'flexDirection') && /['"]row['"]/.test(v))
      .map(([k]) => k)
  );
  if (rowStyleKeys.size === 0) return [];

  const problems = [];
  const seen = new Set();

  // Para cada uso de um estilo 'row' no JSX
  const STYLE_USE = /style=\{\s*\[?([^\]]*?)\]?\s*\}/g;
  let m;
  while ((m = STYLE_USE.exec(source)) !== null) {
    const refs = [...m[1].matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((x) => x[1]);
    const rowRef = refs.find((r) => rowStyleKeys.has(r));
    if (!rowRef) continue;

    // elemento que carrega esse style
    const tagStart = source.lastIndexOf('<', m.index);
    if (tagStart === -1) continue;
    const tagMatch = /^<([A-Za-z][A-Za-z0-9.]*)/.exec(source.slice(tagStart, tagStart + 40));
    if (!tagMatch) continue;

    // fim da tag de abertura
    let openEnd = tagStart + tagMatch[0].length;
    let d = 0;
    let inStr = null;
    let selfClosing = false;
    for (; openEnd < source.length; openEnd++) {
      const c = source[openEnd];
      if (inStr) {
        if (c === inStr) inStr = null;
        continue;
      }
      if (c === '"' || c === "'") {
        inStr = c;
        continue;
      }
      if (c === '{') d++;
      else if (c === '}') d--;
      else if (c === '>' && d === 0) {
        selfClosing = source[openEnd - 1] === '/';
        break;
      }
    }
    if (selfClosing) continue;

    // fim do conteúdo do elemento (tag de fechamento correspondente)
    let contentEnd = openEnd + 1;
    let bd = 0;
    while (contentEnd < source.length) {
      const c = source[contentEnd];
      if (c === '{') bd++;
      else if (c === '}') bd--;
      else if (c === '<' && bd === 0) {
        const close = /^<\/\s*([A-Za-z][A-Za-z0-9.]*)\s*>/.exec(source.slice(contentEnd, contentEnd + 40));
        if (close && close[1] === tagMatch[1]) {
          contentEnd = source.indexOf('>', contentEnd) + 1;
          break;
        }
      }
      contentEnd++;
    }

    const children = directChildren(source, openEnd + 1, contentEnd);
    if (children.length === 0) continue;

    // evita duplicar o mesmo container
    const key = `${rel}:${rowRef}:${openEnd}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let shrinkableCount = 0;
    let fixedCount = 0;

    for (const child of children) {
      const { expr, refs } = readStyle(child.attrs);
      const childValues = refs.map((r) => byKey.get(r) || '').join('\n');
      const combined = childValues + '\n' + expr;

      const isText = child.tag === 'Text' || child.tag === 'TextInput';
      const hasNumberOfLines = /numberOfLines/.test(child.attrs);

      if (SELF_SAFE.has(child.tag)) {
        shrinkableCount++;
        continue;
      }
      if (/^[A-Z]/.test(child.tag) && !RN_TAGS.has(child.tag)) {
        fixedCount++; // ícone lucide
        continue;
      }
      if (flexShrinkZero(combined)) {
        fixedCount++;
        continue;
      }

      const shrinkable =
        declares(combined, 'flexShrink') ||
        declares(combined, 'flex') ||
        minWidthZero(combined);

      if (shrinkable) {
        if (isText && !hasNumberOfLines && !minWidthZero(combined)) {
          problems.push({
            file: rel,
            line: source.slice(0, child.index).split('\n').length,
            message: `<${child.tag}> dentro de um container 'row' (${rowRef}) encolhe mas não tem 'numberOfLines' — o texto pode quebrar caractere a caractere`,
          });
        }
        shrinkableCount++;
        continue;
      }

      const semStyle = refs.length === 0 && !expr.trim();
      const what = semStyle
        ? `sem 'style' nenhum — não pode encolher, então empurra o irmão para fora da tela`
        : isText && !hasNumberOfLines
          ? `sem 'numberOfLines', sem 'flexShrink: 1', sem 'flex: 1' e sem 'minWidth: 0' — pode transbordar a largura da tela ou quebrar caractere a caractere`
          : `sem 'flexShrink: 1', 'flex: 1' ou 'minWidth: 0' — pode transbordar a largura da tela`;

      problems.push({
        file: rel,
        line: source.slice(0, child.index).split('\n').length,
        message: `<${child.tag}> dentro de um container 'row' (${rowRef}) ${what}`,
      });
    }

    // O row não tem espaço cedível. Isso é aceitável **apenas** se todos
    // os filhos forem fixos (ícones/ações curtas) — nesse caso o row é
    // curto por construção e não transborda. Com texto junto de um item
    // fixo, porém, o texto precisa poder encolher.
    if (shrinkableCount === 0 && children.length > 1) {
      const hasText = children.some((c) => c.tag === 'Text' || c.tag === 'TextInput');
      if (hasText) {
        problems.push({
          file: rel,
          line: source.slice(0, tagStart).split('\n').length,
          message: `container 'row' (${rowRef}) tem texto e ${fixedCount} item(ns) fixo(s), mas nenhum filho pode encolher — o texto empurra os itens para fora da tela`,
        });
      }
    }
  }

  return problems;
}

/* ---------------------------------------------------------------- */
/* Execução                                                          */
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

/**
 * Regra extra: `flex: 1` no conteudo de um componente de largura fixa.
 *
 * Quando um `<Text>` (ou `<TextInput>`) tem `flex: 1` dentro de um
 * componente cujo container e `flexShrink: 0` (botao, chip, badge),
 * o texto cresce ate a largura do pai e o componente inteiro estica.
 * Dentro de um `row`, isso empurra o irmao para fora da tela.
 *
 * O web nao reproduz: no CSS o botao tem `width: auto` e o texto cede
 * espaco. No Yoga nativo o `flex: 1` cresce de verdade — foi assim que
 * o botao "Novo Paciente" ocupou a largura toda no celular.
 */
function checkFixedWidthContent(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  if (rel.includes('export-pdf')) return [];

  const source = fs.readFileSync(file, 'utf8');
  const byKey = extractStyleEntries(source);
  const problems = [];

  // estilos cujo container e fixo (flexShrink 0) E row
  const fixedRowStyles = new Set(
    [...byKey.entries()]
      .filter(([, v]) => /flexShrink\s*:\s*0/.test(v) && /flexDirection\s*:\s*['"]row['"]/.test(v))
      .map(([k]) => k)
  );
  if (fixedRowStyles.size === 0) return [];

  /**
   * Para cada elemento cujo style aponta para um container fixo, procura
   * `<Text>` descendentes com `flex: 1`.
   */
  const STYLE_USE = /style=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
  let m;
  while ((m = STYLE_USE.exec(source)) !== null) {
    const refs = [...m[1].matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((x) => x[1]);
    if (!refs.some((r) => fixedRowStyles.has(r))) continue;

    // o elemento que carrega esse style
    const tagStart = source.lastIndexOf('<', m.index);
    if (tagStart === -1) continue;
    const tagMatch = /^<([A-Za-z][A-Za-z0-9.]*)/.exec(source.slice(tagStart));
    if (!tagMatch) continue;

    // percorre a arvore a partir do elemento
    const stack = [m.index];
    while (stack.length) {
      const at = stack.pop();
      const near = source.lastIndexOf('<', at);
      if (near === -1) continue;
      const nearMatch = /^<([A-Za-z][A-Za-z0-9.]*)/.exec(source.slice(near));
      if (!nearMatch) continue;
      const openEnd = source.indexOf('>', near);
      if (openEnd === -1) continue;
      if (source[openEnd - 1] === '/') continue;

      // fecha a tag correspondente
      const closeRe = new RegExp(`</\\s*${nearMatch[1]}\\s*>`);
      const closeMatch = closeRe.exec(source.slice(openEnd + 1));
      if (!closeMatch) continue;
      const body = source.slice(openEnd + 1, openEnd + 1 + closeMatch.index);

      // <Text> dentro deste elemento
      const textRe = /<Text\b([^>]*?)>/g;
      let tm;
      while ((tm = textRe.exec(body)) !== null) {
        const styleMatch = /style=\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/.exec(tm[1] || '');
        if (!styleMatch) continue;
        const childRefs = [...styleMatch[1].matchAll(/styles\.([A-Za-z_][A-Za-z0-9_]*)/g)].map((x) => x[1]);
        const values = childRefs.map((r) => byKey.get(r) || '').join('\n');
        const inline = styleMatch[1];

        const temFlex1 = /(^|[^a-zA-Z])flex\s*:\s*1\b/.test(values) || /(^|[^a-zA-Z])flex\s*:\s*1\b/.test(inline);
        if (!temFlex1) continue;
        if (/minWidth\s*:\s*0/.test(values) || /minWidth\s*:\s*0/.test(inline)) continue;

        problems.push({
          file: rel,
          line: source.slice(0, openEnd + 1 + tm.index).split('\n').length,
          message: `<Text> dentro de um container fixo (flexShrink: 0) com 'flex: 1' — o texto cresce até a largura do pai e o componente estica dentro do row, empurrando o irmão para fora da tela. Use 'flexShrink: 1' + 'minWidth: 0'`,
        });
      }
    }
  }

  return problems;
}

/**
 * Regressões encontradas no aparelho (fase 4c) que a análise de `row`
 * não detecta. Cada item aqui nasceu de um bug real reportado pelo usuário.
 */
function checkDeviceBugs() {
  const encontrados = [];
  const ler = (relativo) => {
    const arquivo = path.join(SRC, relativo);
    return fs.existsSync(arquivo) ? fs.readFileSync(arquivo, 'utf8') : '';
  };

  // Modal descia para o centro ao abrir o teclado (senha e novo paciente).
  const modal = ler('components/Modal.tsx');
  if (modal && !modal.includes("justifyContent: 'flex-start'")) {
    encontrados.push({
      file: 'src/components/Modal.tsx',
      line: 0,
      message:
        "overlay do modal precisa de justifyContent: 'flex-start' — com 'center' o KeyboardAvoidingView encolhe e o form desce para o meio da tela",
    });
  }
  if (modal && !modal.includes('<ScrollView')) {
    encontrados.push({
      file: 'src/components/Modal.tsx',
      line: 0,
      message:
        'conteúdo do modal precisa estar dentro de ScrollView para alcançar os últimos campos com o teclado aberto',
    });
  }

  // Botão "Cadastrar paciente" da dashboard estava fixo no verde do brand.
  const dashboard = ler('app/dashboard.tsx');
  if (dashboard && !dashboard.includes('styles.emptyAction, css.primaryBg')) {
    encontrados.push({
      file: 'src/app/dashboard.tsx',
      line: 0,
      message:
        'botão "Cadastrar paciente" precisa aplicar css.primaryBg/css.onPrimary para acompanhar o tema',
    });
  }

  return encontrados;
}

const files = walk(SRC);
const problems = files
  .flatMap(analyseFile)
  .concat(files.flatMap(checkFixedWidthContent))
  .concat(checkDeviceBugs());

console.log('=== Gate de layout: transbordo horizontal ===');
console.log(`arquivos analisados: ${files.length}`);
console.log(
  "regras: filho de container 'row' precisa poder encolher (flexShrink/flex/minWidth) e texto precisa de numberOfLines"
);

if (problems.length === 0) {
  console.log('\nresultado: VALIDO ✅ (nenhum elemento pode transbordar a largura)');
  process.exit(0);
}

console.log(`\nresultado: ${problems.length} problema(s) ❌\n`);

const byFile = new Map();
for (const p of problems) {
  if (!byFile.has(p.file)) byFile.set(p.file, []);
  byFile.get(p.file).push(p);
}
for (const [file, list] of byFile) {
  console.log(`  ${file}`);
  for (const p of list) console.log(`    linha ${p.line}: ${p.message}`);
  console.log('');
}
console.log(
  'Como corrigir:\n' +
  '  - container do texto dentro do row:  flex: 1, minWidth: 0\n' +
  '  - item fixo (ícone/botão):           flexShrink: 0\n' +
  '  - texto:                             numberOfLines={1} + ellipsizeMode="tail"'
);
process.exit(1);
