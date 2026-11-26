# 🔬 Auditoria da Esteira — Por que o defeito passou

> Análise do pipeline após o usuário reportar que o header da tela
> **Meus Pacientes** está quebrado (botão "Novo Paciente" saindo da tela).
>
> Objetivo: entender **por que a esteira não detectou**, não apenas corrigir
> o sintoma. Base: `de195eb` — esteira declarada 5/5 `[APROVADO]`.

---

## 1. O defeito

**Tela:** `/patients` (Meus Pacientes) — header
**Sintoma:** o botão "Novo Paciente" transborda a borda direita da tela
**Severidade:** **Alta** — a única ação de cadastro está parcialmente
inacessível em telas de 360–375pt de largura (Android corrente, iPhone SE).

### Causa raiz

O header é um `row` com `justifyContent: 'space-between'`:

```tsx
<View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
  <View>                                  {/* ← container do título */}
    <Text style={styles.headerTitle}>Meus Pacientes</Text>
    <Text style={styles.headerSubtitle}>Cadastro, edição e prontuário</Text>
  </View>
  <Button variant="primary" ...>Novo Paciente</Button>
</View>
```

O container do título **não tem `flexShrink` nem `minWidth: 0`**. Em RN, um
filho de row sem essas propriedades mantém o tamanho intrínseco do texto e
**não cede espaço** ao irmão. O `Button`, por sua vez, tem `paddingHorizontal:
16` + ícone + gap + texto — largura intrínseca ≈ 163px.

| Elemento | Largura |
|----------|---------|
| `paddingHorizontal` do header (20 × 2) | 40px |
| Subtítulo "Cadastro, edição e prontuário" @12px (o mais largo dos dois) | ≈ 175px |
| Botão "Novo Paciente" (padding 32 + ícone 18 + gap 8 + texto ≈105) | ≈ 163px |
| **Total necessário** | **≈ 378px** |
| **Largura disponível** (Android 360dp / iPhone SE 375pt) | 360–375px |

**Faltam 3–18px.** O botão estoura a borda direita.

> O `text: { flex: 1 }` do `Button` não salva: ele distribui o espaço
> *dentro* do botão, mas o botão em si não encolhe, porque o pai não cede.

### Agravante: o texto do botão nunca é encurtado

`Button` não tem `numberOfLines`, e `flex: 1` no texto **não** impede
transbordo quando o pai não encolhe. O resultado é o botão cortar pela
direita em vez de truncar.

---

## 2. Por que a esteira NÃO detectou — 4 falhas de processo

### FALHA 1 — O item do backlog que cobria o header ficou **fora** do escopo da etapa 3

No `PLANO.md`, o item **M1** (Média) descreve exatamente este problema:

> **M1 — Header da lista de pacientes** — usa `paddingTop: 52` fixo e
> `Button` "Novo Paciente" com texto; o botão é a única forma de cadastrar e
> fica longe do polegar.
> Critério: *"Header usa inset; a ação primária de cadastro é um botão
> circular no topo (44×44) **e** um FAB/`ActionTile` na thumb zone inferior;
> a lista continua com a mesma função."*

O planner **identificou o problema corretamente** e o classificou como
**Média** — mas o critério de aceite do M1 fala em *redesenhar* a ação
primária (botão circular + FAB), **não** em "o cabeçalho não pode
transbordar".

**Consequência:** a etapa 3 executou só os itens **Alta** (A1–A5). O M1
nunca foi implementado. Mas o defeito **não era do M1** — era um defeito de
**layout preexistente** que ninguém transformou em critério verificável.

> **Lição:** um item de backlog não é só o que foi implementado. É preciso
> um item explícito para "nenhum elemento transborda a largura da tela" —
> **transversal**, não por tela.

### FALHA 2 — A etapa 4 (QA) validou **critérios de aceite**, não **qualidade visual**

O `QA.md` da etapa 4 verificou A1–A5 item a item com grep/tsc/jest. Para
A5 (safe area), o critério era:

> *"nenhum `paddingTop` fixo maior que 24 permanece; nenhum conteúdo fica
> sob o notch ou a barra de gestos em nenhum aparelho testado"*

