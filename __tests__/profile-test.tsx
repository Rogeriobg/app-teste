import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import { writeAsStringAsync } from 'expo-file-system';
import { renderWithProvider } from './helpers/renderWithProvider';
import { spyOnAlert, pressAlertButton } from './helpers/alert';
import ProfileScreen from '@/app/profile';

const mockedShareAsync = shareAsync as jest.Mock;
const mockedWriteAsStringAsync = writeAsStringAsync as jest.Mock;

describe('ProfileScreen — fluxos', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    mockedShareAsync.mockImplementation(async () => undefined);
    mockedWriteAsStringAsync.mockImplementation(async () => undefined);
    alertSpy = spyOnAlert();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('deve exibir os dados do psicólogo logado', async () => {
    await renderWithProvider(<ProfileScreen />);

    await waitFor(() => {
      expect(screen.getByText('Dr(a). Psicólogo(a)')).toBeTruthy();
    });
    // o papel é exibido com textTransform uppercase, mas o texto bruto é minúsculo
    expect(screen.getByText('psicologo')).toBeTruthy();
    expect(screen.getByDisplayValue('psicologo@psicowave.com')).toBeTruthy();
  });

  it('deve habilitar o botão de salvar quando o nome é alterado', async () => {
    await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('Dr(a). Psicólogo(a)')).toBeTruthy());

    await fireEvent.changeText(
      screen.getByDisplayValue('Dr(a). Psicólogo(a)'),
      'Dra. Ana Costa'
    );

    await waitFor(() => {
      expect(screen.getByText('Salvar alterações')).toBeTruthy();
    });
  });

  it('deve validar que o nome do psicólogo foi informado', async () => {
    await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('Dr(a). Psicólogo(a)')).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue('Dr(a). Psicólogo(a)'), '   ');
    await fireEvent.press(screen.getByText('Salvar alterações'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Informe o nome do psicólogo.');
    });
  });

  it('deve validar que o e-mail de acesso foi informado', async () => {
    await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('psicologo@psicowave.com')).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue('psicologo@psicowave.com'), '');
    await fireEvent.press(screen.getByText('Salvar alterações'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Informe o e-mail de acesso.');
    });
  });

  it('deve salvar as alterações do nome e do e-mail', async () => {
    const { current } = await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByDisplayValue('Dr(a). Psicólogo(a)')).toBeTruthy());

    await fireEvent.changeText(
      screen.getByDisplayValue('Dr(a). Psicólogo(a)'),
      'Dra. Ana Costa'
    );
    await fireEvent.changeText(
      screen.getByDisplayValue('psicologo@psicowave.com'),
      'ana@psicowave.com'
    );
    await fireEvent.press(screen.getByText('Salvar alterações'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Dados atualizados com sucesso!');
    });

    await waitFor(() => {
      expect(current.currentUser?.name).toBe('Dra. Ana Costa');
      expect(current.currentUser?.email).toBe('ana@psicowave.com');
    });
  });

  it('deve exportar os dados como JSON e compartilhar o arquivo', async () => {
    await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText('Exportar dados (JSON)')).toBeTruthy());

    await fireEvent.press(screen.getByText('Exportar dados (JSON)'));

    await waitFor(() => {
      expect(mockedWriteAsStringAsync).toHaveBeenCalledTimes(1);
    });

    const [caminho, conteudo] = mockedWriteAsStringAsync.mock.calls[0];
    expect(caminho).toContain('psi_app_export_');
    const parsed = JSON.parse(conteudo);
    expect(parsed.patients).toHaveLength(2);
    expect(parsed.medicalRecords).toHaveLength(3);

    await waitFor(() => {
      expect(mockedShareAsync).toHaveBeenCalledWith(
        caminho,
        expect.objectContaining({ mimeType: 'application/json' })
      );
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Exportação iniciada',
      expect.stringContaining('2 paciente(s)')
    );
  });

  it('deve informar erro quando a exportação falha', async () => {
    mockedShareAsync.mockRejectedValueOnce(new Error('falha ao compartilhar'));

    await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText('Exportar dados (JSON)')).toBeTruthy());
    await fireEvent.press(screen.getByText('Exportar dados (JSON)'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível exportar os dados.');
    });
  });

  it('deve sair do consultório após a confirmação', async () => {
    await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText('Sair do consultório')).toBeTruthy());

    await fireEvent.press(screen.getByText('Sair do consultório'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Sair do consultório',
        expect.any(String),
        expect.any(Array)
      );
    });

    await pressAlertButton(alertSpy, 'Sair');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('deve cancelar a saída sem encerrar a sessão', async () => {
    const { current } = await renderWithProvider(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText('Sair do consultório')).toBeTruthy());
    await fireEvent.press(screen.getByText('Sair do consultório'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Sair do consultório',
        expect.any(String),
        expect.any(Array)
      );
    });

    await pressAlertButton(alertSpy, 'Cancelar');

    expect(router.replace).not.toHaveBeenCalled();
    expect(current.currentUser).not.toBeNull();
  });
});
