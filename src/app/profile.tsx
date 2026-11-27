import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStyles } from '@/theme/hooks';
import {
  selectionAsync,
  impactAsync,
  ImpactFeedbackStyle,
} from 'expo-haptics';
import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { Button, Input, Card } from '@/components';
import {
  Mail,
  ShieldCheck,
  Save,
  Download,
  LogOut,
} from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const ACCENT = colors.brand;
const BACKGROUND = colors.surface;
const CARD = colors.card;
const TEXT_DARK = colors.textPrimary;
const TEXT_MUTED = colors.textSecondary;
const BORDER = colors.border;
const DANGER = colors.danger;

export default function ProfileScreen() {
  const { currentUser, updateUser, exportData, logout, db } = useApp();
  const insets = useSafeAreaInsets();
  const css = useThemeStyles();

  const [name, setName] = useState(currentUser?.name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

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
        <Card style={[styles.headerCard, { backgroundColor: css.surface.backgroundColor }]} elevated>
          <View style={styles.headerContent}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBadge}>
                <ShieldCheck size={26} color={colors.textOnBrand} />
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
            onChangeText={setName}
            autoCapitalize="words"
            accessibilityLabel="Nome completo do psicólogo"
          />

          <Input
            label="E-mail de acesso"
            placeholder="Ex: psicologo@psicowave.com"
            value={email}
            onChangeText={setEmail}
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
            style={styles.saveButton}
            iconLeft={<Save size={18} color={colors.textOnBrand} />}
            accessibilityLabel="Salvar alterações dos dados do psicólogo"
          >
            {saving ? 'Salvando...' : hasChanges ? 'Salvar alterações' : 'Sem alterações'}
          </Button>
        </View>

        {/* Exportar dados */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, css.text]}>Exportar dados</Text>
          <Text style={[styles.sectionSub, css.textSecondary]}>
            Gere um backup JSON com pacientes e prontuários para compartilhar ou salvar.
          </Text>

          <Button
            variant="outline"
            onPress={handleExport}
            disabled={exporting}
            loading={exporting}
            style={styles.exportButton}
            iconLeft={<Download size={18} color={ACCENT} />}
            accessibilityLabel="Exportar dados do PsiApp"
          >
            {exporting ? 'Exportando...' : 'Exportar dados (JSON)'}
          </Button>
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
