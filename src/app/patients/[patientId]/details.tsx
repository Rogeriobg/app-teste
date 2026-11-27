import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectionAsync, impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, Patient, MedicalRecord } from '@/context/AppContext';
import { Button, Card, Input, StatusBadge, AppModal, StatSummary, ActionTile, PatientFormModal, PatientFormValues } from '@/components';
import { colors, radius, shadowCard, shadowRaised, spacing, typography } from '@/theme/tokens';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  FileText,
  Edit2,
  Archive,
  Trash2,
  CheckCircle2,
  Pause,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2 as CheckIcon,
  Download,
} from 'lucide-react-native';

const ACCENT = colors.brand;

export default function PatientDetailsScreen() {
  const { patientId } = useLocalSearchParams() as { patientId: string };
  const {
    db,
    updatePatient,
    togglePatientStatus,
    archivePatient,
    restorePatient,
    deletePatient,
    getRecordsByPatient,
    addMedicalRecord,
    updateMedicalRecord,
    archiveMedicalRecord,
    restoreMedicalRecord,
    deleteMedicalRecord,
  } = useApp();

  const insets = useSafeAreaInsets();

  const patient = db.patients.find((p: Patient) => p.id === patientId);
  const records = getRecordsByPatient(patientId);
  const activeRecords = records.filter((r: MedicalRecord) => r.status === 'Ativo');
  const archivedRecords = records.filter((r: MedicalRecord) => r.status === 'Arquivado');

  /* Modal de prontuário (criar/editar) */
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  /* Modal de edição do paciente */
  const [patientModalVisible, setPatientModalVisible] = useState(false);

  const Haptic = {
    selection: useCallback(async () => {
      try { await selectionAsync(); } catch {}
    }, []),
    success: useCallback(async () => {
      try { await impactAsync(ImpactFeedbackStyle.Light); } catch {}
    }, []),
    error: useCallback(async () => {
      try { await impactAsync(ImpactFeedbackStyle.Heavy); } catch {}
    }, []),
  };

  const handleOpenAddRecord = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('Sessão Terapêutica');
    setDate(new Date().toISOString().slice(0, 10));
    setContent('');
    setPrivateNotes('');
    setRecordModalVisible(true);
    Haptic.selection();
  };

  const handleOpenEditRecord = (rec: MedicalRecord) => {
    setIsEditing(true);
    setEditingId(rec.id);
    setTitle(rec.title);
    setDate(rec.date);
    setContent(rec.content);
    setPrivateNotes(rec.privateNotes);
    setRecordModalVisible(true);
    Haptic.selection();
  };

  const handleSaveRecord = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Informe o título do relatório.');
      Haptic.error();
      return;
    }
    if (!content.trim()) {
      Alert.alert('Atenção', 'Informe o conteúdo do prontuário.');
      Haptic.error();
      return;
    }

    try {
      if (isEditing && editingId) {
        const original = records.find((r: MedicalRecord) => r.id === editingId);
        await updateMedicalRecord({
          id: editingId,
          patientId,
          patientName: patient?.name ?? '',
          title: title.trim(),
          date: date.trim() || new Date().toISOString().slice(0, 10),
          content: content.trim(),
          privateNotes: privateNotes.trim(),
          status: original?.status ?? 'Ativo',
          archivedAt: original?.archivedAt ?? null,
          createdAt: original?.createdAt ?? new Date().toISOString(),
        });
      } else {
        await addMedicalRecord({
          patientId,
          patientName: patient?.name ?? '',
          title: title.trim(),
          date: date.trim() || new Date().toISOString().slice(0, 10),
          content: content.trim(),
          privateNotes: privateNotes.trim(),
          status: 'Ativo',
        });
      }
      await Haptic.success();
      setRecordModalVisible(false);
      Alert.alert('Sucesso', 'Relatório salvo com sucesso!');
    } catch {
      await Haptic.error();
      Alert.alert('Erro', 'Não foi possível salvar o relatório.');
    }
  };

  const handleArchiveRecord = async (rec: MedicalRecord) => {
    if (rec.status === 'Arquivado') {
      await restoreMedicalRecord(rec.id);
      await Haptic.success();
      Alert.alert('Sucesso', 'Relatório restaurado.');
    } else {
      await archiveMedicalRecord(rec.id);
      await Haptic.success();
      Alert.alert('Sucesso', 'Relatório arquivado.');
    }
  };

  const handleDeleteRecord = async (rec: MedicalRecord) => {
    setDeletingRecordId(rec.id);
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o relatório "${rec.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => { setDeletingRecordId(null); Haptic.selection(); } },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteMedicalRecord(rec.id);
            setDeletingRecordId(null);
            await Haptic.success();
            Alert.alert('Sucesso', 'Relatório excluído.');
          },
        },
      ]
    );
  };

  const handleTogglePatientStatus = async () => {
    if (!patient) return;
    await togglePatientStatus(patient.id);
    await Haptic.success();
    Alert.alert('Sucesso', `Paciente marcado como ${patient.status === 'Ativo' ? 'Inativo' : 'Ativo'}.`);
  };

  const handleArchivePatient = async () => {
    if (!patient) return;
    if (patient.status === 'Arquivado') {
      await restorePatient(patient.id);
      await Haptic.success();
      Alert.alert('Sucesso', 'Paciente restaurado.');
    } else {
      await archivePatient(patient.id);
      await Haptic.success();
      Alert.alert('Sucesso', 'Paciente arquivado.');
    }
  };

  const handleDeletePatient = async () => {
    if (!patient) return;
    Alert.alert(
      'Confirmar exclusão',
      `Deseja realmente excluir o paciente ${patient.name} e todos os seus relatórios?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => Haptic.selection() },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deletePatient(patient.id);
            await Haptic.success();
            router.replace('/patients');
          },
        },
      ]
    );
  };

  const handleExportPdf = () => {
    if (!patient) return;
    router.push(`/patients/${patient.id}/export-pdf`);
    Haptic.selection();
  };

  const handleEditPatient = () => {
    if (!patient) return;
    setPatientModalVisible(true);
    Haptic.selection();
  };

  /**
   * Salva os dados editados do paciente.
   *
   * Preserva `id`, `status` e `createdAt` do registro original — só os
   * campos editáveis são trocados.
   */
  const handleSavePatient = async (values: PatientFormValues) => {
    if (!patient) return;
    try {
      await updatePatient({
        ...patient,
        name: values.name,
        email: values.email,
        phone: values.phone,
        birthDate: values.birthDate,
        anamnesis: values.anamnesis,
      });
      await Haptic.success();
      setPatientModalVisible(false);
      Alert.alert('Sucesso', 'Dados do paciente atualizados com sucesso!');
    } catch {
      await Haptic.error();
      Alert.alert('Erro', 'Não foi possível salvar os dados do paciente.');
    }
  };

  if (!patient) {
    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <AlertCircle size={44} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Paciente não encontrado</Text>
            <Text style={styles.emptySub}>
              O paciente pode ter sido removido do consultório.
            </Text>
            <Button
              variant="primary"
              onPress={() => router.replace('/patients')}
              iconLeft={<ChevronRight size={18} color={colors.textOnBrand} />}
              style={styles.emptyBtn}
            >
              Voltar aos pacientes
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  const isAtivo = patient.status === 'Ativo';
  const isArquivado = patient.status === 'Arquivado';

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          accessibilityHint="Retorna para a lista de pacientes"
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Prontuário do paciente
        </Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        style={{ paddingBottom: insets.bottom + spacing.xxxl }}
      >
        {/* Hero do paciente */}
        <View style={styles.heroCard}>
          <View style={styles.avatarBadge}>
            <Users size={30} color={colors.textOnBrand} />
          </View>

          <View style={styles.heroInfo}>
            <Text style={styles.patientName} numberOfLines={2}>
              {patient.name}
            </Text>
            <StatusBadge status={patient.status as any} />
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactChip}>
              <Mail size={14} color={ACCENT} />
              <Text style={styles.contactChipText} numberOfLines={1}>
                {patient.email}
              </Text>
            </View>
            <View style={styles.contactChip}>
              <Phone size={14} color={ACCENT} />
              <Text style={styles.contactChipText} numberOfLines={1}>
                {patient.phone}
              </Text>
            </View>
          </View>
        </View>

        {/* Informações do paciente */}
        <Text style={styles.sectionTitle}>Informações do paciente</Text>

        <Card style={styles.infoCard} elevated>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Calendar size={18} color={ACCENT} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Data de nascimento</Text>
              <Text style={styles.infoValue}>{patient.birthDate || 'Não informada'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <FileText size={18} color={ACCENT} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Anamnese</Text>
              <Text style={styles.infoValue}>{patient.anamnesis || 'Não informada'}</Text>
            </View>
          </View>
        </Card>

        {/* Prontuários */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, styles.sectionHeaderTitle]} numberOfLines={1}>
            Prontuários
          </Text>
          <Button
            variant="primary"
            onPress={handleOpenAddRecord}
            iconLeft={<Plus size={16} color={colors.textOnBrand} />}
            style={styles.addRecordBtn}
            accessibilityLabel="Cadastrar novo prontuário"
          >
            Novo
          </Button>
        </View>

        <StatSummary
          title="Resumo dos prontuários"
          total={records.length}
          segments={[
            { label: 'Ativos', count: activeRecords.length, color: colors.brand },
            { label: 'Arquivados', count: archivedRecords.length, color: colors.muted },
          ]}
        />

        {/* Lista de prontuários */}
        {records.length === 0 ? (
          <Card style={styles.emptyCard} elevated>
            <View style={styles.emptyIconContainer}>
              <FileText size={40} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Nenhum prontuário cadastrado</Text>
            <Text style={styles.emptySub}>
              Inicie o prontuário deste paciente nas próximas sessões.
            </Text>
            <Button
              variant="outline"
              onPress={handleOpenAddRecord}
              style={styles.emptyBtn}
              iconLeft={<Plus size={18} color={ACCENT} />}
            >
              Criar primeiro prontuário
            </Button>
          </Card>
        ) : (
          <View style={styles.recordsList}>
            {activeRecords.length > 0 && (
              <>
                <Text style={styles.listSectionTitle}>Prontuários ativos</Text>
                {activeRecords.map((rec: MedicalRecord) => (
                  <RecordCard
                    key={rec.id}
                    record={rec}
                    deleting={deletingRecordId === rec.id}
                    onPress={() => handleOpenEditRecord(rec)}
                    onArchive={() => handleArchiveRecord(rec)}
                    onDelete={() => handleDeleteRecord(rec)}
                  />
                ))}
              </>
            )}

            {archivedRecords.length > 0 && (
              <>
                <Text style={styles.listSectionTitle}>Prontuários arquivados</Text>
                {archivedRecords.map((rec: MedicalRecord) => (
                  <RecordCard
                    key={rec.id}
                    record={rec}
                    archived
                    deleting={deletingRecordId === rec.id}
                    onPress={() => handleOpenEditRecord(rec)}
                    onArchive={() => handleArchiveRecord(rec)}
                    onDelete={() => handleDeleteRecord(rec)}
                  />
                ))}
              </>
            )}
          </View>
        )}

        {/* Ações do paciente (thumb zone) */}
        <Text style={styles.sectionTitle}>Ações</Text>

        <View style={styles.actionsGrid}>
          <ActionTile
            layout="horizontal"
            style={styles.actionCell}
            title="Editar paciente"
            description="Nome, contato e anamnese"
            icon={<Edit2 size={18} color={ACCENT} />}
            onPress={handleEditPatient}
            accessibilityLabel="Editar dados do paciente"
            accessibilityHint="Toque para editar nome, e-mail, telefone e anamnese"
          />
          <ActionTile
            layout="horizontal"
            style={styles.actionCell}
            title="Nova sessão"
            description="Registrar atendimento"
            icon={<Plus size={18} color={ACCENT} />}
            onPress={handleOpenAddRecord}
            accessibilityLabel="Registrar nova sessão"
            accessibilityHint="Abre o formulário de nova sessão terapêutica"
          />
          <ActionTile
            layout="horizontal"
            style={styles.actionCell}
            title={isAtivo ? 'Inativar' : 'Reativar'}
            description="Alterar o status"
            icon={isAtivo ? <Pause size={18} color={ACCENT} /> : <CheckCircle2 size={18} color={ACCENT} />}
            onPress={handleTogglePatientStatus}
            accessibilityLabel={isAtivo ? 'Marcar paciente como inativo' : 'Marcar paciente como ativo'}
          />
          <ActionTile
            layout="horizontal"
            style={styles.actionCell}
            title="Exportar PDF"
            description="Gerar arquivo do prontuário"
            icon={<Download size={18} color={ACCENT} />}
            onPress={handleExportPdf}
            accessibilityLabel="Exportar prontuário em PDF"
            accessibilityHint="Gera um arquivo PDF com todos os prontuários do paciente"
          />
          <ActionTile
            layout="horizontal"
            style={styles.actionCell}
            title={isArquivado ? 'Restaurar' : 'Arquivar'}
            description="Mover para arquivados"
            icon={<Archive size={18} color={ACCENT} />}
            onPress={handleArchivePatient}
            accessibilityLabel={isArquivado ? 'Restaurar paciente' : 'Arquivar paciente'}
          />
          <ActionTile
            layout="horizontal"
            style={styles.actionCell}
            tone="danger"
            title="Excluir paciente"
            description="Paciente e prontuários"
            icon={<Trash2 size={18} color={colors.danger} />}
            onPress={handleDeletePatient}
            accessibilityLabel="Excluir paciente e todos os prontuários"
            accessibilityHint="Esta ação não pode ser desfeita"
          />
        </View>
      </ScrollView>

      {/* Modal: Novo prontuário / Editar prontuário */}
      <AppModal
        visible={recordModalVisible}
        onDismiss={() => { setRecordModalVisible(false); setDeletingRecordId(null); }}
        title={isEditing ? 'Editar Prontuário' : 'Novo Prontuário'}
        cancelTitle="Cancelar"
        confirmTitle={isEditing ? 'Salvar Prontuário' : 'Salvar Prontuário'}
        onConfirm={handleSaveRecord}
      >
        <Input
          label="Título da sessão"
          placeholder="Ex: Sessão 01 - Anamnese"
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="Título do prontuário"
        />
        <Input
          label="Data da sessão"
          placeholder="AAAA-MM-DD"
          value={date}
          onChangeText={setDate}
          accessibilityLabel="Data da sessão"
        />
        <Input
          label="Conteúdo do prontuário"
          placeholder="Evolução clínica, intervenções realizadas..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={4}
          accessibilityLabel="Conteúdo do prontuário"
        />
        <Input
          label="Notas privadas"
          placeholder="Observações sigilosas..."
          value={privateNotes}
          onChangeText={setPrivateNotes}
          multiline
          numberOfLines={2}
          accessibilityLabel="Notas privadas do psicólogo"
        />
      </AppModal>

      {/* Modal: Edição dos dados do paciente (componente compartilhado).
          O `key` remonta o formulário a cada abertura. */}
      <PatientFormModal
        key={patient?.id ?? 'paciente'}
        visible={patientModalVisible}
        mode="edit"
        initial={patient}
        onDismiss={() => setPatientModalVisible(false)}
        onSubmit={handleSavePatient}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Card de prontuário — usado nos prontuários ativos e arquivados       */
/* ------------------------------------------------------------------ */
function RecordCard({
  record,
  archived = false,
  deleting = false,
  onPress,
  onArchive,
  onDelete,
}: {
  record: MedicalRecord;
  archived?: boolean;
  deleting?: boolean;
  onPress: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={[styles.recordCard, archived && styles.recordCardArchived]}>
      <View style={styles.recordHeader}>
        <View style={[styles.recordIcon, archived && styles.recordIconArchived]}>
          <FileText size={18} color={archived ? colors.textTertiary : ACCENT} />
        </View>

        {/*
          A área que abre o prontuário e os botões de ação são **irmãos**
          dentro de uma View. Aninhar um botão dentro de outro (`button`
          dentro de `button`) é HTML inválido e o React avisa no console
          web — além de quebrar leitores de tela.
        */}
        <TouchableOpacity
          style={styles.recordInfo}
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Editar prontuário ${archived ? 'arquivado ' : ''}${record.title}`}
          accessibilityHint="Toque para visualizar e editar o prontuário"
        >
          <Text
            style={[styles.recordTitle, archived && styles.recordTitleArchived]}
            numberOfLines={2}
          >
            {record.title}
          </Text>
          <Text style={styles.recordDate}>{record.date}</Text>
        </TouchableOpacity>

        <View style={styles.recordActions}>
          <TouchableOpacity
            style={styles.iconAction}
            onPress={onArchive}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={archived ? 'Restaurar prontuário' : 'Arquivar prontuário'}
          >
            {archived ? (
              <CheckIcon size={16} color={ACCENT} />
            ) : (
              <Archive size={16} color={ACCENT} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconAction, styles.iconActionDanger]}
            onPress={onDelete}
            activeOpacity={0.8}
            disabled={deleting}
            accessibilityRole="button"
            accessibilityLabel={`Excluir prontuário ${record.title}`}
          >
            {deleting ? (
              <ActivityIndicator size={14} color={colors.danger} />
            ) : (
              <Trash2 size={16} color={colors.danger} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.recordContentWrap}
        accessibilityRole="button"
        accessibilityLabel={`Ver conteúdo do prontuário ${record.title}`}
      >
        <Text
          style={[styles.recordContent, archived && styles.recordContentArchived]}
          numberOfLines={3}
        >
          {record.content}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderColor: colors.border,
    ...shadowCard,
  },
  /**
   * Alvo de toque de 44x44 px (Apple HIG / WCAG 2.5.8).
   *
   * O ícone continua com 20px; quem cresce é a **área de toque**.
   */
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.cardInner,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topBarTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    textAlign: 'center',
  },
  // espaço reservado simétrico ao backBtn (44px), para centralizar o título
  topBarSpacer: { width: 44, height: 44, flexShrink: 0 },

  scroll: { padding: spacing.xl, gap: spacing.lg },

  /* Hero */
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    ...shadowRaised,
  },
  avatarBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.card,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  heroInfo: { alignItems: 'center', gap: spacing.sm },
  patientName: {
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxs,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    maxWidth: '100%',
    flexShrink: 1,
    minWidth: 0,
  },
  contactChipText: { ...typography.caption, color: ACCENT, flexShrink: 1, minWidth: 0 },

  /* Seções */
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sectionHeaderTitle: { flex: 1, minWidth: 0, flexShrink: 1 },
  // botão "Novo" nao pode ficar abaixo de 44px de altura
  addRecordBtn: { paddingVertical: spacing.sm, minHeight: 44, flexShrink: 0 },

  /* Informações */
  infoCard: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoContent: { flex: 1, minWidth: 0, gap: 2 },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.body, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.separator, marginVertical: spacing.xxs },

  /* Prontuários */
  recordsList: { gap: spacing.md },
  listSectionTitle: { ...typography.label, color: colors.textSecondary, marginTop: spacing.sm },
  recordCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadowCard,
  },
  recordCardArchived: { backgroundColor: colors.cardInner },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  recordIconArchived: { backgroundColor: colors.mutedSoft },
  // areas de toque: abrem o prontuário; mínimo 44px (HIG / WCAG 2.5.8)
  recordInfo: { flex: 1, minWidth: 0, gap: 2, minHeight: 44, justifyContent: 'center' },
  recordTitle: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  recordTitleArchived: { color: colors.textMuted, textDecorationLine: 'line-through' },
  recordDate: { ...typography.caption, color: colors.textMuted },
  /**
   * Área de toque que abre o prontuário.
   *
   * `alignSelf: 'stretch'` é importante: sem largura declarada, um filho
   * de `View` pode ficar com a largura intrínseca do texto (18px no
   * gate). Com stretch ele ocupa a largura do card — e o alvo de toque
   * passa a ser a linha inteira, como esperado.
   */
  recordContentWrap: {
    marginTop: -spacing.xs,
    minHeight: 44,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  recordContent: { ...typography.bodyRegular, color: colors.textSecondary, lineHeight: 19 },
  recordContentArchived: { color: colors.textMuted },
  recordActions: { flexDirection: 'row', gap: spacing.xs, flexShrink: 1, minWidth: 0 },
  /**
   * Alvo de toque de 44x44 px.
   *
   * Antes era 34x34 — abaixo do mínimo recomendado (Apple HIG) e do
   * WCAG 2.5.8 (AA). O ícone continua 16px; só a área de toque cresce.
   */
  iconAction: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconActionDanger: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },

  /* Ações */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  // 2 colunas: o tile precisa de uma base percentual, senão o `flex: 1`
  // interno do ActionTile deixa todos os tiles caberem numa linha só
  actionCell: { flexBasis: '47%', flexGrow: 1, flexShrink: 1 },

  /* Estados vazios */
  emptyContainer: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...typography.title2, color: colors.textPrimary, textAlign: 'center' },
  emptySub: { ...typography.bodyRegular, color: colors.textSecondary, textAlign: 'center' },
  emptyBtn: { marginTop: spacing.sm, alignSelf: 'stretch' },

  emptyCard: {
    backgroundColor: colors.card,
    padding: spacing.xxl,
    borderRadius: radius.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.cardInner,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
});
