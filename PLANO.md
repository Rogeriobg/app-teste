# 📐 Plano de Produto & Design — PsiApp / PsiWave

> Fonte de escopo da esteira (etapas 1–5). Substitui o `BACKLOG.md` removido.
> Expo SDK 58 · React Native 0.88 · React 19 · TypeScript · AsyncStorage · Expo Router.
> Design system: BoardUI portado para `StyleSheet` em `src/theme/tokens.ts`.

---

## 🎯 Visão do produto

O PsiApp é o **caderno de trabalho digital do psicólogo**, offline por padrão: o
profissional cadastra pacientes, mantém o prontuário de cada um e exporta o
material quando precisa. O produto compete com a folha de papel e o bloco de
anotações — não com um sistema hospitalar. Isso define três decisões que valem
para todas as telas:

1. **Um toque, uma decisão.** Ações destrutivas nunca são o caminho padrão;
   ficam no fim da hierarquia e sempre pedem confirmação.
2. **O dado do paciente vem antes da ferramenta.** Nome, status e contato
   ocupam o topo da tela; prontuário e ações vêm depois.
3. **Privacidade por padrão.** Tudo fica no dispositivo, sem rede. A exportação
   é manual e explícita.

### O usuário real

- **Psicólogo clínico** atendendo 20–80 pacientes, com 3–8 sessões por semana.
- Usa o celular **entre/atendimentos**, muitas vezes com uma mão só.
- Não é usuário técnico: precisa que o app "funcione e não tenha dúvida".

---

## 📱 Inventário de telas e estados

| Rota | Tela | Estados cobertos | Estados **faltando** |
|------|------|------------------|----------------------|
| `/login` | Acesso por e-mail | carregando, erro de credencial | — |
| `/dashboard` | Visão geral do consultório | vazio (sem paciente ativo) | — |
| `/patients` | Lista de pacientes | busca, 4 filtros, vazio, modal cadastro/edição | — |
| `/patients/[id]/details` | Prontuário do paciente | vazio, hero, resumo, ações, modal registro | — |
| `/patients/[id]/reports` | Sessões do paciente | vazio, ativos, arquivados, modal | — |
| `/patients/[id]/export-pdf` | Exportação PDF | carregando,分享, erro, paciente inexistente | — |
| `/profile` | Perfil do psicólogo | salvar, exportar JSON, sair | — |

**Total: 7 rotas, 21 componentes de UI** (`src/components/`), **2 telas** com
`SafeAreaView` e as demais com `useSafeAreaInsets` — ver item A5.

---

## 🎨 Direção de design

### Fundamento já portado (não redesenhar)

`src/theme/tokens.ts` é a fonte única de verdade. Já contém:

- **Raios** — `md 6 · sm 8 · lg 12 · xl 16 · xxl 20 · pill`
- **Espaçamentos** — escala de 4px (`xxs 2` → `xxxl 24`)
- **Cores semânticas** — `surface · card · cardInner · tile · border · separator`
  e as famílias `brand / success / warning / danger / muted / info`, cada uma com
  trio `base / soft / border`
- **Sombras** — `shadowCard` (padrão) e `shadowRaised` (destaque)
- **Tipografia** — `display · title1 · title2 · headline · body · bodyRegular · label · caption`

### Regras que a esteira deve respeitar

1. **Zero valor literal novo.** Toda cor, raio, espaçamento e peso de fonte
   novo vem dos tokens. Onde hoje existe literal (`'#0D9488'`, `'#FFFFFF'`),
   migrar para `tokens`.
2. **Escala tipográfica para hierarquia**, não para decorative. Um `headline`
   por bloco; nada de `title2` dentro de `title1`.
3. **Áreas de toque ≥ 44×44 px.** Todo `TouchableOpacity` interativo.
4. **Truncamento explícito.** Todo texto em row que pode crescer recebe
   `numberOfLines` + `minWidth: 0` + `flexShrink: 1` — o bug de layout mobile
   já visto 3 vezes nesta sprint não pode voltar.
5. **Hierarquia por cor, não por peso.** `textPrimary` para o dado que importa,
   `textSecondary`/`textTertiary` para metadado. `textTertiary` nunca carrega
   uma ação.
6. **Sem `flex: 1` em row sem `minWidth: 0`.** Regra técnica herdada do
   RN: sem isso o texto quebra caractere a caractere.
7. **Confirmação para toda ação destrutiva** (excluir, arquivar em lote).
8. **Haptic em ação destrutiva e em sucesso** (`expo-haptics`), nunca em scroll.

### Não-objetivos

