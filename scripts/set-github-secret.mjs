/**
 * Grava um secret do GitHub Actions usando a API oficial.
 *
 * A API do GitHub exige que o valor do secret seja criptografado com a chave
 * pública do repositório (libsodium `crypto_box_seal`) antes do envio.
 *
 * Uso:
 *   node scripts/set-github-secret.mjs <NOME_DO_SECRET> [VALOR]
 *
 * O valor também pode vir da variável de ambiente do mesmo nome, para não
 * ficar no histórico do shell:
 *   $env:EXPO_TOKEN = "..."; node scripts/set-github-secret.mjs EXPO_TOKEN
 *
 * A autenticação usa o token do Git Credential Manager (mesmo do `git push`).
 * Rode `npx eas-cli@latest login` antes se ainda não houver credencial.
 */

import { REPO, setGitHubSecret, listGitHubSecrets } from './lib/github-secrets.mjs';

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

  await setGitHubSecret(name, value);
  console.log(`Secret "${name}" gravado no repositório ${REPO} ✅`);

  const secrets = await listGitHubSecrets();
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
