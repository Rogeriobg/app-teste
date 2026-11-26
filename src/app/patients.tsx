import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useApp, Patient } from '@/context/AppContext';
import { router } from 'expo-router';
import { Button, Input, Card, StatusBadge, AppModal } from '@/components';
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
  Calendar,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const tabs = [
  { key: 'todos' as const, label: 'Todos' },
  { key: 'ativos' as const, label: 'Ativos' },
  { key: 'inativos' as const, label: 'Inativos' },
  { key: 'arquivados' as const, label: 'Arquivados' },
];

export default function PatientsScreen() {
  const {
    db,
    addPatient,
    updatePatient,
    togglePatientStatus,
    archivePatient,
    restorePatient,
    deletePatient,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const filteredPatients = db.patients.filter((p: Patient) => {
    if (activeTab === 'ativos') return p.status === 'Ativo';
    if (activeTab === 'inativos') return p.status === 'Inativo';
    if (activeTab === 'arquivados') return p.status === 'Arquivado';
    return true;
  }).filter((p: Patient) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query)
    );
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
        const original = db.patients.find((p: Patient) => p.id === editingId);
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

  const handleOpenDatePicker = () => setDatePickerVisible(true);
  const handleDateChange = (_event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setBirthDate(selectedDate.toISOString().slice(0, 10));
    }
    setDatePickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Meus Pacientes</Text>
          <Text style={styles.headerSubtitle}>Cadastro, edição e prontuário</Text>
        </View>
        <Button
          variant="primary"
          onPress={handleOpenAdd}
          iconLeft={<Plus size={18} color="#FFFFFF" />}
          accessibilityLabel="Cadastrar novo paciente"
        >
          Novo Paciente
        </Button>
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

      {/* Busca */}
      <View style={styles.searchContainer}>
        <Input
          label="Buscar paciente"
          placeholder="Nome ou e-mail..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Buscar paciente por nome ou e-mail"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredPatients.length === 0 ? (
          <Card style={styles.emptyCard} elevated>
            <Archive size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Nenhum paciente neste filtro</Text>
            {activeTab === 'todos' ? (
              <Text style={styles.emptySub}>Toque em &quot;Novo Paciente&quot; para cadastrar seu primeiro atendimento.</Text>
            ) : null}
          </Card>
        ) : (
          filteredPatients.map((p: Patient) => (
            <Card key={p.id} style={styles.patientCard} elevated>
              <View style={styles.patientInfo}>
                <View style={styles.avatarCircle}>
                  <Users size={22} color="#0D9488" />
                </View>
                <View style={styles.patientTexts}>
                  <Text style={styles.patientName} numberOfLines={2}>{p.name}</Text>
                  <View style={styles.patientMetaRow}>
                    <Mail size={12} color="#94A3B8" />
                    <Text style={styles.patientMeta}>{p.email}</Text>
                  </View>
                  <View style={styles.patientMetaRow}>
                    <Phone size={12} color="#94A3B8" />
                    <Text style={styles.patientMeta}>{p.phone}</Text>
                  </View>
                </View>
                <StatusBadge status={p.status} small />
              </View>

              <View style={styles.patientActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleOpenEdit(p)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar paciente ${p.name}`}
                >
                  <Edit2 size={16} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, p.status === 'Ativo' ? styles.btnToggleActive : styles.btnToggleInactive]}
                  onPress={() => handleToggleStatus(p)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.status === 'Ativo' ? 'Inativar' : 'Reativar'} paciente ${p.name}`}
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
                  accessibilityRole="button"
                  accessibilityLabel={`${p.status === 'Arquivado' ? 'Restaurar' : 'Arquivar'} paciente ${p.name}`}
                >
                  <Archive size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push(`/patients/${p.id}/details`)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalhes do paciente ${p.name}`}
                >
                  <FileText size={16} color="#0D9488" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, styles.btnDelete]}
                  onPress={() => handleDelete(p)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir paciente ${p.name}`}
                >
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal Cadastro / Edição */}
      <AppModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        title={isEditing ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
        cancelTitle="Cancelar"
        confirmTitle={isEditing ? 'Salvar Alterações' : 'Cadastrar'}
        onConfirm={handleSavePatient}
      >
        <Input
          label="Nome Completo"
          placeholder="Ex: Maria Oliveira"
          placeholderTextColor="#94A3B8"
          value={name}
          onChangeText={setName}
          accessibilityLabel="Nome completo do paciente"
        />

        <Input
          label="E-mail"
          placeholder="Ex: maria@email.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="E-mail do paciente"
        />

        <Input
          label="Telefone"
          placeholder="Ex: (11) 98888-7777"
          placeholderTextColor="#94A3B8"
          value={phone}
          onChangeText={setPhone}
          accessibilityLabel="Telefone do paciente"
        />

        <TouchableOpacity
          style={styles.datePickerInput}
          onPress={handleOpenDatePicker}
          activeOpacity={0.8}
          accessibilityLabel="Selecionar data de nascimento"
        >
          <Calendar size={18} color="#94A3B8" style={styles.datePickerIcon} />
          <Text style={[styles.datePickerText, !birthDate && styles.datePickerPlaceholder]}>
            {birthDate || 'AAAA-MM-DD'}
          </Text>
        </TouchableOpacity>

        {datePickerVisible && (
          <DateTimePicker
            value={birthDate ? new Date(birthDate) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date()}
          />
        )}

        <Input
          label="Anamnese (resumo inicial)"
          placeholder="Queixa principal, histórico, observações..."
          placeholderTextColor="#94A3B8"
          value={anamnesis}
          onChangeText={setAnamnesis}
          multiline
          numberOfLines={3}
          accessibilityLabel="Anamnese do paciente"
        />
      </AppModal>
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

  tabsContainer: { flexDirection: 'row', margin: 16, gap: 8 },
  searchContainer: { marginHorizontal: 16, marginBottom: 12 },
  datePickerInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  datePickerIcon: { marginRight: 8 },
  datePickerText: { fontSize: 14, color: '#1E293B', flex: 1 },
  datePickerPlaceholder: { color: '#94A3B8' },
  datePickerWrapper: { height: 200 },
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
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center' },

  patientCard: {
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientInfo: { flex: 1, minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6F4ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1EFE2',
    flexShrink: 0,
  },
  patientTexts: { flex: 1, minWidth: 0, flexShrink: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', flexShrink: 1 },
  patientMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  patientMeta: { fontSize: 12, color: '#64748B' },

  patientActions: { flexDirection: 'row', gap: 6, alignItems: 'center', flexShrink: 0 },
  iconBtn: { padding: 8, borderRadius: 10, backgroundColor: '#F8FAFC' },
  btnToggleActive: { backgroundColor: '#FEF3C7' },
  btnToggleInactive: { backgroundColor: '#D1FAE5' },
  btnArchive: { backgroundColor: '#E5E7EB' },
  btnDelete: { backgroundColor: '#FEE2E2' },
});
