# 🏗️ Arquitetura — Etapa 6: Temas e Aparência (Ciclo 2)

> Etapa 2 (architect) do Ciclo 2. Fecha D1–D3 e define a implementação de
> P1–P9. Base: `PLANO.md` (Etapa 6), `ANALISE-ETAPA6.md`, planner aprovado.
>
> Projeto: Expo SDK 58 · RN 0.88 · React 19 · 8 rotas · 21 componentes ·
> 129 testes · 5 gates automáticos.

---

## 1. Decisões D1–D3 (fechadas)

### D1 — Persistência: **AsyncStorage + SplashScreen**

| Critério | MMKV (proposta original) | **AsyncStorage (escolhido)** |
|---|---|---|
| Instalado | ❌ não | ✅ `2.2.0` |
| Módulo nativo | ✅ sim | ❌ não |
| Funciona no Expo Go | ❌ exige dev build | ✅ sim |
| CNG / build manual | exigiria plugin | ✅ zero mudança nativa |
| Read síncrono | ✅ | ❌ (assíncrono) |

**Como eliminar o flash sem leitura síncrona:** segurar a splash até o tema
carregar.

```tsx
// src/app/_layout.tsx — ESCOPO GLOBAL, sem await (doc SDK 58)
import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>          {/* carrega o tema async */}
      <AppProvider>
        <Stack>...</Stack>
      </AppProvider>
    </ThemeProvider>
  );
}
```

Dentro de `ThemeProvider`, um `useEffect` faz `loadTheme()` e, no `finally`,
chama `SplashScreen.hideAsync()`. O provider renderiza `null` enquanto
`!ready`, então a primeira农民tela visível **já está com o tema correto**.

> **Ressalva documentada:** Expo Go não reproduz a splash nativa (SDK 52+).
> No Expo Go o usuário vê o ícone; a validação do "sem flash" em build
> release fica registrada na fase 4c.

**Chave de storage:** `@psi_app_theme_v1` (padrão `@psi_app_*` do projeto).
**Formato:** `{ presetId: string; custom?: { primary?: string; background?: string }; fontScale: FontScale }`.

---

### D2 — Seletor de cor: **instalar e validar, com plano B**

Pesquisa no registry (2026-11-27): `reanimated-color-picker@5.2.0` é
**"A Pure JavaScript Color Picker"**.

| Peer | Exigido | Temos | Status |
|---|---|---|---|
| expo | ≥44 | 58 | ✅ |
| react-native-reanimated | ≥2 | 4.8.0 | ✅ |
| react-native-gesture-handler | ≥2 | 3.5.0 | ✅ |

**Decisão:** instalar com `npx expo install reanimated-color-picker` (regra do
`AGENTS.md`) e validar no aparelho **antes** do P8. Não instalar agora — a
etapa 3 instala quando chegar ao marco M4.

**Plano B:** se falhar, seletor próprio com `Slider` + 8 swatches curados
(sem dependência nova). Critério de aceite do P8 continua o mesmo.

---

### D3 — Escopo da migração: **componente a componente**

A proposta dizia "rota a rota", mas 21 componentes são compartilhados —
migrar um afeta várias rotas de uma vez. Ordem real:

```
1. Fundação:  tokens.ts (manter) + presets.ts + types.ts + contrast.ts
              + storage.ts + context.tsx + ThemeScope
2. Base:      Button, Input, Card, Modal, Chip, StatusBadge, AppModal
3. Dados:     StatCard, StatSummary, ActionTile, PatientFormModal
4. Rotas:     8 telas (verificando ao final de cada uma)
```

**Depois de cada grupo:** `npm run validate:layout`, `validate:touch`,
`validate:contrast` + `tsc` + `lint`. Se qualquer gate falhar, corrige
antes de avançar.

---

## 2. Estrutura de arquivos

```
src/theme/
  tokens.ts        ← existente: escalas, raios, sombras, cores de STATUS
  presets.ts       ← NOVO: 4 presets (única exceção de hex literal)
  types.ts         ← NOVO: Theme, ThemeColors, FontScale, ThemeState
  contrast.ts      ← NOVO: luminance, contrastRatio, getReadableTextColor
  storage.ts       ← NOVO: loadTheme, saveTheme (AsyncStorage)
  context.tsx      ← NOVO: ThemeProvider, useTheme, ThemeScope
  font.ts          ← NOVO: escala tipográfica com fontScale
```

**`tokens.ts` permanece como fonte de escalas e cores de status.** Os presets
trocam só: `background`, `surface`, `primary`, `onPrimary`, `text`,
`textSecondary`. Status (`success/warning/danger/info`) **não** muda.

