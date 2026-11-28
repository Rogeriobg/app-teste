#!/usr/bin/env node
/**
 * Gate do seed de produção.
 *
 * O PsiApp é entregue SEM dados de teste: nenhum usuário, paciente ou
 * prontuário de demonstração. Este gate impede que um seed volte a ser
 * commitado acidentalmente. Os dados usados nos testes automatizados ficam
 * em __tests__/fixtures/database.json (mapeados no jest.config.js).
 */
const fs = require('fs');
const path = require('path');

const arquivo = path.join(__dirname, '..', 'database.json');
const seed = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const problemas = [];

for (const chave of ['users', 'patients', 'medicalRecords', 'appointments']) {
  if (!Array.isArray(seed[chave])) {
    problemas.push(`database.json: "${chave}" não é um array`);
  } else if (seed[chave].length !== 0) {
    problemas.push(
      `database.json: "${chave}" tem ${seed[chave].length} item(ns) de teste — deixe vazio`
    );
  }
}

const fixture = path.join(__dirname, '..', '__tests__', 'fixtures', 'database.json');
if (!fs.existsSync(fixture)) {
  problemas.push('__tests__/fixtures/database.json não encontrado (testes perdem o seed)');
}

if (problemas.length) {
  console.log('=== Gate do seed de produção ===');
  problemas.forEach((p) => console.log('  ✖ ' + p));
  console.log(`resultado: ${problemas.length} problema(s) ❌`);
  process.exit(1);
}

console.log('=== Gate do seed de produção ===');
console.log('resultado: VALIDO ✅ (app sem usuário/paciente de teste)');
