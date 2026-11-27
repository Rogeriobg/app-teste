import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { selectionAsync, impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Check, ChevronLeft, RotateCcw, Palette } from 'lucide-react-native';

import { Button } from '@/components';
import CustomColorPicker from '@/components/CustomColorPicker';
import { useTheme, ThemeScope } from '@/theme/context';
import { useThemeStyles } from '@/theme/hooks';
import { PRESETS, DEFAULT_PRESET_ID } from '@/theme/presets';
import {
  getReadableTextColor,
  isSoftLightBackground,
  mixColors,
} from '@/theme/contrast';
import type { FontScale, Theme } from '@/theme/types';
import { colors as statusColors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Tela de Aparência — Etapa 6 (P6/P7/P9).
 *
 * A prévia usa `ThemeScope` (override local), então tocar num tema **não**
 * muda o app inteiro — só ao confirmar em "Aplicar tema" (DP3).
 */
export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const {
    theme,
    fontScale,
    applyTheme,
    resetTheme,
  } = useTheme();
  const css = useThemeStyles();

  // estado local: o que está sendo PRÉ-VISUALIZADO (não aplicado ainda)
  const [presetId, setPresetId] = useState(theme.id);
  const [customPrimary, setCustomPrimary] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [selectedFontScale, setSelectedFontScale] = useState<FontScale>(fontScale);
  /** P8: mostra o seletor quando o usuário toca em "Personalizado". */
  const [mostrandoPicker, setMostrandoPicker] = useState(false);

  const previewTheme = useMemo<Theme>(() => {
    const base = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
    const primary = customPrimary ?? base.colors.primary;
    const background = customBackground ?? base.colors.background;
    const surface = base.colors.surface;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary,
        background,
        onPrimary: getReadableTextColor(primary),
        // mesmas derivações do ThemeProvider, para a prévia ser fidedigna
        surfaceInner: mixColors(surface, background, 0.45),
        primarySoft: mixColors(surface, primary, 0.12),
        primaryBorder: mixColors(surface, primary, 0.3),
      },
    };
  }, [presetId, customPrimary, customBackground]);

  const aplicar = async () => {
    // Uma única gravação atômica — evita que a fonte "large" seja perdida
    // por escrita parcial de um setter anterior.
    applyTheme({
      presetId,
      ...(customPrimary || customBackground
        ? {
            custom: {
              ...(customPrimary ? { primary: customPrimary } : {}),
              ...(customBackground ? { background: customBackground } : {}),
            },
          }
        : {}),
      fontScale: selectedFontScale,
    });
    await impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  };

  const escolherTema = async (id: string) => {
    setPresetId(id);
    setCustomPrimary(null);
    setCustomBackground(null);
    setMostrandoPicker(false);
    await selectionAsync();
  };

  const escolherFonte = async (escala: FontScale) => {
    setSelectedFontScale(escala);
    await selectionAsync();
  };

  const restaurar = () => {
    resetTheme();
    setPresetId(DEFAULT_PRESET_ID);
    setCustomPrimary(null);
    setCustomBackground(null);
    setSelectedFontScale('default');
  };

  const confirmarRestaurar = () => {
    Alert.alert(
      'Restaurar padrão',
      'Volta ao tema Acolhimento e fonte Padrão. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', style: 'destructive', onPress: restaurar },
      ]
    );
  };

  const fundoValidoOuAtual =
    customBackground == null || isSoftLightBackground(customBackground);

  return (
    <View style={[styles.container, css.page, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={[styles.topBar, css.surface]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <ChevronLeft size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, css.text]}>Aparência</Text>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Prévia isolada — ThemeScope (DP3) */}
        <ThemeScope theme={previewTheme} fontScale={selectedFontScale}>
          <View style={[styles.previewCard, { backgroundColor: previewTheme.colors.surface }]}>
            <View style={[styles.previewAvatar, { backgroundColor: previewTheme.colors.primary }]}>
              <Palette size={22} color={previewTheme.colors.onPrimary} />
            </View>
            <View style={styles.previewCopy}>
              <Text style={[styles.previewTitle, { color: previewTheme.colors.text }]}>
                As cores mudam em tempo real
              </Text>
              <Text style={[styles.previewSub, { color: previewTheme.colors.textSecondary }]}>
                Toque em um tema para pré-visualizar. O app só muda ao aplicar.
              </Text>
            </View>
            <View style={[styles.previewBtn, { backgroundColor: previewTheme.colors.primary }]}>
              <Text style={[styles.previewBtnText, { color: previewTheme.colors.onPrimary }]}>
                Prévia
              </Text>
            </View>
          </View>
        </ThemeScope>

        {/* Grade de temas */}
        <Text style={[styles.sectionTitle, css.text]}>Temas</Text>
        <View style={styles.grid}>
          {PRESETS.map((preset) => {
            const ativo = presetId === preset.id && !customPrimary && !customBackground;
            return (
              <TouchableOpacity
                key={preset.id}
                style={[styles.themeCard, css.surface, ativo && styles.themeCardAtivo]}
                onPress={() => escolherTema(preset.id)}
                activeOpacity={0.85}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Tema ${preset.name}`}
                accessibilityState={{ selected: ativo }}
              >
                <View style={styles.themeSwatch}>
                  <View style={[styles.swatchHalf, { backgroundColor: preset.colors.background }]} />
                  <View style={[styles.swatchHalf, { backgroundColor: preset.colors.primary }]} />
                  {ativo ? (
                    <View style={styles.checkBadge}>
                      <Check size={14} color={statusColors.textOnBrand} />
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.themeName, css.text]} numberOfLines={1}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* 6º item: Personalizado */}
          <TouchableOpacity
            style={[
              styles.themeCard,
              css.surface,
              (customPrimary || customBackground) && styles.themeCardAtivo,
            ]}
            onPress={() => {
              setMostrandoPicker(true);
              setPresetId(theme.id);
              setCustomPrimary((atual) => atual ?? previewTheme.colors.primary);
              setCustomBackground((atual) => atual ?? previewTheme.colors.background);
            }}
            activeOpacity={0.85}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Tema personalizado"
          >
            <View style={styles.themeSwatch}>
              <View style={[styles.swatchHalf, { backgroundColor: previewTheme.colors.background }]} />
              <View style={[styles.swatchHalf, { backgroundColor: previewTheme.colors.primary }]} />
            </View>
            <Text style={[styles.themeName, css.text]} numberOfLines={1}>
              Personalizado
            </Text>
          </TouchableOpacity>
        </View>

        {mostrandoPicker ? (
          <CustomColorPicker
            primary={previewTheme.colors.primary}
            background={previewTheme.colors.background}
            onPrimaryChange={(hex) => setCustomPrimary(hex)}
            onBackgroundChange={(hex) => setCustomBackground(hex)}
          />
        ) : null}

        {!fundoValidoOuAtual ? (
          <Text style={[styles.aviso, { color: statusColors.danger }]}>
            Esse fundo não é claro e suave o bastante. Use um tom mais claro.
          </Text>
        ) : null}

        {/* Tamanho da fonte (P7) */}
        <Text style={[styles.sectionTitle, css.text]}>Tamanho do texto</Text>
        <View style={styles.fontRow}>
          {(['small', 'default', 'large'] as FontScale[]).map((escala) => {
            const ativo = selectedFontScale === escala;
            return (
              <TouchableOpacity
                key={escala}
                style={[styles.fontBtn, css.surface, ativo && styles.fontBtnAtivo]}
                onPress={() => escolherFonte(escala)}
                activeOpacity={0.85}
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Fonte ${escala}`}
                accessibilityState={{ selected: ativo }}
              >
                <Text style={[styles.fontBtnText, css.text, ativo && css.primary]}>
                  {escala === 'small' ? 'Pequeno' : escala === 'default' ? 'Padrão' : 'Grande'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Button variant="primary" onPress={aplicar} style={styles.applyBtn}>
            Aplicar tema
          </Button>
          <Button
            variant="outline"
            onPress={confirmarRestaurar}
            style={styles.resetBtn}
            iconLeft={<RotateCcw size={18} color={theme.colors.primary} />}
          >
            Restaurar padrão
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: statusColors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  topBarTitle: { ...typography.title2, flex: 1, minWidth: 0, flexShrink: 1, marginLeft: spacing.sm },
  topBarSpacer: { width: 44, height: 44, flexShrink: 0 },
  scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxxl },

  previewCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: statusColors.border,
  },
  previewAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewCopy: { flex: 1, minWidth: 0, gap: spacing.xxs },
  previewTitle: { ...typography.headline },
  previewSub: { ...typography.bodyRegular },
  previewBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    minHeight: 44,
    justifyContent: 'center',
    flexShrink: 0,
  },
  previewBtnText: { ...typography.label, fontWeight: '700' },

  sectionTitle: { ...typography.title2, marginTop: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  themeCard: {
    // `width: '30%'` é string — o gate de toque não consegue medir.
    // `minWidth: 100` + `flex: 1` dá 3 colunas em 360dp e mantém
    // a área de toque >= 44px (QA-3).
    flex: 1,
    minWidth: 100,
    flexShrink: 1,
    minHeight: 100,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: statusColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  themeCardAtivo: { borderWidth: 2 },
  themeSwatch: { flexDirection: 'row', width: '100%', height: 36, borderRadius: radius.md, overflow: 'hidden' },
  swatchHalf: { flex: 1 },
  checkBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: statusColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeName: { ...typography.label, textAlign: 'center', width: '100%' },
  aviso: { ...typography.bodyRegular, marginTop: spacing.sm },

  fontRow: { flexDirection: 'row', gap: spacing.sm },
  fontBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: statusColors.border,
    paddingHorizontal: spacing.sm,
  },
  fontBtnAtivo: { borderWidth: 2 },
  fontBtnText: { ...typography.label },

  footer: { gap: spacing.md, marginTop: spacing.xl },
  applyBtn: { minHeight: 48 },
  resetBtn: { minHeight: 48 },
});
