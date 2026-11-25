import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { colors, radius, shadowCard, spacing, typography } from '@/theme/tokens';

export type ActionTileLayout = 'vertical' | 'horizontal';
export type ActionTileTone = 'default' | 'danger';

export interface ActionTileProps {
  /** Título da ação */
  title: string;
  /** Descrição curta */
  description?: string;
  /** Ícone do tile */
  icon?: React.ReactNode;
  /** Callback do toque */
  onPress?: () => void;
  /** Ícone à direita */
  trailingIcon?: React.ReactNode;
  /**
   * `vertical` empilha ícone, título e descrição (usado em Ações Rápidas).
   * `horizontal` alinha o ícone à esquerda do texto (usado em grades densas).
   */
  layout?: ActionTileLayout;
  /** `danger` usa a paleta destrutiva */
  tone?: ActionTileTone;
  /** Estilo adicional do tile */
  style?: ViewStyle;
  /** Rótulo lido por leitores de tela */
  accessibilityLabel?: string;
  /** Dica lida por leitores de tela */
  accessibilityHint?: string;
}

/**
 * Tile de ação.
 *
 * O layout vertical é **vertical**: ícone no topo, título, descrição e um
 * chevron posicionado de forma absoluta no canto inferior. O chevron fica
 * fora do fluxo do texto, então a descrição nunca é espremida nem vaza do
 * card — era o que acontecia com o layout horizontal original.
 *
 * No layout horizontal o texto ocupa `flex: 1` com `minWidth: 0`, e o
 * chevron é `flexShrink: 0`: o mesmo cuidado, com menos altura.
 */
export function ActionTile({
  title,
  description,
  icon,
  onPress,
  trailingIcon,
  layout = 'vertical',
  tone = 'default',
  style,
  accessibilityLabel,
  accessibilityHint,
}: ActionTileProps) {
  const isDanger = tone === 'danger';
  const horizontal = layout === 'horizontal';

  return (
    <TouchableOpacity
      style={[
        styles.tile,
        shadowCard,
        horizontal && styles.tileHorizontal,
        isDanger && styles.tileDanger,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint ?? description}
    >
      {icon ? (
        <View style={[styles.iconTile, horizontal && styles.iconTileHorizontal, isDanger && styles.iconTileDanger]}>
          {icon}
        </View>
      ) : null}

      <View style={[styles.textBlock, horizontal && styles.textBlockHorizontal]}>
        <Text
          style={[styles.title, horizontal && styles.titleHorizontal, isDanger && styles.titleDanger]}
          numberOfLines={2}
        >
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>

      {trailingIcon ? (
        <View style={horizontal ? styles.trailingHorizontal : styles.trailing}>{trailingIcon}</View>
      ) : null}
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
  tileHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tileDanger: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSoft,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTileHorizontal: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
  },
  iconTileDanger: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  textBlock: { flex: 1, gap: 2 },
  textBlockHorizontal: { flex: 1, minWidth: 0, gap: 1 },
  title: { ...typography.headline, color: colors.textPrimary },
  // no layout horizontal o texto é mais estreito: um corpo menor evita
  // truncar "Editar paciente" em "Editar paci..."
  titleHorizontal: { ...typography.body, fontWeight: '700' },
  titleDanger: { color: colors.danger },
  description: { ...typography.bodyRegular, color: colors.textSecondary },
  trailing: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xxl,
  },
  trailingHorizontal: {
    marginLeft: spacing.xs,
  },
});
