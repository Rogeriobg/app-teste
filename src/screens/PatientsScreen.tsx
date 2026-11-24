import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useApp, Patient } from '../context/AppContext';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Archive,
  CheckCircle2,
  Pause,
  Mail,
  Phone,
  FileText,
} from 'lucide-react-native';

const STATUS_COLOR: Record<string, string> = {
  Ativo: '#0D9488',
  Inativo: '#F59E0B',
  Arquivado: '#94A3B8',
};

const STATUS_LABEL: Record<string, string> = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
  Arquivado: 'Arquivado',
};

export default function PatientsScreen() {
  const {
    db,
    addPatient,
    updatePatient,
    togglePatientStatus,
    archivePatient,
    restorePatient,
    deletePatient,
    setActiveScreen,
    setSelectedPatient,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'todos' | 'ativos' | 'inativos' | 'arquivados'>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [anamnesis, setAnamnesis] = useState('');

  const filteredPatients = db.patients.filter(p => {
    if (activeTab === 'ativos') return p.status === 'Ativo';
    if (activeTab === 'inativos') return p.status === 'Inativo';
    if (activeTab === 'arquivados') return p.status === 'Arquivado';
    return true;
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setBirthDate('');
    setAnamnesis('');
    setModalVisible(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setIsEditing(true);
    setEditingId(p.id);
    setName(p.name);
    setEmail(p.email);
    setPhone(p.phone);
    setBirthDate(p.birthDate);
    setAnamnesis(p.anamnesis);
    setModalVisible(true);
  };

  const handleSavePatient = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do paciente.');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe o e-mail do paciente.');
      return;
    }

    const patientData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      birthDate: birthDate.trim(),
      anamnesis: anamnesis.trim(),
      status: 'Ativo' as const,
    };

    try {
      if (isEditing && editingId) {
        const original = db.patients.find(p => p.id === editingId);
        await updatePatient({
          ...patientData,
          id: editingId,
          createdAt: original?.createdAt ?? new Date().toISOString(),
          status: original?.status ?? 'Ativo',
        });
        Alert.alert('Sucesso', 'Paciente atualizado com sucesso!');
      } else {
        await addPatient(patientData);
        Alert.alert('Sucesso', 'Paciente cadastrado com sucesso!');
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o paciente.');
    }
  };

  const handleToggleStatus = async (p: Patient) => {
    const novoStatus = p.status === 'Ativo' ? 'Inativo' : 'Ativo';
    await togglePatientStatus(p.id);
    Alert.alert('Sucesso', `Paciente marcado como ${novoStatus}.`);
  };

  const handleArchive = async (p: Patient) => {
    if (p.status === 'Arquivado') {
      await restorePatient(p.id);
      Alert.alert('Sucesso', 'Paciente restaurado para Ativo.');
    } else {
      await archivePatient(p.id);
      Alert.alert('Sucesso', 'Paciente arquivado.');
    }
  };

  const handleDelete = async (p: Patient) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o paciente ${p.name} e todos os seus relatórios?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deletePatient(p.id);
            Alert.alert('Sucesso', 'Paciente excluído.');
          },
        },
      ]
    );
  };

  const statusBadge = (status: Patient['status']) => {
    const color = STATUS_COLOR[status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: color + '15', borderColor: color + '40' }]}>
        <Text style={[styles.statusText, { color }]}>{STATUS_LABEL[status]}</Text>
      </View>
    );
  };

  const tabs = [
    { key: 'todos' as const, label: 'Todos' },
    { key: 'ativos' as const, label: 'Ativos' },
    { key: 'inativos' as const, label: 'Inativos' },
    { key: 'arquivados' as const, label: 'Arquivados' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Meus Pacientes</Text>
          <Text style={styles.headerSubtitle}>Cadastro, edição e prontuário</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd} activeOpacity={0.85}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Novo Paciente</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros por status */}
      <View style={styles.tabsContainer}>
        {tabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabBtn, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredPatients.length === 0 ? (
          <View style={styles.emptyCard}>
            <Archive size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Nenhum paciente neste filtro</Text>
            {activeTab === 'todos' ? (
              <Text style={styles.emptySub}>Toque em &quot;Novo Paciente&quot; para cadastrar seu primeiro atendimento.</Text>
            ) : null}
          </View>
        ) : (
          filteredPatients.map(p => (
            <View key={p.id} style={styles.patientCard}>
              <View style={styles.patientInfo}>
                <View style={styles.avatarCircle}>
                  <Users size={22} color="#0D9488" />
                </View>
                <View style={styles.patientTexts}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <View style={styles.patientMetaRow}>
                    <Mail size={12} color="#94A3B8" />
                    <Text style={styles.patientMeta}>{p.email}</Text>
                  </View>
                  <View style={styles.patientMetaRow}>
                    <Phone size={12} color="#94A3B8" />
                    <Text style={styles.patientMeta}>{p.phone}</Text>
                  </View>
                </View>
                {statusBadge(p.status)}
              </View>

              <View style={styles.patientActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleOpenEdit(p)} activeOpacity={0.8}>
                  <Edit2 size={16} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, p.status === 'Ativo' ? styles.btnToggleActive : styles.btnToggleInactive]}
                  onPress={() => handleToggleStatus(p)}
                  activeOpacity={0.8}
                >
                  {p.status === 'Ativo' ? (
                    <Pause size={16} color="#F59E0B" />
                  ) : (
                    <CheckCircle2 size={16} color="#0D9488" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, styles.btnArchive]}
                  onPress={() => handleArchive(p)}
                  activeOpacity={0.8}
                >
                  <Archive size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => {
                    setSelectedPatient(p.id, p.name);
                    setActiveScreen('reports');
                  }}
                  activeOpacity={0.8}
                >
                  <FileText size={16} color="#0D9488" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, styles.btnDelete]} onPress={() => handleDelete(p)} activeOpacity={0.8}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal Cadastro / Edição */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
              </Text>

              <Text style={styles.label}>Nome Completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Maria Oliveira"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: maria@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <Text style={styles.label}>Telefone</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: (11) 98888-7777"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={setPhone}
              />

              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={styles.input}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94A3B8"
                value={birthDate}
                onChangeText={setBirthDate}
              />

              <Text style={styles.label}>Anamnese (resumo inicial)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Queixa principal, histórico, observações..."
                placeholderTextColor="#94A3B8"
                value={anamnesis}
                onChangeText={setAnamnesis}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelModalBtn]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelModalText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.saveModalBtn]}
                  onPress={handleSavePatient}
                >
                  <Text style={styles.saveModalText}>{isEditing ? 'Salvar Alterações' : 'Cadastrar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FBF7' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#133E2B' },
  headerSubtitle: { fontSize: 12, color: '#0D9488', fontWeight: '600', marginTop: 2 },
  addButton: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  tabsContainer: { flexDirection: 'row', margin: 16, gap: 8 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  tabActive: { backgroundColor: '#E6F4ED', borderColor: '#0D9488' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#0D9488', fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 20 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center' },

  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  patientInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E6F4ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1EFE2',
  },
  patientTexts: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', marginBottom: 4 },
  patientMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  metaIcon: { color: '#94A3B8' },
  patientMeta: { fontSize: 12, color: '#64748B' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  patientActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F8FAFC' },
  btnToggleActive: { backgroundColor: '#FEF3C7' },
  btnToggleInactive: { backgroundColor: '#D1FAE5' },
  btnArchive: { backgroundColor: '#E5E7EB' },
  btnDelete: { backgroundColor: '#FEE2E2' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalKeyboard: { flex: 1 },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#133E2B', marginBottom: 18, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  inputMultiline: { height: 96, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelModalBtn: { backgroundColor: '#F1F5F9' },
  cancelModalText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
  saveModalBtn: { backgroundColor: '#0D9488' },
  saveModalText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
