import React from 'react';
import { StyleSheet, TextInput, Text, View, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/context';

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
  /**
   * Callback do botão de limpar.
   *
   * Quando presente, o input mostra um "×" à direita. É a forma mais
   * rápida de sair de uma busca sem resultado.
   */
  onClear?: () => void;
  /** Rótulo de acessibilidade do botão de limpar */
  clearAccessibilityLabel?: string;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor,
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
  onClear,
  clearAccessibilityLabel = 'Limpar campo',
}: InputProps) {
  const { theme } = useTheme();
  const corPlaceholder = placeholderTextColor ?? theme.colors.textSecondary;
  const isMultiline = multiline === true || (typeof multiline === 'number' && multiline > 0);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.fieldRow, isMultiline && styles.fieldRowMultiline]}>
        <TextInput
          style={[
            styles.input,
            isMultiline && styles.inputMultiline,
            error && styles.inputError,
            onClear ? styles.inputWithAdornment : null,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={corPlaceholder}
          keyboardType={keyboardType}
          multiline={isMultiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          accessibilityLabel={accessibilityLabel}
        />
        {onClear && value.length > 0 ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={onClear}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={clearAccessibilityLabel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error && errorText && <Text style={styles.errorText}>{errorText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: statusColors.labelText,
    marginBottom: spacing.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldRowMultiline: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: statusColors.inputBorder,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    ...typography.body,
    color: statusColors.inputText,
    backgroundColor: statusColors.inputBg,
  },
  inputWithAdornment: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  clearBtn: {
    width: 44,
    // acompanha a altura do campo (o row usa alignItems: 'center' e o
    // botão se estica), com 44px de área de toque garantida
    minHeight: 44,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: statusColors.inputBorder,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: statusColors.inputBg,
  },
  inputMultiline: {
    height: 96,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: statusColors.danger,
  },
  errorText: {
    ...typography.label,
    color: statusColors.danger,
    marginTop: spacing.xs,
  },
});
