/**
 * Setup global do Jest para o PsiApp.
 *
 * Mocks de módulos nativos do Expo/React Native que não funcionam
 * no ambiente de Node usado pelo Jest.
 */

/* ---------- AsyncStorage ---------- */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/* ---------- react-native-safe-area-context ---------- */
// o mock oficial é um default export
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

/* ---------- expo-haptics ---------- */
jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
    Rigid: 'rigid',
    Soft: 'soft',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

/* ---------- expo-sharing ---------- */
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn(async () => {}),
  isAvailableAsync: jest.fn(async () => true),
  getSharedPayloads: jest.fn(() => []),
  clearSharedPayloads: jest.fn(),
}));

/* ---------- expo-print ---------- */
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({ uri: 'file:///tmp/psi-app-test.pdf' })),
  printAsync: jest.fn(async () => {}),
  selectPrinterAsync: jest.fn(async () => ({ name: 'Test Printer', url: 'mock://printer' })),
}));

/* ---------- expo-file-system ---------- */
/**
 * Mock da API **nova** (`File`, `Directory`, `Paths`) e da antiga
 * (`writeAsStringAsync`, `cacheDirectory`...).
 *
 * A API nova é usada pela exportação de PDF: o conteúdo do PDF (base64
 * vindo do `expo-print`) é escrito em `new File(Paths.document, 'x.pdf')`
 * antes de ser compartilhado — porque nem o `FileProvider` do
 * `expo-sharing` nem o `expo-file-system` conseguem ler o diretório
 * `Print/` do cache onde o `expo-print` grava.
 */
jest.mock('expo-file-system', () => {
  /** Escritas feitas via `File.write()` — para asserções dos testes. */
  const writes: Array<{ uri: string; content: unknown; options?: unknown }> = [];
  /** Instâncias de `File` criadas — para asserções dos testes. */
  const instances: Array<Record<string, jest.Mock>> = [];

  const makeFile = (uri: string) => {
    const parts = uri.split('/').filter(Boolean);
    const name = parts[parts.length - 1] ?? '';
    return {
      uri,
      name,
      extension: name.includes('.') ? `.${name.split('.').pop()}` : '',
      size: 1024,
      type: 'application/pdf',
      exists: true,
      create: jest.fn(),
      delete: jest.fn(),
      copy: jest.fn(async () => undefined),
      move: jest.fn(async () => undefined),
      write: jest.fn(async (content: unknown, options?: unknown) => {
        writes.push({ uri, content, options });
      }),
      text: jest.fn(async () => ''),
      base64: jest.fn(async () => ''),
    };
  };

  class FileMock {
    constructor(...parts: unknown[]) {
      const flat = parts
        .map((p) => {
          if (typeof p === 'string') return p;
          if (p && typeof p === 'object' && 'uri' in p) return String((p as { uri: string }).uri);
          return '';
        })
        .filter(Boolean)
        .join('/');
      Object.assign(this, makeFile(flat || 'file:///cache/file.pdf'));
      instances.push(this as unknown as Record<string, jest.Mock>);
    }
    static canPreview = jest.fn(async () => true);
    static preview = jest.fn(async () => undefined);
    /** Histórico global de escritas (`File.write`). */
    static __writes = writes;
    /** Instâncias criadas (`new File(...)`). */
    static __instances = instances;
  }

  class DirectoryMock {
    constructor(...parts: unknown[]) {
      const flat = parts
        .map((p) => {
          if (typeof p === 'string') return p;
          if (p && typeof p === 'object' && 'uri' in p) return String((p as { uri: string }).uri);
          return '';
        })
        .filter(Boolean)
        .join('/');
      Object.assign(this, makeFile(flat || 'file:///cache/'));
    }
    create = jest.fn();
    delete = jest.fn();
    list = jest.fn(() => []);
  }

  return {
    File: FileMock,
    Directory: DirectoryMock,
    Paths: {
      cache: { uri: 'file:///cache/' },
      document: { uri: 'file:///documents/' },
      bundle: { uri: 'file:///bundle/' },
    },
    /* API legada */
    cacheDirectory: 'file:///cache/',
    documentDirectory: 'file:///documents/',
    writeAsStringAsync: jest.fn(async () => {}),
    readAsStringAsync: jest.fn(async () => ''),
    deleteAsync: jest.fn(async () => {}),
    getInfoAsync: jest.fn(async () => ({ exists: true })),
    makeDirectoryAsync: jest.fn(async () => {}),
  };
});

/* ---------- expo-crypto (senha do usuario) ----------
 * Implementação determinística com o crypto do Node para os testes.
 */
jest.mock('expo-crypto', () => {
  const nodeCrypto = require('crypto');
  return {
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: jest.fn(async (_alg: string, data: string) =>
      nodeCrypto.createHash('sha256').update(data).digest('hex')
    ),
    getRandomBytesAsync: jest.fn(async (n: number) =>
      new Uint8Array(nodeCrypto.randomBytes(n))
    ),
    getRandomBytes: jest.fn((n: number) => new Uint8Array(nodeCrypto.randomBytes(n))),
    randomUUID: jest.fn(() => nodeCrypto.randomUUID()),
  };
});

/* ---------- reanimated-color-picker (Etapa 6 / P8) ----------
 * O picker usa worklets de verdade; no Jest basta um mock que expose
 * os componentes para a tela de Aparência poder ser testada.
 */
jest.mock('reanimated-color-picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children, onComplete }: { children?: unknown; onComplete?: (c: { hex: string }) => void }) =>
      React.createElement(View, { testID: 'color-picker', onColorChange: onComplete }, children),
    Panel3: () => React.createElement(View, { testID: 'color-panel' }),
    Preview: () => React.createElement(View, { testID: 'color-preview' }),
  };
});

/* ---------- expo-splash-screen (Etapa 6 / D1) ---------- */
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => undefined),
  hide: jest.fn(),
  setOptions: jest.fn(),
}));

/* ---------- @react-native-community/datetimepicker ---------- */
// expõe um testID para que os testes possam encontrar e acionar o picker
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement('DateTimePicker', { testID: 'date-time-picker', ...props }),
  };
});

/* ---------- expo-router ---------- */
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismiss: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: jest.fn(() => true),
    setParams: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismiss: jest.fn(),
  }),
  useLocalSearchParams: jest.fn(() => ({})),
  useGlobalSearchParams: jest.fn(() => ({})),
  Link: ({ children }: { children: React.ReactNode }) => children,
  Stack: Object.assign(
    jest.fn(),
    {
      Navigator: jest.fn(),
      Screen: jest.fn(),
      Group: jest.fn(),
    }
  ),
  Tabs: Object.assign(
    jest.fn(),
    {
      Navigator: jest.fn(),
      Screen: jest.fn(),
    }
  ),
}));
