/**
 * Assistente interativo: configura o `EXPO_TOKEN` no GitHub Actions e vincula
 * o projeto ao EAS (criando o `extra.eas.projectId` no app.json).
 *
 * Uso:
 *   npm run eas:setup
 *
 * O token é digitado de forma mascarada — não aparece na tela nem no
 * histórico do shell. Também é possível usar:
 *   $env:EXPO_TOKEN = "..."      (a variável tem prioridade)
 *   $env:EXPO_TOKEN_FILE = "..." (aponta para um arquivo com o token)
 *
 * O token é validado contra a API do Expo ANTES de ser gravado no GitHub,
 * para nunca armazenar uma credencial inválida.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  REPO,
  setGitHubSecret,
  setGitHubVariable,
  listGitHubSecrets,
  listGitHubVariables,
} from './lib/github-secrets.mjs';
import { checkExpoToken, sanitizeToken, describeToken } from './lib/expo-token.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Lê uma linha do terminal com a digitação mascarada (compatível com Ctrl+V). */
function promptMasked(question) {
  const stdin = process.stdin;
  const stdout = process.stdout;

  if (!stdin.isTTY) {
    throw new Error(
      'O terminal não suporta leitura mascarada.\n' +
        'Defina a variável EXPO_TOKEN e rode novamente:\n' +
        '  $env:EXPO_TOKEN = "seu-token"'
    );
  }

  return new Promise((resolve, reject) => {
    let value = '';
    let pasteMode = false;

    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    const onData = (chunk) => {
      for (const ch of chunk) {
        // bracketed paste: \u001b[200~ ... \u001b[201~
        if (ch === '\u001b') {
          pasteMode = true;
          continue;
        }
        if (pasteMode) {
          if (ch === '~') pasteMode = false;
          continue;
        }
        if (ch === '\u0003') {
          cleanup();
          process.exit(130);
        }
        if (ch === '\r' || ch === '\n') {
          cleanup();
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\b' || ch === '\u007f') {
          value = value.slice(0, -1);
          continue;
        }
        if (ch < ' ') continue;
        value += ch;
      }
    };

    stdin.on('data', onData);
    stdin.once('error', reject);
  });
}

function readAppJson() {
  return JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8'));
}

function hasProjectId() {
  return Boolean(readAppJson().expo?.extra?.eas?.projectId);
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  PsiApp — configuração do EAS Build no GitHub Actions  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');

  /* ---------------- 1. Obter e validar o token ---------------- */
  console.log('1️⃣  Personal access token do Expo');
  console.log('    (crie em https://expo.dev/settings/access-tokens)');
  console.log('');

  let raw;
  if (process.env.EXPO_TOKEN) {
    raw = process.env.EXPO_TOKEN;
    console.log('    Token lido de $env:EXPO_TOKEN');
  } else if (process.env.EXPO_TOKEN_FILE && existsSync(process.env.EXPO_TOKEN_FILE)) {
    raw = readFileSync(process.env.EXPO_TOKEN_FILE, 'utf8');
    console.log('    Token lido de', process.env.EXPO_TOKEN_FILE);
  } else {
    raw = await promptMasked('    Cole o token aqui (não aparece na tela): ');
  }

  const token = sanitizeToken(raw);
  console.log('    Token:', describeToken(token));
  console.log('');

  console.log('    Validando contra a API do Expo...');
  const check = await checkExpoToken(token);

  if (!check.ok) {
    console.error(`    ❌ Token inválido — ${check.reason}`);
    console.error(`       ${check.detail}`);
    console.error('');
    console.error('    O token NÃO foi gravado no GitHub.');
    console.error('');
    console.error('    Checklist:');
    console.error('      • Copiei o token completo (ele só aparece uma vez, na criação)?');
    console.error('      • Sem espaços no começo/fim e sem aspas?');
    console.error('      • Não revoguei o token em expo.dev/settings/access-tokens?');
    console.error('');
    console.error('    Alternativa sem prompt mascarado (mais confiável com Ctrl+V):');
    console.error('      $sec = Read-Host "token" -AsSecureString');
    console.error('      $env:EXPO_TOKEN = [System.Net.NetworkCredential]::new("", $sec).Password');
    console.error('      npm run eas:setup');
    process.exitCode = 1;
    return;
  }

  console.log(`    ✅ Token válido — conta: ${check.viewer.username} (${check.viewer.email})`);
  console.log('');

  /* ---------------- 2. Secret + Variable no GitHub ---------------- */
  console.log('2️⃣  Gravando o secret EXPO_TOKEN no GitHub Actions (criptografado)...');
  await setGitHubSecret('EXPO_TOKEN', token);
  console.log('    ✅ Secret gravado em', REPO);

  console.log('3️⃣  Garantindo a variable EAS_BUILD_ENABLED...');
  const varResult = await setGitHubVariable('EAS_BUILD_ENABLED', 'true');
  console.log(`    ✅ Variable EAS_BUILD_ENABLED = true (${varResult})`);

  const secrets = await listGitHubSecrets();
  const variables = await listGitHubVariables();
  console.log('');
  console.log('    Secrets no repositório:');
  secrets.forEach((s) => console.log(`      • ${s.name} (atualizado ${s.updated_at})`));
  console.log('    Variables no repositório:');
  variables.forEach((v) => console.log(`      • ${v.name} = ${v.value}`));

  /* ---------------- 3. Vincular projeto ao EAS ---------------- */
  console.log('');
  console.log('4️⃣  Vinculando o projeto ao EAS (eas init)...');
  if (hasProjectId()) {
    console.log('    ℹ️  O app.json já tem extra.eas.projectId — pulando.');
  } else {
    const result = spawnSync(
      'npx',
      ['--yes', 'eas-cli@latest', 'init', '--force', '--non-interactive'],
      {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, EXPO_TOKEN: token },
        shell: true,
      }
    );
    if (result.status !== 0) {
      console.error('   ❌ eas init falhou. Para ver o erro detalhado, rode:');
      console.error('      $env:EXPO_TOKEN = "..."; npx eas-cli@latest init --force --non-interactive');
      process.exitCode = 1;
      return;
    }
  }

  const app = readAppJson();
  if (app.expo?.extra?.eas?.projectId) {
    console.log(`    ✅ Projeto vinculado: ${app.expo.extra.eas.projectId}`);
  } else {
    console.log('    ⚠️  extra.eas.projectId ainda não aparece no app.json — verifique o eas init.');
  }

  console.log('');
  console.log('✅ Configuração concluída!');
  console.log('');
  console.log('Próximos passos:');
  console.log('  1. Faça o commit do app.json (projectId) e envie para o GitHub');
  console.log('  2. O CI dispara o build automaticamente (job "EAS Build (preview)")');
  console.log('  3. Ou rode localmente:  npm run eas:build:preview');
}

main().catch((err) => {
  console.error('');
  console.error('❌', err.message || err);
  process.exitCode = 1;
});
