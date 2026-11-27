import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Chip, ChipTone } from './Chip';
import { colors as statusColors, radius, shadowCard, spacing, toneColors, typography, StatTone } from '@/theme/tokens';
import { useTheme } from '@/theme/context';

export interface StatCardProps {
  /** Rótulo da métrica (ex.: "Ativos") */
  label: string;
  /** Valor exibido em destaque */
  value: string | number;
  /** Ícone do tile */
  icon?: React.ReactNode;
  /** Matiz do stat card */
  tone?: StatTone;
  /** Texto do chip opcional (ex.: "50%", "Total") */
  chip?: string;
  /** Matiz do chip */
  chipTone?: ChipTone;
  /** Ícone do chip */
  chipIcon?: React.ReactNode;
  /** Estilo adicional do card */
  style?: ViewStyle;
  /** Rótulo lido por leitores de tela */
  accessibilityLabel?: string;
}

/**
 * Stat card no padrão BoardUI (variant `plain`).
 *
 * Reprodução do recipe oficial
 * (https://www.boardui.com/r/stat-cards.json):
 *
 * ```
 * <section class="flex h-[132px] min-w-0 flex-col items-start justify-between
 *                rounded-2xl bg-background-secondary-default p-4">
 *   <span class="flex items-center rounded-md bg-stat-card-icon-background p-1.5">
 *     <icon class="size-5 shrink-0 text-foreground-icon-primary" />
 *   </span>
 *   <div class="flex w-full flex-col gap-0.5">
 *     <p class="w-full text-body-medium text-text-secondary">{label}</p>
 *     <div class="flex w-full flex-wrap items-center gap-2">
 *       <p class="text-title-1-medium whitespace-nowrap text-text-primary">{value}</p>
 *       <Chip variant="bold">{chip}</Chip>
 *     </div>
 *   </div>
 * </section>
 * ```
 *
 * O `min-w-0` do original vira `flexShrink: 1` + `numberOfLines`, para o
 * rótulo nunca vazar do card em telas estreitas.
 */
export function StatCard({
  label,
  value,
  icon,
  tone = 'brand',
  chip,
  chipTone = 'neutral',
  chipIcon,
  style,
  accessibilityLabel,
}: StatCardProps) {
  const { theme } = useTheme();
  const palette = toneColors[tone];

  return (
    <View
      style={[styles.card, shadowCard, { backgroundColor: theme.colors.surface }, style]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? `${label}: ${value}`}
    >
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: palette.soft }]}>{icon}</View>
      ) : null}

      <View style={styles.body}>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: theme.colors.text }]} numberOfLines={1}>
            {value}
          </Text>
          {chip ? (
            <Chip tone={chipTone} icon={chipIcon}>
              {chip}
            </Chip>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    minHeight: 124,
    borderRadius: radius.xl,
    backgroundColor: statusColors.card,
    borderWidth: 1,
    borderColor: statusColors.border,
    padding: spacing.xl,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  iconTile: {
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  body: { width: '100%', gap: 2 },
  label: { ...typography.bodyRegular, color: statusColors.textSecondary },
  valueRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  value: { ...typography.title1, color: statusColors.textPrimary, flexShrink: 1, minWidth: 0 },
});