- **Dark mode** — ~~não é prioridade da v1~~ **movido para a Etapa 6**
  (ciclo 2 da esteira), apenas como preset "Noite Aconchegante", sem seguir
  o tema do sistema na v1. Ver `ANALISE-ETAPA6.md`.
- **Multi-perfil** (equipe, supervisão) — só `role: 'psicologo'` existe.
- **Sincronização em nuvem / servidor** — o produto é local-first.
- **Notificações push / lembretes de sessão** — fora do escopo da v1.
- **Prontuário compartilhado com o paciente** — não existe na v1.
- **Reescrever o design system do zero** — o BoardUI já está portado.

---

## 📋 Backlog priorizado

> Cada item tem critério de aceite verificável. `A` = Alta, `M` = Média, `B` = Baixa.

### 🔴 Alta — travam a versão 1.0

| # | Item | Critério de aceite | Status |
|---|------|--------------------|--------|
| **A1** | **Editar paciente funcional** — hoje o modal de "Editar paciente" na tela de detalhes tem `onChangeText` vazio (`/* edição de paciente futura */`) e o botão "Salvar Alterações" chama `handleSaveRecord`, que valida título/conteúdo de prontuário. O usuário **não consegue editar os dados de um paciente por esse caminho**. | Editar nome, e-mail, telefone, data de nascimento e anamnese na tela de detalhes persiste no `AppContext`; `updatePatient` é chamado com os dados novos; toast/alerta de sucesso; teste automatizado cobrindo salvar e cancelar. | ✅ `88419e1` |
| **A2** | **Tokenização completa** — `login.tsx`, `profile.tsx`, `patients.tsx`, `reports.tsx`, `export-pdf.tsx`, `details.tsx` e todos os componentes (`Button`, `Input`, `Modal`, `StatusBadge`, `Chip`) usam hex literais em vez de `src/theme/tokens.ts`. | Nenhum hex literal fora de `src/theme/tokens.ts` (exceto `app.json`/`export-pdf` HTML); `grep` de `#` no `src/` retorna apenas o arquivo de tokens; `tsc` e `lint` limpos. | ✅ `37e40fd` |
| **A3** | **Busca por telefone** — a busca filtra só por nome e e-mail, mas o telefone é exibido em todas as telas. | A busca encontra por nome, e-mail **ou** telefone; teste automatizado para os três campos. | ✅ `5643eb8` |
| **A4** | **Estado vazio da busca** — quando um filtro/busca não encontra ninguém, a mensagem diz "Nenhum paciente neste filtro" e não diz **por quê**. | A mensagem distingue "nenhum paciente cadastrado" de "nenhum resultado para «termo»" e oferece limpar a busca quando há termo ativo. | ✅ `5643eb8` |
| **A5** | **Safe area inconsistente** — `profile.tsx` e `details.tsx` usam `SafeAreaView`; `login.tsx` usa `paddingTop: 40` fixo; `patients.tsx` usa `paddingTop: 52` fixo; `reports.tsx` e `export-pdf.tsx` não aplicam inset nenhum. | Todas as 7 rotas aplicam `useSafeAreaInsets()`; nenhum `paddingTop` fixo maior que 24 permanece; nenhum conteúdo fica sob o notch ou a barra de gestos em nenhum aparelho testado. | ✅ `fd9ae31` |

### 🟡 Média — qualidade do produto

