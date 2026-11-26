# 🏗️ Arquitetura Técnica — PsiApp / PsiWave

> Etapa 2 (architect) da esteira. Traduz o `PLANO.md` em decisões técnicas.
> Expo SDK 58 · RN 0.88 · React 19 · TypeScript · StyleSheet · AsyncStorage.

---

## 1. Estado atual da base técnica

| Camada | Estado | Observação |
|--------|--------|------------|
| Navegação | Expo Router, `main: expo-router/entry` | 7 rotas registradas em `src/app/_layout.tsx` |
| Estado | `AppContext` (React Context + `useState`) | Persistência eager em AsyncStorage a cada mutação |
| Persistência | AsyncStorage, chave `@psi_app_db_json_v1` | JSON serializado do banco inteiro — **sem versionamento de schema** |
| Design | `src/theme/tokens.ts` + 9 componentes | Tokens portados do BoardUI, mas **~80 hex literais fora dele** |
| Testes | 8 suítes, 131 testes, RNTL v14 + Jest 30 | `coverageThreshold` cobre só 2 de 7 telas |
| CI | GitHub Actions (`quality` + `build-preview` manual) | `npm run typecheck` → `lint` → `test:coverage` → `expo-doctor` |
| Build | EAS manual, `projectId` gravado | `eas.json` regredido (R1) |

### Decisões estruturais que **não mudam** nesta iteração

1. **`AppContext` como fonte única de estado.** Sem Redux/Zustand — a escala do
   app (um psicólogo, ~100 pacientes) não justifica. A troca de biblioteca é
   uma decisão de v2.
2. **AsyncStorage com JSON.** O volume é pequeno e o formato é legível para
   backup manual. Migrar para SQLite exigiria一遍 rewrite do `AppContext`.
3. **`StyleSheet` + tokens, sem NativeWind.** O BoardUI é React+Tailwind e foi
   portado;_nativewind_ reintroduziria um build step de Tailwind sem ganho.
4. **Rotas em `src/app/`, lógica fora.** Nenhuma regra de negócio dentro de
   arquivo de rota.

---

## 2. Decisões por item do backlog

### A1 — Editar paciente funcional 🔴

**Problema.** `details.tsx` abre um modal "Editar Paciente" cujos campos têm
`onChangeText={(v) => { /* edição de paciente futura */ }}` e cujo `onConfirm`
aponta para `handleSaveRecord` — que valida *título e conteúdo de prontuário*.
Resultado: o botão "Salvar Alterações" nunca salva o paciente. O modal é
**decorativo**.

**Decisão.** Separar o modal em dois componentes com Props explícitas, em vez
de um modal sobrecarregado com três modos:

```
src/components/PatientFormModal.tsx   (novo)
  props: visible, mode: 'create' | 'edit', initial?: Patient,
         onSubmit(values: PatientFormValues), onDismiss, loading?
```

O `details.tsx` passa a ter **dois modais distintos**:
- `PatientFormModal` (modo `edit`) → `updatePatient`
- `RecordFormModal` (modo `create` | `edit`) → `addMedicalRecord` / `updateMedicalRecord`

**Contrato de dados.** Novo tipo em `src/types/patient.ts`:

```ts
export interface PatientFormValues {
  name: string;
  email: string;
  phone: string;
  birthDate: string;   // ISO 'YYYY-MM-DD'
  anamnesis: string;
}
```

`handleSavePatient` valida `name` e `email` (obrigatórios, igual ao cadastro),
monta o objeto completo preservando `id`, `status` e `createdAt` do paciente
original, e chama `updatePatient`.

**Estado local do formulário.** O `details.tsx` atual usa `isEditing` +
`editingId` para decidir título e campos — a origem do bug. Novo padrão:
um `modalMode: 'patient' | 'record'` mais `editingId`, com **duas**
variáveis de estado para o formulário do paciente (`patientName`,
`patientEmail`, …). Isso elimina a inversão de lógica.

**Efeito colateral (A1 → M3).** O `patients.tsx` já tem um modal de cadastro
com exatamente os mesmos campos. Com `PatientFormModal` extraído, os dois
lugares passam a compartilhar o mesmo componente → **um** formulário, **uma**
validação, **um** conjunto de testes.

**Critério de aceite (A1).**
- Editar nome/e-mail/telefone/nascimento/anamnese na tela de detalhes persiste
  no `AppContext`.
- `updatePatient` chamado com `id`, `status` e `createdAt` preservados.
- Alerta de sucesso + haptic.
- Teste automatizado: salvar altera o dado; cancelar não altera nada.

**Estimativa:** ~1 dia (extrair componente + 2 formulários + testes).

---

### A2 — Tokenização completa 🔴

**Decisão.** `src/theme/tokens.ts` vira a **única** fonte de cor. Isso exige
adicionar tokens que hoje não existem, porque o design system atual não cobre
tudo o que o app usa:

