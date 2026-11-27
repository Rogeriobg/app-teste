import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { colors as statusColors, radius, spacing, shadowCard } from '@/theme/tokens';
import { useTheme } from '@/theme/context';

export interface CardProps {
  /** Conteúdo do card */
  children: React.ReactNode;
  /** Estilo adicional (aceita array, padrão RN) */
  style?: StyleProp<ViewStyle>;
  /** Se deve ter sombra */
  elevated?: boolean;
  /** Raio da borda */
  borderRadius?: number;
  /** Padding interno */
  padding?: number;
  /** Cor de fundo */
  backgroundColor?: string;
}

export function Card({
  children,
  style,
  elevated = true,
  borderRadius = radius.xl,
  padding = spacing.xl,
  backgroundColor,
}: CardProps) {
  const { theme } = useTheme();
  // cards "com cor": tom suave derivado da primária do tema
  const fundo = backgroundColor ?? theme.colors.cardTint;

  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        {
          borderRadius,
          padding,
          backgroundColor: fundo,
          borderColor: theme.colors.cardBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    // borda é substituída no JSX por theme.colors.cardBorder
    borderColor: statusColors.border,
  },
  elevated: {
    ...shadowCard,
  },
});