| # | Item | Critério de aceite | Status |
|---|------|--------------------|--------|
| **T7** | **Nenhum elemento transbordar a largura da tela** — *transversal, vale para todas as rotas*. Em 41 containers `row` de 11 arquivos havia filhos que não podiam encolher (o container do título do header de `/patients` era o caso reportado: o botão "Novo Paciente" saía da tela em 360–375pt). | `npm run validate:layout` retorna VÁLIDO; nenhum header, card ou linha tem conteúdo mais largo que a viewport; conferido visualmente em 360dp e 430dp. | ✅ Ciclo 2 |
| **M1** | **Header da lista de pacientes** — usa `paddingTop: 52` fixo e `Button` "Novo Paciente" com texto; o botão é a única forma de cadastrar e fica longe do polegar. | Header usa inset; a ação primária de cadastro é um botão circular no topo (44×44) **e** um FAB/`ActionTile` na thumb zone inferior; a lista continua com a mesma função. | Parcial — o T7 resolveu o transbordo; falta a ação na thumb zone |
| **M2** | **Ordenação da lista** — pacientes saem na ordem de inserção, sem opção de ordenar. | Ordenação por nome (alfabética), por mais recente e por mais antigo, com controle acessível; a escolha persiste entre navegações. | Aberto |
| **M3** | **Duplicidade de prontuário** — a tela de detalhes e a de relatórios (`/patients/[id]/reports`) mantêm **duas** listas de prontuários do mesmo paciente, com CRUD duplicado. | Uma das duas telas passa a ser a fonte única (recomendado: `details`), e a outra redireciona para ela; nenhum prontuário aparece em dois lugares diferentes. | Aberto |
| **M4** | **Contagem de prontuários no card do paciente** — o card da lista não mostra quantos prontuários o paciente tem. | O card mostra a contagem (ex.: "3 prontuários") com ícone; item visual do card, sem tocar no layout de 4 linhas já aprovado. | Aberto |
| **M5** | **Data de nascimento sem máscara/validação** — o `DateTimePicker` grava `AAAA-MM-DD` cru, e o campo aceita qualquer texto. | Data válida e formatada (`DD/MM/AAAA`) na exibição e na gravação; o picker abre o calendário em vez de um campo de texto livre; idade calculada e exibida no hero do paciente. | Aberto |
| **M6** | **Estado vazio da tela de prontuários** — o texto "Nenhum prontuário cadastrado" não diferencia "paciente sem prontuário" de "filtro sem resultado". | Mensagem contextual + ação primária "Criar primeiro prontuário" no vazio do paciente sem prontuários. | Aberto |
| **M7** | **Ordenação dos prontuários** — prontuários aparecem na ordem de inserção, sem destaque de sessão mais recente. | Prontuários ordenados por data (mais recente primeiro), com a data de criação preservada em `createdAt`. | Aberto |
| **M8** | **Busca global / atalho** — o acesso ao prontuário exige 2–3 toques a partir do dashboard. | Atalho no dashboard para "paciente recente" (último atendido) com um toque; sem criar uma tela nova de busca. | Aberto |

### 🟢 Baixa — polimento

| # | Item | Critério de aceite |
|---|------|--------------------|
| **B1** | **Confirmação de exclusão com o nome** — o alerta de exclusão já cita o nome do paciente, mas o de prontuário não cita o paciente. | Todo alerta destrutivo identifica o alvo pelo nome e mostra a consequência ("e todos os seus prontuários"). |
| **B2** | **Feedback de erro nos formulários** — hoje o erro é um `Alert.alert`; o `Input` já suporta `error`/`errorText` e não é usado. | Erro de validação aparece inline no campo correspondente (`Input` com `error`), mantendo o `Alert` só para casos de sistema. |
| **B3** | **Data relativa** — "13/11/2026" exige esforço de leitura; "há 3 dias" é mais rápido. | Rótulos relativos ("hoje", "há 2 dias") em listas de prontuário, com a data absoluta no `accessibilityLabel`. |
| **B4** | **Persistência de filtro/busca** — ao voltar da tela de detalhes, a lista perde a busca e o filtro. | Busca, filtro e ordenação preservados ao voltar da tela do paciente. |
| **B5** | **Contraste das cores secundárias** — `#94A3B8` sobre `#FFFFFF` fica em ~2,6:1, abaixo de 4,5:1. | `textTertiary` passa a `#64748B` (ou equivalente com ≥4,5:1) quando usado como texto; áreas ≥16px exigem ≥3:1. |

---

## ⚠️ Riscos e dívidas técnicas

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| **R1** | **`eas.json` regrediu** — a versão atual do working tree perdeu o pin do Node (`22.23.3`), as variantes `EXPO_PUBLIC_APP_VARIANT` (`base/development/preview/production`), o bloco `submit` com `track`/`releaseStatus`/`language` e a config de simulador iOS; e trocou `appVersionSource` de `local` para `remote`. | Build de produção pode falhar ou gerar numeração de build inconsistente. | ✅ **Resolvido na etapa 5** — `eas.json` restaurado do HEAD e validado com `npm run validate:eas` (VÁLIDO). |
| **R2** | **Cobertura só protege 2 arquivos** — `coverageThreshold` só cobre `reports.tsx` e `export-pdf.tsx`; `patients.tsx`, `details.tsx`, `profile.tsx`, `dashboard.tsx` e `login.tsx` podem regredir sem o CI avisar. | Regressão silenciosa de UI. | ✅ **Resolvido na etapa 4** — `coverageThreshold` agora cobre `details.tsx` (70%), `patients.tsx` (75%) e `profile.tsx` (70%) além dos 2 originais. Cobertura real: 89,4% · 96,5% · 92,8%. |
| **R3** | **`BACKLOG.md` removido** — o histórico de decisões do produto vive só no git. | Perda de contexto entre etapas. | Este `PLANO.md` é a nova fonte de escopo; o histórico permanece em `git show HEAD:BACKLOG.md`. |
| **R4** | **`android/` existe localmente** — diretório gerado, ignorado pelo git. | Risco de alguém editar nativo à mão, contra o `AGENTS.md`. | Não editar; o projeto é CNG (config em `app.json`). |
| **R5** | **Seed com 2 pacientes e 3 prontuários** — o app abre sempre com o mesmo conteúdo. | Estado de "primeiro uso" nunca é visto por quem já rodou o app; o vazio real não é testado. | Adicionar um item de QA: apagar o storage do app e percorrer o primeiro uso. |
| **R6** | **Login aceita qualquer e-mail cadastrado** — `login()` só compara com a lista de usuários; não há senha. |ameaça mínima, mas o "E-mail não cadastrado" com o e-mail de exemplo hardcoded no login (`psicologo@psicowave.com`) é frágil. | Registrar como dívida: a v1 é single-user local, e a tela deve dizer isso explicitamente. |

