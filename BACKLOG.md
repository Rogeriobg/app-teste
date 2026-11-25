# 📋 Backlog — PsiApp / PsiWave

> App para psicólogos gerenciarem pacientes e prontuários clínicos.
> Expo SDK 58 · React Native 0.88 · React 19 · TypeScript · AsyncStorage.

---

## 🎯 Visão geral

- **Login** simples por e-mail
- **Dashboard** com estatísticas (bento boxes)
- **Pacientes**: cadastro, edição, ativar/inativar, arquivar/restaurar, excluir, filtros por status
- **Prontuários/Relatórios**: por paciente, ativo/arquivado, notas privadas
- **Persistência**: AsyncStorage (seed em `database.json`)
- **Navegação**: caseira via `App.tsx` (condicional) — ainda não usa Expo Router

---

## ✅ Sprint concluído — Componentes compartilhados (esta sessão)

Criados em `src/components/` e exportados por `src/components/index.ts`:

| Componente | Arquivo | O que faz |
|------------|---------|-----------|
| `Button` | `Button.tsx` | Botão reutilizável com variantes (`primary`, `secondary`, `outline`, `danger`, `ghost`), estados `loading`, `disabled`, ícones esquerdo/direito |
| `Input` | `Input.tsx` | Input com label, placeholder, erro, `multiline`, `keyboardType`, `autoComplete` |
| `Card` | `Card.tsx` | Container com borda, sombra opcional, padding configurável |
| `StatusBadge` | `StatusBadge.tsx` | Badge com cores padronizadas para `Ativo` / `Inativo` / `Arquivado` |
| `AppModal` | `Modal.tsx` | Modal reutilizável com overlay, título, conteúdo, botoes Cancelar/Confirmar, estado loading |

**Verificações passing:**
- `npx tsc --noEmit` ✅ (0 erros)
- `npx expo lint` ✅ (0 erros, 0 warnings)

---

## 🗂 Como continuar quando voltar ao projeto

### 1. Rode primeiro as verificações
```bash
cd F:\08-MOBILE\psi-app
npx tsc --noEmit      # typecheck
npx expo lint         # lint
```
Ambos devem retornar sem saída (0 erros).

### 2. Rode o app
```bash
bunx expo start       # ou npx expo start
# ou
bunx expo start --android
bunx expo start --ios
bunx expo start --web
```

### 3. Estrutura de pastas (respeite)
```
src/
  app/          <- rotas Expo Router (quando migrar)
  components/   <- componentes compartilhados (UI pura, sem regra de negócio)
  context/      <- AppContext (estado global + AsyncStorage)
  screens/      <- telas (usam context + components)
  hooks/        <- hooks customizados (futuro)
  services/     <- integrações externas (futuro)
```

**Regra do AGENTS.md:** não criar ou editar `ios/` / `android/` à mão. Configurar native em `app.json` via config plugins.

---

## ✅ Tarefas concluídas

| # | Tarefa | Status | Detalhes |
|---|--------|--------|----------|
| C1 | Criar componentes compartilhados (`src/components/`) | ✅ Feito | `Button`, `Input`, `Card`, `StatusBadge`, `AppModal` + `index.ts` |
| C2 | Refatorar telas para usar `src/components/` | ✅ Feito | `PatientsScreen.tsx` e `PatientReportsScreen.tsx` agora usam `Button`, `Input`, `Card`, `AppModal` |

---

## 📅 Backlog de tarefas (prioridade)

### ✅ Tarefas concluídas (esta sessão)

