import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ColorPicker, { Panel3, Preview } from 'reanimated-color-picker';

import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';
import { contrastRatio, isSoftLightBackground } from '@/theme/contrast';

/**
 * Seletor de cor com limites (P8).
 *
 * O `ColorPicker` é importado dinamicamente via `require` **dentro** do
 * componente para que o módulo nativo (reanimated/worklets) não seja
 * carregado quando a tela de aparência abre — ele só entra em cena quando
 * o usuário toca em "Personalizado".
 *
 * Regras de negócio:
 *  - fundo: apenas tons claros suaves (luminância >= 0,6, croma <= 0,12)
 *  - primária: sempre legível — branco ou preto com >= 4,5:1
 */
interface CustomColorPickerProps {
  primary: string;
  background: string;
  onPrimaryChange: (hex: string) => void;
  onBackgroundChange: (hex: string) => void;
}

export default function CustomColorPicker({
  primary,
  background,
  onPrimaryChange,
  onBackgroundChange,
}: CustomColorPickerProps) {
  const [corPrimaria, setCorPrimaria] = useState(primary);
  const [corFundo, setCorFundo] = useState(background);

  const fundoValido = isSoftLightBackground(corFundo);
  const primariaLegivel =
    contrastRatio(corPrimaria, '#FFFFFF') >= 4.5 ||
    contrastRatio(corPrimaria, '#000000') >= 4.5;

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Cor dos botões</Text>
      <ColorPicker
        value={corPrimaria}
        onComplete={(cor: { hex: string }) => {
          if (primariaLegivel) onPrimaryChange(cor.hex);
          setCorPrimaria(cor.hex);
        }}
        sliderThickness={24}
        thumbSize={32}
      >
        <Preview style={styles.preview} />
        <Panel3 style={styles.panel} />
      </ColorPicker>

      <Text style={styles.titulo}>Tom de fundo</Text>
      <Text style={styles.ajuda}>
        Apenas tons claros e suaves — fundos escuros não fazem parte desta versão.
      </Text>
      <ColorPicker
        value={corFundo}
        onComplete={(cor: { hex: string }) => {
          if (isSoftLightBackground(cor.hex)) onBackgroundChange(cor.hex);
          setCorFundo(cor.hex);
        }}
        sliderThickness={24}
        thumbSize={32}
      >
        <Preview style={styles.preview} />
        <Panel3 style={styles.panel} />
      </ColorPicker>

      {!fundoValido ? (
        <Text style={[styles.erro, { color: statusColors.danger }]}>
          Fundo fora do limite: escolha um tom mais claro e suave.
        </Text>
      ) : null}
      {!primariaLegivel ? (
        <Text style={[styles.erro, { color: statusColors.danger }]}>
          Essa cor não permite texto legível no botão.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, marginTop: spacing.md },
  titulo: { ...typography.headline, color: statusColors.textPrimary },
  ajuda: { ...typography.bodyRegular, color: statusColors.textSecondary },
  preview: { height: 44, borderRadius: radius.lg, marginBottom: spacing.sm },
  panel: { height: 180 },
  erro: { ...typography.bodyRegular },
});
