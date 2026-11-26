# 🔍 Relatório de QA — Etapa 4

> Validação dos itens Alta (A1–A5) do `PLANO.md` contra seus critérios de
> aceite. Base: `b5a696a` — 142/142 testes, `tsc` e `lint` limpos.

---

## Resumo

| Verificação | Resultado |
|-------------|-----------|
| `npx tsc --noEmit` | 0 erros ✅ |
| `npx expo lint` | 0 erros, 0 warnings ✅ |
| `npx jest --ci` | **142/142**, 8/8 suítes ✅ |
| Cobertura | `patients.tsx` 96,5% · `profile.tsx` 92,8% · `details.tsx` 89,4% ✅ |
| `coverageThreshold` | 7 telas protegidas (antes: 2) ✅ |

**Veredito: `[APROVADO]`** — os 5 itens Alta cumprem os critérios de aceite.
2 defeitos encontrados e corrigidos durante a revisão.

---

## Validação item a item

### A1 — Editar paciente funcional ✅

| Critério | Verificação | Status |
|----------|-------------|--------|
| Editar dados persiste no `AppContext` | `handleSavePatient` chama `updatePatient` com os 5 campos editáveis | ✅ |
| `updatePatient` chamado com os dados novos | `details.tsx:256` | ✅ |
| Preserva `id`, `status`, `createdAt` | `...patient` (spread) + `id`/`status`/`createdAt` do original | ✅ |
| Alerta de sucesso | `'Sucesso', 'Dados do paciente atualizados com sucesso!'` | ✅ |
| Teste automatizado (salvar) | `patient-details-test.tsx:338` — "deve salvar os dados editados do paciente" | ✅ |
| Teste automatizado (cancelar) | `patient-details-test.tsx:367` — "não deve alterar o paciente quando a edição é cancelada" | ✅ |
| Teste de validação | `patient-details-test.tsx:384` — "deve validar o nome do paciente no modal de edição" | ✅ |

**Verificação extra:** o modal de prontuário e o de paciente agora são
**componentes separados** — a inversão de lógica por `isEditing`/`editingId`
(que causava o bug "ATIVO ATIVO" e o modal com título errado) não existe
mais. `PatientFormModal` é compartilhado entre cadastro e edição.

### A2 — Tokenização completa ✅

| Critério | Verificação | Status |
|----------|-------------|--------|
| Nenhum hex literal fora de `tokens.ts` | Varredura de `src/` (13 arquivos `.tsx`/`.ts`): **0 ocorrências** | ✅ |
| Exceção `export-pdf` (HTML) | Literais **só** dentro do `buildHtml`; verificado: "NENHUM fora do HTML" | ✅ |
| `app.json` intocado | Não é código RN | ✅ |
| `tsc` e `lint` limpos | 0 erros | ✅ |

### A3 — Busca por telefone ✅

| Critério | Verificação | Status |
|----------|-------------|--------|
| Busca por nome | `patients.tsx:72` | ✅ |
| Busca por e-mail | `patients.tsx:73` | ✅ |
| Busca por telefone (texto) | `patients.tsx:75` — "(11) 98888-7777" | ✅ |
| Busca por telefone (dígitos) | `patients.tsx:76-77` — "988887777" | ✅ |
| Teste automatizado | 2 testes: "busca por telefone formatado" e "por telefone apenas com dígitos" | ✅ |

### A4 — Estado vazio da busca ✅

| Situação | Texto exibido | Ação de recuperação | Teste |
|----------|---------------|---------------------|-------|
| Busca sem resultado | `Nenhum resultado para «termo»` | "Limpar busca" + "×" no campo | ✅ 2 testes |
| Filtro sem resultado | `Nenhum paciente arquivado/ativo/inativo` | "Ver todos" | ✅ 2 testes |
| Sem pacientes cadastrados | `Nenhum paciente cadastrado` | "Cadastrar paciente" | ✅ 2 testes (contexto com banco vazio) |

**Nota (R5):** o seed em `database.json` (2 pacientes) impede o estado de
primeiro uso de aparecer naturalmente. O estado foi validado com um
contexto de banco vazio — o comportamento está correto, mas **o primeiro
uso real do app nunca é visto** por quem já rodou com o seed. Item de
produto, não de defeito.

### A5 — Safe area consistente ✅

| Verificação | Resultado |
|-------------|-----------|
| `SafeAreaView` residual no `src/` | **0** — removido de todas as telas |
| `paddingTop` fixo > 24 | **0** — o grep não retorna nenhum |
| `useSafeAreaInsets()` por rota | 7/7 telas com conteúdo usam insets: `login`, `dashboard`, `patients`, `details`, `reports`, `export-pdf`, `profile` |
| Rotas sem inset | `index.tsx` (redireciona, sem UI) e `_layout.tsx` (não têm tela) — correto |
| Inset contado duas vezes | Corrigido — `details.tsx` somava `insets.top` **dentro** de um `SafeAreaView` |

