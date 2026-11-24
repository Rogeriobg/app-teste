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

---

### 🔴 Alta — Próximo a fazer

| # | Tarefa | Detalhes | Arquivos envolvidos |
|---|--------|----------|---------------------|
| 3 | Migrar navegação para Expo Router | Substituir a navegação condicional de `App.tsx` por rotas em `src/app/`. | `src/app/`, `App.tsx` |
| 4 | Tela de perfil/configurações | Dados do psicólogo, trocar e-mail, exportar dados. | `src/screens/`, `src/context/` |

### 🟡 Média

| # | Tarefa | Detalhes |
|---|--------|----------|
| 4 | Migrar navegação para Expo Router | Substituir a navegação condicional de `App.tsx` por rotas em `src/app/`. |
| 5 | Tela de perfil/configurações | Dados do psicólogo, trocar e-mail, exportar dados. |
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

Última atualização: componentes compartilhados criados e verificados (TS + lint limpos). Próximo passo: refatorar telas para usar `src/components/`.