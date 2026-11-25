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
jest.mock('expo-file-system', () => ({
  Paths: {
    get cache() {
      return { uri: 'file:///cache/' };
    },
    get document() {
      return { uri: 'file:///documents/' };
    },
  },
  cacheDirectory: 'file:///cache/',
  documentDirectory: 'file:///documents/',
  writeAsStringAsync: jest.fn(async () => {}),
  readAsStringAsync: jest.fn(async () => ''),
  deleteAsync: jest.fn(async () => {}),
  getInfoAsync: jest.fn(async () => ({ exists: true })),
  makeDirectoryAsync: jest.fn(async () => {}),
}));

/* ---------- @react-native-community/datetimepicker ---------- */
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => React.createElement('DateTimePicker', props),
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
