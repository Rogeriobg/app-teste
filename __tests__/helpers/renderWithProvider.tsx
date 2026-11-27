import React from 'react';
import { render } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp, AppContextData } from '@/context/AppContext';

/**
 * Simula uma sessão já autenticada para testes de telas internas.
 *
 * Antes da senha, o seed virava `currentUser` automaticamente — os testes
 * de dashboard/perfil/prontuários dependiam disso. Agora o login é
 * obrigatório, então eles precisam declarar a sessão explicitamente.
 *
 * Os testes de autenticação NÃO devem chamar isso (querem começar sem
 * sessão para verificar o fluxo de login).
 */
export function mockAsyncStorage() {
  const store: Record<string, string> = {};
  (AsyncStorage.getItem as jest.Mock).mockImplementation(
    async (key: string) => store[key] ?? null
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(
    async (key: string, value: string) => {
      store[key] = value;
    }
  );
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(
    async (key: string) => {
      delete store[key];
    }
  );
  return store;
}

export function mockAuthenticatedSession() {
  const store = mockAsyncStorage();
  store['@psi_app_session_v1'] = 'u1';
  store['@psi_app_current_user_v1'] = JSON.stringify({
    id: 'u1',
    name: 'Dr(a). Psicólogo(a)',
    email: 'psicologo@psicowave.com',
    role: 'psicologo',
  });
}

/**
 * Renderiza uma árvore dentro do AppProvider e expõe o contexto de forma viva.
 *
 * Nota: no RNTL 14 a API `render` é assíncrona.
 *
 * `current` é um Proxy que sempre lê o valor mais recente do contexto,
 * portanto continua válido mesmo após o destructuring
 * (`const { current } = await renderWithProvider(...)`).
 */
export async function renderWithProvider(ui: React.ReactElement) {
  const contextRef: { current: AppContextData | null } = { current: null };

  const Probe = () => {
    contextRef.current = useApp();
    return null;
  };

  const utils = await render(
    <AppProvider>
      <Probe />
      {ui}
    </AppProvider>
  );

  const liveContext = new Proxy({} as AppContextData, {
    get: (_target, prop) => {
      if (!contextRef.current) {
        throw new Error('AppProvider não está montado no teste.');
      }
      return (contextRef.current as unknown as Record<string | symbol, unknown>)[prop];
    },
    has: (_target, prop) => {
      if (!contextRef.current) return false;
      return prop in (contextRef.current as unknown as object);
    },
  });

  return {
    ...utils,
    /** Proxy com o contexto vivo (sempre o estado mais recente). */
    current: liveContext,
    /** Referência mutável ao contexto. */
    context: contextRef,
  };
}
