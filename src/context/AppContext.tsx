import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { shareAsync } from 'expo-sharing';
import { writeAsStringAsync, Paths } from 'expo-file-system';
import defaultDbData from '../../database.json';
import {
  ensureAuth,
  verifyPassword,
  setPassword as salvarSenha,
} from '@/services/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'psicologo';
  avatar?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  anamnesis: string;
  status: 'Ativo' | 'Inativo' | 'Arquivado';
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  date: string;
  title: string;
  content: string;
  privateNotes: string;
  status: 'Ativo' | 'Arquivado';
  archivedAt: string | null;
  createdAt: string;
}

export interface Database {
  users: User[];
  patients: Patient[];
  medicalRecords: MedicalRecord[];
}

const defaultDb: Database = defaultDbData as unknown as Database;

export interface AppContextData {
  db: Database;
  currentUser: User | null;
  /** `false` até o storage (sessão + banco) terminar de carregar. */
  authReady: boolean;
  /** Autentica com e-mail **e senha**. */
  login: (email: string, senha: string) => Promise<boolean>;
  /** Valida a senha atual antes de trocar. */
  checkPassword: (senha: string) => Promise<boolean>;
  /** Troca a senha e devolve o novo código de recuperação (6 dígitos). */
  changePassword: (novaSenha: string) => Promise<{ recoveryCode: string }>;
  /**
   * Cadastra o e-mail e a senha reais do psicólogo (conta única),
   * substituindo as credenciais padrão. NÃO autentica — o usuário volta
   * ao login para entrar com os dados recém-cadastrados.
   */
  registerUser: (dados: {
    name: string;
    email: string;
    senha: string;
  }) => Promise<{ recoveryCode: string }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<Pick<User, 'name' | 'email'>>) => Promise<void>;
  exportData: () => Promise<void>;
  /* Navegação entre telas */
  activeScreen: 'login' | 'dashboard' | 'patients' | 'reports';
  setActiveScreen: (screen: 'login' | 'dashboard' | 'patients' | 'reports') => void;
  selectedPatientId: string | null;
  selectedPatientName: string | null;
  setSelectedPatient: (id: string | null, name: string | null) => void;
  /* Pacientes */
  addPatient: (patient: Omit<Patient, 'id' | 'createdAt'>) => Promise<void>;
  updatePatient: (patient: Patient) => Promise<void>;
  togglePatientStatus: (id: string) => Promise<void>;
  archivePatient: (id: string) => Promise<void>;
  restorePatient: (id: string) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  /* Prontuários / Relatórios */
  addMedicalRecord: (rec: Omit<MedicalRecord, 'id' | 'createdAt' | 'archivedAt'>) => Promise<void>;
  updateMedicalRecord: (rec: MedicalRecord) => Promise<void>;
  archiveMedicalRecord: (id: string) => Promise<void>;
  restoreMedicalRecord: (id: string) => Promise<void>;
  deleteMedicalRecord: (id: string) => Promise<void>;
  getPatientsByStatus: (status: Patient['status']) => Patient[];
  getRecordsByPatient: (patientId: string) => MedicalRecord[];
}

/**
 * Contexto exposto para que testes (e integrações) possam sobrescrever
 * comportamentos específicos sem alterar a implementação do AppProvider.
 */
export const AppContext = createContext<AppContextData>({} as AppContextData);
const STORAGE_KEY = '@psi_app_db_json_v1';
const CURRENT_USER_KEY = '@psi_app_current_user_v1';
/**
 * Marcador de sessão autenticada.
 *
 * Sessões salvas ANTES da existência da senha não têm este marcador,
 * então são descartadas e o usuário é levado ao login. Sem isso, o
 * `index.tsx` via `currentUser` e pulava a autenticação.
 */