---

## 3. Tipos (`types.ts`)

```ts
import type { StatusBarStyle } from 'expo-status-bar';

export type FontScale = 'small' | 'default' | 'large';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  onPrimary: string;   // calculado por getReadableTextColor
  text: string;
  textSecondary: string;
  statusBar: StatusBarStyle;  // 'dark' nos 4 presets (dark-content)
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface ThemeState {
  presetId: string;
  custom?: {
    primary?: string;
    background?: string;
  };
  fontScale: FontScale;
}
```

> `statusBar` usa `StatusBarStyle` do `expo-status-bar@58`
> (`'auto'|'inverted'|'light'|'dark'`). Com 4 presets claros, sempre `'dark'`.

---

## 4. Contraste (`contrast.ts`)

Mover a implementação já validada de `scripts/validate-contrast.mjs` para
código de produção (mesma matemática WCAG 2.1, sem divergência):

```ts
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return 0.2126 * channel((n >> 16) & 255)
       + 0.7152 * channel((n >> 8) & 255)
       + 0.0722 * channel(n & 255);
};

export const contrastRatio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

export const getReadableTextColor = (bg: string) => {
  const branco = contrastRatio(bg, '#FFFFFF');
  const preto = contrastRatio(bg, '#000000');
  return branco >= preto ? '#FFFFFF' : '#000000';
};
```

**Propriedade matemática:** para qualquer cor `bg`, `max(cr(bg,branco),
cr(bg,preto)) ≥ 4,5`. Sempre existe um `onPrimary` legível — nunca é
necessário recusar uma cor primária por causa do texto do botão.

### Validação de fundo claro suave (DP2 / R14)

```ts
export const isSoftLightBackground = (hex: string) =>
  luminance(hex) >= 0.6 && saturacaoHSL(hex) <= 0.25;
```

O seletor do P8 usa essa função para **bloquear** fundos escuros/vibrantes
antes de aplicar. Regra do planner convertida em código.

---

## 5. Presets (`presets.ts`)

4 temas, com as correções de contraste do planner:

```ts
export const PRESETS: Theme[] = [
  { id: 'acolhimento', name: 'Acolhimento', colors: {
      background: '#FAF8F5', surface: '#FFFFFF', primary: '#7C6A96',
      text: '#2D2A32', textSecondary: '#64748B', statusBar: 'dark' } },
  { id: 'jardim', name: 'Jardim Calmo', colors: {
      background: '#F4F7F4', surface: '#FFFFFF', primary: '#567C61',
      text: '#233026', textSecondary: '#64748B', statusBar: 'dark' } },
  { id: 'terracota', name: 'Terracota Suave', colors: {
      background: '#FDF6F3', surface: '#FFFFFF', primary: '#A85F4B',
      text: '#382621', textSecondary: '#64748B', statusBar: 'dark' } },
  { id: 'brisa', name: 'Brisa Serena', colors: {
      background: '#F3F7FA', surface: '#FFFFFF', primary: '#527999',
      text: '#1E2B36', textSecondary: '#64748B', statusBar: 'dark' } },
];
```

`onPrimary` **não é gravado**: é derivado em `ThemeProvider` com
`getReadableTextColor(colors.primary)`. Assim, uma cor personalizada nunca
fica com texto ilegível.

---

## 6. Context (`context.tsx`)

```ts
interface ThemeContextValue {
  theme: Theme;
  fontScale: FontScale;
  setPreset: (id: string) => void;
  setCustom: (partial: ThemeState['custom']) => void;
  setFontScale: (scale: FontScale) => void;
  resetTheme: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({} as ThemeContextValue);

export function ThemeProvider({ children }) { ... }
export const useTheme = () => useContext(ThemeContext);
```

### `ThemeScope` — prévia isolada (P6)

```tsx
export function ThemeScope({
  theme, fontScale, children
}: { theme: Theme; fontScale: FontScale; children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ theme, fontScale, /* setters no-op */ }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

A prévia usa `ThemeScope` com `previewTheme`. O resto da tela continua no
tema aplicado. **Ação de aplicar** chama `setPreset`/`setCustom` no provider
global — só nesse momento o app inteiro muda.

### Regra de ouro dos gates

```tsx
// ✅ CORRETO: layout estático no StyleSheet, cor dinâmica no array
<View style={[styles.card, { backgroundColor: theme.colors.surface }]} />

// ❌ PROIBIDO: quebra validate:layout / validate:touch / validate:contrast
const styles = createStyles(theme);
```

---

## 7. Tipografia com fontScale (`font.ts`)

```ts
export const FONT_SCALE: Record<FontScale, number> = {
  small: 0.9,
  default: 1,
  large: 1.125,
};

