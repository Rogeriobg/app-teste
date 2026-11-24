import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';

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
  primary: { bg: '#0D9488', border: '#0D9488', color: '#FFFFFF' },
  secondary: { bg: '#FFFFFF', border: '#E2E8F0', color: '#133E2B' },
  outline: { bg: 'transparent', border: '#0D9488', color: '#0D9488' },
  danger: { bg: '#FEE2E2', border: '#FECACA', color: '#EF4444' },
  ghost: { bg: 'transparent', border: 'transparent', color: '#64748B' },
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
        <ActivityIndicator size="small" color={color === '#FFFFFF' ? '#FFFFFF' : '#0D9488'} style={styles.spinner} />
      ) : (
        <>
          {iconLeft && <View style={styles.iconWrapper}>{iconLeft}</View>}
          <Text style={[styles.text, { color }, textStyle]}>{children ?? title}</Text>
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
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
  },
  iconWrapper: {
    // permite que ícones lucide ocupem o espaço correto
  },
  spinner: {
    marginLeft: -4,
  },
});