const SESSION_KEY = '@psi_app_session_v1';

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [db, setDb] = useState<Database>(defaultDb);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'login' | 'dashboard' | 'patients' | 'reports'>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);

  const loadStorage = async () => {
    try {
      const storedDb = await AsyncStorage.getItem(STORAGE_KEY);
      const db = storedDb ? JSON.parse(storedDb) : defaultDb;
      if (!storedDb) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaultDb));
      }

      /**
       * Só restaura a sessão se houver marcador de login autenticado.
       *
       * Antes da senha, qualquer `currentUser` salvo bastava — agora
       * sessões antigas são ignoradas e o app abre no login (R6).
       */
      const sessao = await AsyncStorage.getItem(SESSION_KEY);
      const storedUser = sessao
        ? await AsyncStorage.getItem(CURRENT_USER_KEY)
        : null;

      if (!sessao && storedUser) {
        await AsyncStorage.removeItem(CURRENT_USER_KEY);
      }

      return { db, currentUser: storedUser ? JSON.parse(storedUser) : null };
    } catch (e) {
      console.warn('AsyncStorage fallback to memory/default', e);
      return { db: defaultDb, currentUser: null };
    }
  };

  useEffect(() => {
    let mounted = true;
    // cria o estado de autenticação na primeira execução (senha padrão)
    void ensureAuth();
    loadStorage()
      .then(({ db, currentUser }) => {
        if (mounted) {
          setDb(db);
          setCurrentUser(currentUser);
        }
      })
      .finally(() => {
        if (mounted) setAuthReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const saveDb = async (newDb: Database) => {
    setDb(newDb);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newDb));
    } catch (e) {
      console.warn('AsyncStorage save error', e);
    }
  };

  const login = async (email: string, senha: string) => {
    const found = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return false;
    if (!(await verifyPassword(senha))) return false;

    setCurrentUser(found);
    try {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
      // marcador: só uma sessão que passou pela senha restoration o usuário
      await AsyncStorage.setItem(SESSION_KEY, found.id);
    } catch {}
    return true;
  };

  const checkPassword = async (senha: string) => verifyPassword(senha);

  const changePassword = async (novaSenha: string) => salvarSenha(novaSenha);

  /**
   * Cadastro único: substitui o usuário do seed pelo e-mail/nome reais e
   * define a senha. Os prontuários/pacientes são preservados.
   * Não cria sessão — a navegação volta ao login para conferir o acesso.
   */
  const registerUser = async ({ name, email, senha }: {
    name: string;
    email: string;
    senha: string;
  }) => {
    const emailLimpo = email.trim().toLowerCase();
    const usuarios = db.users.length ? db.users : defaultDb.users;
    const primeiro = usuarios[0];
    /**
     * O seed de produção é vazio: na primeira instalação não existe usuário.
     * Nesse caso o cadastro CRIA o psicólogo, em vez de substituir um seed.
     */
    const atualizado: User = primeiro
      ? { ...primeiro, name: name.trim() || primeiro.name, email: emailLimpo }
      : {
          id: 'u_' + Date.now(),
          name: name.trim(),
          email: emailLimpo,
          role: 'psicologo',
        };
    await saveDb({
      ...db,
      users: primeiro
        ? [atualizado, ...usuarios.slice(1)]
        : [atualizado, ...usuarios],
    });
    const { recoveryCode } = await salvarSenha(senha);
    return { recoveryCode };
  };

  const logout = async () => {
    setCurrentUser(null);
    setActiveScreen('login');
    setSelectedPatient(null, null);
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch {}
  };

  const updateUser = async (updates: Partial<Pick<User, 'name' | 'email'>>) => {
    if (!currentUser) return;
    const updatedUser: User = { ...currentUser, ...updates };
    setCurrentUser(updatedUser);
    try {
      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('AsyncStorage save user error', e);
    }
    // o login consulta db.users — sem isso, trocar o e-mail no Perfil
    // deixaria o usuário sem conseguir entrar novamente
    await saveDb({
      ...db,
      users: db.users.some((u) => u.id === updatedUser.id)
        ? db.users.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        : [...db.users, updatedUser],
    });
  };

  const exportData = async () => {
    const json = JSON.stringify(db, null, 2);
    const fileName = `psi_app_export_${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = `${Paths.cache.uri}${fileName}`;
    try {
      await writeAsStringAsync(filePath, json, {
        encoding: 'utf8',
      });
      await shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Exportar dados do PsiApp',
      });
    } catch (e) {
      console.warn('Export error', e);
      throw e;
    }
  };

  const setSelectedPatient = (id: string | null, name: string | null) => {
    setSelectedPatientId(id);
    setSelectedPatientName(name);
  };

  /* ---------- Pacientes ---------- */

  const addPatient = async (patientData: Omit<Patient, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newPatient: Patient = { id: 'p_' + Date.now(), createdAt: now, ...patientData };
    await saveDb({ ...db, patients: [newPatient, ...db.patients] });
  };

  const updatePatient = async (patient: Patient) => {
    const updatedPatients = db.patients.map(p => (p.id === patient.id ? patient : p));
    await saveDb({ ...db, patients: updatedPatients });
  };

  const togglePatientStatus = async (id: string) => {
    const updatedPatients = db.patients.map(p => {
      if (p.id === id) {
        return {
          ...p,
          status: (p.status === 'Ativo' ? 'Inativo' : 'Ativo') as Patient['status'],
        };
      }
      return p;
    });
    await saveDb({ ...db, patients: updatedPatients });
  };

  const archivePatient = async (id: string) => {
    const updatedPatients = db.patients.map(p =>
      p.id === id ? { ...p, status: 'Arquivado' as Patient['status'] } : p
    );
    await saveDb({ ...db, patients: updatedPatients });
  };

  const restorePatient = async (id: string) => {
    const updatedPatients = db.patients.map(p =>
      p.id === id ? { ...p, status: 'Ativo' as Patient['status'] } : p
    );
    await saveDb({ ...db, patients: updatedPatients });
  };

  const deletePatient = async (id: string) => {
    const updatedPatients = db.patients.filter(p => p.id !== id);
    const updatedRecords = db.medicalRecords.filter(r => r.patientId !== id);
    await saveDb({ ...db, patients: updatedPatients, medicalRecords: updatedRecords });
  };

  /* ---------- Prontuários / Relatórios ---------- */

  const addMedicalRecord = async (recData: Omit<MedicalRecord, 'id' | 'createdAt' | 'archivedAt'>) => {
    const now = new Date().toISOString();
    const newRec: MedicalRecord = {
      id: 'm_' + Date.now(),
      createdAt: now,
      archivedAt: null,
      ...recData,
    };
    await saveDb({ ...db, medicalRecords: [newRec, ...db.medicalRecords] });
  };

  const updateMedicalRecord = async (rec: MedicalRecord) => {
    const updatedRecords = db.medicalRecords.map(r => (r.id === rec.id ? rec : r));
    await saveDb({ ...db, medicalRecords: updatedRecords });
  };

  const archiveMedicalRecord = async (id: string) => {
    const now = new Date().toISOString();
    const updatedRecords = db.medicalRecords.map(r =>
      r.id === id ? { ...r, status: 'Arquivado' as MedicalRecord['status'], archivedAt: now } : r
    );
    await saveDb({ ...db, medicalRecords: updatedRecords });
  };

  const restoreMedicalRecord = async (id: string) => {
    const updatedRecords = db.medicalRecords.map(r =>
      r.id === id ? { ...r, status: 'Ativo' as MedicalRecord['status'], archivedAt: null } : r
    );
    await saveDb({ ...db, medicalRecords: updatedRecords });
  };

  const deleteMedicalRecord = async (id: string) => {
    const updatedRecords = db.medicalRecords.filter(r => r.id !== id);
    await saveDb({ ...db, medicalRecords: updatedRecords });
  };

  /* ---------- Helpers ---------- */

  const getPatientsByStatus = (status: Patient['status']) => {
    return db.patients.filter(p => p.status === status);
  };

  const getRecordsByPatient = (patientId: string) => {
    return db.medicalRecords.filter(r => r.patientId === patientId);
  };

  return (
    <AppContext.Provider
      value={{
        db,
        currentUser,
        authReady,
        login,
        checkPassword,
        changePassword,
        registerUser,
        logout,
        updateUser,
        exportData,
        activeScreen,
        setActiveScreen,
        selectedPatientId,
        selectedPatientName,
        setSelectedPatient,
        addPatient,
        updatePatient,
        togglePatientStatus,
        archivePatient,
        restorePatient,
        deletePatient,
        addMedicalRecord,
        updateMedicalRecord,
        archiveMedicalRecord,
        restoreMedicalRecord,
        deleteMedicalRecord,
        getPatientsByStatus,
        getRecordsByPatient,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