---

## 🚦 Como a esteira consome este plano

1. **Etapa 2 (architect)** — traduz A1–A5 em decisões técnicas e ordem de
   execução; confirma o escopo de A2 (tokenização) e A5 (safe area).
2. **Etapa 3 (mobile-ui)** — implementa os itens **Alta** na ordem A1 → A5,
   com revisão visual do `mobile-designer` a cada item.
3. **Etapa 4 (qa-vision)** — valida cada item pelo critério de aceite;
   devolve os que falharem com screenshot e passo a passo.
4. **Etapa 5 (release-prep)** — resolve **R1** (`eas.json`), confere `app.json`
   (ícone, splash, `name`, `slug`, `version`, bundle id/package) e entrega o
   checklist de build manual.

**Regra de ouro:** nenhum item é considerado entregue sem `npx tsc --noEmit` e
`npx expo lint` limpos **e** o teste automatizado do critério de aceite verde.

---

## 🎨 Etapa 6 — Temas e Aparência (ciclo 2 da esteira)

> Entra **após** a etapa 5. Estende `src/theme/tokens.ts`; não substitui o
> design system. Análise de viabilidade: `ANALISE-ETAPA6.md`.
>
> **Status:** aguardando o architect fechar D1–D3 (ver `WORKFLOW_STATE.md`,
> Ciclo 2). Nenhum item iniciado.

### Objetivo

Permitir que o psicólogo escolha a aparência do app (paleta, tamanho de
fonte) com prévia em tempo real, sem "flash" de cor padrão na abertura e sem
quebrar contraste.

### Decisões de produto (ajustadas pela análise)

1. **5 presets curados + "Personalizado" + "Restaurar padrão".**
2. **Prévia antes de aplicar** — o tema só muda no app inteiro ao tocar em
   "Aplicar tema". Implementar com `ThemeScope` (override local na prévia).
3. **Personalização limitada** — o usuário não escolhe combinações
   ilegíveis; pares abaixo de 4,5:1 são bloqueados ou corrigidos com aviso.
4. **Tamanho de fonte** (`Pequeno`/`Padrão`/`Grande`) é acessibilidade.

### Presets (com as correções de contraste aplicadas)

| Tema | Fundo | Superfície | Primária | Texto | Contraste prim/superf | Sensação |
|------|-------|------------|----------|-------|----------------------|----------|
| **Acolhimento** (padrão) | `#FAF8F5` | `#FFFFFF` | `#7C6A96` | `#2D2A32` | 4,82:1 ✅ | Calma, introspecção |
| **Jardim Calmo** | `#F4F7F4` | `#FFFFFF` | `#567C61` | `#233026` | 4,72:1 ✅ | Equilíbrio, natureza |
| **Terracota Suave** | `#FDF6F3` | `#FFFFFF` | `#A85F4B` | `#382621` | 4,77:1 ✅ | Calor, empatia |
| **Brisa Serena** | `#F3F7FA` | `#FFFFFF` | `#527999` | `#1E2B36` | 4,61:1 ✅ | Clareza, confiança |
| **Noite Aconchegante** (dark) | `#18171C` | `#232129` | `#A594C2` | `#F0EEF5` | 5,76:1 ✅ | Conforto noturno |

> Os valores originais `#5B8266` (4,35:1) e `#C07A65` (3,38:1) **falhavam
> WCAG AA** e foram ajustados mantendo a família de cor.

### Regras do plano (alterações)

- **Não-objetivo "Dark mode" removido** — existe só como preset Noite, sem
  seguir o tema do sistema na v1.
