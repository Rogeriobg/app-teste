import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';

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
  Ativo: { bg: '#D1FAE5', border: '#BBF7D0', color: '#0D9488' },
  Inativo: { bg: '#FEF3C7', border: '#FCD34D', color: '#F59E0B' },
  Arquivado: { bg: '#F3F4F6', border: '#E5E7EB', color: '#94A3B8' },
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
  const color = customColor ?? (config?.color ?? '#64748B');
  const bg = config ? config.bg + '15' : '#F8FAFC';
  const border = config ? config.border + '40' : '#CBD5E1';
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
