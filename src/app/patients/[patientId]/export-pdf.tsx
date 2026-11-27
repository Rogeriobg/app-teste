import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles } from '@/theme/hooks';
import { useTheme } from '@/theme/context';
import { selectionAsync, impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { printToFileAsync } from 'expo-print';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useApp, Patient, MedicalRecord } from '@/context/AppContext';
import { Button, Card, StatSummary } from '@/components';
import {
  FileText,
  Download,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { mixColors } from '@/theme/contrast';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const ACCENT = colors.brand;
const BACKGROUND = colors.surface;
const CARD = colors.card;
const TEXT_DARK = colors.textPrimary;
const TEXT_MUTED = colors.textSecondary;
const BORDER = colors.border;

export default function ExportPdfScreen() {
  const { patientId } = useLocalSearchParams() as { patientId: string };
  const { db, getRecordsByPatient } = useApp();

  const insets = useSafeAreaInsets();
  const css = useThemeStyles();
  const { theme } = useTheme();

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

  /**
   * HTML do PDF.
   *
   * Exceção deliberada à regra de tokenização (A2): este CSS é renderizado
   * pelo `expo-print` num WebView — **não** é React Native. Usar os tokens de
   * RN aqui não faria sentido (o WebView não conhece `StyleSheet`), então as
   * cores ficam como literais aqui, espelhando a paleta do design system.
   */
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

      /**
       * O PDF vem como **base64**, e não como URI de arquivo.
       *
       * O `expo-print` grava o PDF em `<cacheDir>/Print/<uuid>.pdf`, um
       * diretório que nem o `FileProvider` do `expo-sharing` nem o
       * `expo-file-system` conseguem ler ("Not allowed to read file" /
       * "Missing 'READ' permission"). Com `base64: true`, o próprio
       * `expo-print` lê o arquivo que ele criou e devolve o conteúdo —
       * nenhum módulo precisa tocar no diretório `Print/`.
       */
      const { base64 } = await printToFileAsync({
        html,
        base64: true,
      });
      if (!base64) {
        throw new Error('O gerador de PDF não devolveu o conteúdo do arquivo.');
      }

      await Haptic.success();

      /**
       * O PDF é gravado no **documentDirectory**, que o `expo-sharing`
       * autoriza a compartilhar, com um nome legível. O arquivo também
       * fica disponível para o usuário abrir depois pelo explorador de
       * arquivos.
       */
      const destino = new File(
        Paths.document,
        `prontuario-${(patient?.name ?? 'paciente').replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`
      );
      await destino.write(base64, { encoding: 'base64' });

      await handleSharePdf(destino);
    } catch (error) {
      await Haptic.error();
      const mensagem = error instanceof Error ? error.message : String(error);
      Alert.alert('Erro', `Não foi possível gerar o PDF.\n\n${mensagem}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSharePdf = async (arquivo: File) => {
    /**
     * `isAvailableAsync` é o guard oficial: em web (e em Expo Go sem o
     * módulo nativo) o compartilhamento não existe e `shareAsync` lança.
     */
    const disponivel = await isAvailableAsync();
    if (!disponivel) {
      await tentarPreview(arquivo);
      return;
    }

    setSharing(true);
    try {
      await shareAsync(arquivo.uri, {
        mimeType: 'application/pdf',
        UTI: '.pdf',
        dialogTitle: `Prontuário - ${patient?.name ?? ''}`,
      });
      await Haptic.success();
    } catch (error) {
      await Haptic.error();
      /**
       * O share sheet pode falhar (sem app para receber PDF, permissão
       * negada, share cancelado). O visualizador nativo é o caminho
       * principal no Android e evita o erro.
       */
      const abriu = await tentarPreview(arquivo);
      if (!abriu) {
        const mensagem = error instanceof Error ? error.message : String(error);
        Alert.alert('Erro', `Não foi possível compartilhar o PDF.\n\n${mensagem}`);
      }
    } finally {
      setSharing(false);
    }
  };

  /**
   * Abre o PDF no visualizador nativo do sistema.
   *
   * No Android isso abre um app instalado que handle o MIME type; no iOS,
   * o Quick Look. É o caminho que **não** depende do `FileProvider` do
   * `expo-sharing`.
   */
  const tentarPreview = async (arquivo: File): Promise<boolean> => {
    try {
      const pode = await File.canPreview(arquivo);
      if (!pode) return false;
      await File.preview(arquivo, { title: `Prontuário - ${patient?.name ?? ''}` });
      return true;
    } catch {
      return false;
    }
  };

  const handleBack = () => {
    Haptic.selection();
    router.back();
  };

  if (!patient) {
    return (
      <View style={[styles.container, css.page]}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xxxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Paciente não encontrado</Text>
            <Button
              variant="primary"
              onPress={handleBack}
              iconLeft={<ChevronRight size={18} color={colors.textOnBrand} />}
            >
              Voltar
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
                  <FileText size={34} color={colors.textOnBrand} />
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
          <StatSummary
            title="Prontuários"
            total={records.length}
            segments={[
              { label: 'Ativos', count: activeRecords.length, color: ACCENT },
              { label: 'Arquivados', count: archivedRecords.length, color: mixColors(theme.colors.surface, theme.colors.primary, 0.3) },
            ]}
          />

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
            iconLeft={<Download size={20} color={colors.textOnBrand} />}
            accessibilityLabel="Exportar prontuário em PDF"
          >
            {generating ? 'Gerando PDF...' : sharing ? 'Compartilhando...' : 'Exportar PDF'}
          </Button>

          <Button
            variant="outline"
            onPress={handleBack}
            style={styles.backButton}
            iconLeft={<ChevronRight size={18} color={theme.colors.primary} />}
            accessibilityLabel="Voltar aos detalhes do paciente"
          >
            Voltar
          </Button>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  scroll: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  headerWrapper: {
    marginBottom: spacing.xxl,
  },
  headerCard: {
    backgroundColor: CARD,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: BORDER,
    padding: spacing.xxl,
    shadowColor: colors.brand,
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
    marginBottom: spacing.xl,
  },
  avatarBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.card,
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
    ...typography.title1,
    color: TEXT_DARK,
    marginBottom: spacing.sm,
  },
  screenSub: {
    ...typography.body,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.title2,
    fontSize: 17,
    color: TEXT_DARK,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.xl,
  },
  summaryBox: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryTotal: {
    borderColor: colors.infoBorder,
    backgroundColor: colors.infoSoft,
  },
  summaryActive: {
    borderColor: colors.brandBorder,
    backgroundColor: colors.brandSoft,
  },
  summaryArchived: {
    borderColor: colors.mutedBorder,
    backgroundColor: colors.mutedSoft,
  },
  summaryNum: {
    ...typography.title2,
    fontSize: 20,
    color: TEXT_DARK,
    marginBottom: spacing.xxs,
  },
  summaryLabel: {
    ...typography.caption,
    color: TEXT_MUTED,
  },
  infoCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.dividerSoft,
  },
  infoLabel: {
    ...typography.label,
    color: TEXT_MUTED,
  },
  infoValue: {
    ...typography.body,
    color: TEXT_DARK,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.dividerSoft,
    marginVertical: spacing.xs,
  },
  actionsSection: {
    marginBottom: spacing.xxl,
  },
  exportButton: {
    backgroundColor: ACCENT,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  emptyTitle: {
    ...typography.headline,
    fontSize: 18,
    color: TEXT_DARK,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
});
