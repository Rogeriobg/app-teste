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
import { Button, Input, Card, AppModal } from '@/components';
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
import { colors, radius, shadowCard, spacing, typography } from '@/theme/tokens';

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
          iconLeft={<Plus size={18} color={colors.textOnBrand} />}
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
          placeholder="Nome, e-mail ou telefone..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Buscar paciente por nome, e-mail ou telefone"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredPatients.length === 0 ? (
          <Card style={styles.emptyCard} elevated>
            <Archive size={36} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Nenhum paciente neste filtro</Text>
            {activeTab === 'todos' ? (
              <Text style={styles.emptySub}>Toque em &quot;Novo Paciente&quot; para cadastrar seu primeiro atendimento.</Text>
            ) : null}
          </Card>
        ) : (
          filteredPatients.map((p: Patient) => (
            <Card key={p.id} style={styles.patientCard} elevated>
              {/* Linha 1: Apenas o nome */}
              <View style={styles.rowName}>
                <Text style={styles.rowNameText} numberOfLines={1} ellipsizeMode="tail">
                  {p.name}
                </Text>
              </View>

              {/* Linha 2: Avatar | Email */}
              <View style={styles.rowEmail}>
                <View style={styles.avatarCircle}>
                  <Users size={22} color={colors.brand} />
                </View>
                <View style={styles.rowEmailTextContainer}>
                  <Mail size={14} color={colors.textTertiary} />
                  <Text style={styles.rowEmailText} numberOfLines={1} ellipsizeMode="tail">
                    {p.email}
                  </Text>
                </View>
              </View>

              {/* Linha 3: Ícone telefone | Número */}
              <View style={styles.rowPhone}>
                <Phone size={14} color={colors.textTertiary} />
                <Text style={styles.rowPhoneText} numberOfLines={1} ellipsizeMode="tail">
                  {p.phone}
                </Text>
              </View>

              {/* Linha 4: Ícones de ação */}
              <View style={styles.rowActions}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => handleOpenEdit(p)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Editar paciente ${p.name}`}
                >
                  <Edit2 size={16} color={colors.info} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, p.status === 'Ativo' ? styles.btnToggleActive : styles.btnToggleInactive]}
                  onPress={() => handleToggleStatus(p)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.status === 'Ativo' ? 'Inativar' : 'Reativar'} paciente ${p.name}`}
                >
                  {p.status === 'Ativo' ? (
                    <Pause size={16} color={colors.warning} />
                  ) : (
                    <CheckCircle2 size={16} color={colors.success} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, styles.btnArchive]}
                  onPress={() => handleArchive(p)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.status === 'Arquivado' ? 'Restaurar' : 'Arquivar'} paciente ${p.name}`}
                >
                  <Archive size={16} color={colors.contentSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => router.push(`/patients/${p.id}/details`)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalhes do paciente ${p.name}`}
                >
                  <FileText size={16} color={colors.brand} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconBtn, styles.btnDelete]}
                  onPress={() => handleDelete(p)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Excluir paciente ${p.name}`}
                >
                  <Trash2 size={16} color={colors.danger} />
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
          placeholderTextColor={colors.textTertiary}
          value={name}
          onChangeText={setName}
          accessibilityLabel="Nome completo do paciente"
        />

        <Input
          label="E-mail"
          placeholder="Ex: maria@email.com"
          placeholderTextColor={colors.textTertiary}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="E-mail do paciente"
        />

        <Input
          label="Telefone"
          placeholder="Ex: (11) 98888-7777"
          placeholderTextColor={colors.textTertiary}
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
          <Calendar size={18} color={colors.textTertiary} style={styles.datePickerIcon} />
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
          placeholderTextColor={colors.textTertiary}
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
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.card,
    paddingTop: 52,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: colors.border,
    ...shadowCard,
  },
  headerTitle: { ...typography.title2, fontSize: 20, color: colors.textPrimary },
  headerSubtitle: { ...typography.caption, color: colors.brand, marginTop: spacing.xxs },

  tabsContainer: { flexDirection: 'row', margin: spacing.xl, gap: spacing.md },
  searchContainer: { marginHorizontal: spacing.xl, marginBottom: spacing.lg },
  datePickerInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.inputBg,
    marginBottom: spacing.lg,
  },
  datePickerIcon: { marginRight: spacing.md },
  datePickerText: { ...typography.body, color: colors.inputText, flex: 1 },
  datePickerPlaceholder: { color: colors.textTertiary },
  datePickerWrapper: { height: 200 },
  tabBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  tabText: { ...typography.label, color: colors.textSecondary },
  tabTextActive: { color: colors.brand, fontWeight: '700' },

  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  emptyCard: {
    padding: spacing.xxxl,
    borderRadius: radius.xxl,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptySub: { ...typography.bodyRegular, color: colors.textSecondary, textAlign: 'center' },

  patientCard: {
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    ...shadowCard,
    overflow: 'hidden',
  },
  /* Linha 1: Apenas o nome */
  rowName: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  rowNameText: {
    ...typography.title2,
    fontSize: 17,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
  },
  /* Linha 2: Avatar | Email */
  rowEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerSoft,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.brandBorder,
    flexShrink: 0,
    marginRight: spacing.lg,
  },
  rowEmailTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  rowEmailText: {
    ...typography.body,
    color: colors.inputText,
    flex: 1,
    minWidth: 0,
  },
  /* Linha 3: Ícone telefone | Número */
  rowPhone: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerSoft,
  },
  rowPhoneText: {
    ...typography.body,
    color: colors.inputText,
    flex: 1,
    minWidth: 0,
  },
  /* Linha 4: Ícones de ação */
  rowActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconBtn: { padding: spacing.md, borderRadius: radius.lg, backgroundColor: colors.cardInner },
  btnToggleActive: { backgroundColor: colors.warningSoft },
  btnToggleInactive: { backgroundColor: colors.successSoft },
  btnArchive: { backgroundColor: colors.mutedSoft },
  btnDelete: { backgroundColor: colors.dangerSoft },
});
