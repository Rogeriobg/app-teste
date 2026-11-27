# 🔬 Análise — Etapa 6: Temas e Aparência

> Análise de viabilidade da proposta recebida, antes de incluí-la no
> `PLANO.md`. Base: projeto no commit `c378cdb` — 5/5 etapas `[APROVADO]`,
> gate de release **DESBLOQUEADO**, 129 testes e 5 gates automáticos.

---

## Veredito

**Viável — com 6 correções obrigatórias antes de entrar na esteira.**

A proposta está bem estruturada (presets, prévia, limites, gates e riscos),
mas contém **conflitos com o ambiente real do projeto** que fariam a
implementação falhar ou ser impossível de validar no celular.

---

## ✂️ Decisão do produto (2026-11-27): tema escuro FORA do escopo

O usuário decidiu **remover o preset "Noite Aconchegante"** da Etapa 6.
A recomendação técnica é **aprovar** — foi exatamente a única parte que não
podia ser verificada no ambiente dele (Expo Go + build manual).

### Impacto da remoção

| Item | Antes | Depois |
|---|---|---|
| Presets | 5 | **4** (todos claros) |
| `app.json` `userInterfaceStyle` | `automatic` + `Appearance.setColorScheme` | **continua `light`** ✅ |
| Risco R13 (sistema sobrescrever tema) | presente | **eliminado** |
| StatusBar (P5) | dinâmica por preset | **fixa** em `style="dark"` — trivial |
| Flash na abertura (P3) | dependia de build release para validar | frame claro sobre fundo claro → **imperceptível** |
| Pares de contraste (P4) | 5 presets × 3 pares | 4 presets × 3 pares, todos ✅ |
| Splash com variante `dark` | necessária | **desnecessária** |

### Contraste dos 4 presets restantes (recalculado)

| Preset | Texto/superfície | Primária/superfície | Veredito |
|---|---|---|---|
| Acolhimento | 14,11:1 | 4,82:1 | ✅ |
| Jardim Calmo (`#567C61`) | 13,80:1 | 4,72:1 | ✅ |
| Terracota Suave (`#A85F4B`) | 14,31:1 | 4,77:1 | ✅ |
| Brisa Serena | 14,44:1 | 4,61:1 | ✅ |

### ⚠️ Consequência obrigatória

O seletor **Personalizado (P8) deve ser restrito a fundos claros suaves**.
Sem isso o tema escuro volta pelo seletor, trazendo de volta o splash, o
`setColorScheme` e a StatusBar dinâmica que acabamos de eliminar.

**As 6 correções abaixo seguem válidas**, exceto a #5 (`Appearance.setColorScheme`)
que deixa de existir — `userInterfaceStyle` permanece `light`.

---

## ✅ O que está correto na proposta

| Decisão | Avaliação |
|---|---|
| Estender `tokens.ts`, não substituir | ✅ Correto — preserva o design system e os gates existentes |
| Presets curados/dessaturados | ✅ Coerente com o produto (psicólogo, calma) |
| Prévia antes de aplicar | ✅ Evita aplicar tema indesejado; bom padrão |
| Personalização limitada | ✅ Impede combinações ilegíveis |
| Fonte como acessibilidade | ✅ Correto — não é enfeite |
| `onPrimary` calculado por luminância | ✅ Já temos `contrast.ts` equivalent no gate; reutilizar |
| StatusBar dinâmico | ✅ Necessário para o preset Noite |
| Riscos R7–R10 mapeados | ✅ R7 e R9 confirmados pela análise abaixo |
| Rota a rota com gate | ⚠️ Ajustar (ver item 5) |

---

## 🔴 Correções obrigatórias

### 1. D1 — `react-native-mmkv` **não é viável** neste projeto

**Dado:** `react-native-mmkv` **não está instalado** e é módulo nativo.

**Conflito:** o usuário testa **no Expo Go** (`npx expo start --go`). MMKV
exige dev build (`expo run:android` / `eas build --profile development`).
Adotá-lo impediria você de testar a feature — e o build é manual por decisão
explícita.

