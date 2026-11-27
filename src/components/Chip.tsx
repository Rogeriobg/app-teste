import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/context';

export type ChipTone = 'positive' | 'negative' | 'neutral' | 'brand';

export interface ChipProps {
  /** Texto do chip */
  children: React.ReactNode;
  /** Matiz do chip */
  tone?: ChipTone;
  /** Ícone opcional à esquerda */
  icon?: React.ReactNode;
  /** Estilo adicional do container */
  style?: ViewStyle;
}

/**
 * Chip / pill de status.
 *
 * Port do `Chip` do BoardUI (variant `bold`): pilha arredondada, ícone
 * opcional à esquerda e texto em `body-medium`.
 */
export function Chip({ children, tone = 'neutral', icon, style }: ChipProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  /**
   * Cores resolvidas do tema: status vem dos tokens (não muda),
   * as demais acompanham o preset ativo.
   */
  const tones: Record<ChipTone, { bg: string; fg: string }> = {
    positive: { bg: statusColors.successSoft, fg: statusColors.success },
    negative: { bg: statusColors.dangerSoft, fg: statusColors.danger },
    brand: { bg: statusColors.brandSoft, fg: c.primary },
    neutral: { bg: statusColors.cardInner, fg: c.textSecondary },
  };
  const palette = tones[tone];

  return (
    <View
      style={[styles.container, { backgroundColor: palette.bg }, style]}
      accessible
      accessibilityRole="text"
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingVertical: spacing.xxs,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
    gap: spacing.xxs,
    maxWidth: '100%',
    minWidth: 0,
  },
  icon: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { ...typography.caption, includeFontPadding: false, flexShrink: 1, minWidth: 0 },
});