export const scaled = (base: TextStyle, scale: FontScale): TextStyle => ({
  ...base,
  fontSize: Math.round((base.fontSize ?? 14) * FONT_SCALE[scale]),
  lineHeight: base.lineHeight
    ? Math.round(base.lineHeight * FONT_SCALE[scale])
    : undefined,
});
```

Uso: `style={[scaled(styles.body, fontScale), { color: theme.colors.text }]}`.

> Componentes que já usam `numberOfLines` e `minWidth: 0` (ciclo 1) não
> transbordam com 1,125×. Ainda assim, P7 exige medição DOM em 360/430 —
> gate estático não mede fonte.

---

## 8. StatusBar

`StatusBar` principal do app, no `RootLayout`, lendo `theme.colors.statusBar`:

```tsx
<StatusBar style={theme.colors.statusBar} />
```

Com 4 presets claros, sempre `'dark'`. P5 vira uma **assertiva estática**
(verificada no teste e no preset), não lógica condicional.

---

## 9. Evolução dos gates

| Gate | Mudança | Quando |
|---|---|---|
| `validate-contrast.mjs` | Extrair `luminance`/`contrastRatio` de `src/theme/contrast.ts` (mesma matemática) e validar: 4 presets × `background` × `surface` × `primary`, `onPrimary` derivado, e `isSoftLightBackground` nos presets | P4 |
| `validate:layout.mjs` | Nenhuma mudança de código — mas **adicionar** medição DOM com 3 fontScales em 360/430 (script novo `scripts/measure-font-scales.mjs`, padrão da fase 4b) | P7 |
| `validate:touch.mjs` | Nenhuma — reutilizar | — |
| `coverageThreshold` | Incluir `src/theme/*` e `src/app/appearance.tsx` sem rebaixar os pisos atuais | P1 |
| `validate:workflow.mjs` | Nenhuma | — |

**CI:** adicionar `npm run validate:contrast` já existe; só o script muda.

---

## 10. Ordem de execução (architect)

```
P1  ThemeContext + presets + types + contrast + storage + font + ThemeScope
    → gate coverage
P4  mover contrast.ts para produção + validar 4 presets + onPrimary
    → gate validate:contrast (novo comportamento)
P2  migração: fundação → base (7 comp) → dados (4 comp) → 8 rotas
    → validate:layout + touch + contrast a cada grupo
P3  SplashScreen + AsyncStorage + loadTheme no provider
    → teste de tema persistido sem frame errado
P5  StatusBar fixa no RootLayout
P7  font.ts + aplicar em todos os textos
    → measure-font-scales (360/430)
P6  /appearance + ThemeScope + entrada no /profile (44px + haptic)
P8  reanimated-color-picker (com D2 validado no aparelho antes)
P9  restaurar padrão com confirmação
```

---

## 11. Riscos técnicos desta arquitetura

| # | Risco | Mitigação |
|---|---|---|
| **A1** | AsyncStorage é assíncrono — Providers do Expo Router montam antes do tema | `ready` gate no ThemeProvider + splash segurada; `null` até carregar |
| **A2** | `ThemeScope` com setters no-op pode mascarar bug se prévia chamar setter | Tipar prévia com `Readonly<ThemeContextValue>`; setters explícitos que avisam em dev |
| **A3** | `presets.ts` com hex literal quebra regra do planner | Exceção explícita já registrada; `validate-contrast` lê presets e valida |
| **A4** | `fontScale` 1,125 em headers longos ("Relatórios de ...") | `numberOfLines` + `minWidth: 0` (já aplicados no ciclo 1) + medição DOM |
| **A5** | Migração esquecer um componente e deixar cor fixa | `grep` de `colors.` em componentes migrados + gate de contraste |
| **A6** | Substituir `tokens.ts` quebra as 7 telas atuais | `tokens.ts` intocado; presets só adicionam camada |

---

## 12. Definition of Done do marco M1

- [ ] `npx tsc --noEmit` 0 erros
- [ ] `npx expo lint` 0 erros/0 warnings
- [ ] `npm run validate:contrast` válido com os 4 presets
- [ ] `npm run validate:layout` e `validate:touch` válidos
- [ ] Teste unitário: troca de preset, restauração, `onPrimary` calculado
- [ ] `coverageThreshold` inclui `src/theme/*`
- [ ] Splash não mostra tema errado (verificado no aparelho — ressalva Expo Go)

---

Última atualização: Etapa 2 (architect), Ciclo 2 — 2026-11-27.
