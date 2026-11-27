import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemeProvider, ThemeScope, useTheme } from '@/theme/context';
import {
  contrastRatio,
  getReadableTextColor,
  isSoftLightBackground,
  luminance,
  chroma,
} from '@/theme/contrast';
import { PRESETS } from '@/theme/presets';
import { loadTheme, saveTheme } from '@/theme/storage';
import { DEFAULT_THEME_STATE } from '@/theme/types';
import { FONT_SCALE, scaled } from '@/theme/font';

/** Componente de teste que expõe o tema e botões para trocar. */
function Sonda() {
  const { theme, fontScale, setPreset, setFontScale, resetTheme } = useTheme();
  return (
    <>
      <Text testID="preset">{theme.id}</Text>
      <Text testID="primary">{theme.colors.primary}</Text>
      <Text testID="onPrimary">{theme.colors.onPrimary}</Text>
      <Text testID="fundo">{theme.colors.background}</Text>
      <Text testID="fonte">{fontScale}</Text>
      <TouchableOpacity testID="jardim" onPress={() => setPreset('jardim')} />
      <TouchableOpacity testID="grande" onPress={() => setFontScale('large')} />
      <TouchableOpacity testID="restaurar" onPress={resetTheme} />
    </>
  );
}

describe('Theme — contraste (WCAG 2.1)', () => {
  it('calcula luminância e razão de contraste corretamente', () => {
    expect(luminance('#FFFFFF')).toBeCloseTo(1, 3);
    expect(luminance('#000000')).toBeCloseTo(0, 3);
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
  });

  it('todos os 4 presets têm texto/fundo e primária/superfície >= 4,5:1', () => {
    expect(PRESETS).toHaveLength(4);
    for (const preset of PRESETS) {
      expect(contrastRatio(preset.colors.text, preset.colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(preset.colors.primary, preset.colors.surface)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('onPrimary é sempre legível para qualquer cor', () => {
    for (const preset of PRESETS) {
      const on = getReadableTextColor(preset.colors.primary);
      expect(contrastRatio(preset.colors.primary, on)).toBeGreaterThanOrEqual(4.5);
    }
    // caso intermediário que a análise citou
    expect(contrastRatio('#C07A65', getReadableTextColor('#C07A65'))).toBeGreaterThanOrEqual(4.5);
  });

  it('isSoftLightBackground bloqueia fundos escuros e vibrantes (R14)', () => {
    expect(isSoftLightBackground('#FAF8F5')).toBe(true);
    expect(isSoftLightBackground('#18171C')).toBe(false); // escuro removido
    expect(isSoftLightBackground('#FF0000')).toBe(false); // vibrante
    expect(chroma('#808080')).toBeCloseTo(0, 3);
    // fundos suaves reais passam (a regra HSL pura rejeitaria #FAF8F5)
    for (const preset of PRESETS) {
      expect(isSoftLightBackground(preset.colors.background)).toBe(true);
    }
  });
});

describe('Theme — persistência', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('usa o padrão quando não há nada salvo', async () => {
    await expect(loadTheme()).resolves.toEqual(DEFAULT_THEME_STATE);
  });

  it('salva e recupera o estado completo', async () => {
    const estado = { presetId: 'brisa', fontScale: 'large' as const };
    await saveTheme(estado);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(estado));
    await expect(loadTheme()).resolves.toEqual(estado);
  });

  it('storage corrompido volta ao padrão sem quebrar', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{invalido');
    await expect(loadTheme()).resolves.toEqual(DEFAULT_THEME_STATE);
  });
});

describe('Theme — Provider e troca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  it('expõe preset padrão e permite trocar', async () => {
    await render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('preset')).toHaveTextContent('acolhimento'));

    await act(async () => {
      await fireEvent.press(screen.getByTestId('jardim'));
    });

    expect(screen.getByTestId('preset')).toHaveTextContent('jardim');
    expect(screen.getByTestId('primary')).toHaveTextContent('#567C61');
  });

  it('restaura padrão e fonte', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ presetId: 'terracota', fontScale: 'large' })
    );

    await render(
      <ThemeProvider>
        <Sonda />
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('preset')).toHaveTextContent('terracota'));
    expect(screen.getByTestId('fonte')).toHaveTextContent('large');

    await act(async () => {
      await fireEvent.press(screen.getByTestId('restaurar'));
    });

    expect(screen.getByTestId('preset')).toHaveTextContent('acolhimento');
    expect(screen.getByTestId('fonte')).toHaveTextContent('default');
  });

  it('ThemeScope mantém a prévia isolada do tema global', async () => {
    const [preview] = PRESETS.filter((p) => p.id === 'brisa');

    await render(
      <ThemeProvider>
        <ThemeScope
          theme={{ ...preview, colors: { ...preview.colors, onPrimary: '#FFFFFF' } }}
          fontScale="small"
        >
          <Sonda />
        </ThemeScope>
      </ThemeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('preset')).toHaveTextContent('brisa'));
    expect(screen.getByTestId('fonte')).toHaveTextContent('small');
  });
});

describe('Theme — escala de fonte', () => {
  it('aplica multiplicadores sem arredondar para zero', () => {
    expect(FONT_SCALE.small).toBe(0.9);
    expect(FONT_SCALE.default).toBe(1);
    expect(FONT_SCALE.large).toBe(1.125);
    expect(scaled({ fontSize: 16 }, 'large').fontSize).toBe(18);
    expect(scaled({ fontSize: 16, lineHeight: 20 }, 'small').lineHeight).toBe(18);
  });
});
