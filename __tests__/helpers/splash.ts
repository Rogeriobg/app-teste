/**
 * Setup dos gates automáticos — expo-splash-screen.
 *
 * O ThemeProvider chama `SplashScreen.hideAsync()` quando termina de
 * carregar o tema. Sem este mock o teste falharia com módulo nativo.
 */
jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => undefined),
  hide: jest.fn(),
  setOptions: jest.fn(),
}));
