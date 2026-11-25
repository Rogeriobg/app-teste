import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectionAsync, impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, Patient, MedicalRecord } from '@/context/AppContext';
import { Button, Card } from '@/components';
import {
  FileText,
  Users,
  Download,
  Archive,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';

const ACCENT = '#0D9488';
const BACKGROUND = '#F4FBF7';
const CARD = '#FFFFFF';
const TEXT_DARK = '#133E2B';
const TEXT_MUTED = '#64748B';
const BORDER = '#E2E8F0';

export default function ExportPdfScreen() {
  const { patientId } = useLocalSearchParams() as { patientId: string };
  const { db, getRecordsByPatient } = useApp();

  const insets = useSafeAreaInsets();

  const patient = db.patients.find((p: Patient) => p.id === patientId);
  const records = getRecordsByPatient(patientId);
  const activeRecords = records.filter((r: MedicalRecord) => r.status === 'Ativo');
  const archivedRecords = records.filter((r: MedicalRecord) => r.status === 'Arquivado');

  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);

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

  const buildHtml = useCallback((): string => {
    const dateFormatted = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const recordsHtml = records
      .map(
        (r: MedicalRecord) => `
        <div style="border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:14px; background:#FFFFFF;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <h3 style="margin:0; font-size:16px; font-weight:700; color:#133E2B;">${r.title}</h3>
            <span style="font-size:12px; color:#64748B; font-weight:600;">${r.date}</span>
          </div>
          <div style="color:#374151; font-size:14px; line-height:1.6; margin-bottom:8px;">${r.content}</div>
          ${r.privateNotes ? `<div style="margin-top:8px; padding:8px; background:#E6F4ED; border-radius:8px; font-size:13px; color:#0F766E; font-weight:600;">Notas privadas: ${r.privateNotes}</div>` : ''}
          <div style="margin-top:8px; font-size:11px; color:#94A3B8; font-weight:600; text-transform:uppercase;">
            Status: ${r.status === 'Ativo' ? 'Ativo' : 'Arquivado'}
          </div>
        </div>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Prontuário - ${patient?.name}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm 15mm 20mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #133E2B;
              line-height: 1.6;
              font-size: 14px;
              margin: 0;
              padding: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
              padding-bottom: 20px;
              border-bottom: 2px solid #0D9488;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              color: #133E2B;
            }
            .header .subtitle {
              font-size: 14px;
              color: #0D9488;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .patient-info {
              background: #F4FBF7;
              border: 1px solid #D1EFE2;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 20px;
            }
            .patient-info h2 {
              margin: 0 0 12px 0;
              font-size: 18px;
              font-weight: 700;
              color: #133E2B;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              font-size: 13px;
            }
            .info-row .label {
              color: #64748B;
              font-weight: 600;
            }
            .info-row .value {
              color: #133E2B;
              font-weight: 500;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #133E2B;
              margin: 20px 0 12px 0;
              padding-bottom: 6px;
              border-bottom: 1px solid #E2E8F0;
            }
            .record {
              border: 1px solid #E2E8F0;
              border-radius: 12px;
              padding: 16px;
              margin-bottom: 14px;
              background: #FFFFFF;
              page-break-inside: avoid;
            }
            .record-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }
            .record-title {
              margin: 0;
              font-size: 16px;
              font-weight: 700;
              color: #133E2B;
            }
            .record-date {
              font-size: 12px;
              color: #64748B;
              font-weight: 600;
            }
            .record-content {
              color: #374151;
              font-size: 14px;
              line-height: 1.6;
              margin-bottom: 8px;
            }
            .private-notes {
              margin-top: 8px;
              padding: 8px;
              background: #E6F4ED;
              border-radius: 8px;
              font-size: 13px;
              color: #0F766E;
              font-weight: 600;
            }
            .record-status {
              margin-top: 8px;
              font-size: 11px;
              color: #94A3B8;
              font-weight: 600;
              text-transform: uppercase;
            }
            .empty-state {
              text-align: center;
              color: #94A3B8;
              font-size: 14px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 16px;
              border-top: 1px solid #E2E8F0;
              font-size: 11px;
              color: #94A3B8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Prontuário Clínico</h1>
            <div class="subtitle">PsiApp • Consultório Psicológico</div>
            <div style="margin-top:8px; font-size:12px; color:#64748b;">Gerado em ${dateFormatted}</div>
          </div>

          <div class="patient-info">
            <h2>Dados do Paciente</h2>
            <div class="info-row">
              <span class="label">Nome:</span>
              <span class="value">${patient?.name ?? 'Não informado'}</span>
            </div>
            <div class="info-row">
              <span class="label">E-mail:</span>
              <span class="value">${patient?.email ?? 'Não informado'}</span>
            </div>
            <div class="info-row">
              <span class="label">Telefone:</span>
              <span class="value">${patient?.phone ?? 'Não informado'}</span>
            </div>
            <div class="info-row">
              <span class="label">Data de Nascimento:</span>
              <span class="value">${patient?.birthDate ?? 'Não informada'}</span>
            </div>
            <div class="info-row">
              <span class="label">Status:</span>
              <span class="value" style="text-transform:uppercase; font-weight:700; color:${patient?.status === 'Ativo' ? '#0D9488' : '#64748B'}">${patient?.status ?? 'Não informado'}</span>
            </div>
            <div class="info-row" style="margin-top:8px;">
              <span class="label">Anamnese:</span>
              <span class="value">${patient?.anamnesis ?? 'Não informada'}</span>
            </div>
          </div>

          <div class="section-title">Prontuários (${records.length})</div>
          ${records.length > 0 ? recordsHtml : '<div class="empty-state">Nenhum prontuário cadastrado para este paciente.</div>'}

          <div class="footer">
            PsiApp — Consultório Pessoal do Psicólogo<br />
            Dados gerados localmente no dispositivo. ${dateFormatted}
          </div>
        </body>
      </html>
    `;
  }, [patient, records]);

  const handleExportPdf = async () => {
    if (!patient) {
      Alert.alert('Erro', 'Paciente não encontrado.');
      Haptic.error();
      return;
    }

    setGenerating(true);
    try {
      const html = buildHtml();
      const { uri } = await printToFileAsync({
        html,
        base64: false,
      });

      await Haptic.success();
      Alert.alert(
        'PDF gerado com sucesso',
        `O prontuário de ${patient.name} foi gerado. Escolha um app para salvar ou compartilhar.`,
      );

      await handleSharePdf(uri);
    } catch {
      await Haptic.error();
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSharePdf = async (uri: string) => {
    setSharing(true);
    try {
      await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Prontuário - ${patient?.name}`,
      });
      await Haptic.success();
    } catch {
      await Haptic.error();
      Alert.alert('Erro', 'Não foi possível compartilhar o PDF.');
    } finally {
      setSharing(false);
    }
  };

  const handleBack = () => {
    Haptic.selection();
    router.back();
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
              onPress={handleBack}
              iconLeft={<ChevronRight size={18} color="#FFFFFF" />}
            >
              Voltar
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: BACKGROUND }, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        style={{ paddingBottom: insets.bottom + 100 }}
      >
        {/* Header */}
        <View style={styles.headerWrapper}>
          <View style={styles.headerCard}>
            <View style={styles.headerContent}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatarBadge}>
                  <FileText size={34} color="#FFFFFF" />
                </View>
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.screenTitle}>Exportar Prontuário</Text>
                <Text style={styles.screenSub}>
                  Gerar PDF com os dados e prontuários de {patient.name}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo</Text>
          <Card style={styles.summaryCard} elevated>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryBox, styles.summaryTotal]}>
                <FileText size={22} color="#2563EB" />
                <Text style={styles.summaryNum}>{records.length}</Text>
                <Text style={styles.summaryLabel}>Prontuários</Text>
              </View>
              <View style={[styles.summaryBox, styles.summaryActive]}>
                <Users size={22} color={ACCENT} />
                <Text style={styles.summaryNum}>{activeRecords.length}</Text>
                <Text style={styles.summaryLabel}>Ativos</Text>
              </View>
              <View style={[styles.summaryBox, styles.summaryArchived]}>
                <Archive size={22} color="#94A3B8" />
                <Text style={styles.summaryNum}>{archivedRecords.length}</Text>
                <Text style={styles.summaryLabel}>Arquivados</Text>
              </View>
            </View>
          </Card>

          {/* Informações do paciente */}
          <Card style={styles.infoCard} elevated>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Paciente</Text>
              <Text style={styles.infoValue}>{patient.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>E-mail</Text>
              <Text style={styles.infoValue}>{patient.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total de sessões</Text>
              <Text style={styles.infoValue}>{records.length}</Text>
            </View>
          </Card>
        </View>

        {/* Ações (thumb zone) */}
        <View style={styles.actionsSection}>
          <Button
            variant="primary"
            onPress={handleExportPdf}
            disabled={generating || sharing}
            loading={generating || sharing}
            style={styles.exportButton}
            iconLeft={<Download size={20} color="#FFFFFF" />}
            accessibilityLabel="Exportar prontuário em PDF"
          >
            {generating ? 'Gerando PDF...' : sharing ? 'Compartilhando...' : 'Exportar PDF'}
          </Button>

          <Button
            variant="outline"
            onPress={handleBack}
            style={styles.backButton}
            iconLeft={<ChevronRight size={18} color={ACCENT} />}
            accessibilityLabel="Voltar aos detalhes do paciente"
          >
            Voltar
          </Button>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  headerContent: {
    alignItems: 'center',
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
  screenTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 6,
  },
  screenSub: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
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
  summaryCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    padding: 16,
  },
  summaryBox: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryTotal: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  summaryActive: {
    borderColor: ACCENT,
    backgroundColor: '#E6F4ED',
  },
  summaryArchived: {
    borderColor: '#94A3B8',
    backgroundColor: '#F3F4F6',
  },
  summaryNum: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: TEXT_MUTED,
    fontWeight: '600',
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
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
  },
  infoValue: {
    fontSize: 14,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  actionsSection: {
    marginBottom: 24,
  },
  exportButton: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
  },
  bottomSpacer: {
    height: 16,
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
});
