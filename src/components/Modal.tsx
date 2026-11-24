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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '85%',
  },
  header: {
    marginBottom: 18,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#133E2B',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: '#F1F5F9',
  },
  btnConfirm: {
    backgroundColor: '#0D9488',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnTextCancel: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnTextConfirm: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