| Token novo | Valor | Uso |
|------------|-------|-----|
| `colors.inputBg` | `#F8FAFC` | fundo de campo (hoje literal em `Input`) |
| `colors.inputBorder` | `#CBD5E1` | borda de campo |
| `colors.inputText` | `#1E293B` | texto digitado |
| `colors.labelText` | `#475569` | rótulo de campo |
| `colors.textOnBrand` | `#FFFFFF` | texto sobre fundo de marca |
| `colors.textOnDanger` | `#FFFFFF` | texto sobre fundo destrutivo |
| `colors.mutedSurface` | `#F1F5F9` | botão secundário/neutro |
| `colors.overlay` | `rgba(0,0,0,0.45)` | backdrop do modal |
| `colors.shadowNeutral` | `#000000` | sombra neutra (modal) |
| `colors.contentMuted` | `#374151` | corpo de texto em card |
| `colors.successSoftAlt` | `#D1FAE5` | badge de sucesso (mantém paridade com `successSoft`) |
| `colors.warningSoftAlt` | `#FEF3C7` | badge de inativo |

**Regra de migração.** Em cada arquivo, a substituição é **mecânica e
local**: `const ACCENT = '#0D9488'` → `const ACCENT = colors.brand`; dentro de
`StyleSheet.create`, `'#0D9488'` → `colors.brand`. Nenhuma lógica muda.

**Fora do escopo de A2 (deliberado).**
- `export-pdf.tsx` monta **HTML/CSS** para o `expo-print` — aquele CSS não é
  RN e não deve usar tokens de RN. Fica com literais, com um comentário
  explicando o porquê.
- `app.json` (cores de splash/adaptive icon) — não é código RN.
- `database.json` — seed, não estilo.

**Critério de aceite (A2).** Nenhum hex literal em `src/` exceto
`src/theme/tokens.ts` e o bloco HTML de `export-pdf.tsx` (com comentário).
Grep automatizado no CI.

**Estimativa:** ~1 dia.

---

### A3 — Busca por telefone 🔴

**Decisão.** A busca é feita **no cliente**, sobre `db.patients`. Ampliar o
 predicado:

```ts
const query = searchQuery.trim().toLowerCase();
const matches = (p: Patient) =>
  p.name.toLowerCase().includes(query) ||
  p.email.toLowerCase().includes(query) ||
  p.phone.toLowerCase().includes(query);
```

Sem normalização de telefone (remover parênteses/espaços): o usuário digita
como vê. Mas a busca **também** compara a versão normalizada do telefone
apenas contra dígitos, para que "988887777" encontre "(11) 98888-7777".
Normalização mínima: `replace(/\D/g, '')`.

**Critério de aceite (A3).** Teste automatizado: paciente encontrado por
nome, e-mail, telefone formatado e telefone só com dígitos.

**Estimativa:** ~2h.

---

### A4 — Estado vazio da busca 🔴

**Decisão.** Um único componente de estado vazio, **contextual**, com
**ação de recuperação**:

| Situação | Título | Subtítulo | Ação |
|----------|--------|-----------|------|
| Sem pacientes no banco | "Nenhum paciente cadastrado" | "Comece cadastrando seu primeiro paciente." | Botão "Cadastrar paciente" |
| Filtro de status sem resultado | "Nenhum paciente {ativo/inativo/arquivado}" | "Ajuste o filtro ou cadastre um novo paciente." | Botão "Ver todos" (limpa o filtro) |
| Busca sem resultado | "Nenhum resultado para «termo»" | "Tente outro nome, e-mail ou telefone." | Botão "Limpar busca" |

A busca passa a ter um botão **"×"** dentro do campo, à direita, para limpar
rapidamente — o `Input` componente precisa ganhar a prop `onClear` (e um
ícone `X` opcional). Alternativa mais simples: `Input` aceita `rightAdornment`.

**Critério de aceite (A4).** Três estados distintos testados por texto; a ação
de limpeza zera a busca e o filtro correspondente.

**Estimativa:** ~4h.

---

### A5 — Safe area consistente 🔴

**Decisão.** Regra única para as 7 rotas:

> Toda tela que **não** tem `SafeAreaView` usa `useSafeAreaInsets()` e
> aplica `paddingTop: insets.top` no header e `paddingBottom: insets.bottom`
> no conteúdo rolável. Nenhum `paddingTop` fixo.

Implementação por rota:

| Rota | Situação atual | Decisão |
|------|----------------|---------|
| `/login` | `paddingTop: 40` fixo | `insets.top + spacing.xl` no `ScrollView` |
| `/dashboard` | ✅ já usa `insets.top` | mantém; `insets.bottom` no scroll |
| `/patients` | `paddingTop: 52` fixo | `insets.top + spacing.md` no header |
| `/patients/[id]/details` | ✅ `SafeAreaView` + `insets` | mantém; unificar com a regra acima |
| `/patients/[id]/reports` | `paddingTop: 52` fixo | `insets.top + spacing.md` no header |
| `/patients/[id]/export-pdf` | ✅ `SafeAreaView` + `insets` | mantém |
| `/profile` | `SafeAreaView` sem inset | manter `SafeAreaView` (top e bottom) |

