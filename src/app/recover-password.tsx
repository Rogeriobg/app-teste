import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, KeyRound } from 'lucide-react-native';

import { Button } from '@/components';
import { useTheme } from '@/theme/context';
import { useThemeStyles } from '@/theme/hooks';
import { resetPasswordWithCode } from '@/services/auth';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Recuperação 100% offline: código de 6 dígitos gerado quando a senha foi
 * definida. O usuário deve guardá-lo em local seguro.
 */
export default function RecoverPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const css = useThemeStyles();
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const recover = async () => {
    if (codigo.trim().length !== 6) {
      setErro('Digite o código de 6 dígitos.');
      return;
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha precisa ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmar) {
      setErro('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    setErro('');
    try {
      const ok = await resetPasswordWithCode(codigo, novaSenha);
      if (!ok) {
        setErro('Código inválido. Confira os 6 dígitos.');
        return;
      }
      router.replace('/login');
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
        <Text style={[styles.title, css.text]} numberOfLines={1}>Recuperar acesso</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, css.cardTint, css.cardBorder]}>
          <KeyRound size={28} color={theme.colors.primary} />
          <Text style={[styles.cardTitle, css.text]}>Código de recuperação</Text>
          <Text style={[styles.cardText, css.textSecondary]}>
            Use o código de 6 dígitos que você guardou quando definiu a senha.
            Ele funciona sem internet.
          </Text>

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <TextInput
            style={styles.input}
            value={codigo}
            onChangeText={setCodigo}
            placeholder="000000"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            accessibilityLabel="Código de recuperação"
          />
          <TextInput
            style={styles.input}
            value={novaSenha}
            onChangeText={setNovaSenha}
            placeholder="Nova senha (mín. 6 caracteres)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            accessibilityLabel="Nova senha"
          />
          <TextInput
            style={styles.input}
            value={confirmar}
            onChangeText={setConfirmar}
            placeholder="Confirmar nova senha"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            accessibilityLabel="Confirmar nova senha"
          />

          <Button
            variant="primary"
            onPress={recover}
            loading={loading}
            style={styles.action}
            accessibilityLabel="Redefinir senha"
          >
            Redefinir senha
          </Button>
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
    borderColor: colors.border,
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
  erro: { ...typography.bodyRegular, color: colors.danger },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.lg,
    backgroundColor: colors.inputBg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    minHeight: 48,
    ...typography.body,
    color: colors.inputText,
  },
  action: { marginTop: spacing.sm },
});
