import React from 'react';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { renderWithProvider, mockAuthenticatedSession } from './helpers/renderWithProvider';
import { spyOnAlert, pressAlertButton } from './helpers/alert';
import PatientsScreen from '@/app/patients';
import { AppContext } from '@/context/AppContext';
import { render } from '@testing-library/react-native';

describe('PatientsScreen — fluxos', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    mockAuthenticatedSession();
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    alertSpy = spyOnAlert();
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  /* ---------------------------------------------------------------- */
  /* Cadastro                                                         */
  /* ---------------------------------------------------------------- */

  it('deve abrir o modal de cadastro com os campos vazios', async () => {
    await renderWithProvider(<PatientsScreen />);

    await fireEvent.press(screen.getByText('Novo Paciente'));

    await waitFor(() => {
      expect(screen.getByText('Cadastrar Novo Paciente')).toBeTruthy();
    });
    expect(screen.getAllByDisplayValue('').length).toBeGreaterThan(0);
    expect(screen.getByText('AAAA-MM-DD')).toBeTruthy();
  });

  it('deve validar que o nome do paciente foi informado', async () => {
    await renderWithProvider(<PatientsScreen />);

    await fireEvent.press(screen.getByText('Novo Paciente'));
    await waitFor(() => expect(screen.getByText('Cadastrar Novo Paciente')).toBeTruthy());

    await fireEvent.press(screen.getByText('Cadastrar'));

    // a validação acontece inline, no próprio campo
    await waitFor(() => {
      expect(screen.getByText('Informe o nome do paciente.')).toBeTruthy();
    });
  });

  it('deve validar que o e-mail do paciente foi informado', async () => {
    await renderWithProvider(<PatientsScreen />);

    await fireEvent.press(screen.getByText('Novo Paciente'));
    await waitFor(() => expect(screen.getByText('Cadastrar Novo Paciente')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Nome completo do paciente'), 'Ana Costa');
    await fireEvent.press(screen.getByText('Cadastrar'));

    await waitFor(() => {
      expect(screen.getByText('Informe o e-mail do paciente.')).toBeTruthy();
    });
  });

  it('deve cadastrar um novo paciente', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await fireEvent.press(screen.getByText('Novo Paciente'));
    await waitFor(() => expect(screen.getByText('Cadastrar Novo Paciente')).toBeTruthy());

    await fireEvent.changeText(screen.getByLabelText('Nome completo do paciente'), 'Ana Costa');
    await fireEvent.changeText(
      screen.getByLabelText('E-mail do paciente'),
      'ana.costa@email.com'
    );
    await fireEvent.changeText(screen.getByLabelText('Telefone do paciente'), '(11) 90000-0000');
    await fireEvent.changeText(
      screen.getByLabelText('Anamnese do paciente'),
      'Ansiedade e insônia.'
    );
    await fireEvent.press(screen.getByText('Cadastrar'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente cadastrado com sucesso!');
    });

    await waitFor(() => {
      const criado = current.db.patients.find((p) => p.name === 'Ana Costa');
      expect(criado).toBeTruthy();
      expect(criado?.email).toBe('ana.costa@email.com');
      expect(criado?.phone).toBe('(11) 90000-0000');
      expect(criado?.anamnesis).toBe('Ansiedade e insônia.');
      expect(criado?.status).toBe('Ativo');
    });
  });

  it('deve aplicar a data de nascimento pelo seletor nativo', async () => {
    await renderWithProvider(<PatientsScreen />);

    await fireEvent.press(screen.getByText('Novo Paciente'));
    await waitFor(() => expect(screen.getByText('Cadastrar Novo Paciente')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Selecionar data de nascimento'));

    const picker = screen.getByTestId('date-time-picker');
    await act(async () => {
      picker.props.onChange({}, new Date('1990-05-20T12:00:00Z'));
    });

    await waitFor(() => {
      expect(screen.getByText('1990-05-20')).toBeTruthy();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Edição                                                           */
  /* ---------------------------------------------------------------- */

  it('deve abrir o modal de edição preenchido com os dados do paciente', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Editar paciente Maria Oliveira'));

    await waitFor(() => {
      expect(screen.getByText('Editar Paciente')).toBeTruthy();
    });
    expect(screen.getByDisplayValue('Maria Oliveira')).toBeTruthy();
    expect(screen.getByDisplayValue('maria.oliveira@email.com')).toBeTruthy();
    // a data de nascimento é exibida no seletor nativo, não em um input
    expect(screen.getByText('1994-05-12')).toBeTruthy();
  });

  it('deve atualizar os dados do paciente', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Editar paciente Maria Oliveira'));
    await waitFor(() => expect(screen.getByText('Editar Paciente')).toBeTruthy());

    await fireEvent.changeText(screen.getByDisplayValue('Maria Oliveira'), 'Maria Oliveira Santos');
    await fireEvent.press(screen.getByText('Salvar Alterações'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente atualizado com sucesso!');
    });

    await waitFor(() => {
      const atualizado = current.db.patients.find((p) => p.id === 'p1');
      expect(atualizado?.name).toBe('Maria Oliveira Santos');
      // campos não editados são preservados
      expect(atualizado?.email).toBe('maria.oliveira@email.com');
      expect(atualizado?.status).toBe('Ativo');
      expect(atualizado?.createdAt).toBe('2026-10-01T10:00:00Z');
    });
  });

  /* ---------------------------------------------------------------- */
  /* Status / arquivamento / exclusão                                  */
  /* ---------------------------------------------------------------- */

  it('deve inativar um paciente ativo', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Inativar paciente Maria Oliveira'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente marcado como Inativo.');
    });
    await waitFor(() => {
      expect(current.db.patients.find((p) => p.id === 'p1')?.status).toBe('Inativo');
    });
  });

  it('deve reativar um paciente inativo', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('João Silva')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Reativar paciente João Silva'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente marcado como Ativo.');
    });
    await waitFor(() => {
      expect(current.db.patients.find((p) => p.id === 'p2')?.status).toBe('Ativo');
    });
  });

  it('deve arquivar um paciente', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Arquivar paciente Maria Oliveira'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente arquivado.');
    });
    await waitFor(() => {
      expect(current.db.patients.find((p) => p.id === 'p1')?.status).toBe('Arquivado');
    });
  });

  it('deve restaurar um paciente arquivado', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await current.archivePatient('p1');

    await waitFor(() => {
      expect(screen.getByLabelText('Restaurar paciente Maria Oliveira')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Restaurar paciente Maria Oliveira'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente restaurado para Ativo.');
    });
    await waitFor(() => {
      expect(current.db.patients.find((p) => p.id === 'p1')?.status).toBe('Ativo');
    });
  });

  it('deve excluir um paciente somente após a confirmação', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Excluir paciente Maria Oliveira'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmar Exclusão',
        expect.stringContaining('Maria Oliveira'),
        expect.any(Array)
      );
    });

    // antes da confirmação nada é removido
    expect(current.db.patients).toHaveLength(2);

    await pressAlertButton(alertSpy, 'Excluir');

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Paciente excluído.');
    });
    await waitFor(() => {
      expect(current.db.patients).toHaveLength(1);
      expect(current.db.patients.find((p) => p.id === 'p1')).toBeUndefined();
    });
  });

  it('deve manter o paciente quando a exclusão é cancelada', async () => {
    const { current } = await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Excluir paciente Maria Oliveira'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Confirmar Exclusão',
        expect.any(String),
        expect.any(Array)
      );
    });

    await pressAlertButton(alertSpy, 'Cancelar');

    expect(current.db.patients).toHaveLength(2);
  });

  /* ---------------------------------------------------------------- */
  /* Navegação e filtros                                              */
  /* ---------------------------------------------------------------- */

  it('deve navegar para os detalhes do paciente', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByLabelText('Ver detalhes do paciente Maria Oliveira'));

    expect(router.push).toHaveBeenCalledWith('/patients/p1/details');
  });

  it('deve filtrar pela tab Inativos', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByText('Inativos'));

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeTruthy();
      expect(screen.queryByText('Maria Oliveira')).toBeNull();
    });
  });

  it('deve filtrar pela tab Ativos', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByText('Ativos'));

    await waitFor(() => {
      expect(screen.getByText('Maria Oliveira')).toBeTruthy();
      expect(screen.queryByText('João Silva')).toBeNull();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Busca por telefone (A3)                                          */
  /* ---------------------------------------------------------------- */

  it('deve filtrar a lista pela busca por telefone formatado', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.changeText(
      screen.getByPlaceholderText('Nome, e-mail ou telefone...'),
      '(11) 98888-7777'
    );

    await waitFor(() => {
      expect(screen.getByText('Maria Oliveira')).toBeTruthy();
      expect(screen.queryByText('João Silva')).toBeNull();
    });
  });

  it('deve filtrar a lista pela busca por telefone apenas com dígitos', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.changeText(
      screen.getByPlaceholderText('Nome, e-mail ou telefone...'),
      '988887777'
    );

    await waitFor(() => {
      expect(screen.getByText('Maria Oliveira')).toBeTruthy();
      expect(screen.queryByText('João Silva')).toBeNull();
    });
  });

  /* ---------------------------------------------------------------- */
  /* Estados vazios contextuais (A4)                                 */
  /* ---------------------------------------------------------------- */

  it('deve mostrar o estado vazio da busca com o termo digitado', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.changeText(
      screen.getByPlaceholderText('Nome, e-mail ou telefone...'),
      'ninguem'
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum resultado para «ninguem»')).toBeTruthy();
    });
    expect(screen.getByText('Tente outro nome, e-mail ou telefone.')).toBeTruthy();
  });

  it('deve limpar a busca pela ação do estado vazio', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.changeText(
      screen.getByPlaceholderText('Nome, e-mail ou telefone...'),
      'ninguem'
    );
    await waitFor(() => {
      expect(screen.getByText('Nenhum resultado para «ninguem»')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Limpar busca'));

    await waitFor(() => {
      expect(screen.getByText('Maria Oliveira')).toBeTruthy();
      expect(screen.queryByText('Nenhum resultado para «ninguem»')).toBeNull();
    });
  });

  it('deve mostrar o estado vazio do filtro de status', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByText('Arquivados'));

    await waitFor(() => {
      expect(screen.getByText('Nenhum paciente arquivado')).toBeTruthy();
    });
    expect(screen.getByText('Ajuste o filtro ou cadastre um novo paciente.')).toBeTruthy();
  });

  it('deve voltar para todos os pacientes pela ação do estado vazio', async () => {
    await renderWithProvider(<PatientsScreen />);

    await waitFor(() => expect(screen.getByText('Maria Oliveira')).toBeTruthy());

    await fireEvent.press(screen.getByText('Arquivados'));
    await waitFor(() => {
      expect(screen.getByText('Nenhum paciente arquivado')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Ver todos os pacientes'));

    await waitFor(() => {
      expect(screen.getByText('Maria Oliveira')).toBeTruthy();
      expect(screen.queryByText('Nenhum paciente arquivado')).toBeNull();
    });
  });

  it('deve mostrar o estado vazio de primeiro uso quando nao ha pacientes', async () => {
    // contexto com banco vazio — simula o primeiro uso real do app
    const emptyContext = {
      db: { users: [], patients: [], medicalRecords: [] },
      currentUser: null,
      getPatientsByStatus: () => [],
      getRecordsByPatient: () => [],
    } as never;

    await render(
      <AppContext.Provider value={emptyContext}>
        <PatientsScreen />
      </AppContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum paciente cadastrado')).toBeTruthy();
    });
    expect(screen.getByText('Comece cadastrando seu primeiro paciente para abrir o prontuário.')).toBeTruthy();
    expect(screen.getByLabelText('Cadastrar primeiro paciente')).toBeTruthy();
  });

  it('deve abrir o cadastro a partir do estado vazio de primeiro uso', async () => {
    const emptyContext = {
      db: { users: [], patients: [], medicalRecords: [] },
      currentUser: null,
      getPatientsByStatus: () => [],
      getRecordsByPatient: () => [],
    } as never;

    await render(
      <AppContext.Provider value={emptyContext}>
        <PatientsScreen />
      </AppContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhum paciente cadastrado')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Cadastrar primeiro paciente'));

    await waitFor(() => {
      expect(screen.getByText('Cadastrar Novo Paciente')).toBeTruthy();
    });
  });
});