**Decisão:** **usar AsyncStorage + `SplashScreen.preventAutoHideAsync()`**.
AsyncStorage já está instalado, é mockado nos testes e mantém o app
local-first como o resto do projeto.

**Confirmação na doc do SDK 58:** `SplashScreen.preventAutoHideAsync()`
deve ser chamado em **escopo global** (não dentro de componente), e
`SplashScreen.hide()` é o método atual (SDK 52+). Padrão:

```tsx
// _layout.tsx (escopo global, sem await)
import * as SplashScreen from 'expo-splash-screen';
SplashScreen.preventAutoHideAsync();

// no provider, após carregar o tema:
await SplashScreen.hideAsync();
```

⚠️ **Limitação documentada:** desde o SDK 52 o Expo Go **não reproduz
fielmente a splash nativa** (mostra o ícone). O "sem flash" precisará ser
confirmado em build release — registrar como ressalva da fase 4c.

---

### 2. D2 — `reanimated-color-picker` é viável, mas precisa de verificação

**Dado:** `reanimated-color-picker` **não está instalado**, porém
`react-native-reanimated@4.8.0` e `react-native-gesture-handler@3.5.0`
**já estão**. A lib é pure-JS sobre essas duas — deve funcionar no Expo Go
porque ambas já fazem parte do runtime.

**Ação:** instalar com `npx expo install reanimated-color-picker` (regra do
`AGENTS.md`) e validar no aparelho **antes** de implementar P8. Se falhar,
plano B: seletor próprio com `Slider` + swatches (sem dependência nova).

---

### 3. Presets — **2 falham contraste AA** (confirmado por cálculo WCAG)

Rodei o cálculo da própria proposta **original** nos 5 presets (incluindo
o Noite, depois removido do escopo):

| Preset | Texto/superfície | Primária/superfície | Veredito |
|---|---|---|---|
| Acolhimento | 14,11:1 | 4,82:1 | ✅ |
| **Jardim Calmo** | 13,80:1 | **4,35:1** | ❌ abaixo de 4,5 |
| **Terracota Suave** | 14,31:1 | **3,38:1** | ❌ bem abaixo |
| Brisa Serena | 14,44:1 | 4,61:1 | ✅ |
| Noite Aconchegante | 13,82:1 | 5,76:1 | ✅ |

O R7 está **correto e é pior do que diz**: Terracota em 3,38:1 (não ~3,6).
`getReadableTextColor` resolve o texto **dentro do botão** (escolhe preto →
6,21:1), **mas não resolve** a primária usada como texto/link sobre a
superfície.

**Correção:** ajustar as primárias no `presets.ts`:

| Preset | De | Para | Novo contraste |
|---|---|---|---|
| Jardim Calmo | `#5B8266` | `#567C61` | **4,72:1** ✅ |
| Terracota Suave | `#C07A65` | `#A85F4B` | **4,77:1** ✅ |

Mantêm a sensação (verde equilibrado, terracota quente) e passam AA.

---

### 4. `ThemeColors.statusBar` usa o tipo errado

A proposta define `statusBar: 'dark-content' | 'light-content'` (nomenclatura
do React Native). O `expo-status-bar@58` usa:

```ts
export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';
```

**Correção:** tipar como `StatusBarStyle` importado de `expo-status-bar`, ou
usar `'light' | 'dark'` diretamente. `'light-content'` causaria erro de TS.

---

### 5. `userInterfaceStyle` — ~~`automatic` + `setColorScheme`~~ **resolvido**

Com a saída do tema escuro, `app.json` **continua `userInterfaceStyle: light`**.
Não há mais necessidade de `Appearance.setColorScheme`, nem de variante
`dark` no plugin do splash. (O problema original estava descrito aqui; a
decisão de produto o eliminou.)

---

### 6. Gates existentes precisam evoluir (senão P2 quebra o CI)

