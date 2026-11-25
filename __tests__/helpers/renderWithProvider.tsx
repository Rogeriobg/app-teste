import React from 'react';
import { render } from '@testing-library/react-native';
import { AppProvider, useApp, AppContextData } from '@/context/AppContext';

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
