import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles } from '@/theme/hooks';
import { useTheme } from '@/theme/context';
import {
  selectionAsync,
  impactAsync,
  ImpactFeedbackStyle,
} from 'expo-haptics';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { buildPatientsReportHtml } from '@/services/patientsReport';
import { gerarPdf, compartilharPdf } from '@/services/pdf';
import { Button, Input, Card, AppModal } from '@/components';
import {
  Mail,
  ShieldCheck,
  Save,
  FileText,
  Download,
  LogOut,
  Lock,
  Palette,
  ChevronRight,
} from 'lucide-react-native';
import {
  colors,
  radius,
  spacing,
  typography,
  colors as statusColors,
} from '@/theme/tokens';

const ACCENT = colors.brand;
const BACKGROUND = colors.surface;
const CARD = colors.card;
const TEXT_DARK = colors.textPrimary;
const TEXT_MUTED = colors.textSecondary;
const BORDER = colors.border;
const DANGER = colors.danger;

export default function ProfileScreen() {
  const { currentUser, updateUser, exportData, logout, db, checkPassword, changePassword } = useApp();
  const insets = useSafeAreaInsets();
  const css = useThemeStyles();
  const { theme } = useTheme();

  // A sessão é restaurada do AsyncStorage de forma assíncrona: `null` indica
  // "ainda sem edição", então o valor exibido vem direto do currentUser assim
  // que ele chega — sem efeito e sem sobrescrever o que o usuário digitou.
  const [nameEdit, setNameEdit] = useState<string | null>(null);
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const name = nameEdit ?? currentUser?.name ?? '';
  const email = emailEdit ?? currentUser?.email ?? '';
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  /* Segurança — troca de senha */
  const [mostrandoSenha, setMostrandoSenha] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [codigoRecuperacao, setCodigoRecuperacao] = useState<string | null>(null);
  const [erroSenha, setErroSenha] = useState('');
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const salvarNovaSenha = async () => {
    if (novaSenha.length < 6) {
      setErroSenha('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErroSenha('As senhas não coincidem.');
      return;
    }
    setSalvandoSenha(true);
    setErroSenha('');
    try {
      if (!(await checkPassword(senhaAtual))) {
        setErroSenha('Senha atual incorreta.');
        return;
      }
      const { recoveryCode } = await changePassword(novaSenha);
      setCodigoRecuperacao(recoveryCode);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      await impactAsync(ImpactFeedbackStyle.Light);
    } catch {
      setErroSenha('Não foi possível alterar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  const hasChanges =
    name.trim() !== currentUser?.name?.trim() ||
    email.trim() !== currentUser?.email?.trim();

  const Haptic = {
    selection: useCallback(async () => {
      try {
        await selectionAsync();
      } catch {}
    }, []),
    success: useCallback(async () => {
      try {
        await impactAsync(ImpactFeedbackStyle.Light);
      } catch {}
    }, []),
    error: useCallback(async () => {
      try {
        await impactAsync(ImpactFeedbackStyle.Heavy);
      } catch {}
    }, []),
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do psicólogo.');
      Haptic.error();
      return;
    }
    if (!email.trim()) {
      Alert.alert('Atenção', 'Informe o e-mail de acesso.');
      Haptic.error();
      return;
    }

    setSaving(true);
    try {
      await updateUser({ name: name.trim(), email: email.trim() });
      // limpa a edição: os valores passam a vir do currentUser atualizado
      setNameEdit(null);
      setEmailEdit(null);
      await Haptic.success();
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
    } catch {
      await Haptic.error();
      Alert.alert('Erro', 'Não foi possível atualizar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const patientCount = db.patients.length;
      const recordCount = db.medicalRecords.length;
      await exportData();
      await Haptic.success();
      Alert.alert(
        'Exportação iniciada',
        `Foram incluídos ${patientCount} paciente(s) e ${recordCount} relatório(s). Escolha um app para salvar o arquivo JSON.`
      );
    } catch {
      await Haptic.error();
      Alert.alert('Erro', 'Não foi possível exportar os dados.');
    } finally {
      setExporting(false);
    }
  };

  /**
   * Relatório PDF de pacientes: lista + resumo, sem dados clínicos.
   * Nenhum Alert antes da share sheet — o alerta de erro vem depois.
   */
  const handleExportPdf = async () => {
    if (db.patients.length === 0) {
      await Haptic.error();
      Alert.alert('Atenção', 'Cadastre ao menos um paciente para gerar o relatório.');
      return;
    }

    setExportingPdf(true);
    try {
      const html = buildPatientsReportHtml(db.patients, currentUser);
      const nome = `pacientes-${new Date().toISOString().slice(0, 10)}.pdf`;
      const arquivo = await gerarPdf(html, nome);
      await compartilharPdf(arquivo, 'Relatório de pacientes - PsiApp');
      await Haptic.success();
    } catch {
      await Haptic.error();
      Alert.alert('Erro', 'Não foi possível gerar o PDF de pacientes.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleLogout = async () => {
    await selectionAsync();
    Alert.alert(
      'Sair do consultório',
      'Tem certeza que deseja encerrar a sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, css.page]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header com dados do psicólogo */}
        <Card style={[styles.headerCard, css.cardTint, css.cardBorder]} elevated>
          <View style={styles.headerContent}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.avatarBadge, { backgroundColor: theme.colors.primary }]}>
                <ShieldCheck size={26} color={theme.colors.onPrimary} />
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, css.text]}>
                {currentUser?.name ?? 'Psicólogo(a)'}
              </Text>
              <Text style={styles.headerRole}>
                {currentUser?.role ?? 'psicologo'}
              </Text>
              <View style={styles.headerContact}>
                <Mail size={14} color={colors.textMuted} />
                <Text style={styles.headerEmail} numberOfLines={1} ellipsizeMode="tail">
                  {currentUser?.email ?? ''}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Dados do psicólogo (editável) */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, css.text]}>Dados do psicólogo</Text>
          <Text style={[styles.sectionSub, css.textSecondary]}>
            Atualize seu nome e e-mail de acesso.
          </Text>

          <Input
            label="Nome completo"
            placeholder="Ex: Dr(a). Maria Oliveira"
            value={name}
            onChangeText={setNameEdit}
            autoCapitalize="words"
            accessibilityLabel="Nome completo do psicólogo"
          />

          <Input
            label="E-mail de acesso"
            placeholder="Ex: psicologo@psicowave.com"
            value={email}
            onChangeText={setEmailEdit}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel="E-mail de acesso do psicólogo"
          />

          <Button
            variant="primary"
            onPress={handleSave}
            disabled={!hasChanges || saving}
            loading={saving}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            iconLeft={<Save size={18} color={colors.textOnBrand} />}
            accessibilityLabel="Salvar alterações dos dados do psicólogo"
          >
            {saving ? 'Salvando...' : hasChanges ? 'Salvar alterações' : 'Sem alterações'}
          </Button>
        </View>

        {/* Segurança — troca de senha + código de recuperação */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, css.text]}>Segurança</Text>
          <Text style={[styles.sectionSub, css.textSecondary]}>
            Troque sua senha e guarde o código de recuperação em local seguro.
          </Text>

          <Button
            variant="outline"
            onPress={() => setMostrandoSenha(true)}
            style={styles.exportButton}
            iconLeft={<Lock size={18} color={theme.colors.primary} />}
            accessibilityLabel="Alterar senha"
          >
            Alterar senha
          </Button>
        </View>

        {/* Aparência — Etapa 6 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, css.text]}>Aparência</Text>
          <Text style={[styles.sectionSub, css.textSecondary]}>
            Escolha as cores do app e o tamanho do texto.
          </Text>

          <TouchableOpacity
            style={[styles.appearanceBtn, css.surface]}
            onPress={() => router.push('/appearance')}
            activeOpacity={0.85}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Abrir aparência"
            accessibilityHint="Temas e tamanho de fonte"
          >
            <Palette size={20} color={theme.colors.primary} />
            <Text style={[styles.appearanceBtnText, css.text]}>Temas e fonte</Text>
            <ChevronRight size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Exportar dados */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, css.text]}>Exportar dados</Text>
          <Text style={[styles.sectionSub, css.textSecondary]}>
            Gere um relatório em PDF com a lista e o resumo dos seus pacientes.
            Não inclui anamneses nem prontuários.
          </Text>

          <Button
            variant="primary"
            onPress={handleExportPdf}
            disabled={exportingPdf}
            loading={exportingPdf}
            style={styles.exportButton}
            iconLeft={<FileText size={18} color={colors.textOnBrand} />}
            accessibilityLabel="Exportar relatório de pacientes em PDF"
          >
            {exportingPdf ? 'Gerando PDF...' : 'Exportar dados (PDF)'}
          </Button>

          <TouchableOpacity
            style={styles.backupBtn}
            onPress={handleExport}
            disabled={exporting}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Exportar backup técnico em JSON"
          >
            <Download size={16} color={theme.colors.primary} />
            <Text style={[styles.backupBtnText, css.primary]} numberOfLines={1} ellipsizeMode="tail">
              {exporting ? 'Exportando backup...' : 'Backup técnico (JSON)'}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.backupHint, css.textSecondary]}>
            O JSON é um backup técnico, para migração futura. Para ler e compartilhar, use o PDF.
          </Text>
        </View>

        {/* Sair */}
        <View style={styles.logoutSection}>
          <Button
            variant="danger"
            onPress={handleLogout}
            style={styles.logoutButton}
            iconLeft={<LogOut size={18} color={colors.textOnDanger} />}
            accessibilityLabel="Sair da conta"
          >
            Sair do consultório
          </Button>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <AppModal
        visible={mostrandoSenha || !!codigoRecuperacao}
        onDismiss={() => {
          setMostrandoSenha(false);
          setCodigoRecuperacao(null);
          setErroSenha('');
        }}
        title={codigoRecuperacao ? 'Guarde este código' : 'Alterar senha'}
        confirmTitle={codigoRecuperacao ? 'Entendi' : 'Salvar senha'}
        confirmLoading={salvandoSenha}
        onConfirm={codigoRecuperacao ? () => { setCodigoRecuperacao(null); setMostrandoSenha(false); } : salvarNovaSenha}
      >
        {codigoRecuperacao ? (
          <>
            <Text style={[styles.codigoTexto, css.text]}>
              Seu código de recuperação (6 dígitos):
            </Text>
            <Text style={[styles.codigoNumero, css.primary]}>{codigoRecuperacao}</Text>
            <Text style={[styles.codigoAviso, css.textSecondary]}>
              Guarde-o em local seguro. Ele é necessário se você esquecer a senha.
              Este é o único momento em que ele aparece.
            </Text>
          </>
        ) : (
          <>
            {erroSenha ? <Text style={styles.erroSenha}>{erroSenha}</Text> : null}
            <Input label="Senha atual" placeholder="Senha atual" secureTextEntry
              value={senhaAtual} onChangeText={setSenhaAtual} accessibilityLabel="Senha atual" />
            <Input label="Nova senha" placeholder="Mínimo 6 caracteres" secureTextEntry
              value={novaSenha} onChangeText={setNovaSenha} accessibilityLabel="Nova senha" />
            <Input label="Confirmar nova senha" placeholder="Repita a nova senha" secureTextEntry
              value={confirmarSenha} onChangeText={setConfirmarSenha} accessibilityLabel="Confirmar nova senha" />
          </>
        )}
      </AppModal>
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
  },
  headerCard: {
    backgroundColor: CARD,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: spacing.xxl,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerContent: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: spacing.lg,
  },
  avatarBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
  headerName: {
    ...typography.title2,
    fontSize: 20,
    color: TEXT_DARK,
    marginBottom: spacing.xs,
  },
  headerRole: {
    ...typography.caption,
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  headerContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    maxWidth: '100%',
    flexShrink: 1,
    minWidth: 0,
  },
  headerEmail: {
    ...typography.bodyRegular,
    fontSize: 13,
    color: TEXT_MUTED,
    flexShrink: 1,
    minWidth: 0,
  },

  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.headline,
    color: TEXT_DARK,
    marginBottom: spacing.sm,
    marginLeft: spacing.xxs,
  },
  sectionSub: {
    ...typography.bodyRegular,
    color: TEXT_MUTED,
    marginBottom: spacing.xl,
    marginLeft: spacing.xxs,
    lineHeight: 18,
  },

  saveButton: {
    backgroundColor: ACCENT,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    marginTop: spacing.xs,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.xs,
  },
  backupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    marginTop: spacing.sm,
  },
  backupBtnText: { ...typography.label, flexShrink: 1, minWidth: 0 },
  backupHint: { ...typography.caption, textAlign: 'center' },
  /** Botão de entrada para /appearance — 44px de toque (QA-3) */
  appearanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: BORDER,
  },
  appearanceBtnText: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  codigoTexto: { ...typography.bodyRegular, textAlign: 'center' },
  codigoNumero: {
    ...typography.display,
    fontSize: 32,
    letterSpacing: 6,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  codigoAviso: { ...typography.bodyRegular, textAlign: 'center' },
  erroSenha: { ...typography.bodyRegular, color: statusColors.danger, marginBottom: spacing.sm },

  logoutSection: {
    marginBottom: spacing.xxl,
  },
  logoutButton: {
    backgroundColor: DANGER,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    shadowColor: DANGER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});
