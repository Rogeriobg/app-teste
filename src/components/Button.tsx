import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/context';

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

/**
 * Estilos de layout permanecem estáticos (os gates leem StyleSheet.create).
 * As cores vêm de `useTheme()` em tempo de render.
 *
 * `statusColors` (tokens) continua sendo a fonte das cores de STATUS —
 * o tema troca só primary/surface/text.
 */
type VariantColors = { bg: string; border: string; color: string };

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
  const { theme } = useTheme();
  const c = theme.colors;

  /** Cores da variante — resolvidas do tema ativo a cada render. */
  const variantColors: Record<ButtonVariant, VariantColors> = {
    primary: { bg: c.primary, border: c.primary, color: c.onPrimary },
    secondary: { bg: c.surface, border: c.textSecondary, color: c.text },
    outline: { bg: 'transparent', border: c.primary, color: c.primary },
    danger: { bg: statusColors.dangerSoft, border: statusColors.dangerBorder, color: statusColors.danger },
    ghost: { bg: 'transparent', border: 'transparent', color: c.textSecondary },
  };
  const { bg, border, color } = variantColors[variant];
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
        <ActivityIndicator size="small" color={color} style={styles.spinner} />
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
    /**
     * O botão **nunca cresce**: dentro de um `row` ele ocupa só a
     * largura do próprio conteúdo (ícone + texto + padding) e o resto
     * fica com o irmão que cede espaço.
     *
     * `flexBasis: 'auto'` + `flexGrow: 0` + `flexShrink: 0` = o botão
     * mantém a largura intrínseca. Sem isso, o `flex: 1` do texto (que
     * existia) fazia o botão herdar a largura total do pai.
     */
    flexBasis: 'auto',
    flexGrow: 0,
    flexShrink: 0,
    maxWidth: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
    /**
     * **NÃO** use `flex: 1` aqui.
     *
     * Com `flex: 1`, o texto cresce até ocupar o pai — e como o botão é
     * filho de um `row` (o header de `/patients`, por exemplo), o botão
     * inteiro inchava para a largura da tela, espremendo o título para
     * fora. No web o CSS mascara isso (o botão tem `width: auto`); no
     * Yoga nativo não.
     *
     * O encolhimento do texto é controlado por `numberOfLines` +
     * `ellipsizeMode`, e o botão por `flexShrink: 0`.
     */
    flexShrink: 1,
    minWidth: 0,
  },
  iconWrapper: {
    // permite que ícones lucide ocupem o espaço correto
  },
  spinner: {
    marginLeft: -spacing.xs,
  },
});
