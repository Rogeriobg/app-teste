/**
 * Funções compartilhadas para gerenciar secrets e variables do GitHub Actions
 * via API REST oficial.
 *
 * A API exige que o valor de um secret seja criptografado com a chave pública
 * do repositório (libsodium `crypto_box_seal`) antes do envio.
 */

import { execFileSync } from 'node:child_process';
import sodium from 'libsodium-wrappers';

export const REPO = 'Rogeriobg/app-teste';
const API = 'https://api.github.com';

/** Obtém o token do GitHub via Git Credential Manager (mesmo do `git push`). */
export function getGitHubToken() {
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

export function apiHeaders(token) {
  return {
    'User-Agent': 'psi-app-secret-setter',
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/** Grava (ou sobrescreve) um secret do GitHub Actions. */
export async function setGitHubSecret(name, value, token = getGitHubToken()) {
  const headers = apiHeaders(token);

  const keyRes = await fetch(`${API}/repos/${REPO}/actions/secrets/public-key`, { headers });
  if (!keyRes.ok) {
    throw new Error(
      `Falha ao obter a chave pública do repositório: HTTP ${keyRes.status} ${await keyRes.text()}`
    );
  }
  const { key_id, key } = await keyRes.json();

  await sodium.ready;
  const encrypted = sodium.crypto_box_seal(
    sodium.from_string(value),
    Uint8Array.from(Buffer.from(key, 'base64'))
  );

  const putRes = await fetch(`${API}/repos/${REPO}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      encrypted_value: Buffer.from(encrypted).toString('base64'),
      key_id,
    }),
  });

  if (!putRes.ok) {
    throw new Error(`Falha ao gravar o secret: HTTP ${putRes.status} ${await putRes.text()}`);
  }
  return true;
}

/** Grava (ou sobrescreve) uma variable do GitHub Actions. */
export async function setGitHubVariable(name, value, token = getGitHubToken()) {
  const headers = apiHeaders(token);
  const body = JSON.stringify({ name, value });

  const post = await fetch(`${API}/repos/${REPO}/actions/variables`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body,
  });

  if (post.ok) return 'created';

  // 422/409 = já existe → atualiza
  const patch = await fetch(`${API}/repos/${REPO}/actions/variables/${name}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body,
  });
  if (patch.ok) return 'updated';

  throw new Error(`Falha ao gravar a variable: HTTP ${patch.status} ${await patch.text()}`);
}

/** Lista os secrets do repositório (a API nunca devolve os valores). */
export async function listGitHubSecrets(token = getGitHubToken()) {
  const res = await fetch(`${API}/repos/${REPO}/actions/secrets`, {
    headers: apiHeaders(token),
  });
  if (!res.ok) throw new Error(`Falha ao listar secrets: HTTP ${res.status}`);
  const { secrets } = await res.json();
  return secrets;
}

/** Lista as variables do repositório. */
export async function listGitHubVariables(token = getGitHubToken()) {
  const res = await fetch(`${API}/repos/${REPO}/actions/variables`, {
    headers: apiHeaders(token),
  });
  if (!res.ok) throw new Error(`Falha ao listar variables: HTTP ${res.status}`);
  const { variables } = await res.json();
  return variables;
}
