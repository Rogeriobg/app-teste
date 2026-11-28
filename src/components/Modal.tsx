import React from 'react';
import {
  StyleSheet,
  View,
  Modal,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onDismiss={onDismiss}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: statusColors.overlay,
            // Safe area explícita por borda — nunca SafeAreaView + inset manual
            paddingTop: insets.top + spacing.sm,
            paddingBottom: insets.bottom + spacing.sm,
          },
        ]}
      >
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
            {/*
             * Conteúdo rolável: com o teclado aberto o form continua fixo no
             * topo e o usuário consegue alcançar os últimos campos.
             */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
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
    // âncora no topo: o KeyboardAvoidingView encolhe com o teclado e, se
    // estivesse centralizado, o form desceria para o meio da tela (bug do
    // aparelho). flex-start mantém o card exatamente onde abriu.
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboard: {
    flex: 1,
    width: '100%',
  },
  content: {
    backgroundColor: statusColors.card,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    shadowColor: statusColors.shadowNeutral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxHeight: '100%',
    flexShrink: 1,
  },
  body: {
    flexShrink: 1,
  },
  bodyContent: {
    paddingVertical: spacing.xs,
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
    flexShrink: 0,
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
