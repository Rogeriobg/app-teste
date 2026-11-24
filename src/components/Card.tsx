import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

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
  borderRadius = 16,
  padding = 18,
  backgroundColor = '#FFFFFF',
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
    borderColor: '#E2E8F0',
  },
  elevated: {
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
