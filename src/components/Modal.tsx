import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export interface ModalProps {
  /** Visibilidade do modal */
  visible: boolean;
  /** Callback ao fechar (pressionar overlay ou botão cancelar) */
  onDismiss: () => void;
  /** Título do modal */
  title?: string;
  /** Conteúdo customizado (filhos) */
  children?: React.ReactNode;
  /** Texto do botão cancelar */
  cancelTitle?: string;
  /** Texto do botão salvar/confirmar */
  confirmTitle?: string;
  /** Ação do botão confirmar */
  onConfirm?: () => void;
  /** Se o botão confirmar está carregando */
  confirmLoading?: boolean;
  /** Se o botão confirmar está desabilitado */
  confirmDisabled?: boolean;
  /** Estilo adicional do conteúdo */
  contentStyle?: ViewStyle;
  /** Estilo adicional do título */
  titleStyle?: TextStyle;
  /** Se deve fechar ao pressionar o overlay */
  backdropPressToClose?: boolean;
}

export function AppModal({
  visible,
  onDismiss,
  title,
  children,
  cancelTitle = 'Cancelar',
  confirmTitle = 'Confirmar',
  onConfirm,
  confirmLoading = false,
  confirmDisabled = false,
  contentStyle,
  titleStyle,
  backdropPressToClose = true,
}: ModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onDismiss={onDismiss}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={backdropPressToClose ? onDismiss : undefined}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <View style={[styles.content, contentStyle]}>
            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, titleStyle]}>{title}</Text>
              </View>
            )}
            {children}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel]}
                onPress={onDismiss}
                activeOpacity={0.8}
              >
                <Text style={styles.btnTextCancel}>{cancelTitle}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnConfirm, confirmDisabled && styles.btnDisabled]}
                onPress={!confirmDisabled ? onConfirm : undefined}
                activeOpacity={0.8}
                disabled={confirmDisabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: confirmDisabled }}
              >
                {confirmLoading ? (
                  <Text style={styles.btnTextConfirm}>Processando...</Text>
                ) : (
                  <Text style={styles.btnTextConfirm}>{confirmTitle}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    shadowColor: colors.shadowNeutral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '85%',
  },
  header: {
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.title2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  btn: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: colors.mutedSurface,
  },
  btnConfirm: {
    backgroundColor: colors.brand,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnTextCancel: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  btnTextConfirm: {
    ...typography.body,
    fontWeight: 'bold',
    color: colors.textOnBrand,
  },
});
