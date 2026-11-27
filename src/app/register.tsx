import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, UserPlus, KeyRound } from 'lucide-react-native';

import { Button, Input } from '@/components';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/theme/context';
import { useThemeStyles } from '@/theme/hooks';
import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Cadastro da conta única do consultório.
 *
 * Substitui o e-mail/senha padrão pelos dados reais do psicólogo. Não cria
 * sessão: ao salvar, o usuário volta ao login para conferir o novo acesso.
 */
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const css = useThemeStyles();
  const { registerUser } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [codigoRecuperacao, setCodigoRecuperacao] = useState<string | null>(null);

  const cadastrar = async () => {
    if (name.trim().length < 3) {
      setErro('Informe seu nome completo.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro('Informe um e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (senha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setErro('');
    try {
      const { recoveryCode } = await registerUser({ name, email, senha });
      setCodigoRecuperacao(recoveryCode);
      setName('');
      setEmail('');
      setSenha('');
      setConfirmar('');
    } catch {
      setErro('Não foi possível cadastrar o acesso. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, css.page, { paddingTop: insets.top }]}>
      <View style={[styles.topBar, css.surface]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, css.text]} numberOfLines={1}>Cadastrar acesso</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, css.cardTint, css.cardBorder]}>
          {codigoRecuperacao ? (
            <>
              <KeyRound size={28} color={theme.colors.primary} />
              <Text style={[styles.cardTitle, css.text]}>Cadastro concluído</Text>
              <Text style={[styles.cardText, css.textSecondary]}>
                Guarde este código de recuperação de 6 dígitos em local seguro.
                Ele aparece apenas agora e é o único caminho para recuperar
                sua senha (o app não usa servidor nem e-mail).
              </Text>
              <Text style={[styles.codigo, css.primary]}>{codigoRecuperacao}</Text>
              <Button
                variant="primary"
                onPress={() => router.replace('/login')}
                style={styles.action}
                accessibilityLabel="Voltar ao login"
              >
                Voltar ao login
              </Button>
            </>
          ) : (
            <>
              <UserPlus size={28} color={theme.colors.primary} />
              <Text style={[styles.cardTitle, css.text]}>Seus dados de acesso</Text>
              <Text style={[styles.cardText, css.textSecondary]}>
                Cadastre seu e-mail e senha reais. Isso substitui o acesso padrão
                do consultório. Seus pacientes e prontuários são preservados.
              </Text>

              {erro ? <Text style={styles.erro}>{erro}</Text> : null}

              <Input
                label="Nome completo"
                placeholder="Ex: Dra. Maria Oliveira"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                accessibilityLabel="Nome completo do psicólogo"
              />
              <Input
                label="E-mail de acesso"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                accessibilityLabel="E-mail de acesso"
              />
              <Input
                label="Senha"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                accessibilityLabel="Senha de acesso"
              />
              <Input
                label="Confirmar senha"
                placeholder="Repita a senha"
                value={confirmar}
                onChangeText={setConfirmar}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                accessibilityLabel="Confirmar senha"
              />

              <Button
                variant="primary"
                onPress={cadastrar}
                loading={loading}
                style={styles.action}
                accessibilityLabel="Cadastrar acesso"
              >
                Cadastrar acesso
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: statusColors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title: { ...typography.title2, flex: 1, minWidth: 0, flexShrink: 1, marginLeft: spacing.sm },
  spacer: { width: 44, height: 44, flexShrink: 0 },
  scroll: { padding: spacing.xl },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xxl,
    gap: spacing.md,
  },
  cardTitle: { ...typography.title2 },
  cardText: { ...typography.bodyRegular },
  erro: { ...typography.bodyRegular, color: statusColors.danger },
  codigo: {
    ...typography.display,
    fontSize: 32,
    letterSpacing: 6,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  action: { marginTop: spacing.sm },
});
