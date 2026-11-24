import React from 'react';
import { StyleSheet, TextInput, Text, View, ViewStyle, TextStyle } from 'react-native';

export interface InputProps {
  /** Rótulo acima do input */
  label?: string;
  /** Valor atual */
  value: string;
  /** Callback de mudança */
  onChangeText: (text: string) => void;
  /** Placeholder */
  placeholder?: string;
  /** Cor do placeholder */
  placeholderTextColor?: string;
  /** Tipo de teclado */
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  /** Se é multilinha */
  multiline?: number | boolean;
  /** Número de linhas (quando multiline) */
  numberOfLines?: number;
  /** Se está com erro */
  error?: boolean;
  /** Texto de erro exibido abaixo */
  errorText?: string;
  /** Estilo adicional do container */
  style?: ViewStyle;
  /** Estilo adicional do input */
  inputStyle?: TextStyle;
  /** Dica de auto completa */
  autoComplete?: any;
  /** Auto capitalizar */
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  /** Label de acessibilidade */
  accessibilityLabel?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = '#94A3B8',
  keyboardType = 'default',
  multiline = false,
  numberOfLines,
  error = false,
  errorText,
  style,
  inputStyle,
  autoComplete,
  autoCapitalize = 'none',
  accessibilityLabel,
}: InputProps) {
  const isMultiline = multiline === true || (typeof multiline === 'number' && multiline > 0);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isMultiline && styles.inputMultiline,
          error && styles.inputError,
          inputStyle,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        keyboardType={keyboardType}
        multiline={isMultiline}
        numberOfLines={numberOfLines}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        accessibilityLabel={accessibilityLabel}
      />
      {error && errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  inputMultiline: {
    height: 96,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