| Gate | Impacto da etapa 6 | Ação |
|---|---|---|
| `validate-contrast.mjs` | Hoje **hardcoded em branco** (`#FFFFFF`) | Estender para validar cada preset contra **seu próprio** `background`/`surface`, e `onPrimary` contra `primary` |
| `validate-layout.mjs` | Seguro **se** layout continuar em `StyleSheet.create` | Manter `flexShrink`/`minWidth`/`flexDirection` estáticos; só cores viram runtime |
| `validate-touch-targets.mjs` | Mesmo acima | Idem |
| `validate-layout` para P7 (fonte Grande) | Gate estático **não mede** fonte maior | Extensão da fase 4b: injetar 3 escalas em 360/430 e medir no DOM |

**Restrição arquitetural a registrar:** nunca converter `StyleSheet.create`
em `createStyles(theme)` com objetos dinâmicos — os 3 gates leem estilos
estáticos. Padrão obrigatório:

```tsx
<View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
```

---

## 🟡 Ajustes de escopo (não bloqueiam)

### P2 — "rota a rota" precisa virar "componente a componente"

Existem **21 componentes compartilhados**. Migrar um componente afeta
**todas** as rotas que o usam de uma vez. A ordem correta é:

1. `tokens.ts` + `ThemeContext` (P1)
2. Componentes base: `Button`, `Input`, `Card`, `Modal`, `Chip`, `StatusBadge`, `AppModal`
3. Componentes de dados: `StatCard`, `StatSummary`, `ActionTile`, `PatientFormModal`
4. Rotas (7), verificando ao final de cada grupo

### P6 — prévia exige "ThemeScope"

Se o `ThemeProvider` for global, tocar num tema na tela mudaria **o app
inteiro**, violando "só muda ao aplicar". A prévia precisa de um escopo
local:

```tsx
<ThemeScope value={previewTheme}>
  <PreviewCard />
</ThemeScope>
```

`ThemeScope` é um provider filho que faz override do tema **apenas** na
subárvore da prévia. Incluir no P1.

### R10 — cobertura

Adicionar ao `coverageThreshold`: `src/theme/*`, `src/app/appearance.tsx`.
Já existe piso para 7 telas; estender sem rebaixar.

---

## 📋 Pipeline preparado

A "Etapa 6" **não é um 6º agente** — é um novo **ciclo da esteira**, com as
mesmas 5 etapas (planner → architect → mobile-ui → qa-vision →
release-prep), exatamente como o texto da proposta descreve.

O estado atual (ciclo 1) fica **intacto no histórico**. Criei o **Ciclo 2**
no `WORKFLOW_STATE.md` com as 5 etapas `[PENDENTE]`, pronto para o architect
fechar D1–D3 com as decisões acima.

### Ordem recomendada (architect)

```
P1 (base) → P4 (contraste) → P2 (migração) → P3 (sem flash)
→ P5 (StatusBar) → P7 (fonte) → P6 (tela) → P8 (personalizado) → P9 (restaurar)
```

P4 vem antes de P2 para que a migração já use `onPrimary` calculado e os
presets corrigidos — não migra para cor que depois muda.

### Gates do ciclo 2

| Gate | Status |
|---|---|
| `validate:contrast` estendido (presets × fundos × onPrimary) | A criar |
| `validate:layout` (360/430, 3 escalas de fonte) | A estender |
| `validate:touch` | ✅ existe |
| Fase 4c - 4 presets × 3 fontes no aparelho | A executar |

---

## ⚠️ Ressalva final

Mesmo com tudo isso, há **um ponto que só o aparelho responde**: a ausência
de flash na abertura com tema escuro salvo. O Expo Go não reproduz a splash
nativa (doc oficial SDK 58). Isso fica registrado como limitação da fase 4c
e exigirá um build release para confirmação definitiva.

---

Última atualização: 2026-11-27 — análise prévia à inclusão no `PLANO.md`.
