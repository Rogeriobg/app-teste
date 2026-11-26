import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export type PatientStatus = 'Ativo' | 'Inativo' | 'Arquivado';
export type RecordStatus = 'Ativo' | 'Arquivado';

export interface StatusBadgeProps {
  /** Texto exibido no badge */
  label?: string;
  /** Status do paciente (usa cores padronizadas) */
  status?: PatientStatus;
  /** Status do prontuário (Ativo/Arquivado) */
  recordStatus?: RecordStatus;
  /** Cor customizada (sobrepõe status) */
  color?: string;
  /** Estilo adicional do container */
  style?: ViewStyle;
  /** Estilo adicional do texto */
  textStyle?: TextStyle;
  /** Tamanho pequeno */
  small?: boolean;
}

const STATUS_CONFIG: Record<string, { bg: string; border: string; color: string }> = {
  Ativo: { bg: colors.successSoft, border: colors.successBorder, color: colors.success },
  Inativo: { bg: colors.warningSoft, border: colors.warningBorder, color: colors.warning },
  Arquivado: { bg: colors.mutedSoft, border: colors.mutedBorder, color: colors.muted },
};

export function StatusBadge({
  label,
  status,
  recordStatus,
  color: customColor,
  style,
  textStyle,
  small = false,
}: StatusBadgeProps) {
  const statusKey = recordStatus ?? status;
  const config = statusKey ? STATUS_CONFIG[statusKey] : null;
  const color = customColor ?? (config?.color ?? colors.textSecondary);
  const bg = config ? config.bg + '15' : colors.inputBg;
  const border = config ? config.border + '40' : colors.inputBorder;
  const text = label ?? statusKey ?? recordStatus ?? '';

  return (
    <View
      style={[
        styles.container,
        small && styles.small,
        { backgroundColor: bg, borderColor: border },
        style,
      ]}
    >
      <Text style={[styles.text, { color }, textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: radius.md,
  },
  text: {
    ...typography.caption,
    textTransform: 'uppercase',
  },
});
