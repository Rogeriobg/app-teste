import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_THEME_STATE,
  type ThemeState,
} from './types';

/**
 * Persistência do tema (decisão D1).
 *
 * AsyncStorage e não MMKV: o app roda no Expo Go, e MMKV é módulo nativo
 * que exigiria dev build. A ausência de leitura síncrona é compensada
 * segurando a splash até `loadTheme()` terminar (ver `context.tsx`).
 */
const KEY = '@psi_app_theme_v1';

export const loadTheme = async (): Promise<ThemeState> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_THEME_STATE;
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    return {
      presetId: parsed.presetId ?? DEFAULT_THEME_STATE.presetId,
      custom: parsed.custom,
      fontScale: parsed.fontScale ?? DEFAULT_THEME_STATE.fontScale,
    };
  } catch {
    // storage corrompido não pode travar o app: volta ao padrão
    return DEFAULT_THEME_STATE;
  }
};

export const saveTheme = async (state: ThemeState): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // falha de escrita não deve quebrar a troca de tema na sessão atual
  }
};
