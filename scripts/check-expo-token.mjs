/**
 * Diagnostica um personal access token do Expo chamando a API oficial.
 *
 * Uso:
 *   $env:EXPO_TOKEN = "eyJ..."
 *   npm run eas:check-token
 *
 * Mostra exatamente o que a API do Expo responde, para distinguir:
 *   - token inválido / expirado / revogado
 *   - token sem permissão na conta
 *   - token válido (e o username da conta)
 */

import { checkExpoToken, sanitizeToken, describeToken } from './lib/expo-token.mjs';

async function main() {
  const raw = process.env.EXPO_TOKEN ?? '';
  const token = sanitizeToken(raw);

  console.log('Token recebido:', describeToken(token));
  console.log('');

  if (!token) {
    console.error('EXPO_TOKEN não definido. Defina a variável de ambiente antes.');
    process.exitCode = 1;
    return;
  }

  const check = await checkExpoToken(token);

  if (check.ok) {
    console.log('✅ Token VÁLIDO');
    console.log('   conta :', check.viewer.username);
    console.log('   e-mail:', check.viewer.email);
    console.log('   id    :', check.viewer.id);
    console.log('');
    console.log('   Próximo passo: npm run eas:setup');
    return;
  }

  console.error('❌ Token inválido');
  console.error('   motivo:', check.reason);
  console.error('   detalhe:', check.detail);
  console.error('');
  console.error('Checklist:');
  console.error('  • Copiei o token completo (aparece só uma vez, na criação)?');
  console.error('  • Sem espaços no começo/fim e sem aspas?');
  console.error('  • O token não foi revogado em expo.dev/settings/access-tokens?');
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err.message || err);
  process.exitCode = 1;
});