Duas coisas erradas nesse critério:

1. **"em nenhum aparelho testado"** — nenhum aparelho foi testado. A etapa
   4 rodou **zero** verificações no aparelho; tudo foi estático.
2. O critério é sobre **posição vertical** (notch/barrа de gestos). Não tem
   nada a ver com **transbordo horizontal** — que é o defeito real.

A etapa 4 foi honestamente marcada `[APROVADO]` porque **os critérios que
ela mesma escreveu estavam satisfeitos**. O problema é que os critérios
**não cobriam a classe de defeito**.

> **Lição:** o QA não pode ser apenas "checar o que foi pedido". Precisa de
> uma **lista de invariantes de UI** que valam para *toda* tela, revisada
> independentemente dos itens do backlog.

### FALHA 3 — Não existe **gate automático** para overflow

O pipeline tem gates fortes para código (`tsc`, `lint`, `jest`,
`coverageThreshold`), mas **nenhum** gate para layout.

Teste automatizado **não** teria pego isso: o RNTL não mede geometria.
`getByText('Novo Paciente')` confirma que o texto existe, não que ele cabe.

Faltou um gate barato que existe e foi ignorado:

```bash
# todo container que é filho de um row precisa poder encolher
grep -rn "flexDirection: 'row'" src/ | ...
```

Ou, mais simples e mais forte: **um teste de snapshot de layout com largura
fixa**. Com `react-native` + RNTL dá para renderizar com
`dimensions` fixas e comparar a posição dos filhos — o RNTL v14 expõe
`toHaveStyle` e o `onLayout`, mas não há assert de geometria pronta. O que
**existe** e é gratuito:

```bash
npx expo export --platform android   # gera o bundle de produção
```
Não valida layout, mas valida que nada quebra.

> **Lição:** a esteira precisa de um **gate de layout** — estático no
> mínimo. Sem ele, overflow só aparece quando alguém abre o app.

### FALHA 4 — A `mobile-designer` skill **não foi carregada** pela etapa 3

A skill existe em
`C:\Users\rbgor\.config\opencode\skills\skills-mobile\mobile-designer\SKILL.md`
(414 linhas) e tem uma seção inteira dedicada a React Native (§6). Mas:

- O `PLANO.md` **menciona** a skill (regras de `minWidth: 0`, `flexShrink`)
- A **etapa 3 (mobile-ui) nunca a carregou** — a.executei manualmente e usei
  apenas o `PLANO.md` como brief
- A skill, lida agora, **não tem** uma seção sobre transbordo horizontal
  em headers — mas tem as ferramentas certas (ergonomia, touch area,
  responsividade)

> **Lição:** a skill precisa ser **invocada explicitamente** por cada
> etapa que implementa UI, e não apenas citada em documento.

---

## 3. Diagnóstico da esteira

| Capacidade da esteira | Antes | Avaliação |
|---|---|---|
| Portões de qualidade de código (`tsc`, `lint`, `jest`, cobertura) | 7 telas protegidas | ✅ Sólida |
| Portão de **layout/UI** | ❌ inexistente | 🔴 **Lacuna crítica** |
| QA visual em aparelho | ❌ nunca executado | 🔴 **Lacuna crítica** |
| Critérios de aceite |cobrem só o backlog | 🟡 Parciais |
| Revisão de skill por etapa | ⚠️ só citada | 🟡 Fraca |
| Rastreabilidade item → commit | ✅ A1–A5 com hash | ✅ Boa |

**Veredito: a esteira é confiável em _código_ e frágil em _UI_.** O item
A2 (tokenização) provou que dá para ser rigoroso com refatoração mecânica;
mas o mesmo rigor **nunca foi aplicado ao espaço**.

---

## 4. Correções de processo propostas

### 4.1 Novo gate automático: `scripts/validate-layout.mjs`

Varredura estática que **falha o CI** quando encontra um filho de `row` sem
capacidade de encolher. Regras:

1. Todo `View` que é filho direto de um container `flexDirection: 'row'`
   **precisa** de `flexShrink: 1` **ou** `minWidth: 0` **ou** `flex: 1`.
