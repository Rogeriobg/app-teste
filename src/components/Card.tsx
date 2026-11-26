import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, shadowCard } from '@/theme/tokens';

export interface CardProps {
  /** Conteúdo do card */
  children: React.ReactNode;
  /** Estilo adicional */
  style?: ViewStyle;
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
  backgroundColor = colors.card,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        { borderRadius, padding, backgroundColor },
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
    borderColor: colors.border,
  },
  elevated: {
    ...shadowCard,
  },
});
