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

---

### 🔴 Alta — Próximo a fazer

| # | Tarefa | Detalhes | Arquivos envolvidos |
|---|--------|----------|---------------------|
| 9 | EAS Build | Configurar `eas.json` e build de desenvolvimento/produção. | `eas.json`, `app.json` |

### 🟡 Média

| # | Tarefa | Detalhes |
|---|--------|----------|
| 10 | Cobertura de testes | Ampliar cobertura para `src/app/patients/[patientId]/reports.tsx` e `export-pdf.tsx`. |
| 11 | Publicar o repositório no GitHub | O repositório local ainda não tem remote configurado — sem isso o CI não roda. |
| 6 | Exportar relatório (PDF/compartilhar) | Gerar PDF do prontuário ou compartilhar via `expo-sharing`. |
| 7 | Tela de detalhes do paciente | Abrir paciente para ver informações completas + lista de relatórios. |

### 🟢 Baixa / Futuro

| # | Tarefa | Detalhes |
|---|--------|----------|
| 8 | Testes (Jest / React Native Testing Library) | Cobrir `AppContext` e componentes críticos. |
| 9 | Configurar ESLint/Prettier no CI | GitHub Actions para rodar lint + tsc em cada PR. |
| 10 | EAS Build | Configurar `eas.json` e build de desenvolvimento/produção. |

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

Última atualização: CI no GitHub Actions concluído (tarefa #8). Workflow `.github/workflows/ci.yml` roda typecheck + lint + jest + expo-doctor em cada push/PR. `expo-doctor` 20/20 ✅, `tsc` 0 erros, `lint` 0 erros/0 warnings, `jest` 61/61 ✅. Próximo passo: EAS Build (tarefa #9).

### 🧪 Como rodar os testes
```bash
cd F:\08-MOBILE\psi-app
npm test              # uma vez (CI)
npm run test:watch    # modo watch
npm run test:coverage # relatório de cobertura
npm run typecheck     # tsc --noEmit
npx expo-doctor       # diagnóstico de dependências
```

### 🔀 Ativar o CI
O repositório local ainda não tem remote configurado. Para o GitHub Actions rodar:
```bash
cd F:\08-MOBILE\psi-app
git remote add origin https://github.com/<usuario>/psi-app.git
git push -u origin master
```