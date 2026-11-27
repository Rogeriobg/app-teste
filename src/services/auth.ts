import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

/**
 * Autenticação local do PsiApp — Etapa "Senha do usuário".
 *
 * ## Decisões de produto (confirmadas com o usuário)
 *
 * 1. Senha padrão + alteração no perfil
 * 2. Código de recuperação local de 6 dígitos
 *
 * ## Segurança
 *
 * - A senha **nunca** é guardada em texto puro: salvos apenas hashes
 *   SHA-256 com salt aleatório por instalação.
 * - As credenciais ficam em uma chave **separada** do banco
 *   (`@psi_app_auth_v1`), então `exportData()` (que exporta o banco) nunca
 *   inclui hash de senha nem código de recuperação.
 * - O diretório de config do app é privado ao próprio app no Android/iOS.
 */
const AUTH_KEY = '@psi_app_auth_v1';

/** Senha inicial, usada apenas até o psicólogo trocar no Perfil. */
export const SENHA_PADRAO = 'PsiApp2026';

export interface AuthState {
  /** Salt aleatório da instalação (hex). */
  salt: string;
  /** SHA-256(salt + senha). */
  passwordHash: string;
  /** SHA-256(salt + código de 6 dígitos). */
  recoveryCodeHash: string;
  /** `true` enquanto a senha padrão nunca foi trocada. */
  isDefault: boolean;
}

const bytesParaHex = (bytes: Uint8Array<ArrayBufferLike>): string =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const hash = async (salt: string, valor: string): Promise<string> =>
  Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${valor}`
  );

const ler = async (): Promise<AuthState | null> => {
  try {
    const raw = await AsyncStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
};

const gravar = async (state: AuthState): Promise<void> => {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(state));
};

const gerarCodigo = async (): Promise<string> => {
  const bytes = await Crypto.getRandomBytesAsync(4);
  const numero =
    (bytes[0] * 0x1000000 + bytes[1] * 0x10000 + bytes[2] * 0x100 + bytes[3]) %
    1000000;
  return String(numero).padStart(6, '0');
};

/**
 * Garante que existe um estado de autenticação.
 *
 * Em instalações antigas (que só tinham e-mail) cria o estado com a senha
 * padrão e um código de recuperação novo — sem apagar nenhum dado.
 */
export const ensureAuth = async (): Promise<AuthState> => {
  const existente = await ler();
  if (existente?.salt && existente?.passwordHash) return existente;

  const salt = bytesParaHex(await Crypto.getRandomBytesAsync(16));
  const codigo = await gerarCodigo();
  const state: AuthState = {
    salt,
    passwordHash: await hash(salt, SENHA_PADRAO),
    recoveryCodeHash: await hash(salt, codigo),
    isDefault: true,
  };
  await gravar(state);
  return state;
};

/** Verifica senha. Chamada pelo `login()` do AppContext. */
export const verifyPassword = async (senha: string): Promise<boolean> => {
  const auth = await ensureAuth();
  return (await hash(auth.salt, senha)) === auth.passwordHash;
};

/** Informa se a senha padrão ainda está ativa (para aviso no login). */
export const isDefaultPassword = async (): Promise<boolean> =>
  (await ensureAuth()).isDefault;

/**
 * Define uma nova senha e devolve o **novo código de recuperação**.
 *
 * O código é gerado de novo a cada troca (o antigo deixa de valer) e deve
 * ser exibido ao usuário **uma única vez**, para ele guardar em local seguro.
 */
export const setPassword = async (
  novaSenha: string
): Promise<{ recoveryCode: string }> => {
  const auth = await ensureAuth();
  const codigo = await gerarCodigo();
  await gravar({
    ...auth,
    passwordHash: await hash(auth.salt, novaSenha),
    recoveryCodeHash: await hash(auth.salt, codigo),
    isDefault: false,
  });
  return { recoveryCode: codigo };
};

/** Valida o código de recuperação de 6 dígitos. */
export const verifyRecoveryCode = async (codigo: string): Promise<boolean> => {
  const auth = await ensureAuth();
  return (await hash(auth.salt, codigo.trim())) === auth.recoveryCodeHash;
};

/** Redefine a senha usando o código de recuperação. */
export const resetPasswordWithCode = async (
  codigo: string,
  novaSenha: string
): Promise<boolean> => {
  if (!(await verifyRecoveryCode(codigo))) return false;
  const auth = await ensureAuth();
  await gravar({
    ...auth,
    passwordHash: await hash(auth.salt, novaSenha),
    isDefault: false,
  });
  return true;
};
