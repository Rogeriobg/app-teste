import { act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { renderWithProvider, mockAuthenticatedSession, mockAsyncStorage } from './helpers/renderWithProvider';
import { Appointment, MedicalRecord, NewAppointment, Patient } from '@/context/AppContext';

const DB_KEY = '@psi_app_db_json_v1';
const USER_KEY = '@psi_app_current_user_v1';

describe('AppContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Autenticação', () => {
    it('deve iniciar sem sessão até autenticar (senha obrigatória)', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));
      expect(current.currentUser).toBeNull();
    });

    it('deve autenticar com e-mail válido (case-insensitive)', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));

      let result = false;
      await act(async () => {
        result = await current.login('PSICOLOGO@PSICOWAVE.COM', 'PsiApp2026');
      });

      expect(result).toBe(true);
      expect(current.currentUser?.email).toBe('psicologo@psicowave.com');
    });

    it('deve rejeitar e-mail não cadastrado', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));

      let result = true;
      await act(async () => {
        result = await current.login('nao-cadastrado@email.com', 'PsiApp2026');
      });

      expect(result).toBe(false);
    });

    it('deve persistir o usuário logado no AsyncStorage', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));

      await act(async () => {
        await current.login('psicologo@psicowave.com', 'PsiApp2026');
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        USER_KEY,
        expect.stringContaining('psicologo@psicowave.com')
      );
    });

    it('deve encerrar a sessão e remover o usuário do storage', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));

      await act(async () => {
        await current.logout();
      });

      expect(current.currentUser).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(USER_KEY);
      // o botão de saída do header deve voltar ao login (não só limpar a sessão)
      expect(router.replace).toHaveBeenCalledWith('/login');
    });
  });

  describe('updateUser', () => {
    // operações de perfil exigem sessão autenticada (senha obrigatória)
    beforeEach(() => mockAuthenticatedSession());

    it('deve atualizar nome e e-mail do usuário logado', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));

      await act(async () => {
        await current.updateUser({ name: 'Dra. Ana Costa', email: 'ana@psicowave.com' });
      });

      expect(current.currentUser?.name).toBe('Dra. Ana Costa');
      expect(current.currentUser?.email).toBe('ana@psicowave.com');
    });

    it('deve persistir o usuário atualizado no AsyncStorage', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));

      await act(async () => {
        await current.updateUser({ name: 'Dra. Ana Costa' });
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        USER_KEY,
        expect.stringContaining('Dra. Ana Costa')
      );
    });

    it('não deve alterar o usuário quando não há sessão ativa', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));
      await act(async () => {
        await current.logout();
      });

      await act(async () => {
        await current.updateUser({ name: 'Sem sessão' });
      });

      expect(current.currentUser).toBeNull();
    });

    it('deve atualizar db.users para que o novo e-mail sirva para login', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));
      await act(async () => {
        await current.updateUser({ email: 'novo.email@psicowave.com' });
      });

      await waitFor(() =>
        expect(current.db.users[0].email).toBe('novo.email@psicowave.com')
      );
      await act(async () => {
        await current.logout();
      });
      let ok = false;
      await act(async () => {
        ok = await current.login('novo.email@psicowave.com', 'PsiApp2026');
      });
      expect(ok).toBe(true);
    });
  });

  describe('registerUser', () => {
    // precisa de storage com persistência real: a senha é gravada e depois
    // lida por verifyPassword() no login
    beforeEach(() => mockAsyncStorage());

    it('cadastra e-mail/senha reais, substitui o padrão e não cria sessão', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));
      const pacientesAntes = current.db.patients.length;
      const prontuariosAntes = current.db.medicalRecords.length;

      let recoveryCode = '';
      await act(async () => {
        const r = await current.registerUser({
          name: 'Dra. Maria Oliveira',
          email: 'maria@consultorio.com',
          senha: 'MinhaSenha123',
        });
        recoveryCode = r.recoveryCode;
      });

      expect(recoveryCode).toMatch(/^\d{6}$/);
      expect(current.db.users[0].email).toBe('maria@consultorio.com');
      expect(current.db.users[0].name).toBe('Dra. Maria Oliveira');
      // cadastro não autentica — o usuário volta ao login
      expect(current.currentUser).toBeNull();
      // dados clínicos preservados
      expect(current.db.patients).toHaveLength(pacientesAntes);
      expect(current.db.medicalRecords).toHaveLength(prontuariosAntes);

      // o e-mail antigo não serve mais; o novo entra com a nova senha
      let antigo = true;
      let novo = false;
      await act(async () => {
        antigo = await current.login('psicologo@psicowave.com', 'PsiApp2026');
      });
      await act(async () => {
        novo = await current.login('maria@consultorio.com', 'MinhaSenha123');
      });
      expect(antigo).toBe(false);
      expect(novo).toBe(true);
    });

    it('cria o usuário do zero quando o banco está vazio (instalação limpa)', async () => {
      // instalação nova: seed vazio, nenhum usuário para substituir
      const store = mockAsyncStorage();
      store['@psi_app_db_json_v1'] = JSON.stringify({
        users: [],
        patients: [],
        medicalRecords: [],
      });

      const { current } = await renderWithProvider(<></>);
      await waitFor(() => expect(current.authReady).toBe(true));
      expect(current.db.users).toHaveLength(0);

      await act(async () => {
        await current.registerUser({
          name: 'Dra. Real Usuária',
          email: 'real@consultorio.com',
          senha: 'SenhaVerdadeira123',
        });
      });

      expect(current.db.users).toHaveLength(1);
      expect(current.db.users[0]).toEqual(
        expect.objectContaining({
          name: 'Dra. Real Usuária',
          email: 'real@consultorio.com',
          role: 'psicologo',
        })
      );

      let ok = false;
      await act(async () => {
        ok = await current.login('real@consultorio.com', 'SenhaVerdadeira123');
      });
      expect(ok).toBe(true);
    });

    it('rejeita a senha antiga após o cadastro', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.authReady).toBe(true));
      await act(async () => {
        await current.registerUser({
          name: 'Dr. João',
          email: 'joao@consultorio.com',
          senha: 'SenhaNova456',
        });
      });

      let ok = true;
      await act(async () => {
        ok = await current.login('joao@consultorio.com', 'PsiApp2026');
      });
      expect(ok).toBe(false);
    });
  });

  describe('Pacientes', () => {
    it('deve cadastrar um novo paciente com id e createdAt gerados', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));
      const before = current.db.patients.length;

      await act(async () => {
        await current.addPatient({
          name: 'Carlos Souza',
          email: 'carlos@email.com',
          phone: '(11) 90000-0000',
          birthDate: '1990-01-01',
          anamnesis: 'Queixa inicial',
          status: 'Ativo',
        });
      });

      expect(current.db.patients).toHaveLength(before + 1);
      const created = current.db.patients[0];
      expect(created.id).toMatch(/^p_\d+$/);
      expect(created.name).toBe('Carlos Souza');
      expect(created.createdAt).toEqual(expect.any(String));
    });

    it('deve persistir o novo paciente no AsyncStorage', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));

      await act(async () => {
        await current.addPatient({
          name: 'Carlos Souza',
          email: 'carlos@email.com',
          phone: '',
          birthDate: '',
          anamnesis: '',
          status: 'Ativo',
        });
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        DB_KEY,
        expect.stringContaining('Carlos Souza')
      );
    });

    it('deve atualizar os dados de um paciente existente', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));
      const target = current.db.patients[0];

      const updated: Patient = {
        ...target,
        name: 'Maria Oliveira Silva',
        phone: '(11) 91111-1111',
      };

      await act(async () => {
        await current.updatePatient(updated);
      });

      const found = current.db.patients.find((p: Patient) => p.id === target.id);
      expect(found?.name).toBe('Maria Oliveira Silva');
      expect(found?.phone).toBe('(11) 91111-1111');
    });

    it('deve alternar o status entre Ativo e Inativo', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));
      const target = current.db.patients.find((p: Patient) => p.status === 'Ativo');
      expect(target).toBeDefined();

      await act(async () => {
        await current.togglePatientStatus(target!.id);
      });

      expect(current.db.patients.find((p: Patient) => p.id === target!.id)?.status).toBe('Inativo');

      await act(async () => {
        await current.togglePatientStatus(target!.id);
      });

      expect(current.db.patients.find((p: Patient) => p.id === target!.id)?.status).toBe('Ativo');
    });

    it('deve arquivar e restaurar um paciente', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));
      const target = current.db.patients[0];

      await act(async () => {
        await current.archivePatient(target.id);
      });
      expect(current.db.patients.find((p: Patient) => p.id === target.id)?.status).toBe('Arquivado');

      await act(async () => {
        await current.restorePatient(target.id);
      });
      expect(current.db.patients.find((p: Patient) => p.id === target.id)?.status).toBe('Ativo');
    });

    it('deve excluir o paciente e todos os seus prontuários', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));
      const target = current.db.patients.find(
        (p: Patient) => current.db.medicalRecords.some((r: MedicalRecord) => r.patientId === p.id)
      );
      expect(target).toBeDefined();

      const recordsBefore = current.db.medicalRecords.length;
      const targetRecords = current.db.medicalRecords.filter(
        (r: MedicalRecord) => r.patientId === target!.id
      ).length;

      await act(async () => {
        await current.deletePatient(target!.id);
      });

      expect(current.db.patients.find((p: Patient) => p.id === target!.id)).toBeUndefined();
      expect(current.db.medicalRecords).toHaveLength(recordsBefore - targetRecords);
      expect(
        current.db.medicalRecords.some((r: MedicalRecord) => r.patientId === target!.id)
      ).toBe(false);
    });
  });

  describe('Prontuários / Relatórios', () => {
    it('deve criar um prontuário com id, createdAt e archivedAt', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));
      const patient = current.db.patients[0];
      const before = current.db.medicalRecords.length;

      await act(async () => {
        await current.addMedicalRecord({
          patientId: patient.id,
          patientName: patient.name,
          title: 'Sessão 01',
          date: '2026-11-25',
          content: 'Conteúdo do prontuário',
          privateNotes: 'Notas privadas',
          status: 'Ativo',
        });
      });

      expect(current.db.medicalRecords).toHaveLength(before + 1);
      const created = current.db.medicalRecords[0];
      expect(created.id).toMatch(/^m_\d+$/);
      expect(created.createdAt).toEqual(expect.any(String));
      expect(created.archivedAt).toBeNull();
    });

    it('deve atualizar um prontuário preservando status e archivedAt', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.medicalRecords.length).toBeGreaterThan(0));
      const target = current.db.medicalRecords[0];

      const updated: MedicalRecord = { ...target, title: 'Título revisado' };

      await act(async () => {
        await current.updateMedicalRecord(updated);
      });

      const found = current.db.medicalRecords.find((r: MedicalRecord) => r.id === target.id);
      expect(found?.title).toBe('Título revisado');
      expect(found?.status).toBe(target.status);
      expect(found?.archivedAt).toBe(target.archivedAt);
    });

    it('deve arquivar e restaurar um prontuário', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.medicalRecords.length).toBeGreaterThan(0));
      const target = current.db.medicalRecords.find((r: MedicalRecord) => r.status === 'Ativo');
      expect(target).toBeDefined();

      await act(async () => {
        await current.archiveMedicalRecord(target!.id);
      });
      const archived = current.db.medicalRecords.find((r: MedicalRecord) => r.id === target!.id);
      expect(archived?.status).toBe('Arquivado');
      expect(archived?.archivedAt).toEqual(expect.any(String));

      await act(async () => {
        await current.restoreMedicalRecord(target!.id);
      });
      const restored = current.db.medicalRecords.find((r: MedicalRecord) => r.id === target!.id);
      expect(restored?.status).toBe('Ativo');
      expect(restored?.archivedAt).toBeNull();
    });

    it('deve excluir um prontuário', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.medicalRecords.length).toBeGreaterThan(0));
      const target = current.db.medicalRecords[0];
      const before = current.db.medicalRecords.length;

      await act(async () => {
        await current.deleteMedicalRecord(target.id);
      });

      expect(current.db.medicalRecords).toHaveLength(before - 1);
      expect(current.db.medicalRecords.find((r: MedicalRecord) => r.id === target.id)).toBeUndefined();
    });
  });

  describe('Helpers', () => {
    it('getPatientsByStatus deve filtrar pelo status informado', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));

      const ativos = current.getPatientsByStatus('Ativo');
      expect(ativos.every((p: Patient) => p.status === 'Ativo')).toBe(true);

      const arquivados = current.getPatientsByStatus('Arquivado');
      expect(arquivados.every((p: Patient) => p.status === 'Arquivado')).toBe(true);
    });

    it('getRecordsByPatient deve retornar apenas prontuários do paciente', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.medicalRecords.length).toBeGreaterThan(0));
      const patient = current.db.patients[0];

      const records = current.getRecordsByPatient(patient.id);
      expect(records.every((r: MedicalRecord) => r.patientId === patient.id)).toBe(true);
    });
  });

  describe('Agendamentos (Etapa 7 / G1)', () => {
    const novoAtendimento = (patientId = 'p1'): NewAppointment => ({
      patientId,
      startsAt: '2026-12-10T14:00:00-03:00',
      timeZone: 'America/Sao_Paulo',
      durationMin: 50,
      level: 'normal',
      contactedAt: '2026-12-01T10:00:00Z',
      notes: 'Sessao de teste G1',
      reminderMinutesBefore: 5,
    });

    it('cria com id, createdAt e status agendado', async () => {
      const { current } = await renderWithProvider(<></>);
      await waitFor(() => expect(current.authReady).toBe(true));

      let criado: Appointment | null = null;
      await act(async () => {
        criado = await current.addAppointment(novoAtendimento());
      });

      expect(criado).not.toBeNull();
      expect(criado!.id).toMatch(/^a_\d+$/);
      expect(criado!.createdAt).toEqual(expect.any(String));
      expect(criado!.status).toBe('agendado');
      expect(criado!.patientId).toBe('p1');
      expect(criado!.reminderMinutesBefore).toBe(5);
      expect(current.db.appointments).toHaveLength(1);
    });

    it('edita e exclui um atendimento', async () => {
      const { current } = await renderWithProvider(<></>);
      await waitFor(() => expect(current.authReady).toBe(true));

      let criado: Appointment | null = null;
      await act(async () => {
        criado = await current.addAppointment(novoAtendimento());
      });
      const editado: Appointment = { ...criado!, status: 'realizado', notes: 'Concluida' };
      await act(async () => {
        await current.updateAppointment(editado);
      });
      expect(current.db.appointments[0].status).toBe('realizado');
      expect(current.db.appointments[0].notes).toBe('Concluida');

      await act(async () => {
        await current.removeAppointment(criado!.id);
      });
      expect(current.db.appointments).toHaveLength(0);
    });

    it('persiste o atendimento no AsyncStorage', async () => {
      const { current } = await renderWithProvider(<></>);
      await waitFor(() => expect(current.authReady).toBe(true));

      await act(async () => {
        await current.addAppointment(novoAtendimento());
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        DB_KEY,
        expect.stringContaining('Sessao de teste G1')
      );
    });

    it('migra bancos antigos sem o campo appointments', async () => {
      const store = mockAsyncStorage();
      store['@psi_app_db_json_v1'] = JSON.stringify({
        users: [],
        patients: [],
        medicalRecords: [],
      });

      const { current } = await renderWithProvider(<></>);
      await waitFor(() => expect(current.authReady).toBe(true));
      expect(current.db.appointments).toEqual([]);
    });

    it('inclui a agenda no backup JSON exportado', async () => {
      const { writeAsStringAsync } = require('expo-file-system');
      const { current } = await renderWithProvider(<></>);
      await waitFor(() => expect(current.authReady).toBe(true));

      await act(async () => {
        await current.addAppointment(novoAtendimento());
      });
      await act(async () => {
        await current.exportData();
      });

      const conteudo = (writeAsStringAsync as jest.Mock).mock.calls[0][1];
      expect(conteudo).toContain('Sessao de teste G1');
      expect(JSON.parse(conteudo).appointments).toHaveLength(1);
    });
  });

  describe('exportData', () => {
    it('deve gerar o arquivo JSON e compartilhar', async () => {
      const { shareAsync } = require('expo-sharing');
      const { writeAsStringAsync } = require('expo-file-system');

      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.db.patients.length).toBeGreaterThan(0));

      await act(async () => {
        await current.exportData();
      });

      expect(writeAsStringAsync).toHaveBeenCalled();
      expect(shareAsync).toHaveBeenCalledWith(
        expect.stringContaining('psi_app_export_'),
        expect.objectContaining({ mimeType: 'application/json' })
      );
    });
  });
});
