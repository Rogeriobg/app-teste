import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { renderWithProvider, mockAuthenticatedSession } from './helpers/renderWithProvider';
import { spyOnAlert, pressAlertButton } from './helpers/alert';
import PatientDetailsScreen from '@/app/patients/[patientId]/details';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;

describe('PatientDetailsScreen — fluxos', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAuthenticatedSession();
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    mockedUseLocalSearchParams.mockReturnValue({ patientId: 'p1' });
    alertSpy = spyOnAlert();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  /* ---------------------------------------------------------------- */
  /* Prontuários                                                      */
  /* ---------------------------------------------------------------- */

  it('deve abrir o modal de novo prontuário', async () => {
    await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Prontuários')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Cadastrar novo prontuário'));

    await waitFor(() => {
      expect(screen.getByText('Novo Prontuário')).toBeTruthy();
    });
    expect(screen.getByDisplayValue('Sessão Terapêutica')).toBeTruthy();
  });

  it('deve validar o título e o conteúdo do prontuário', async () => {
    await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Prontuários')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Cadastrar novo prontuário'));
    await waitFor(() => expect(screen.getByText('Novo Prontuário')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Título do prontuário'), '');
    await fireEvent.press(screen.getByText('Salvar Prontuário'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Informe o título do relatório.');
    });

    await fireEvent.changeText(screen.getByLabelText('Título do prontuário'), 'Sessão 02');
    await fireEvent.press(screen.getByText('Salvar Prontuário'));
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Informe o conteúdo do prontuário.');
    });
  });

  it('deve criar um novo prontuário', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Prontuários')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Cadastrar novo prontuário'));
    await waitFor(() => expect(screen.getByText('Novo Prontuário')).toBeTruthy());

    await fireEvent.changeText(
      screen.getByLabelText('Conteúdo do prontuário'),
      'Sessão de retorno com foco em grounding.'
    );
    await fireEvent.press(screen.getByText('Salvar Prontuário'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório salvo com sucesso!');
    });

    await waitFor(() => {
      const criado = current.db.medicalRecords.find((r) => r.title === 'Sessão Terapêutica');
      expect(criado).toBeTruthy();
      expect(criado?.patientId).toBe('p1');
      expect(criado?.status).toBe('Ativo');
      expect(criado?.archivedAt).toBeNull();
    });
  });

  it('deve editar um prontuário existente preservando status e data de criação', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Editar prontuário Sessão Inicial - Anamnese'));

    await waitFor(() => {
      expect(screen.getByText('Editar Prontuário')).toBeTruthy();
    });
    expect(screen.getByDisplayValue('Sessão Inicial - Anamnese')).toBeTruthy();

    await fireEvent.changeText(
      screen.getByDisplayValue('Sessão Inicial - Anamnese'),
      'Sessão Inicial - Revisada'
    );
    await fireEvent.press(screen.getByText('Salvar Prontuário'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório salvo com sucesso!');
    });

    await waitFor(() => {
      const editado = current.db.medicalRecords.find((r) => r.id === 'm1');
      expect(editado?.title).toBe('Sessão Inicial - Revisada');
      expect(editado?.status).toBe('Ativo');
      expect(editado?.createdAt).toBe('2026-11-13T14:00:00Z');
    });
  });

  it('deve arquivar um prontuário ativo', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Arquivar prontuário'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório arquivado.');
    });
    await waitFor(() => {
      const arquivado = current.db.medicalRecords.find((r) => r.id === 'm1');
      expect(arquivado?.status).toBe('Arquivado');
      expect(arquivado?.archivedAt).not.toBeNull();
    });
  });

  it('deve restaurar um prontuário arquivado', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Sessão de Acompanhamento')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Restaurar prontuário'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório restaurado.');
    });
    await waitFor(() => {
      const restaurado = current.db.medicalRecords.find((r) => r.id === 'm2');
      expect(restaurado?.status).toBe('Ativo');
      expect(restaurado?.archivedAt).toBeNull();
    });
  });

  it('deve excluir um prontuário somente após a confirmação', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Excluir prontuário Sessão Inicial - Anamnese'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmar exclusão',
        expect.stringContaining('Sessão Inicial - Anamnese'),
        expect.any(Array)
      );
    });

    expect(current.db.medicalRecords).toHaveLength(3);

    await pressAlertButton(alertSpy, 'Excluir');

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório excluído.');
    });
    await waitFor(() => {
      expect(current.db.medicalRecords).toHaveLength(2);
    });
  });

  it('deve manter o prontuário quando a exclusão é cancelada', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Excluir prontuário Sessão Inicial - Anamnese'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmar exclusão',
        expect.any(String),
        expect.any(Array)
      );
    });

    await pressAlertButton(alertSpy, 'Cancelar');

    expect(current.db.medicalRecords).toHaveLength(3);
  });

  /* ---------------------------------------------------------------- */
  /* Ações do paciente                                                */
  /* ---------------------------------------------------------------- */

  it('deve inativar o paciente', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Marcar paciente como inativo'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente marcado como Inativo.');
    });
    await waitFor(() => {
      expect(current.db.patients.find((p) => p.id === 'p1')?.status).toBe('Inativo');
    });
  });

  it('deve arquivar o paciente', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Arquivar paciente'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente arquivado.');
    });
    await waitFor(() => {
      expect(current.db.patients.find((p) => p.id === 'p1')?.status).toBe('Arquivado');
    });
  });

  it('deve restaurar o paciente arquivado', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Arquivar paciente'));

    await waitFor(() => {
      expect(screen.getByLabelText('Restaurar paciente')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Restaurar paciente'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente restaurado.');
    });
    await waitFor(() => {
      expect(current.db.patients.find((p) => p.id === 'p1')?.status).toBe('Ativo');
    });
  });

  it('deve excluir o paciente somente após a confirmação', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Excluir paciente e todos os prontuários'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmar exclusão',
        expect.stringContaining('Maria Oliveira'),
        expect.any(Array)
      );
    });

    expect(current.db.patients).toHaveLength(2);

    await pressAlertButton(alertSpy, 'Excluir');

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/patients');
    });
  });

  it('deve manter o paciente quando a exclusão é cancelada', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Excluir paciente e todos os prontuários'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmar exclusão',
        expect.any(String),
        expect.any(Array)
      );
    });

    await pressAlertButton(alertSpy, 'Cancelar');

    expect(router.replace).not.toHaveBeenCalled();
    expect(current.db.patients).toHaveLength(2);
  });

  /* ---------------------------------------------------------------- */
  /* Navegação e modais                                                */
  /* ---------------------------------------------------------------- */

  /**
   * Não existe mais uma "tela de prontuários" separada (QA-6). A ação
   * "Nova sessão" abre o formulário direto na tela de detalhes, que é a
   * fonte única de listagem e CRUD dos prontuários.
   */
  it('deve abrir o formulário de nova sessão pela ação Nova sessão', async () => {
    await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Registrar nova sessão'));

    await waitFor(() => {
      expect(screen.getByText('Novo Prontuário')).toBeTruthy();
    });
  });

  it('deve navegar para a tela de exportação em PDF', async () => {
    await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Exportar prontuário em PDF'));

    expect(router.push).toHaveBeenCalledWith('/patients/p1/export-pdf');
  });

  it('deve abrir o modal de edição do paciente', async () => {
    await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Editar dados do paciente'));

    await waitFor(() => {
      expect(screen.getByText('Editar Paciente')).toBeTruthy();
    });
    expect(screen.getByDisplayValue('maria.oliveira@email.com')).toBeTruthy();
    expect(screen.getByDisplayValue('(11) 98888-7777')).toBeTruthy();
  });

  it('deve salvar os dados editados do paciente', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Editar dados do paciente'));
    await waitFor(() => expect(screen.getByText('Editar Paciente')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Nome completo do paciente'), 'Maria da Silva');
    await fireEvent.changeText(screen.getByLabelText('E-mail do paciente'), 'maria.silva@email.com');
    await fireEvent.changeText(screen.getByLabelText('Telefone do paciente'), '(11) 90000-1111');
    await fireEvent.press(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Dados do paciente atualizados com sucesso!');
    });

    await waitFor(() => {
      const editado = current.db.patients.find((p) => p.id === 'p1');
      expect(editado?.name).toBe('Maria da Silva');
      expect(editado?.email).toBe('maria.silva@email.com');
      expect(editado?.phone).toBe('(11) 90000-1111');
      // id, status e createdAt preservados
      expect(editado?.id).toBe('p1');
      expect(editado?.status).toBe('Ativo');
      expect(editado?.createdAt).toBeTruthy();
    });
  });

  it('não deve alterar o paciente quando a edição é cancelada', async () => {
    const { current } = await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Editar dados do paciente'));
    await waitFor(() => expect(screen.getByText('Editar Paciente')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Nome completo do paciente'), 'Nome Descartado');
    await fireEvent.press(screen.getByText('Cancelar'));

    await waitFor(() => {
      const original = current.db.patients.find((p) => p.id === 'p1');
      expect(original?.name).toBe('Maria Oliveira');
    });
  });

  it('deve validar o nome do paciente no modal de edição', async () => {
    await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Editar dados do paciente'));
    await waitFor(() => expect(screen.getByText('Editar Paciente')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Nome completo do paciente'), '');
    await fireEvent.press(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(screen.getByText('Informe o nome do paciente.')).toBeTruthy();
    });
  });

  it('deve voltar para a tela anterior', async () => {
    await renderWithProvider(<PatientDetailsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Voltar'));

    expect(router.back).toHaveBeenCalled();
  });
});
