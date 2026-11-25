const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

async function main() {
  const res = await fetch('https://json.schemastore.org/github-workflow.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const schema = await res.json();

  const file = path.join(__dirname, '..', '.github', 'workflows', 'ci.yml');
  const yamlText = fs.readFileSync(file, 'utf8');
  const yaml = require('js-yaml');
  const doc = yaml.load(yamlText, { schema: yaml.JSON_SCHEMA });

  const ajv = new Ajv({ allErrors: true, strict: false, schemaId: 'auto' });
  const validate = ajv.compile(schema);
  const valid = validate(doc);

  console.log('=== .github/workflows/ci.yml vs schema oficial do GitHub ===');
  console.log('resultado:', valid ? 'VALIDO ✅' : 'INVALIDO ❌');
  if (!valid) {
    for (const e of validate.errors) {
      console.log(`  ${e.instancePath || '(root)'} ${e.message} [${e.keyword}]`);
      if (e.params && e.params.additionalProperty) {
        console.log(`     -> chave: "${e.params.additionalProperty}"`);
      }
    }
    process.exitCode = 1;
    return;
  }
  console.log('jobs:', Object.keys(doc.jobs || {}).join(', '));

  // O GitHub Actions restringe os contextos disponíveis em `jobs.<job_id>.if`.
  // Usar `secrets.` nesse ponto faz o workflow inteiro ser rejeitado com
  // "Invalid workflow file" (e nenhum job é criado).
  const ALLOWED_IN_JOB_IF = ['github', 'needs', 'vars', 'inputs'];
  let problems = 0;
  for (const [jobId, job] of Object.entries(doc.jobs || {})) {
    const expr = job.if || '';
    const used = [...expr.matchAll(/\b(secrets|env|steps|strategy|matrix|runner|job)\./g)].map(
      m => m[1]
    );
    for (const ctx of new Set(used)) {
      if (!ALLOWED_IN_JOB_IF.includes(ctx)) {
        console.log(
          `  ✗ jobs.${jobId}.if usa o contexto "${ctx}", indisponível nesse ponto ` +
            `(permitidos: ${ALLOWED_IN_JOB_IF.join(', ')}) -> workflow seria rejeitado`
        );
        problems++;
      }
    }
  }
  console.log(
    problems === 0
      ? 'contextos em jobs.<id>.if: OK ✅'
      : `contextos em jobs.<id>.if: ${problems} problema(s) ❌`
  );
  if (problems > 0) process.exitCode = 1;
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