| # | Tarefa | Status | Detalhes |
|---|--------|--------|----------|
| 1 | Adicionar busca de pacientes | ✅ Feito | Campo de texto no `PatientsScreen` filtrando por nome e e-mail, funciona em combinação com filtros por status |
| 2 | Date picker nativo | ✅ Feito | Substituir `TextInput` de datas por `@react-native-community/datetimepicker` em PatientsScreen (Data de Nascimento) e PatientReportsScreen (Data da Sessão) |
| 3 | Migrar navegação para Expo Router | ✅ Feito | `App.tsx` reexporta `src/app/_layout`; rotas em `src/app/` usam `expo-router`. |
| 4 | Tela de perfil/configurações | ✅ Feito | Nova rota `src/app/profile.tsx` com SafeArea, dados editáveis do psicólogo, `updateUser` no AppContext, exportação de dados JSON via `expo-sharing` + `expo-file-system`, feedback háptico via `expo-haptics`, acessibilidade, thumb zone para logout. Link adicionado no dashboard. |
| 5 | Tela de detalhes do paciente | ✅ Feito | Nova rota `src/app/patients/[patientId]/details.tsx` com SafeAreaView, useSafeAreaInsets, avatar grande, cards de informações (nascimento, anamnese, email, telefone), resumo de prontuários (ativos/arquivados), lista de prontuários com editar/arquivar/excluir, modal de novo prontuário, ações na thumb zone (editar, inativar/reativar, arquivar/restaurar, prontuários, excluir), feedback háptico via expo-haptics, acessibilidade completa (accessibilityLabel/role/hint), estados vazios. `updateUser`, `addMedicalRecord`, etc. expostos no AppContext. |
| 6 | Exportar relatório (PDF/compartilhar) | ✅ Feito | Nova rota `src/app/patients/[patientId]/export-pdf.tsx` usando `expo-print` (`printToFileAsync`) com HTML/CSS estilizado para A4 (cabeçalho, dados do paciente, prontuários, notas privadas, rodapé) + `expo-sharing` para compartilhar. Botão "Exportar PDF" adicionado na thumb zone da tela de detalhes. Bug corrigido: `DateTimePicker` agora renderiza condicionalmente (`datePickerVisible &&`) em `patients.tsx` e `reports.tsx` — antes aparecia sempre dentro do modal. |
| 7 | Testes (Jest / React Native Testing Library) | ✅ Feito | `jest-expo` + Jest 30 + `@testing-library/react-native` v14. `jest.config.js` (preset, alias `@/`, mocks de `lucide-react-native` ESM, `testTimeout`), `jest.setup.ts` (mocks de AsyncStorage, safe-area-context, haptics, sharing, print, file-system, datetimepicker, expo-router), `__tests__/` com 61 testes: `AppContext-test.tsx` (autenticação, updateUser, CRUD de pacientes e prontuários, helpers, exportData), `components-test.tsx` (Button, Input, Card, StatusBadge, AppModal), `screens-test.tsx` (Login, Dashboard, Patients, Profile, PatientDetails). Scripts `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run typecheck`. |
| 8 | Configurar ESLint/Prettier no CI | ✅ Feito | Workflow `.github/workflows/ci.yml` (push/PR em master+main, concurrency, Node 22 com cache npm): `npm ci` → `npm run typecheck` → `npm run lint` → `npm test` → `expo-doctor`. Bugs corrigidos: `expo-haptics` e `expo-print` removidos dos `plugins` do `app.json` (não possuem config plugin e quebravam `expo config`); peer deps `expo-constants`, `expo-linking` e `react-native-svg` instaladas (expo-doctor: 20/20 ✅). |
| 9 | EAS Build | ✅ Feito | `eas.json` com 4 perfis (`base`, `development`, `preview`, `production`) + perfil de `submit`. `app.json` com `bundleIdentifier`/`package` (`com.psicowave.psiapp`), `scheme`, `buildNumber`, `versionCode` e splash via plugin. `expo-dev-client`, `expo-system-ui` e `expo-splash-screen` instalados. Job `build-preview` no CI. Validador `scripts/validate-eas-json.cjs` (schema oficial do EAS + checagem estrita de chaves). Migração CNG mantida — sem `ios/`/`android/` no repo (verificado via `expo prebuild`). Ajustes de schema do SDK 58: `newArchEnabled` e `splash` removidos do `app.json`. |
| 12 | Publicar o repositório no GitHub | ✅ Feito | Repositório `Rogeriobg/app-teste` (branch `main`) sincronizado. CI validado no GitHub Actions: bug corrigido em `jobs.<id>.if` (contexto `secrets` não é permitido nesse ponto — causava "Invalid workflow file" sem criar jobs). Validador local `scripts/validate-workflow.cjs` (schema oficial do GitHub + checagem de contextos) adicionado ao CI. |
| 10 | Cobertura de testes | ✅ Feito | Novo `__tests__/reports-test.tsx` com 21 testes cobrindo `reports.tsx` (cabeçalho, resumo, listagem, estado vazio, modal de criação com validações, criação, edição, arquivar, restaurar, excluir com confirmação/cancelamento, date picker e caminho de erro) e `export-pdf.tsx` (cabeçalho, resumo, geração do PDF, compartilhamento, erros de impressão/compartilhamento e paciente inexistente). Cobertura: `reports.tsx` 98,7% stmts / 95,4% funcs · `export-pdf.tsx` 95% stmts / 100% funcs. `coverageThreshold` no `jest.config.js` impede regressão e o CI agora roda `npm run test:coverage` e publica o relatório como artifact. |
| 13 | Configurar secret e variable no GitHub | ✅ Feito | **Variable** `EAS_BUILD_ENABLED=true` criada. **Secret** `EXPO_TOKEN` gravado (criptografado com libsodium via `scripts/set-github-secret.mjs`). Projeto vinculado ao EAS: `extra.eas.projectId` = `75093bc5-2f6d-41b9-9404-dcd5f858b322` e `owner` = `rogeriobg` no `app.json` (gerado por `eas init`). Assistente `npm run eas:setup` (digitação mascarada, valida o token contra `api.expo.dev/graphql` **antes** de gravar) e diagnóstico `npm run eas:check-token`. |

