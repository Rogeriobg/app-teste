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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card, PatientFormModal, PatientFormValues } from '@/components';
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
  X,
} from 'lucide-react-native';
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

  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'todos' | 'ativos' | 'inativos' | 'arquivados'>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Normaliza um telefone para comparação: só dígitos.
   *
   * Permite que "988887777" encontre "(11) 98888-7777".
   */
  const apenasDigitos = (valor: string) => valor.replace(/\D/g, '');

  const filteredPatients = db.patients.filter((p: Patient) => {
    if (activeTab === 'ativos') return p.status === 'Ativo';
    if (activeTab === 'inativos') return p.status === 'Inativo';
    if (activeTab === 'arquivados') return p.status === 'Arquivado';
    return true;
  }).filter((p: Patient) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    if (p.name.toLowerCase().includes(query)) return true;
    if (p.email.toLowerCase().includes(query)) return true;
    // telefone: comparação por texto e por dígitos
    if (p.phone.toLowerCase().includes(query)) return true;
    const queryDigitos = apenasDigitos(query);
    if (queryDigitos.length > 0 && apenasDigitos(p.phone).includes(queryDigitos)) return true;
    return false;
  });

  /** Há uma busca ativa no momento? */
  const buscaAtiva = searchQuery.trim().length > 0;
  /** Termo exibido no estado vazio da busca */
  const termoBusca = searchQuery.trim();
  /** Rótulo do status do filtro atual (usado no estado vazio) */
  const rotuloFiltro =
    activeTab === 'ativos'
      ? 'ativo'
      : activeTab === 'inativos'
        ? 'inativo'
        : activeTab === 'arquivados'
          ? 'arquivado'
          : 'nenhum';

  const handleClearSearch = () => setSearchQuery('');
  const handleShowAll = () => setActiveTab('todos');

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setEditingPatient(null);
    setModalVisible(true);
  };

  const handleOpenEdit = (p: Patient) => {
    setIsEditing(true);
    setEditingId(p.id);
    setEditingPatient(p);
    setModalVisible(true);
  };

  const handleSavePatient = async (values: PatientFormValues) => {
    const patientData = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      birthDate: values.birthDate,
      anamnesis: values.anamnesis,
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
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
          onClear={() => setSearchQuery('')}
          accessibilityLabel="Buscar paciente por nome, e-mail ou telefone"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {filteredPatients.length === 0 ? (
          <Card style={styles.emptyCard} elevated>
            <Archive size={36} color={colors.textTertiary} />

            {/* Estado vazio contextual: o texto diz exatamente por que a
                lista está vazia e oferece a ação de recuperação. */}
            {buscaAtiva ? (
              <>
                <Text style={styles.emptyTitle}>Nenhum resultado para «{termoBusca}»</Text>
                <Text style={styles.emptySub}>
                  Tente outro nome, e-mail ou telefone.
                </Text>
                <Button
                  variant="outline"
                  onPress={handleClearSearch}
                  style={styles.emptyBtn}
                  iconLeft={<X size={16} color={colors.brand} />}
                  accessibilityLabel="Limpar busca"
                >
                  Limpar busca
                </Button>
              </>
            ) : db.patients.length === 0 ? (
              <>
                <Text style={styles.emptyTitle}>Nenhum paciente cadastrado</Text>
                <Text style={styles.emptySub}>
                  Comece cadastrando seu primeiro paciente para abrir o prontuário.
                </Text>
                <Button
                  variant="primary"
                  onPress={handleOpenAdd}
                  style={styles.emptyBtn}
                  iconLeft={<Plus size={16} color={colors.textOnBrand} />}
                  accessibilityLabel="Cadastrar primeiro paciente"
                >
                  Cadastrar paciente
                </Button>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>Nenhum paciente {rotuloFiltro}</Text>
                <Text style={styles.emptySub}>
                  Ajuste o filtro ou cadastre um novo paciente.
                </Text>
                <Button
                  variant="outline"
                  onPress={handleShowAll}
                  style={styles.emptyBtn}
                  iconLeft={<Users size={16} color={colors.brand} />}
                  accessibilityLabel="Ver todos os pacientes"
                >
                  Ver todos
                </Button>
              </>
            )}
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

      {/* Modal Cadastro / Edição — componente compartilhado.
          O `key` remonta o formulário a cada abertura, para os campos
          nascerem com os valores do paciente em edição. */}
      <PatientFormModal
        key={editingId ?? 'novo'}
        visible={modalVisible}
        mode={isEditing ? 'edit' : 'create'}
        initial={editingPatient}
        onDismiss={() => setModalVisible(false)}
        onSubmit={handleSavePatient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.card,
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

  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl + 24 },
  emptyCard: {
    padding: spacing.xxxl,
    borderRadius: radius.xxl,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptySub: { ...typography.bodyRegular, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg },
  emptyBtn: { marginTop: spacing.xs, minWidth: 200 },

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
