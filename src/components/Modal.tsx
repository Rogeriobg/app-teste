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
import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/context';

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
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onDismiss={onDismiss}
    >
      <View style={[styles.overlay, { backgroundColor: statusColors.overlay }]}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={backdropPressToClose ? onDismiss : undefined}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <View style={[styles.content, { backgroundColor: c.surface }, contentStyle]}>
            {title && (
              <View style={styles.header}>
                <Text style={[styles.title, { color: c.text }, titleStyle]}>{title}</Text>
              </View>
            )}
            {children}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnCancel, { backgroundColor: statusColors.mutedSurface }]}
                onPress={onDismiss}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnTextCancel, { color: c.textSecondary }]}>{cancelTitle}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: c.primary }, confirmDisabled && styles.btnDisabled]}
                onPress={!confirmDisabled ? onConfirm : undefined}
                activeOpacity={0.8}
                disabled={confirmDisabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: confirmDisabled }}
              >
                {confirmLoading ? (
                  <Text style={[styles.btnTextConfirm, { color: c.onPrimary }]}>Processando...</Text>
                ) : (
                  <Text style={[styles.btnTextConfirm, { color: c.onPrimary }]}>{confirmTitle}</Text>
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
    backgroundColor: statusColors.overlay,
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
    backgroundColor: statusColors.card,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    shadowColor: statusColors.shadowNeutral,
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
    color: statusColors.textPrimary,
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
    // botões do modal: mínimo 44px de altura (HIG / WCAG 2.5.8)
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: statusColors.mutedSurface,
  },
  btnConfirm: {
    backgroundColor: statusColors.brand,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnTextCancel: {
    ...typography.body,
    fontWeight: 'bold',
    color: statusColors.textSecondary,
  },
  btnTextConfirm: {
    ...typography.body,
    fontWeight: 'bold',
    color: statusColors.textOnBrand,
  },
});
