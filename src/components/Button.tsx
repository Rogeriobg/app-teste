import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

export interface ButtonProps {
  /** Texto do botão (usado como fallback se children não for fornecido) */
  title?: string;
  /** Conteúdo do botão (texto ou elementos) */
  children?: React.ReactNode;
  /** Variante visual */
  variant?: ButtonVariant;
  /** Ação ao pressionar */
  onPress?: () => void;
  /** Desabilita o botão */
  disabled?: boolean;
  /** Estado de carregamento (mostra spinner no lugar do texto) */
  loading?: boolean;
  /** Estilo adicional do container */
  style?: ViewStyle;
  /** Estilo adicional do texto */
  textStyle?: TextStyle;
  /** Ícone à esquerda (React Native element) */
  iconLeft?: React.ReactElement;
  /** Ícone à direita */
  iconRight?: React.ReactElement;
  /** Acessibilidade */
  accessibilityLabel?: string;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; border: string; color: string }> = {
  primary: { bg: colors.brand, border: colors.brand, color: colors.textOnBrand },
  secondary: { bg: colors.card, border: colors.border, color: colors.textPrimary },
  outline: { bg: 'transparent', border: colors.brand, color: colors.brand },
  danger: { bg: colors.dangerSoft, border: colors.dangerBorder, color: colors.danger },
  ghost: { bg: 'transparent', border: 'transparent', color: colors.textSecondary },
};

export function Button({
  title,
  children,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  iconLeft,
  iconRight,
  accessibilityLabel,
}: ButtonProps) {
  const { bg, border, color } = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.container, variantStyles(bg, border), isDisabled && styles.disabled, style]}
      onPress={!isDisabled ? onPress : undefined}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color === colors.textOnBrand ? colors.textOnBrand : colors.brand} style={styles.spinner} />
      ) : (
        <>
          {iconLeft && <View style={styles.iconWrapper}>{iconLeft}</View>}
          {/* `children` pode ser uma string simples: o RN exige que todo
              texto dentro de um <View> esteja dentro de um <Text>. */}
          <Text style={[styles.text, { color }, textStyle]} numberOfLines={1} ellipsizeMode="tail">
            {children ?? title}
          </Text>
          {iconRight && <View style={styles.iconWrapper}>{iconRight}</View>}
        </>
      )}
    </TouchableOpacity>
  );
}

function variantStyles(bg: string, border: string): ViewStyle {
  return {
    backgroundColor: bg,
    borderWidth: 1,
    borderColor: border,
  };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    minHeight: 48,
    // nunca cresce além do pai: o texto é que trunca
    maxWidth: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  iconWrapper: {
    // permite que ícones lucide ocupem o espaço correto
  },
  spinner: {
    marginLeft: -spacing.xs,
  },
});
