import {
  ensureAuth,
  verifyPassword,
  isDefaultPassword,
  setPassword,
  verifyRecoveryCode,
  resetPasswordWithCode,
  SENHA_PADRAO,
} from '@/services/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Autenticação local — senha do usuário', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const store: Record<string, string> = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (k: string) => store[k] ?? null);
    (AsyncStorage.setItem as jest.Mock).mockImplementation(async (k: string, v: string) => { store[k] = v; });
    // Ensure a new auth state for each test by clearing mocks of crypto
    await ensureAuth();
  });

  it('aceita a senha padrão no primeiro acesso', async () => {
    expect(await verifyPassword(SENHA_PADRAO)).toBe(true);
    expect(await verifyPassword('senha-errada')).toBe(false);
  });

  it('trocar senha gera código de 6 dígitos e invalida a anterior', async () => {
    const { recoveryCode } = await setPassword('NovaSenha123');

    expect(recoveryCode).toMatch(/^\d{6}$/);
    expect(await verifyRecoveryCode(recoveryCode)).toBe(true);
    expect(await verifyPassword('NovaSenha123')).toBe(true);
    expect(await verifyPassword(SENHA_PADRAO)).toBe(false);
    expect(await isDefaultPassword()).toBe(false);
  });

  it('rejeita código de recuperação errado', async () => {
    await setPassword('OutraSenha123');
    expect(await verifyRecoveryCode('000000')).toBe(false);
    expect(await resetPasswordWithCode('000000', 'Qualquer123')).toBe(false);
  });

  it('redefine a senha com o código correto', async () => {
    const { recoveryCode } = await setPassword('SenhaAntiga1');
    const ok = await resetPasswordWithCode(recoveryCode, 'SenhaNova123');

    expect(ok).toBe(true);
    expect(await verifyPassword('SenhaNova123')).toBe(true);
    expect(await verifyPassword('SenhaAntiga1')).toBe(false);
  });

  it('nunca grava a senha em texto puro no storage', async () => {
    await setPassword('SuperSecreta99');
    const raw = await AsyncStorage.getItem('@psi_app_auth_v1');
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('SuperSecreta99');
    expect(raw).not.toContain(SENHA_PADRAO);
    const parsed = JSON.parse(raw as string);
    expect(parsed.passwordHash).toMatch(/^[a-f0-9]{64}$/);
    expect(parsed.salt).toBeTruthy();
  });
});
