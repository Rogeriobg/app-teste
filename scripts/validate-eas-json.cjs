const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

async function main() {
  const schemaUrl =
    'https://raw.githubusercontent.com/expo/eas-cli/main/packages/eas-json/schema/eas.schema.json';

  const res = await fetch(schemaUrl);
  if (!res.ok) throw new Error(`Falha ao baixar schema: HTTP ${res.status}`);
  const schema = await res.json();

  const easJsonPath = path.join(__dirname, '..', 'eas.json');
  const data = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

  // o schema oficial é draft-06; o ajv 6 suporta draft-07 nativamente
  // (definitions continua válido em draft-07)
  schema.$schema = 'http://json-schema.org/draft-07/schema#';

  const ajv = new Ajv({ allErrors: true, schemaId: 'auto' });
  const validate = ajv.compile(schema);
  const valid = validate(data);

  console.log('=== eas.json vs schema oficial do EAS CLI ===');
  console.log('resultado:', valid ? 'VALIDO ✅' : 'INVALIDO ❌');
  if (!valid) {
    console.log(JSON.stringify(validate.errors, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log('\nperfis encontrados:', Object.keys(data.build).join(', '));
  console.log('perfis de submit:', Object.keys(data.submit || {}).join(', ') || '(nenhum)');

  // checagem estrita de chaves conhecidas (o EAS CLI e mais rigoroso que o schema)
  const KNOWN_PROFILE = new Set([
    'withoutCredentials', 'extends', 'credentialsSource', 'channel', 'releaseChannel',
    'distribution', 'developmentClient', 'prebuildCommand', 'node', 'corepack', 'yarn',
    'pnpm', 'bun', 'expoCli', 'env', 'autoIncrement', 'cache', 'buildArtifactPaths',
    'resourceClass', 'config', 'permissions', 'account', 'environment',
    'android', 'ios', 'uploadSourceMaps',
  ]);
  const KNOWN_ANDROID = new Set([
    'withoutCredentials', 'image', 'resourceClass', 'ndk', 'autoIncrement', 'buildType',
    'gradleCommand', 'applicationArchivePath', 'artifactPath', 'config',
  ]);
  const KNOWN_IOS = new Set([
    'withoutCredentials', 'simulator', 'enterpriseProvisioning', 'autoIncrement', 'image',
    'resourceClass', 'bundler', 'fastlane', 'cocoapods', 'scheme', 'buildConfiguration',
    'applicationArchivePath', 'artifactPath', 'config',
  ]);

  let problems = 0;
  for (const [name, profile] of Object.entries(data.build)) {
    for (const key of Object.keys(profile)) {
      if (!KNOWN_PROFILE.has(key)) {
        console.log(`  ✗ build.${name}.${key} -> chave desconhecida`);
        problems++;
      }
    }
    for (const key of Object.keys(profile.android || {})) {
      if (!KNOWN_ANDROID.has(key)) {
        console.log(`  ✗ build.${name}.android.${key} -> chave desconhecida`);
        problems++;
      }
    }
    for (const key of Object.keys(profile.ios || {})) {
      if (!KNOWN_IOS.has(key)) {
        console.log(`  ✗ build.${name}.ios.${key} -> chave desconhecida`);
        problems++;
      }
    }
  }
  console.log(
    problems === 0
      ? '\nchaves estritas: OK (nenhuma chave desconhecida) ✅'
      : `\nchaves estritas: ${problems} problema(s) ❌`
  );
  if (problems > 0) process.exitCode = 1;
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
});