**Nota de arquitetura.** `SafeAreaView` do `react-native-safe-area-context`
aplica inset em **todas** as bordas por padrão. `details.tsx` já soma
`insets.top` no top bar **e** está dentro de um `SafeAreaView` — o inset é
contado duas vezes. Decisão: **remover `SafeAreaView`** das telas e usar
**apenas** `useSafeAreaInsets()`, com aplicação explícita por borda. Isso
elimina a classe de bug "conteúdo sob o notch" e "espaço duplicado no topo".

**Critério de aceite (A5).** Nenhum `paddingTop` fixo > 24 em `src/`. Em
aparelho com notch (iPhone) e sem notch (Android), nenhum conteúdo fica sob a
barra de status nem sob a barra de gestos.

**Estimativa:** ~1 dia.

---

## 3. Ordem de execução

A ordem não é a do PLANO porque há dependências técnicas reais:

```
Etapa 3 (mobile-ui) — ordem de execução:
  1. A2 (tokenização)      ← toca todo arquivo; se vier depois, o retrabalho é grande
  2. A5 (safe area)        ← toca todo arquivo; mesma razão
  3. A1 (editar paciente)  ← depende de A2 (componente novo usa tokens)
  4. A3 (busca telefone)   ← isolado em patients.tsx
  5. A4 (estado vazio)     ← depende de A3 (mesma tela)
```

**Justificativa.** A2 e A5 são refatorações transversais (tocam 100% das
telas). Executá-las primeiro evita refazer o mesmo arquivo duas vezes. A1
cria componente novo e reaproveita os tokens de A2. A3 e A4 são localized em
`patients.tsx` e devem ser feitos juntos para não brigar pelo mesmo estado.

**Dependências entre itens:**
- A1 ⇒ A2 (componente novo precisa de tokens)
- A4 ⇒ A3 (o estado vazio da busca depende da busca existir)
- A5 ⇒ nada; A2 ⇒ nada

---

## 4. Contratos de teste

Cada item só fecha com teste. Convenções já em uso:

- RNTL v14: `render`/`fireEvent` são **assíncronos**; queries via `screen`.
- Alert: helper `__tests__/helpers/alert.ts` (`spyOnAlert`, `lastAlertWithButtons`, `pressAlertButton`).
- Render com provider: `renderWithProvider` (ver `__tests__/patients-test.tsx`).

| Item | Testes a criar | Arquivo |
|------|----------------|---------|
| A1 | salvar edita; cancelar não edita; validação de nome/e-mail | `__tests__/patient-details-test.tsx` (ampliar) |
| A2 | — (é refatoração; a suíte existenteacts como regressão) | — |
| A3 | busca por telefone (formatado e só dígitos) | `__tests__/patients-test.tsx` (ampliar) |
| A4 | 3 estados vazios distintos + ação de limpar | `__tests__/patients-test.tsx` (ampliar) |
| A5 | — (refatoração visual; validado na etapa 4) | — |

**Piso de cobertura (R2).** Depois de A1 e A2, acrescentar `coverageThreshold`
para `patients.tsx`, `details.tsx`, `profile.tsx`, `dashboard.tsx` e
`login.tsx` — no mesmo padrão já usado para `reports.tsx` e `export-pdf.tsx`.

---

## 5. Riscos técnicos desta execução

| # | Risco | Mitigação |
|---|-------|-----------|
| T1 | **Tokenização é mecânica, mas tediosa** — ~80 literais em 12 arquivos; erro de digitação muda cor sem quebrar o build. | Migrar por arquivo, rodando `lint` + `tsc` + suíte a cada arquivo. Conferir visualmente as telas com card e badge (onde as cores mudam de tom). |
| T2 | **A5 pode deslocar layout** — trocar `paddingTop: 52` por `insets.top + spacing.md` muda a altura do header em aparelhos sem notch (de 52 para ~24). | Compensar com `spacing.lg` extra no header para manter a altura visual; validar em Android (sem notch) e iPhone. |
| T3 | **A1 muda a API do modal** — testes existentes de `details.tsx` referenciam "Salvar Prontuário"/"Editar Paciente". | Atualizar os testes no mesmo commit do item; a suíte é a rede de segurança. |
| T4 | **`export-pdf.tsx` fica com literais** — pode parecer inconsistência. | Comentário explícito no arquivo + item de例外 no critério de aceite de A2. |
| T5 | **Excesso de escopo** — a esteira tentará "aproveitar" e mexer em M1–M8. | Regra: nesta etapa só A1–A5. M1–M8 são etapas futuras. |

---

## 6. Definition of Done da etapa 3

- [ ] `npx tsc --noEmit` → 0 erros
- [ ] `npx expo lint` → 0 erros, 0 warnings
- [ ] `npx jest --ci` → 131/131 + os testes novos (verde)
- [ ] Critério de aceite de A1–A5 cumprido **e verificado em tela**
- [ ] `PLANO.md` atualizado (itens marcados como feitos)
- [ ] Commit por item (A2, A5, A1, A3, A4) — facilitates bisect e rollback

---

Última atualização: Etapa 2 (architect) — 2026-11-26.
Base: `4f73142` (etapa 1 aprovada, 131/131 testes verdes).