---

## 🐛 Defeitos encontrados e corrigidos

### DEF-1 — Botão "×" de limpar visível com o campo vazio

**Severidade:** baixa (visual)
**Onde:** `src/components/Input.tsx`

O botão de limpar era renderizado sempre que `onClear` existia, mesmo com o
campo vazio — ruído visual no estado inicial da busca.

**Correção:** `onClear && value.length > 0`.

### DEF-2 — Botão "×" desalinhado e com altura fixa

**Severidade:** média (layout)
**Onde:** `src/components/Input.tsx`

`clearBtn` tinha `height: 44` fixo, enquanto o campo tem altura de ~43px
(`paddingVertical: 12` + borda + linha do texto). Resultado: desalinhamento
de ~1px e o botão não acompanhava a altura do campo.

**Correção:** `alignSelf: 'stretch'` + `minHeight: 44` — o botão se estica
com o campo e mantém 44px de área de toque.

### R2 — Piso de cobertura para 3 telas

`coverageThreshold` protegia só `reports.tsx` e `export-pdf.tsx`. Agora
`também` `details.tsx`, `patients.tsx` e `profile.tsx`.

---

## ⚠️ Pendências que ficam para as próximas etapas

| # | Item | Severidade | Etapa |
|---|------|-----------|-------|
| **QA-1** | **`textTertiary` (#94A3B8) sobre branco = 2,56:1** — abaixo de 4,5:1 (WCAG AA). Afeta títulos de prontuário arquivado, datas, placeholders e o "×". Item **B5** do `PLANO.md` — ainda não feito. | Média | 5+ / M |
| **QA-2** | **`brand` (#0D9488) sobre branco = 3,74:1** — passa em texto grande (≥18px) mas não em texto pequeno. Afeta chips e rótulos de marca. | Média | M |
| **QA-3** | **Áreas de toque abaixo de 44px:** `backBtn` (40×40, `details.tsx`), `logoutBtn` (40×40, `dashboard.tsx`), `iconAction` (34×34, `details.tsx`), `iconBtn` (≈38px, `patients.tsx`), `viewBtn` (≈30px, `reports.tsx`). Viola a regra "≥44×44 px" do design system. | Média | 3 (mobile-ui) |
| **QA-4** | **Seed de demonstração** sempre presente — o primeiro uso real (sem pacientes) nunca aparece; e `users` só tem 1 usuário, sem como testar multiusuário. | Baixa | Produto |
| **QA-5** | **`eas.json` regredido** (R1) — pin do Node, variantes de env, bloco `submit` e `appVersionSource` perdidos. | Alta | 5 (release-prep) |
| **QA-6** | **Duplicidade de prontuários** (M3) — `details.tsx` e `reports.tsx` mantêm duas listas do mesmo dado, com CRUD duplicado. | Média | M |

### Contraste medido (WCAG 2.1)

| Combinação | Razão | AA |
|-------------|-------|-----|
| `textPrimary` #133E2B s/ #FFFFFF | 11,99:1 | ✅ |
| `textSecondary` #64748B s/ #FFFFFF | 4,76:1 | ✅ |
| `textTertiary` #94A3B8 s/ #FFFFFF | **2,56:1** | ❌ |
| `textTertiary` #94A3B8 s/ #F8FAFC | **2,45:1** | ❌ |
| `brand` #0D9488 s/ #FFFFFF | **3,74:1** | ⚠️ só texto grande |
| `textOnBrand` #FFFFFF s/ #0D9488 | 3,74:1 | ⚠️ só texto grande |

---

## Como verificar no aparelho

```powershell
npx expo start --go --clear
```

Expo Go: `exp://192.168.0.111:8081`

Roteiro de verificação:

1. **A5** — abrir cada uma das 7 rotas em aparelho com notch (iPhone) e sem
   notch (Android): nenhum conteúdo sob a barra de status nem sob a barra de
   gestos.
2. **A2** — conferir cards, badges e chips: as cores devem ser **iguais** às
   de antes (a tokenização é mecânica, não deve mudar tom).
3. **A1** — paciente → Editar paciente → alterar nome e telefone → Salvar:
   o card da lista deve refletir a mudança. Recarregar o app: a alteração
   persiste.
4. **A3** — na busca, digitar `988887777` (sem formatação): deve achar
   "(11) 98888-7777".
5. **A4** — buscar "zzz": deve aparecer `Nenhum resultado para «zzz»` com o
   botão "Limpar busca". O "×" só aparece depois de digitar.
6. **R5** — primeira vez num aparelho limpo: desinstalar o app (ou limpar
   os dados) e abrir: a tela de pacientes deve mostrar os 2 pacientes do
   seed. Para ver o estado de primeiro uso real, excluir os dois pacientes.

---

Última atualização: Etapa 4 (qa-vision) — 2026-11-26.
Aprovado com 2 defeitos corrigidos (DEF-1, DEF-2) e 6 pendências registradas.
