import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Chip } from './Chip';
import { colors, radius, shadowCard, spacing, typography } from '@/theme/tokens';

export interface StatSummarySegment {
  /** Rótulo do segmento (ex.: "Prontuários ativos") */
  label: string;
  /**
   * Quantidade do segmento.
   *
   * O nome NÃO pode ser `value`: o plugin de Babel do Worklets
   * (`react-native-worklets/plugin`) insere um `console.warn` que faz
   * `require('react-native-reanimated')` sempre que uma member expression
   * terminada em `.value` aparece dentro de um objeto literal de `style`.
   * Esse require quebra o ambiente de teste (o módulo nativo não existe
   * fora do app) e polui o console em dev.
   */
  count: number;
  /** Cor do segmento na barra */
  color: string;
}

export interface StatSummaryProps {
  /** Título do card (ex.: "Prontuários") */
  title: string;
  /** Total exibido no chip */
  total?: string | number;
  /** Segmentos da barra de proporção */
  segments: StatSummarySegment[];
  /** Rótulo lido por leitores de tela */
  accessibilityLabel?: string;
  /** Estilo adicional do card */
  style?: ViewStyle;
}

/**
 * Card de resumo com barra de proporção segmentada.
 *
 * Junta numa única superfície o que antes eram três cards soltos, usando o
 * recipe de "inner tile" do BoardUI (superfície secundária + sombra de card)
 * para as linhas de detalhe e a linguagem do `Meter`/`Progress` para a barra.
 */
export function StatSummary({
  title,
  total,
  segments,
  accessibilityLabel,
  style,
}: StatSummaryProps) {
  const soma = segments.reduce((acc, s) => acc + s.count, 0);
  const resumo = segments.map((s) => `${s.label} ${s.count}`).join(', ');

  return (
    <View
      style={[styles.card, shadowCard, style]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel ?? `${title}: ${total ?? soma}. ${resumo}`}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {total !== undefined ? <Chip tone="brand">{total}</Chip> : null}
      </View>

      {/* Barra segmentada — proporções relativas ao total */}
      <View style={styles.bar} accessibilityElementsHidden>
        {soma > 0 &&
          segments.map((segment) => {
            if (segment.count <= 0) return null;
            // estilos dinâmicos ficam fora do literal do array de `style`
            const estilo = { flexGrow: segment.count, backgroundColor: segment.color };
            return <View key={segment.label} style={estilo} />;
          })}
      </View>

      <View style={styles.legend}>
        {segments.map((segment) => {
          const cor = { backgroundColor: segment.color };
          return (
            <View key={segment.label} style={styles.legendRow}>
              <View style={[styles.dot, cor]} />
              <Text style={styles.legendLabel} numberOfLines={1}>
                {segment.label}
              </Text>
              <Text style={styles.legendValue}>{segment.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...typography.headline, color: colors.textPrimary, flexShrink: 1 },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.cardInner,
    overflow: 'hidden',
  },
  legend: { gap: spacing.sm },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  dot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendLabel: { ...typography.bodyRegular, color: colors.textSecondary, flex: 1, minWidth: 0 },
  legendValue: { ...typography.headline, color: colors.textPrimary, fontSize: 15, flexShrink: 0 },
});
