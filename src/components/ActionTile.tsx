import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, shadowCard, spacing, typography } from '@/theme/tokens';

export interface ActionTileProps {
  /** Título da ação */
  title: string;
  /** Descrição curta (2 linhas no máximo) */
  description?: string;
  /** Ícone do tile */
  icon?: React.ReactNode;
  /** Callback do toque */
  onPress?: () => void;
  /** Ícone à direita */
  trailingIcon?: React.ReactNode;
  /** Estilo adicional do tile */
  style?: ViewStyle;
  /** Rótulo lido por leitores de tela */
  accessibilityLabel?: string;
  /** Dica lida por leitores de tela */
  accessibilityHint?: string;
}

/**
 * Tile de ação (Ações Rápidas).
 *
 * O layout é **vertical**: ícone no topo, título, descrição e um chevron
 * posicionado de forma absoluta no canto inferior. O chevron fica fora do
 * fluxo do texto, então a descrição nunca é espremida nem vaza do card —
 * era o que acontecia com o layout horizontal anterior.
 */
export function ActionTile({
  title,
  description,
  icon,
  onPress,
  trailingIcon,
  style,
  accessibilityLabel,
  accessibilityHint,
}: ActionTileProps) {
  return (
    <TouchableOpacity
      style={[styles.tile, shadowCard, style]}
      onPress={onPress}
      activeOpacity={0.85}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint ?? description}
    >
      {icon ? <View style={styles.iconTile}>{icon}</View> : null}

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>

      {trailingIcon ? <View style={styles.trailing}>{trailingIcon}</View> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    minHeight: 132,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1, gap: 2 },
  title: { ...typography.headline, color: colors.textPrimary },
  description: { ...typography.bodyRegular, color: colors.textSecondary },
  trailing: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
  },
});
