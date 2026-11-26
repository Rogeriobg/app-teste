import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useApp, MedicalRecord } from '@/context/AppContext';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card, AppModal, StatSummary } from '@/components';

import {
  FileText,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Lock,
  Calendar,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius, shadowCard, spacing, typography } from '@/theme/tokens';

export type PatientReportsScreenParams = {
  patientId: string;
  patientName: string;
};

export default function PatientReportsScreen() {
  const { db, addMedicalRecord, archiveMedicalRecord, restoreMedicalRecord, deleteMedicalRecord, updateMedicalRecord } = useApp();
  const { patientId, patientName } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const patientIdStr = typeof patientId === 'string' ? patientId : String(patientId ?? '');
  const patientNameStr = typeof patientName === 'string' ? patientName : String(patientName ?? '');

  const records = db.medicalRecords.filter((r: MedicalRecord) => r.patientId === patientIdStr);
  const activeRecords = records.filter((r: MedicalRecord) => r.status === 'Ativo');
  const archivedRecords = records.filter((r: MedicalRecord) => r.status === 'Arquivado');

  const handleArchive = async (rec: MedicalRecord) => {
    await archiveMedicalRecord(rec.id);
    Alert.alert('Sucesso', 'Relatório arquivado.');
  };

  const handleRestore = async (rec: MedicalRecord) => {
    await restoreMedicalRecord(rec.id);
    Alert.alert('Sucesso', 'Relatório restaurado para ativo.');
  };

  const handleDelete = async (rec: MedicalRecord) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir o relatório "${rec.title}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteMedicalRecord(rec.id);
            Alert.alert('Sucesso', 'Relatório excluído.');
          },
        },
      ]
    );
  };

  const [modalVisible, setModalVisible] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [content, setContent] = React.useState('');
  const [privateNotes, setPrivateNotes] = React.useState('');
  const [datePickerVisible, setDatePickerVisible] = React.useState(false);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('Sessão Terapêutica');
    setDate(new Date().toISOString().slice(0, 10));
    setContent('');
    setPrivateNotes('');
    setModalVisible(true);
  };

  const handleOpenEdit = (rec: MedicalRecord) => {
    setIsEditing(true);
    setEditingId(rec.id);
    setTitle(rec.title);
    setDate(rec.date);
    setContent(rec.content);
    setPrivateNotes(rec.privateNotes);
    setModalVisible(true);
  };

  const handleSaveRecord = async () => {
    if (!title.trim()) {
      Alert.alert('Atenção', 'Informe o título do relatório.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Atenção', 'Informe o conteúdo do prontuário.');
      return;
    }

    try {
      if (isEditing && editingId) {
        const original = db.medicalRecords.find((r: MedicalRecord) => r.id === editingId);
        await updateMedicalRecord({
          id: editingId,
          patientId: patientIdStr,
          patientName: patientNameStr,
          title: title.trim(),
          date: date.trim() || new Date().toISOString().slice(0, 10),
          content: content.trim(),
          privateNotes: privateNotes.trim(),
          status: original?.status ?? 'Ativo',
          archivedAt: original?.archivedAt ?? null,
          createdAt: original?.createdAt ?? new Date().toISOString(),
        });
        Alert.alert('Sucesso', 'Relatório atualizado com sucesso!');
      } else {
        await addMedicalRecord({
          patientId: patientIdStr,
          patientName: patientNameStr,
          title: title.trim(),
          date: date.trim() || new Date().toISOString().slice(0, 10),
          content: content.trim(),
          privateNotes: privateNotes.trim(),
          status: 'Ativo',
        });
        Alert.alert('Sucesso', 'Relatório criado com sucesso!');
      }
      setModalVisible(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o relatório.');
    }
  };

  const handleOpenDatePicker = () => setDatePickerVisible(true);
  const handleDateChange = (_event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate.toISOString().slice(0, 10));
    }
    setDatePickerVisible(false);
  };

  const recordCard = (rec: MedicalRecord, isArchived: boolean) => (
    <Card key={rec.id} style={styles.recordCard} elevated>
      <View style={styles.recordHeader}>
        <View style={styles.recordIconRow}>
          <FileText size={18} color={isArchived ? colors.textTertiary : colors.brand} />
          <Text style={[styles.recordTitle, isArchived && styles.recordTitleArchived]}>{rec.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => handleOpenEdit(rec)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Editar relatório ${rec.title}`}
        >
          <Edit2 size={16} color={colors.info} />
        </TouchableOpacity>
      </View>
      <Text style={styles.recordDate}>
        <Clock size={12} color={colors.textTertiary} />
        {' '} {rec.date}
      </Text>
      <Text style={styles.recordContent}>{rec.content}</Text>
      <View style={styles.recordActions}>
        {isArchived ? (
          <TouchableOpacity style={[styles.actionBtn, styles.btnRestore]} onPress={() => handleRestore(rec)} activeOpacity={0.8}>
            <CheckCircle2 size={16} color={colors.success} />
            <Text style={styles.actionText}>Restaurar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, styles.btnArchive]} onPress={() => handleArchive(rec)} activeOpacity={0.8}>
            <Archive size={16} color={colors.contentSecondary} />
            <Text style={styles.actionText}>Arquivar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.btnDelete]} onPress={() => handleDelete(rec)} activeOpacity={0.8}>
          <Trash2 size={16} color={colors.danger} />
          <Text style={styles.actionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.headerIdentity}>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
            Relatórios de {patientNameStr}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
            Prontuário e histórico de sessões
          </Text>
        </View>
        <Button
          variant="primary"
          onPress={handleOpenAdd}
          style={styles.headerAction}
          iconLeft={<Plus size={18} color={colors.textOnBrand} />}
          accessibilityLabel="Cadastrar novo relatório"
        >
          Novo Relatório
        </Button>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Resumo */}
        <StatSummary
          title="Relatórios"
          total={records.length}
          segments={[
            { label: 'Ativos', count: activeRecords.length, color: colors.brand },
            { label: 'Arquivados', count: archivedRecords.length, color: colors.muted },
          ]}
        />

        {/* Relatórios Ativos */}
        <Text style={styles.sectionTitle}>Prontuários Ativos</Text>
        {activeRecords.length === 0 ? (
          <Card style={styles.emptyCard} elevated>
            <CheckCircle2 size={28} color={colors.success} />
            <Text style={styles.emptyTitle}>Nenhum relatório ativo</Text>
            <Text style={styles.emptySub}>Todos os prontuários deste paciente estão arquivados.</Text>
          </Card>
        ) : (
          activeRecords.map((rec: MedicalRecord) => recordCard(rec, false))
        )}

        {/* Relatórios Arquivados */}
        {archivedRecords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Prontuários Arquivados</Text>
            {archivedRecords.map((rec: MedicalRecord) => recordCard(rec, true))}
          </>
        )}

        {records.length === 0 && (
          <Card style={styles.emptyCard} elevated>
            <FileText size={36} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Nenhum relatório cadastrado</Text>
            <Text style={styles.emptySub}>Inicie o prontuário deste paciente nas próximas sessões.</Text>
          </Card>
        )}
      </ScrollView>

      {/* Modal Criar / Editar Prontuário */}
      <AppModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        title={isEditing ? 'Editar Relatório / Prontuário' : 'Novo Relatório de Sessão'}
        cancelTitle="Cancelar"
        confirmTitle={isEditing ? 'Salvar Alterações' : 'Criar Relatório'}
        onConfirm={handleSaveRecord}
      >
        <Input
          label="Título da Sessão / Relatório"
          placeholder="Ex: Sessão 01 - Anamnese e Vínculo"
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
          accessibilityLabel="Título do relatório"
        />

        <TouchableOpacity
          style={styles.datePickerInput}
          onPress={handleOpenDatePicker}
          activeOpacity={0.8}
          accessibilityLabel="Selecionar data da sessão"
        >
          <Calendar size={18} color={colors.textTertiary} style={styles.datePickerIcon} />
          <Text style={[styles.datePickerText, !date && styles.datePickerPlaceholder]}>
            {date || 'AAAA-MM-DD'}
          </Text>
        </TouchableOpacity>

        {datePickerVisible && (
          <DateTimePicker
            value={date ? new Date(date) : new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date(1900, 0, 1)}
            maximumDate={new Date()}
          />
        )}

        <Input
          label="Conteúdo do Prontuário (evolução)"
          placeholder="Relato da sessão, evolução clínica, intervenções realizadas..."
          placeholderTextColor={colors.textTertiary}
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={4}
          accessibilityLabel="Conteúdo do prontuário"
        />

        <View style={styles.privateNotesLabelRow}>
          <Lock size={12} color={colors.brand} />
          <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
            Notas Privadas do Psicólogo
          </Text>
        </View>
        <Input
          label=" "
          placeholder="Observações sigilosas, hipóteses diagnósticas..."
          placeholderTextColor={colors.textTertiary}
          value={privateNotes}
          onChangeText={setPrivateNotes}
          multiline
          numberOfLines={2}
          accessibilityLabel="Notas privadas do psicólogo"
        />
      </AppModal>
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
  /**
   * Container do título.
   *
   * `flex: 1` + `minWidth: 0` obrigam o bloco a ceder espaço ao botão —
   * sem isso o título mantém a largura intrínseco e o botão
   * "Novo Relatório" transborda a tela em aparelhos de 360–375pt.
   */
  headerIdentity: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'center',
  },
  /** Botão do header: largura fixa pelo próprio conteúdo, nunca encolhe. */
  headerAction: {
    flexShrink: 0,
    flexGrow: 0,
    paddingHorizontal: spacing.lg,
  },

  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },

  sectionTitle: { ...typography.headline, fontSize: 15, color: colors.textPrimary, marginVertical: spacing.lg, marginLeft: spacing.xs },

  recordCard: {
    marginBottom: spacing.lg,
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md },
  recordIconRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minWidth: 0 },
  recordTitle: { ...typography.headline, color: colors.textPrimary, flex: 1, minWidth: 0 },
  recordTitleArchived: { color: colors.textTertiary, textDecorationLine: 'line-through' },
  viewBtn: { padding: spacing.sm },
  recordDate: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, ...typography.caption, color: colors.textSecondary, marginBottom: spacing.lg },
  recordContent: { ...typography.bodyRegular, color: colors.contentMuted, lineHeight: 20, marginBottom: spacing.lg },
  recordActions: { flexDirection: 'row', gap: spacing.lg },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    borderWidth: 1,
    minHeight: 44,
  },
  btnArchive: { backgroundColor: colors.mutedSoft, borderColor: colors.mutedBorder },
  btnRestore: { backgroundColor: colors.successSoft, borderColor: colors.successBorder },
  btnDelete: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  actionText: { ...typography.caption, flexShrink: 1, minWidth: 0 },

  emptyCard: {
    padding: spacing.xxxl,
    borderRadius: radius.xxl,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.headline, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
  emptySub: { ...typography.bodyRegular, color: colors.textSecondary, textAlign: 'center' },

  privateNotesLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    flexShrink: 1,
  },
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
  datePickerText: { ...typography.body, color: colors.inputText, flex: 1, minWidth: 0 },
  datePickerPlaceholder: { color: colors.textTertiary },
  label: { ...typography.label, color: colors.labelText, marginBottom: spacing.sm, flexShrink: 1, minWidth: 0 },
});
