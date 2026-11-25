import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

const ACCENT = '#0D9488';
const BACKGROUND = '#F4FBF7';
const CARD = '#FFFFFF';
const TEXT_DARK = '#133E2B';
const TEXT_MUTED = '#64748B';
const BORDER = '#E2E8F0';
const DANGER = '#EF4444';

export default function ProfileScreen() {
  const { currentUser, updateUser, exportData, logout, db } = useApp();

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header com dados do psicólogo */}
        <Card style={styles.headerCard} elevated>
          <View style={styles.headerContent}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBadge}>
                <ShieldCheck size={26} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>
                {currentUser?.name ?? 'Psicólogo(a)'}
              </Text>
              <Text style={styles.headerRole}>
                {currentUser?.role ?? 'psicologo'}
              </Text>
              <View style={styles.headerContact}>
                <Mail size={14} color="#94A3B8" />
                <Text style={styles.headerEmail}>
                  {currentUser?.email ?? ''}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Dados do psicólogo (editável) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do psicólogo</Text>
          <Text style={styles.sectionSub}>
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
            iconLeft={<Save size={18} color="#FFFFFF" />}
            accessibilityLabel="Salvar alterações dos dados do psicólogo"
          >
            {saving ? 'Salvando...' : hasChanges ? 'Salvar alterações' : 'Sem alterações'}
          </Button>
        </View>

        {/* Exportar dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exportar dados</Text>
          <Text style={styles.sectionSub}>
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
            iconLeft={<LogOut size={18} color="#FFFFFF" />}
            accessibilityLabel="Sair da conta"
          >
            Sair do consultório
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
    paddingBottom: 90,
  },
  headerCard: {
    backgroundColor: CARD,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerContent: {
    padding: 24,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginBottom: 14,
  },
  avatarBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
  headerName: {
    fontSize: 20,
    fontWeight: '800',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  headerRole: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  headerContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F4ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1EFE2',
  },
  headerEmail: {
    fontSize: 13,
    color: TEXT_MUTED,
  },

  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 6,
    marginLeft: 2,
  },
  sectionSub: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 16,
    marginLeft: 2,
    lineHeight: 18,
  },

  saveButton: {
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportButton: {
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 4,
  },

  logoutSection: {
    marginBottom: 24,
  },
  logoutButton: {
    backgroundColor: DANGER,
    borderRadius: 14,
    paddingVertical: 16,
    shadowColor: DANGER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomSpacer: {
    height: 16,
  },
});
