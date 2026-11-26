import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

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
  const palette = CHIP_TONES[tone];

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

const CHIP_TONES: Record<ChipTone, { bg: string; fg: string }> = {
  positive: { bg: colors.successSoft, fg: colors.success },
  negative: { bg: colors.dangerSoft, fg: colors.danger },
  brand: { bg: colors.brandSoft, fg: colors.brand },
  neutral: { bg: colors.cardInner, fg: colors.textSecondary },
};

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
