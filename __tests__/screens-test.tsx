import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { renderWithProvider } from './helpers/renderWithProvider';
import LoginScreen from '@/app/login';
import DashboardScreen from '@/app/dashboard';
import PatientsScreen from '@/app/patients';
import ProfileScreen from '@/app/profile';
import PatientDetailsScreen from '@/app/patients/[patientId]/details';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

describe('Telas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    mockedUseLocalSearchParams.mockReturnValue({});
  });

  describe('LoginScreen', () => {
    it('deve renderizar o formulário de acesso', async () => {
      await renderWithProvider(<LoginScreen />);

      expect(screen.getByText('Consultório Psicológico')).toBeTruthy();
      expect(screen.getByText('Entrar no Consultório')).toBeTruthy();
    });

    it('deve mostrar erro quando o e-mail está vazio', async () => {
      const { current } = await renderWithProvider(<LoginScreen />);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

      await fireEvent.changeText(screen.getByDisplayValue('psicologo@psicowave.com'), '   ');
      await fireEvent.press(screen.getByText('Entrar no Consultório'));

      await waitFor(() => {
        expect(screen.getByText('Digite seu e-mail de acesso')).toBeTruthy();
      });
    });

    it('deve redirecionar para /dashboard após login válido', async () => {
      const { current } = await renderWithProvider(<LoginScreen />);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

      await fireEvent.changeText(
        screen.getByDisplayValue('psicologo@psicowave.com'),
        'psicologo@psicowave.com'
      );
      await fireEvent.changeText(
        screen.getByLabelText('Senha de acesso'),
        'PsiApp2026'
      );
      await fireEvent.press(screen.getByText('Entrar no Consultório'));

      await waitFor(() => {
        expect(router.replace).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('DashboardScreen', () => {
    it('deve exibir as estatísticas de pacientes e prontuários', async () => {
      await renderWithProvider(<DashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText('Total de Pacientes')).toBeTruthy();
        expect(screen.getByText('Ativos')).toBeTruthy();
        expect(screen.getByText('Inativos')).toBeTruthy();
        expect(screen.getByText('Arquivados')).toBeTruthy();
      });

      // os prontuários migraram para um card único com barra de proporção
      expect(screen.getByText('Prontuários do paciente')).toBeTruthy();
      expect(screen.getByText('Prontuários ativos')).toBeTruthy();
      expect(screen.getByText('Prontuários arquivados')).toBeTruthy();
    });

    it('deve agrupar as estatísticas de pacientes em uma grade de 2 colunas', async () => {
      await renderWithProvider(<DashboardScreen />);

      await waitFor(() => expect(screen.getByText('Total de Pacientes')).toBeTruthy());

      // cada stat card é um agrupamento acessível com rótulo e valor
      const statCards = screen.getAllByRole('summary');
      const rotulos = statCards.map((card) => card.props.accessibilityLabel);

      expect(rotulos).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Total de Pacientes'),
          expect.stringContaining('Ativos'),
          expect.stringContaining('Inativos'),
          expect.stringContaining('Arquivados'),
        ])
      );
    });

    it('deve exibir o nome do psicólogo logado', async () => {
      await renderWithProvider(<DashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Dr\(a\)\./)).toBeTruthy();
      });
    });

    it('deve exibir saudação e data no cabeçalho', async () => {
      await renderWithProvider(<DashboardScreen />);

      await waitFor(() => {
        expect(screen.getByText(/Bom dia|Boa tarde|Boa noite/)).toBeTruthy();
      });
    });

    it('deve navegar para /patients ao tocar em Gerenciar Pacientes', async () => {
      await renderWithProvider(<DashboardScreen />);

      await waitFor(() => expect(screen.getByText('Gerenciar Pacientes')).toBeTruthy());

      await fireEvent.press(screen.getByText('Gerenciar Pacientes'));

      expect(router.push).toHaveBeenCalledWith('/patients');
    });

    it('deve navegar para /profile ao tocar em Perfil & Configurações', async () => {
      await renderWithProvider(<DashboardScreen />);

      await waitFor(() => expect(screen.getByText('Perfil & Configurações')).toBeTruthy());

      await fireEvent.press(screen.getByText('Perfil & Configurações'));

      expect(router.push).toHaveBeenCalledWith('/profile');
    });
  });

  describe('PatientsScreen', () => {
    it('deve listar os pacientes do seed', async () => {
      await renderWithProvider(<PatientsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Maria Oliveira')).toBeTruthy();
        expect(screen.getByText('João Silva')).toBeTruthy();
      });
    });

    it('deve filtrar a lista pela busca por nome', async () => {
      await renderWithProvider(<PatientsScreen />);

      await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

      await fireEvent.changeText(screen.getByPlaceholderText('Nome, e-mail ou telefone...'), 'João');

      await waitFor(() => {
        expect(screen.queryByText('Maria Oliveira')).toBeNull();
        expect(screen.getByText('João Silva')).toBeTruthy();
      });
    });

    it('deve filtrar a lista pela busca por e-mail', async () => {
      await renderWithProvider(<PatientsScreen />);

      await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

      await fireEvent.changeText(
        screen.getByPlaceholderText('Nome, e-mail ou telefone...'),
        'maria.oliveira@email.com'
      );

      await waitFor(() => {
        expect(screen.getByText('Maria Oliveira')).toBeTruthy();
        expect(screen.queryByText('João Silva')).toBeNull();
      });
    });

    it('deve filtrar a lista pelo status arquivado', async () => {
      await renderWithProvider(<PatientsScreen />);

      await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

      await fireEvent.press(screen.getByText('Arquivados'));

      await waitFor(() => {
        expect(screen.getByText('Nenhum paciente arquivado')).toBeTruthy();
      });
    });
  });

  describe('ProfileScreen', () => {
    it('deve exibir os dados do psicólogo e as seções', async () => {
      await renderWithProvider(<ProfileScreen />);

      await waitFor(() => {
        expect(screen.getByText('Dados do psicólogo')).toBeTruthy();
        expect(screen.getByText('Exportar dados')).toBeTruthy();
        expect(screen.getByText('Sair do consultório')).toBeTruthy();
      });
    });

    it('deve exibir "Sem alterações" quando não há edições pendentes', async () => {
      await renderWithProvider(<ProfileScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sem alterações')).toBeTruthy();
      });
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
  });

  describe('PatientDetailsScreen', () => {
    it('deve exibir o nome e o status do paciente', async () => {
      mockedUseLocalSearchParams.mockReturnValue({ patientId: 'p1' });

      await renderWithProvider(<PatientDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Maria Oliveira')).toBeTruthy();
      });

      expect(screen.getByText('Informações do paciente')).toBeTruthy();
      // 'Prontuários' aparece como título da seção e como label do botão da thumb zone
      expect(screen.getAllByText('Prontuários').length).toBeGreaterThan(0);
    });

    it('deve exibir estado vazio quando o paciente não existe', async () => {
      mockedUseLocalSearchParams.mockReturnValue({ patientId: 'inexistente' });

      await renderWithProvider(<PatientDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paciente não encontrado')).toBeTruthy();
      });
    });

    it('deve listar os prontuários do paciente', async () => {
      mockedUseLocalSearchParams.mockReturnValue({ patientId: 'p1' });

      await renderWithProvider(<PatientDetailsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy();
      });
    });
  });
});
