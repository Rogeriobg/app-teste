/**
 * Grava um secret do GitHub Actions usando a API oficial.
 *
 * A API do GitHub exige que o valor do secret seja criptografado com a chave
 * pública do repositório (libsodium `crypto_box_seal`) antes do envio.
 *
 * Uso:
 *   node scripts/set-github-secret.mjs <NOME_DO_SECRET> <VALOR>
 *
 * O valor também pode vir da variável de ambiente do mesmo nome, para não
 * ficar no histórico do shell:
 *   $env:EXPO_TOKEN = "..."; node scripts/set-github-secret.mjs EXPO_TOKEN
 *
 * A autenticação usa o token do Git Credential Manager (mesmo do `git push`).
 * Rode `npx eas-cli@latest login` antes se ainda não houver credencial.
 */

import { execFileSync } from 'node:child_process';
import sodium from 'libsodium-wrappers';

const REPO = 'Rogeriobg/app-teste';
const API = 'https://api.github.com';

function getGitHubToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const out = execFileSync('git', ['credential', 'fill'], { input, encoding: 'utf8' });
  const line = out.split(/\r?\n/).find((l) => l.startsWith('password='));
  if (!line) {
    throw new Error(
      'Não foi possível obter o token do GitHub via Git Credential Manager.\n' +
        'Faça login no GitHub (git push) e tente novamente.'
    );
  }
  return line.slice('password='.length);
}

function apiHeaders(token) {
  return {
    'User-Agent': 'psi-app-secret-setter',
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function main() {
  const name = process.argv[2];
  const value = process.argv[3] ?? process.env[name];

  if (!name) {
    console.error('Uso: node scripts/set-github-secret.mjs <NOME_DO_SECRET> [VALOR]');
    process.exitCode = 1;
    return;
  }
  if (!value) {
    console.error(`Valor não informado para "${name}".`);
    process.exitCode = 1;
    return;
  }

  const token = getGitHubToken();
  const headers = apiHeaders(token);

  // 1. chave pública do repositório
  const keyRes = await fetch(`${API}/repos/${REPO}/actions/secrets/public-key`, {
    headers,
  });
  if (!keyRes.ok) {
    throw new Error(`Falha ao obter a chave pública: HTTP ${keyRes.status} ${await keyRes.text()}`);
  }
  const { key_id, key } = await keyRes.json();

  // 2. criptografia do valor
  await sodium.ready;
  const binaryKey = Uint8Array.from(Buffer.from(key, 'base64'));
  const encrypted = sodium.crypto_box_seal(
    sodium.from_string(value),
    binaryKey
  );
  const encryptedValue = Buffer.from(encrypted).toString('base64');

  // 3. gravação
  const putRes = await fetch(`${API}/repos/${REPO}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ encrypted_value: encryptedValue, key_id }),
  });

  if (!putRes.ok) {
    throw new Error(`Falha ao gravar o secret: HTTP ${putRes.status} ${await putRes.text()}`);
  }

  console.log(`Secret "${name}" gravado no repositório ${REPO} ✅`);

  // 4. confirmação (a API nunca devolve o valor, apenas os metadados)
  const listRes = await fetch(`${API}/repos/${REPO}/actions/secrets`, { headers });
  const { secrets } = await listRes.json();
  const found = secrets.find((s) => s.name === name);
  console.log(
    found
      ? `  criado em ${found.created_at} | atualizado em ${found.updated_at}`
      : '  ATENÇÃO: o secret não apareceu na listagem.'
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
