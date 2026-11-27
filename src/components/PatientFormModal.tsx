import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
// importa direto do módulo, e não pelo barrel `@/components`: importar pelo
// barrel criaria um ciclo de require (index -> PatientFormModal -> index)
import { AppModal } from './Modal';
import { Input } from './Input';
import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';
import { useTheme } from '@/theme/context';

/** Valores do formulário de paciente. */
export interface PatientFormValues {
  name: string;
  email: string;
  phone: string;
  /** Data de nascimento no formato ISO `YYYY-MM-DD`. */
  birthDate: string;
  anamnesis: string;
}

export type PatientFormMode = 'create' | 'edit';

export interface PatientFormModalProps {
  /** Visibilidade do modal */
  visible: boolean;
  /** `create` = cadastro, `edit` = edição */
  mode: PatientFormMode;
  /** Valores iniciais (necessário no modo `edit`) */
  initial?: Partial<PatientFormValues> | null;
  /** Callback de dismissal */
  onDismiss: () => void;
  /** Callback de submit com os valores validados */
  onSubmit: (values: PatientFormValues) => void | Promise<void>;
}

/**
 * Modal de cadastro/edição de paciente.
 *
 * Extraído para que o cadastro (`patients.tsx`) e a edição
 * (`patients/[patientId]/details.tsx`) compartilhem **um** formulário,
 * **uma** validação e **um** conjunto de testes.
 *
 * A validação é feita aqui dentro (nome e e-mail são obrigatórios) e o
 * componente expõe o erro via `onSubmit` — o erro também aparece inline no
 * campo, sem depender de `Alert`.
 */
export function PatientFormModal({
  visible,
  mode,
  initial,
  onDismiss,
  onSubmit,
}: PatientFormModalProps) {
  /**
   * O formulário nasce **já preenchido** com os valores recebidos.
   *
   * O componente é remontado a cada abertura (o `key` muda junto com o
   * paciente em edição), então o estado inicial já é o correto — sem
   * `setState` dentro de efeito (regra `react-hooks/set-state-in-effect`).
   */
  const { theme } = useTheme();
  const [values, setValues] = useState<PatientFormValues>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    birthDate: initial?.birthDate ?? '',
    anamnesis: initial?.anamnesis ?? '',
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = (field: keyof PatientFormValues, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors((e) => ({ ...e, [field]: undefined }));
    }
  };

  const handleDateChange = (_event: any, selectedDate: Date | undefined) => {
    if (selectedDate) {
      setField('birthDate', selectedDate.toISOString().slice(0, 10));
    }
    setDatePickerVisible(false);
  };

  const validate = (): boolean => {
    const next: { name?: string; email?: string } = {};
    if (!values.name.trim()) next.name = 'Informe o nome do paciente.';
    if (!values.email.trim()) next.email = 'Informe o e-mail do paciente.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        birthDate: values.birthDate.trim(),
        anamnesis: values.anamnesis.trim(),
      });
      setSaving(false);
    } catch {
      setSaving(false);
    }
  };

  const isEdit = mode === 'edit';

  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title={isEdit ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
      cancelTitle="Cancelar"
      confirmTitle={isEdit ? 'Salvar Alterações' : 'Cadastrar'}
      confirmLoading={saving}
      onConfirm={handleConfirm}
    >
      <Input
        label="Nome Completo"
        placeholder="Ex: Maria Oliveira"
        placeholderTextColor={theme.colors.textSecondary}
        value={values.name}
        onChangeText={(v) => setField('name', v)}
        error={!!errors.name}
        errorText={errors.name}
        accessibilityLabel="Nome completo do paciente"
      />

      <Input
        label="E-mail"
        placeholder="Ex: maria@email.com"
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={values.email}
        onChangeText={(v) => setField('email', v)}
        error={!!errors.email}
        errorText={errors.email}
        accessibilityLabel="E-mail do paciente"
      />

      <Input
        label="Telefone"
        placeholder="Ex: (11) 98888-7777"
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="phone-pad"
        value={values.phone}
        onChangeText={(v) => setField('phone', v)}
        accessibilityLabel="Telefone do paciente"
      />

      <Text style={styles.label}>Data de nascimento</Text>
      <TouchableOpacity
        style={styles.datePickerInput}
        onPress={() => setDatePickerVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Selecionar data de nascimento"
        accessibilityHint="Abre o calendário para escolher a data"
      >
        <Calendar size={18} color={statusColors.textMuted} style={styles.datePickerIcon} />
        <Text style={[styles.datePickerText, !values.birthDate && styles.datePickerPlaceholder]}>
          {values.birthDate || 'AAAA-MM-DD'}
        </Text>
      </TouchableOpacity>

      {datePickerVisible && (
        <DateTimePicker
          value={values.birthDate ? new Date(values.birthDate) : new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date(1900, 0, 1)}
          maximumDate={new Date()}
        />
      )}

      <Input
        label="Anamnese (resumo inicial)"
        placeholder="Queixa principal, histórico, observações..."
        placeholderTextColor={theme.colors.textSecondary}
        value={values.anamnesis}
        onChangeText={(v) => setField('anamnesis', v)}
        multiline
        numberOfLines={3}
        accessibilityLabel="Anamnese do paciente"
      />

      <View style={styles.footerNote}>
        <Text style={styles.footerNoteText}>
          Os dados ficam salvos apenas neste dispositivo.
        </Text>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.label,
    color: statusColors.labelText,
    marginBottom: spacing.sm,
  },
  datePickerInput: {
    borderWidth: 1,
    borderColor: statusColors.inputBorder,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: statusColors.inputBg,
    marginBottom: spacing.lg,
    minHeight: 44,
  },
  datePickerIcon: { marginRight: spacing.md },
  datePickerText: { ...typography.body, color: statusColors.inputText, flex: 1, minWidth: 0 },
  datePickerPlaceholder: { color: statusColors.textMuted },
  footerNote: { marginTop: spacing.xs, marginBottom: spacing.xs },
  footerNoteText: { ...typography.caption, color: statusColors.textMuted, textAlign: 'center' },
});
