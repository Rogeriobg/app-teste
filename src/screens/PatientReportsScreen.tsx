import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useApp, MedicalRecord } from '../context/AppContext';
import {
  FileText,
  Archive,
  Trash2,
  CheckCircle2,
  Clock,
  Plus,
  Edit2,
  Lock,
} from 'lucide-react-native';

export type PatientReportsScreenParams = {
  patientId: string;
  patientName: string;
};

export default function PatientReportsScreen({ route }: { route: { params: PatientReportsScreenParams } }) {
  const { db, addMedicalRecord, archiveMedicalRecord, restoreMedicalRecord, deleteMedicalRecord, updateMedicalRecord } = useApp();
  const { patientId, patientName } = route.params;

  const records = db.medicalRecords.filter(r => r.patientId === patientId);
  const activeRecords = records.filter(r => r.status === 'Ativo');
  const archivedRecords = records.filter(r => r.status === 'Arquivado');

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
        const original = db.medicalRecords.find(r => r.id === editingId);
        await updateMedicalRecord({
          id: editingId,
          patientId,
          patientName,
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
          patientId,
          patientName,
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

  const recordCard = (rec: MedicalRecord, isArchived: boolean) => (
    <View key={rec.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.recordIconRow}>
          <FileText size={18} color={isArchived ? '#94A3B8' : '#0D9488'} />
          <Text style={[styles.recordTitle, isArchived && styles.recordTitleArchived]}>{rec.title}</Text>
        </View>
        <TouchableOpacity style={styles.viewBtn} onPress={() => handleOpenEdit(rec)} activeOpacity={0.8}>
          <Edit2 size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>
      <Text style={styles.recordDate}>
        <Clock size={12} color="#94A3B8" />
        {' '} {rec.date}
      </Text>
      <Text style={styles.recordContent}>{rec.content}</Text>
      <View style={styles.recordActions}>
        {isArchived ? (
          <TouchableOpacity style={[styles.actionBtn, styles.btnRestore]} onPress={() => handleRestore(rec)} activeOpacity={0.8}>
            <CheckCircle2 size={16} color="#0D9488" />
            <Text style={styles.actionText}>Restaurar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, styles.btnArchive]} onPress={() => handleArchive(rec)} activeOpacity={0.8}>
            <Archive size={16} color="#6B7280" />
            <Text style={styles.actionText}>Arquivar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.actionBtn, styles.btnDelete]} onPress={() => handleDelete(rec)} activeOpacity={0.8}>
          <Trash2 size={16} color="#EF4444" />
          <Text style={styles.actionText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Relatórios de {patientName}</Text>
          <Text style={styles.headerSubtitle}>Prontuário e histórico de sessões</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleOpenAdd} activeOpacity={0.85}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Novo Relatório</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Resumo */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryBox, styles.summaryTotal]}>
            <Text style={styles.summaryNum}>{records.length}</Text>
            <Text style={styles.summaryLabel}>Relatórios</Text>
          </View>
          <View style={[styles.summaryBox, styles.summaryActive]}>
            <Text style={styles.summaryNum}>{activeRecords.length}</Text>
            <Text style={styles.summaryLabel}>Ativos</Text>
          </View>
          <View style={[styles.summaryBox, styles.summaryArchived]}>
            <Text style={styles.summaryNum}>{archivedRecords.length}</Text>
            <Text style={styles.summaryLabel}>Arquivados</Text>
          </View>
        </View>

        {/* Relatórios Ativos */}
        <Text style={styles.sectionTitle}>Prontuários Ativos</Text>
        {activeRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle2 size={28} color="#0D9488" />
            <Text style={styles.emptyTitle}>Nenhum relatório ativo</Text>
            <Text style={styles.emptySub}>Todos os prontuários deste paciente estão arquivados.</Text>
          </View>
        ) : (
          activeRecords.map(rec => recordCard(rec, false))
        )}

        {/* Relatórios Arquivados */}
        {archivedRecords.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Prontuários Arquivados</Text>
            {archivedRecords.map(rec => recordCard(rec, true))}
          </>
        )}

        {records.length === 0 && (
          <View style={styles.emptyCard}>
            <FileText size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Nenhum relatório cadastrado</Text>
            <Text style={styles.emptySub}>Inicie o prontuário deste paciente nas próximas sessões.</Text>
          </View>
        )}
      </ScrollView>

      {/* Modal Criar / Editar Prontuário */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalKeyboard}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Editar Relatório / Prontuário' : 'Novo Relatório de Sessão'}
              </Text>

              <Text style={styles.label}>Título da Sessão / Relatório</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Sessão 01 - Anamnese e Vínculo"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.label}>Data da Sessão</Text>
              <TextInput
                style={styles.input}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#94A3B8"
                value={date}
                onChangeText={setDate}
              />

              <Text style={styles.label}>Conteúdo do Prontuário (evolução)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Relato da sessão, evolução clínica, intervenções realizadas..."
                placeholderTextColor="#94A3B8"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.label}>
                <Lock size={12} color="#0D9488" /> Notas Privadas do Psicólogo
              </Text>
              <TextInput
                style={[styles.input, styles.inputMultilineSmall]}
                placeholder="Observações sigilosas, hipóteses diagnósticas..."
                placeholderTextColor="#94A3B8"
                value={privateNotes}
                onChangeText={setPrivateNotes}
                multiline
                numberOfLines={2}
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
                  onPress={handleSaveRecord}
                >
                  <Text style={styles.saveModalText}>{isEditing ? 'Salvar Alterações' : 'Criar Relatório'}</Text>
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

  scroll: { padding: 16, paddingBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  summaryBox: { flex: 1, borderRadius: 18, padding: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  summaryTotal: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  summaryActive: { borderColor: '#0D9488', backgroundColor: '#E6F4ED' },
  summaryArchived: { borderColor: '#94A3B8', backgroundColor: '#F3F4F6' },
  summaryNum: { fontSize: 22, fontWeight: '800', color: '#133E2B' },
  summaryLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 4 },

  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#133E2B', marginVertical: 14, marginLeft: 4 },

  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  recordIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  recordTitle: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', flex: 1 },
  recordTitleArchived: { color: '#94A3B8', textDecorationLine: 'line-through' },
  viewBtn: { padding: 6 },
  recordDate: { flexDirection: 'row', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B', marginBottom: 10 },
  metaIcon: { color: '#94A3B8' },
  recordContent: { fontSize: 13, color: '#374151', lineHeight: 20, marginBottom: 14 },
  recordActions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
  },
  btnArchive: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  btnRestore: { backgroundColor: '#D1FAE5', borderColor: '#BBF7D0' },
  btnDelete: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionText: { fontSize: 11, fontWeight: '700' },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#133E2B', marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center' },

  // Header ações
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

  // Modal
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
  inputMultilineSmall: { height: 64, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelModalBtn: { backgroundColor: '#F1F5F9' },
  cancelModalText: { color: '#64748B', fontWeight: 'bold', fontSize: 14 },
  saveModalBtn: { backgroundColor: '#0D9488' },
  saveModalText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});