- **`app.json`:** `userInterfaceStyle` de `light` → `automatic`, **mais**
  `Appearance.setColorScheme(...)` para travar o scheme do app (senão o
  sistema sobrescreve os presets claros em aparelho escuro).
- **Regra 1 (zero literal):** única exceção permitida — os presets vivem em
  `src/theme/presets.ts`. Cores de status continuam em `tokens.ts`; o tema
  troca só `background`, `surface`, `primary`, `text` e derivados.
- **Restrição dos gates:** layout continua em `StyleSheet.create` (estático).
  Nunca converter para `createStyles(theme)` — os 3 gates leem estilos
  estáticos. Padrão: `style={[styles.card, { backgroundColor: theme.colors.surface }]}`.

### Arquitetura

- `ThemeContext` tipado (`ThemeProvider`, `useTheme`, `ThemeScope`) em
  `src/theme/context.tsx`.
- Tipos em `src/theme/types.ts`: `Theme`, `ThemeColors`, `FontScale`.
  `statusBar` usa `StatusBarStyle` de `expo-status-bar` (`'light' | 'dark'`),
  **não** `'dark-content' | 'light-content'`.
- `contrast.ts` — `luminance`, `contrastRatio`, `getReadableTextColor`.
- `storage.ts` — **D1 resolvido**: AsyncStorage + `SplashScreen`.
- `presets.ts` — os 5 temas (única exceção de hex literal).

### Backlog P1–P9

| # | Item | Critério de aceite | Status |
|---|------|--------------------|--------|
| **P1** | ThemeContext + tokens + `ThemeScope` + presets | `tsc` limpo; `useTheme()` devolve `colors`, `fontScale`, `setTheme`, `resetTheme`; teste de troca/restauração | Aberto |
| **P2** | Migração dos componentes (base → dados → 7 rotas) | `grep` de `#` no `src/` retorna só `tokens.ts`/`presets.ts`; nenhum componente importa cor direto de `tokens` | Aberto |
| **P3** | Persistência sem flash (AsyncStorage + SplashScreen) | Abrir com tema escuro salvo não mostra frame claro; ressalva: Expo Go não reproduz splash nativa (validar em release) | Aberto |
| **P4** | Contraste automático + presets corrigidos | Todo par texto/fundo ≥ 4,5:1 (≥3:1 em ≥18px ou bold ≥14px); teste percorre os 5 presets | Aberto |
| **P5** | StatusBar dinâmica | `'light'`/`'dark'` corretos nos 5 presets × 7 rotas | Aberto |
| **P6** | Tela `/appearance` (via `/profile`) — prévia com `ThemeScope`, grade de temas, rodapé | "Aplicar tema" persiste; sair sem aplicar descarta; haptic de sucesso | Aberto |
| **P7** | Tamanho de fonte (3 níveis) | 3 escalas sem truncar em 360dp e 430dp — extensão da fase 4b medindo no DOM | Aberto |
| **P8** | Seletor de cor personalizado com limites | cor do botão livre; fundo restrito; combinações <4,5:1 bloqueadas/corrigidas | Aberto |
| **P9** | Restaurar padrão | Volta a Acolhimento + fonte Padrão, com confirmação | Aberto |

### Riscos (R7–R10 + novos)

| # | Risco | Mitigação |
|---|-------|-----------|
| R7 | Terracota com texto branco (3,38:1) | Preset corrigido para `#A85F4B` + `getReadableTextColor` |
| **R11** | Jardim Calmo 4,35:1 | Preset corrigido para `#567C61` |
| **R12** | MMKV exigiria dev build (Expo Go) | D1: AsyncStorage + SplashScreen |
| **R13** | `userInterfaceStyle: automatic` sozinho não trava o scheme | `Appearance.setColorScheme` no provider |
| R8 | Migração reintroduzir transbordo | `validate:layout` em cada grupo migrado |
| R9 | Fonte Grande estourar headers | medição DOM em 3 escalas × 2 larguras |
| R10 | Cobertura não cobrir `ThemeContext` | estender `coverageThreshold` |

### Ordem recomendada (architect)

```
P1 → P4 → P2 → P3 → P5 → P7 → P6 → P8 → P9
```

P4 antes de P2 para migrar já com os presets corrigidos e `onPrimary`
calculado — não migrar para cor que depois muda.

---

Última atualização: Etapa 6 preparada (análise de viabilidade) — 2026-11-27.
Ciclo 1 concluído: A1–A5 implementados e verificados, gate de release desbloqueado.
Ciclo 2 (Etapa 6 — Temas e Aparência) aguardando architect fechar D1–D3.
