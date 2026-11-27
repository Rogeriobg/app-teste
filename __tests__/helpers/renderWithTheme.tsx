import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/context';
import { AppProvider } from '@/context/AppContext';

/**
 * Renderiza com ThemeProvider + AppProvider — necessário para telas que
 * consomem tema (Etapa 6). O helper `renderWithProvider` só monta o
 * AppProvider e usa o fallback de tema (setters no-op).
 */
export async function renderWithTheme(ui: React.ReactElement) {
  return await render(
    <ThemeProvider>
      <AppProvider>{ui}</AppProvider>
    </ThemeProvider>
  );
}
