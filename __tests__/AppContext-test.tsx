import { act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithProvider } from './helpers/renderWithProvider';
import { MedicalRecord, Patient } from '@/context/AppContext';

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
    it('deve iniciar com o usuário padrão do seed', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => {
        expect(current.currentUser).not.toBeNull();
      });
      expect(current.currentUser?.email).toBe('psicologo@psicowave.com');
    });

    it('deve autenticar com e-mail válido (case-insensitive)', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

      let result = false;
      await act(async () => {
        result = await current.login('PSICOLOGO@PSICOWAVE.COM');
      });

      expect(result).toBe(true);
      expect(current.currentUser?.email).toBe('psicologo@psicowave.com');
    });

    it('deve rejeitar e-mail não cadastrado', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

      let result = true;
      await act(async () => {
        result = await current.login('nao-cadastrado@email.com');
      });

      expect(result).toBe(false);
    });

    it('deve persistir o usuário logado no AsyncStorage', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

      await act(async () => {
        await current.login('psicologo@psicowave.com');
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        USER_KEY,
        expect.stringContaining('psicologo@psicowave.com')
      );
    });

    it('deve encerrar a sessão e remover o usuário do storage', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

      await act(async () => {
        await current.logout();
      });

      expect(current.currentUser).toBeNull();
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(USER_KEY);
    });
  });

  describe('updateUser', () => {
    it('deve atualizar nome e e-mail do usuário logado', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

      await act(async () => {
        await current.updateUser({ name: 'Dra. Ana Costa', email: 'ana@psicowave.com' });
      });

      expect(current.currentUser?.name).toBe('Dra. Ana Costa');
      expect(current.currentUser?.email).toBe('ana@psicowave.com');
    });

    it('deve persistir o usuário atualizado no AsyncStorage', async () => {
      const { current } = await renderWithProvider(<></>);

      await waitFor(() => expect(current.currentUser).not.toBeNull());

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

      await waitFor(() => expect(current.currentUser).not.toBeNull());
      await act(async () => {
        await current.logout();
      });

      await act(async () => {
        await current.updateUser({ name: 'Sem sessão' });
      });

      expect(current.currentUser).toBeNull();
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
