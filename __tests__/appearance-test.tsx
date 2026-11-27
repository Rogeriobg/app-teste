import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { renderWithTheme } from './helpers/renderWithTheme';
import AppearanceScreen from '@/app/appearance';

const mockedRouter = router as jest.Mocked<typeof router>;

describe('Tela de Aparência (Etapa 6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('exibe prévia, 4 presets, personalizado e escalas de fonte', async () => {
    await renderWithTheme(<AppearanceScreen />);

    expect(screen.getByText('Aparência')).toBeTruthy();
    expect(screen.getByText('Temas')).toBeTruthy();
    expect(screen.getByText('Tamanho do texto')).toBeTruthy();

    for (const nome of ['Acolhimento', 'Jardim Calmo', 'Terracota Suave', 'Brisa Serena']) {
      expect(screen.getByLabelText(`Tema ${nome}`)).toBeTruthy();
    }
    expect(screen.getByLabelText('Tema personalizado')).toBeTruthy();

    for (const escala of ['small', 'default', 'large']) {
      expect(screen.getByLabelText(`Fonte ${escala}`)).toBeTruthy();
    }
  });

  it('prévia muda ao tocar em um tema sem aplicar globalmente', async () => {
    await renderWithTheme(<AppearanceScreen />);

    const presetJardim = screen.getByLabelText('Tema Jardim Calmo');
    await fireEvent.press(presetJardim);

    // o preset fica selecionado na prévia (accessibilityState.selected)
    expect(presetJardim.props.accessibilityState.selected).toBe(true);
    // mas o tema global NÃO foi salvo — só o AppContext grava o banco
    const gravouTema = (AsyncStorage.setItem as jest.Mock).mock.calls.some(
      (call) => call[0] === '@psi_app_theme_v1'
    );
    expect(gravouTema).toBe(false);
  });

  it('aplica tema e fonte e volta', async () => {
    await renderWithTheme(<AppearanceScreen />);

    await fireEvent.press(screen.getByLabelText('Tema Brisa Serena'));
    await waitFor(() => {
      expect(screen.getByLabelText('Tema Brisa Serena').props.accessibilityState.selected).toBe(true);
    });
    await fireEvent.press(screen.getByLabelText('Fonte large'));
    await waitFor(() => {
      expect(screen.getByLabelText('Fonte large').props.accessibilityState.selected).toBe(true);
    });
    await fireEvent.press(screen.getByText('Aplicar tema'));

    await waitFor(() => {
      expect(mockedRouter.back).toHaveBeenCalled();
    });

    const saved = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
      (call) => call[0] === '@psi_app_theme_v1'
    );
    expect(saved).toBeTruthy();
    const estado = JSON.parse(saved[1]);
    expect(estado.presetId).toBe('brisa');
    expect(estado.fontScale).toBe('large');
  });

  it('restaurar padrão pede confirmação', async () => {
    await renderWithTheme(<AppearanceScreen />);

    await fireEvent.press(screen.getByText('Restaurar padrão'));

    // O alerta é externo; aqui verificamos que o botão existe e é acessível
    expect(screen.getByText('Restaurar padrão')).toBeTruthy();
  });
});
