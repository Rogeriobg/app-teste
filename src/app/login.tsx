import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { router } from 'expo-router';
import { Mail, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function LoginScreen() {
  const { login } = useApp();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('psicologo@psicowave.com');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail de acesso');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await login(email.trim());
      if (!ok) {
        setError('E-mail não cadastrado. Use psicologo@psicowave.com');
      } else {
        router.replace('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <View style={styles.badgeRow}>
            <Sparkles size={16} color={colors.brand} />
            <Text style={styles.badgeText} numberOfLines={1} ellipsizeMode="tail">
              PsiApp • Consultório Pessoal
            </Text>
          </View>
          <ShieldCheck size={32} color={colors.brand} style={styles.heroIcon} />
          <Text style={styles.title}>Consultório Psicológico</Text>
          <Text style={styles.subtitle}>Cadastro, prontuário e relatórios dos seus pacientes.</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Acesso ao Consultório</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputWrapper}>
            <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="E-mail do psicólogo"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.loadingButton]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.primaryButtonText}>Acessando...</Text>
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Entrar no Consultório</Text>
                <ArrowRight size={18} color={colors.textOnBrand} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xxl },
  heroCard: {
    backgroundColor: colors.brandSoft,
    borderRadius: radius.xxl,
    padding: spacing.xxxl,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.brandBorder,
    alignItems: 'center',
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.md, flexShrink: 1 },
  badgeText: { ...typography.body, color: colors.brandText, fontWeight: '700', flexShrink: 1, minWidth: 0 },
  heroIcon: { marginBottom: spacing.lg },
  title: { ...typography.title1, fontSize: 26, color: colors.textPrimary, marginBottom: spacing.md, letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 20, textAlign: 'center' },

  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: { ...typography.title2, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.xl },
  errorText: { ...typography.body, color: colors.danger, marginBottom: spacing.lg },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
  },
  inputIcon: { marginRight: spacing.lg },
  input: { flex: 1, minWidth: 0, paddingVertical: spacing.lg, ...typography.body, color: colors.inputText },

  primaryButton: {
    backgroundColor: colors.brand,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    // alvo de toque: nunca abaixo de 44px (HIG / WCAG 2.5.8)
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingButton: { opacity: 0.7 },
  primaryButtonText: { ...typography.body, color: colors.textOnBrand, fontWeight: 'bold', fontSize: 15 },
});
