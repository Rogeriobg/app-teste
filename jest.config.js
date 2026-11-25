/**
 * Configuração do Jest para o PsiApp (Expo SDK 58 / Jest 30).
 *
 * - preset `jest-expo`: mocka a camada nativa do Expo SDK
 * - setupFilesAfterEnv: mocks de AsyncStorage, haptics, sharing, print, file-system e router
 * - moduleNameMapper: alias `@/` -> `src/` (mesmo mapping do tsconfig.json)
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // o cold start do Babel para o primeiro render pode exceder o default de 5s
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // lucide-react-native resolve para .mjs (ESM) sob a condição "react-native",
    // o que o Jest (CJS) não consegue carregar. Forçamos o build CommonJS.
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
    '^lucide-react-native/icons$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/index.js',
  },
  // helpers compartilhados não são suites de teste
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/helpers/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-safe-area-context|lucide-react-native)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
  ],
  // Piso de cobertura para as telas com testes dedicados.
  // O `*` no lugar de `[patientId]` evita que o glob interprete os colchetes
  // como uma classe de caracteres.
  coverageThreshold: {
    './src/app/patients/*/reports.tsx': {
      statements: 90,
      branches: 70,
      functions: 90,
      lines: 90,
    },
    './src/app/patients/*/export-pdf.tsx': {
      statements: 85,
      branches: 60,
      functions: 90,
      lines: 85,
    },
  },
};
