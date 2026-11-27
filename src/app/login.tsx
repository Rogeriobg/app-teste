import React, { useState, useEffect } from 'react';
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
import { useThemeStyles } from '@/theme/hooks';
import { useTheme } from '@/theme/context';
import { useApp } from '@/context/AppContext';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, HelpCircle, UserPlus } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import { isDefaultPassword } from '@/services/auth';

export default function LoginScreen() {
  const { login, db } = useApp();
  const insets = useSafeAreaInsets();
  const css = useThemeStyles();
  const { theme } = useTheme();

  // `null` = ainda sem edição: usa o e-mail cadastrado no banco (que muda
  // depois do cadastro e é carregado do storage de forma assíncrona)
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const email = emailEdit ?? db.users[0]?.email ?? '';
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // o cadastro só faz sentido enquanto as credenciais padrão estão ativas
  const [podeCadastrar, setPodeCadastrar] = useState(false);

  useEffect(() => {
    let ativo = true;
    isDefaultPassword().then((padrao) => {
      if (ativo) setPodeCadastrar(padrao);
    }).catch(() => {});
    return () => { ativo = false; };
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail de acesso');
      return;
    }
    if (!senha) {
      setError('Digite sua senha');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ok = await login(email.trim(), senha);
      if (!ok) {
        setError('E-mail ou senha incorretos');
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
        <View style={[styles.heroCard, css.primarySoft]}>
          <View style={styles.badgeRow}>
            <Sparkles size={16} color={theme.colors.primary} />
            <Text style={[styles.badgeText, css.primary]} numberOfLines={1} ellipsizeMode="tail">
              PsiApp • Consultório Pessoal
            </Text>
          </View>
          <ShieldCheck size={32} color={theme.colors.primary} style={styles.heroIcon} />
          <Text style={[styles.title, css.text]}>Consultório Psicológico</Text>
          <Text style={[styles.subtitle, css.textSecondary]}>Cadastro, prontuário e relatórios dos seus pacientes.</Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, css.surface]}>
          <Text style={[styles.formTitle, css.text]}>Acesso ao Consultório</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputWrapper}>
            <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmailEdit}
              placeholder="E-mail do psicólogo"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="E-mail do psicólogo"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!mostrarSenha}
              autoCapitalize="none"
              autoComplete="current-password"
              accessibilityLabel="Senha de acesso"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              style={styles.olhoBtn}
              onPress={() => setMostrarSenha((v) => !v)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {mostrarSenha ? (
                <EyeOff size={18} color={colors.textMuted} />
              ) : (
                <Eye size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.esqueciBtn}
            onPress={() => router.push('/recover-password')}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Esqueci minha senha"
          >
            <HelpCircle size={14} color={theme.colors.primary} />
            <Text style={[styles.esqueciText, css.primary]} numberOfLines={1} ellipsizeMode="tail">
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

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

          {podeCadastrar ? (
            <TouchableOpacity
              style={styles.cadastrarBtn}
              onPress={() => router.push('/register')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cadastrar meu acesso"
            >
              <UserPlus size={16} color={theme.colors.primary} />
              <Text style={[styles.cadastrarText, css.primary]} numberOfLines={1} ellipsizeMode="tail">
                Cadastrar meu acesso
              </Text>
            </TouchableOpacity>
          ) : null}
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
  olhoBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  esqueciBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    marginBottom: spacing.sm,
  },
  esqueciText: { ...typography.label, flexShrink: 1, minWidth: 0 },

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
  cadastrarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    marginTop: spacing.md,
  },
  cadastrarText: { ...typography.label, flexShrink: 1, minWidth: 0 },
});