2. Todo `Text` dentro de um `row` **precisa** de `numberOfLines` (ou o
   container pai precisa de `minWidth: 0`).
3. Nenhum `Button` com `children` textual dentro de um `row` sem
   `numberOfLines` no texto.

> Este é o **gate que teria pego o defeito hoje**: o container do título do
> header é filho de um `row` e não tem `flexShrink`/`minWidth: 0`.

### 4.2 Novo gate de build: `npm run validate:bundle`

```bash
npx expo export --platform android --output-dir .expo/validate
```
Valida que o bundle de produção compila — barato, roda no CI, e pega erro
de import/estilo que o `jest` não pega.

### 4.3 Etapa 4 passa a ter **duas** fases obrigatórias

| Fase | O que faz | Ferramenta |
|------|-----------|-----------|
| **4a — estática** | Critérios de aceite + invariantes de UI + gates | `tsc`, `lint`, `jest`, `validate-layout` |
| **4b — em aparelho** | Percorrer as 7 rotas em **2 larguras** (360dp e 430dp) e fotografar | aparelho do usuário / emulador |

**Regra nova:** se a fase 4b não foi executada, a etapa 4 é
`[PENDENTE]`, **jamais** `[APROVADO]`. O `QA.md` já tinha um roteiro de
verificação no aparelho — mas foi escrito como *instrução para o usuário*,
não como **gate da esteira**. Esse é o ponto que falhou.

### 4.4 Cada etapa de UI **carrega** a `mobile-designer`

Regra no `AGENTS.md`:

> Etapas que implementam ou revisam UI **devem** carregar a skill
> `mobile-designer` e registrar no documento de saída quais regras foram
> aplicadas.

### 4.5 Novo item de backlog **transversal**

> **T7 — Nenhum elemento transborda a largura da tela.**
> Em todas as 7 rotas, nenhum header, card ou linha pode ter conteúdo
> mais largo que a viewport. Passa pelo `validate-layout` e por inspeção
> visual em 360dp.

---

## 5. O que fazer com o defeito atual

**Correção imediata (etapa 3, ciclo 2):**

O header de `/patients` passa a ter:

```tsx
<View style={styles.header}>
  <View style={styles.headerIdentity}>      {/* flex: 1, minWidth: 0 */}
    <Text style={styles.headerTitle} numberOfLines={1}>Meus Pacientes</Text>
    <Text style={styles.headerSubtitle} numberOfLines={1}>Cadastro, edição e prontuário</Text>
  </View>
  <Button ... >Novo Paciente</Button>       {/* flexShrink: 0 */}
</View>
```

com o botão encolhendo (`flexShrink: 0` + `numberOfLines={1}` no texto) e o
título cedendo espaço.

**Mas o ponto não é só este header.** A auditoria deve varrer **os outros
6 headers** pelo mesmo critério — `reports.tsx` tem o **mesmo** padrão
(`title` + `Button` "Novo Relatório" em row) e provavelmente **o mesmo
defeito**.

---

## 6. Veredito

| Etapa | Antes | Correto |
|-------|-------|---------|
| 1 planner | `[APROVADO]` | ✅ Correto — identificou o M1, mas **não** o classificou como de layout |
| 2 architect | `[APROVADO]` | ⚠️ Parcial — não previu o gate de layout |
| 3 mobile-ui | `[APROVADO]` | 🔴 **Devia ter sido REPROVADO** — introduziu/preservou o transbordo sem verificar |
| 4 qa-vision | `[APROVADO]` | 🔴 **Devia ter sido REPROVADO** — validou critérios incompletos e nunca olhou a tela |
| 5 release-prep | `[APROVADO]` | ✅ Correto — escopo era config/build |

**A esteira não é confiável em UI no estado atual.** O `WORKFLOW_STATE.md`
deve voltar a registrar as etapas 3 e 4 como `[REPROVADO]`, com este
relatório como justificativa, até que o gate de layout exista e a fase 4b
seja executada.

---

Última atualização: Auditoria pós-defeito — 2026-11-26.
