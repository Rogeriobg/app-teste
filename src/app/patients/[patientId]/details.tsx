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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectionAsync, impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, Patient, MedicalRecord } from '@/context/AppContext';
import { Button, Card, Input, StatusBadge, AppModal, StatSummary } from '@/components';
import { colors } from '@/theme/tokens';
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
  ChevronRight,
  AlertCircle,
  CheckCircle2 as CheckIcon,
  Download,
} from 'lucide-react-native';

const ACCENT = '#0D9488';
const BACKGROUND = '#F4FBF7';
const CARD = '#FFFFFF';
const TEXT_DARK = '#133E2B';
const TEXT_MUTED = '#64748B';
const BORDER = '#E2E8F0';
const DANGER = '#EF4444';

export default function PatientDetailsScreen() {
  const { patientId } = useLocalSearchParams() as { patientId: string };
  const {
    db,
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

  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [content, setContent] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

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
    setModalVisible(true);
    Haptic.selection();
  };

  const handleOpenEditRecord = (rec: MedicalRecord) => {
    setIsEditing(true);
    setEditingId(rec.id);
    setTitle(rec.title);
    setDate(rec.date);
    setContent(rec.content);
    setPrivateNotes(rec.privateNotes);
    setModalVisible(true);
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
      setModalVisible(false);
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

  const handleOpenReports = () => {
    if (!patient) return;
    router.push(`/patients/${patient.id}/reports?patientName=${encodeURIComponent(patient.name)}`);
    Haptic.selection();
  };

  const handleExportPdf = () => {
    if (!patient) return;
    router.push(`/patients/${patient.id}/export-pdf`);
    Haptic.selection();
  };

  const handleEditPatient = () => {
    if (!patient) return;
    setIsEditing(true);
    setModalVisible(true);
    Haptic.selection();
  };

  if (!patient) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>Paciente não encontrado</Text>
            <Button
              variant="primary"
              onPress={() => router.replace('/patients')}
              iconLeft={<ChevronRight size={18} color="#FFFFFF" />}
            >
              Voltar aos pacientes
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const statusLabel = patient.status === 'Ativo' ? 'Ativo' : patient.status === 'Inativo' ? 'Inativo' : 'Arquivado';

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: BACKGROUND }, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        style={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Header com avatar e nome */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerCard}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBadge}>
                <Users size={34} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <View style={styles.statusRow}>
                <StatusBadge status={patient.status as any} />
                <Text style={styles.statusText}>{statusLabel}</Text>
              </View>
              <View style={styles.contactRow}>
                <Mail size={16} color="#94A3B8" style={styles.contactIcon} />
                <Text style={styles.contactText}>{patient.email}</Text>
              </View>
              <View style={[styles.contactRow, { marginTop: 4 }]}>
                <Phone size={16} color="#94A3B8" style={styles.contactIcon} />
                <Text style={styles.contactText}>{patient.phone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Informações do paciente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do paciente</Text>

          <Card style={styles.infoCard} elevated>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color={ACCENT} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Data de nascimento</Text>
                <Text style={styles.infoValue}>{patient.birthDate || 'Não informada'}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <FileText size={20} color={ACCENT} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Anamnese</Text>
                <Text style={styles.infoValue}>{patient.anamnesis || 'Não informada'}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Resumo de relatórios */}
        <View style={styles.section}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Prontuários</Text>
            <Button
              variant="primary"
              onPress={handleOpenAddRecord}
              iconLeft={<Plus size={18} color="#FFFFFF" />}
              style={styles.addRecordBtn}
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

          {/* Lista de relatórios */}
          {records.length === 0 ? (
            <Card style={styles.emptyCard} elevated>
              <View style={styles.emptyIconContainer}>
                <FileText size={40} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Nenhum prontuário cadastrado</Text>
              <Text style={styles.emptySub}>Inicie o prontuário deste paciente nas próximas sessões.</Text>
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
                    <TouchableOpacity
                      key={rec.id}
                      style={styles.recordCard}
                      onPress={() => handleOpenEditRecord(rec)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar prontuário ${rec.title}`}
                      accessibilityHint="Toque para visualizar e editar o prontuário"
                    >
                      <View style={styles.recordHeader}>
                        <View style={styles.recordIcon}>
                          <FileText size={18} color={ACCENT} />
                        </View>
                        <View style={styles.recordInfo}>
                          <Text style={styles.recordTitle}>{rec.title}</Text>
                          <Text style={styles.recordDate}>{rec.date}</Text>
                        </View>
                        <ChevronRight size={16} color="#CBD5E1" />
                      </View>
                      <Text style={styles.recordContent}>{rec.content}</Text>
                      <View style={styles.recordActions}>
                        <TouchableOpacity
                          style={[styles.recordActionBtn, styles.btnArchive]}
                          onPress={(e) => { e.stopPropagation(); handleArchiveRecord(rec); }}
                          activeOpacity={0.8}
                        >
                          {rec.status === 'Arquivado' ? (
                            <CheckIcon size={16} color="#FFFFFF" />
                          ) : (
                            <Archive size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.recordActionBtn, styles.btnDelete]}
                          onPress={(e) => { e.stopPropagation(); handleDeleteRecord(rec); }}
                          activeOpacity={0.8}
                          disabled={deletingRecordId === rec.id}
                        >
                          {deletingRecordId === rec.id ? (
                            <ActivityIndicator size={16} color="#FFFFFF" />
                          ) : (
                            <Trash2 size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {archivedRecords.length > 0 && (
                <>
                  <Text style={styles.listSectionTitle}>Prontuários arquivados</Text>
                  {archivedRecords.map((rec: MedicalRecord) => (
                    <TouchableOpacity
                      key={rec.id}
                      style={[styles.recordCard, styles.recordArchived]}
                      onPress={() => handleOpenEditRecord(rec)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar prontuário arquivado ${rec.title}`}
                    >
                      <View style={styles.recordHeader}>
                        <View style={styles.recordIcon}>
                          <FileText size={18} color="#94A3B8" />
                        </View>
                        <View style={styles.recordInfo}>
                          <Text style={[styles.recordTitle, styles.recordTitleArchived]}>{rec.title}</Text>
                          <Text style={styles.recordDate}>{rec.date}</Text>
                        </View>
                        <ChevronRight size={16} color="#CBD5E1" />
                      </View>
                      <Text style={[styles.recordContent, styles.recordContentArchived]}>{rec.content}</Text>
                      <View style={styles.recordActions}>
                        <TouchableOpacity
                          style={[styles.recordActionBtn, styles.btnRestore]}
                          onPress={(e) => { e.stopPropagation(); handleArchiveRecord(rec); }}
                          activeOpacity={0.8}
                        >
                          <CheckCircle2 size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.recordActionBtn, styles.btnDelete]}
                          onPress={(e) => { e.stopPropagation(); handleDeleteRecord(rec); }}
                          activeOpacity={0.8}
                          disabled={deletingRecordId === rec.id}
                        >
                          {deletingRecordId === rec.id ? (
                            <ActivityIndicator size={16} color="#FFFFFF" />
                          ) : (
                            <Trash2 size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </View>
          )}
        </View>

        {/* Ações do paciente (thumb zone) */}
        <View style={styles.actionsSection}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionEdit]}
              onPress={handleEditPatient}
              activeOpacity={0.8}
              accessibilityLabel="Editar dados do paciente"
              accessibilityHint="Toque para editar nome, e-mail, telefone e anamnese"
            >
              <Edit2 size={22} color="#FFFFFF" />
              <Text style={styles.actionLabel}>Editar paciente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, patient.status === 'Ativo' ? styles.actionToggle : styles.actionToggleInactive]}
              onPress={handleTogglePatientStatus}
              activeOpacity={0.8}
              accessibilityLabel={patient.status === 'Ativo' ? 'Marcar paciente como inativo' : 'Marcar paciente como ativo'}
            >
              {patient.status === 'Ativo' ? (
                <Pause size={22} color="#FFFFFF" />
              ) : (
                <CheckCircle2 size={22} color="#FFFFFF" />
              )}
              <Text style={styles.actionLabel}>
                {patient.status === 'Ativo' ? 'Inativar' : 'Reativar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionArchive]}
              onPress={handleArchivePatient}
              activeOpacity={0.8}
              accessibilityLabel={patient.status === 'Arquivado' ? 'Restaurar paciente' : 'Arquivar paciente'}
            >
              {patient.status === 'Arquivado' ? (
                <CheckCircle2 size={22} color="#FFFFFF" />
              ) : (
                <Archive size={22} color="#FFFFFF" />
              )}
              <Text style={styles.actionLabel}>
                {patient.status === 'Arquivado' ? 'Restaurar' : 'Arquivar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionReports]}
              onPress={handleOpenReports}
              activeOpacity={0.8}
              accessibilityLabel="Ver prontuários do paciente"
            >
              <FileText size={22} color="#FFFFFF" />
              <Text style={styles.actionLabel}>Prontuários</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.actionExport]}
              onPress={handleExportPdf}
              activeOpacity={0.8}
              accessibilityLabel="Exportar prontuário em PDF"
              accessibilityHint="Gera um arquivo PDF com todos os prontuários do paciente"
            >
              <Download size={22} color="#FFFFFF" />
              <Text style={styles.actionLabel}>Exportar PDF</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionDelete]}
            onPress={handleDeletePatient}
            activeOpacity={0.8}
            accessibilityLabel="Excluir paciente e todos os prontuários"
            accessibilityHint="Esta ação não pode ser desfeita"
          >
            <Trash2 size={22} color="#FFFFFF" />
            <Text style={styles.actionLabel}>Excluir paciente</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Modal: Edição de paciente / Novo prontuário */}
      <AppModal
        visible={modalVisible}
        onDismiss={() => { setModalVisible(false); setDeletingRecordId(null); }}
        title={isEditing ? (editingId ? 'Editar Prontuário' : 'Novo Prontuário') : 'Editar Paciente'}
        cancelTitle="Cancelar"
        confirmTitle={isEditing ? 'Salvar Prontuário' : 'Salvar Alterações'}
        onConfirm={handleSaveRecord}
      >
        {!isEditing || !editingId ? (
          <>
            <Input
              label="Nome completo"
              placeholder="Ex: Maria Oliveira"
              value={patient?.name ?? ''}
              onChangeText={(v) => { /* edição de paciente futura */ }}
              accessibilityLabel="Nome completo do paciente"
            />
            <Input
              label="E-mail"
              placeholder="Ex: maria@email.com"
              value={patient?.email ?? ''}
              onChangeText={(v) => { /* edição de paciente futura */ }}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="E-mail do paciente"
            />
            <Input
              label="Telefone"
              placeholder="Ex: (11) 98888-7777"
              value={patient?.phone ?? ''}
              onChangeText={(v) => { /* edição de paciente futura */ }}
              accessibilityLabel="Telefone do paciente"
            />
            <Input
              label="Anamnese"
              placeholder="Queixa principal, histórico, observações..."
              value={patient?.anamnesis ?? ''}
              onChangeText={(v) => { /* edição de paciente futura */ }}
              multiline
              numberOfLines={3}
              accessibilityLabel="Anamnese do paciente"
            />
          </>
        ) : (
          <>
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
          </>
        )}
      </AppModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scroll: {
    padding: 16,
    paddingBottom: 20,
  },
  headerWrapper: {
    marginBottom: 20,
  },
  headerCard: {
    backgroundColor: CARD,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 24,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerInfo: {
    alignItems: 'center',
  },
  patientName: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactIcon: {
    marginRight: 6,
  },
  contactText: {
    fontSize: 14,
    color: TEXT_MUTED,
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addRecordBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  infoCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: TEXT_DARK,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  recordsList: {
    gap: 10,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 8,
    marginLeft: 2,
  },
  recordCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  recordArchived: {
    opacity: 0.7,
    borderColor: '#E5E7EB',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E6F4ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  recordTitleArchived: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  recordDate: {
    fontSize: 12,
    color: TEXT_MUTED,
  },
  recordContent: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 10,
  },
  recordContentArchived: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  recordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  recordActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
  },
  btnArchive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  btnRestore: {
    backgroundColor: '#D1FAE5',
    borderColor: '#BBF7D0',
  },
  btnDelete: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginTop: 16,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    marginHorizontal: 16,
  },
  emptyIconContainer: {
    marginBottom: 12,
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 12,
  },

  actionsSection: {
    marginBottom: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
  },
  actionBtn: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  actionEdit: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionToggle: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionToggleInactive: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionArchive: {
    backgroundColor: '#94A3B8',
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionReports: {
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionExport: {
    backgroundColor: '#6B7280',
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionDelete: {
    backgroundColor: DANGER,
    alignSelf: 'center',
    width: 'auto',
    paddingHorizontal: 20,
    flexDirection: 'row',
    shadowColor: DANGER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 16,
  },
});