---

### 🔴 Alta — Próximo a fazer

| # | Tarefa | Detalhes | Arquivos envolvidos |
|---|--------|----------|---------------------|
| 11 | Primeiro build real no EAS | O CI já dispara o build `preview` a cada push na `main` (job "EAS Build (preview)"). Acompanhar o run e baixar o APK. | GitHub Actions → EAS Build |

### 🟡 Média

| # | Tarefa | Detalhes |
|---|--------|----------|
| 14 | Ampliar cobertura das demais telas | `patients.tsx` (37,8%), `details.tsx` (29,9%) e `profile.tsx` (34,5%) ainda têm fluxos sem teste (cadastro/edição de paciente, filtros avançados, arquivar paciente, exportar dados). |

---

## 🧠 Notas técnicas importantes

- **AsyncStorage keys:** `@psi_app_db_json_v1` (banco), `@psi_app_current_user_v1` (usuário logado)
- **Seed:** `database.json` é importado como `defaultDb` no `AppContext.tsx`
- **Cores da marca:** teal `#0D9488`, fundo `#F4FBF7`, cards `#FFFFFF`, texto escuro `#133E2B`
- **Role atual:** apenas `psicologo` (sem suporte a múltiplos perfis ainda)
- **IDs gerados:** `p_` + `Date.now()` para pacientes, `m_` + `Date.now()` para prontuários

---

## 🚦 Como marcar uma tarefa como concluída

1. Faça a alteração no código.
2. Rode `npx tsc --noEmit` e `npx expo lint` — ambos devem estar limpos.
3. Commit com mensagem descritiva, ex: `feat(refactor): PatientsScreen usando componentes compartilhados`.
4. Atualize este `BACKLOG.md` riscando ou movendo a tarefa para "concluído".

---

Última atualização: EAS totalmente configurado (tarefa #13). Secret `EXPO_TOKEN` e variable `EAS_BUILD_ENABLED` gravados no repositório, e o projeto vinculado ao EAS (`extra.eas.projectId` + `owner` no `app.json`). O CI agora dispara o build `preview` automaticamente em cada push na `main`. `expo-doctor` 20/20 ✅, `tsc` 0 erros, `lint` 0 erros/0 warnings, `jest` 82/82 ✅, `eas.json` e workflow válidos contra os schemas oficiais. Próximo passo: acompanhar o primeiro build EAS (tarefa #11).

### 🧪 Como rodar os testes
```bash
cd F:\08-MOBILE\psi-app
npm test              # uma vez (CI)
npm run test:watch    # modo watch
npm run test:coverage # relatório de cobertura + coverageThreshold
npm run typecheck     # tsc --noEmit
npx expo-doctor       # diagnóstico de dependências
```

### 📦 EAS Build
```bash
npm run eas:config          # inspecionar a config resolvida (requer login Expo)
npm run eas:build:dev       # perfil development  → dev client (Android APK / iOS simulator)
npm run eas:build:preview   # perfil preview      → APK/IPA de distribuição interna
npm run eas:build:prod      # perfil production  → AAB/IPA para as lojas
npm run eas:submit          # envia o build de production para as lojas
npm run validate:eas        # valida o eas.json contra o schema oficial do EAS
```
Pré-requisitos: conta Expo (`npx eas-cli@latest login`) e `EXPO_TOKEN` como secret do repositório para builds via CI.

### 🔀 Repositório e CI
O repositório está em `https://github.com/Rogeriobg/app-teste` (branch `main`) e o workflow `CI` roda a cada push/PR.

O job de build EAS é controlado por:
- **Variable:** `EAS_BUILD_ENABLED` = `true` ✅ (já criada)
- **Secret:** `EXPO_TOKEN` ⏳ (token pessoal do Expo)

> O gate do job usa `vars.EAS_BUILD_ENABLED` porque o contexto `secrets` não é permitido em `jobs.<job_id>.if` — usá-lo faz o GitHub rejeitar o workflow inteiro sem criar jobs.

**Gravando o secret sem expor o token no histórico do shell:**
```bash
cd F:\08-MOBILE\psi-app
$env:EXPO_TOKEN = "seu-token-expo"
npm run secret:github -- EXPO_TOKEN   # criptografa (libsodium) e grava via API do GitHub
```

**⚠️ O token do Expo (`EXPO_TOKEN`) não é o login por QR code.** O QR code (`eas login`) cria uma sessão local na sua máquina — ela expira e não funciona no CI. O `EXPO_TOKEN` é um *personal access token* criado em https://expo.dev/settings/access-tokens.