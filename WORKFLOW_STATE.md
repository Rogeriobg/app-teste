# Estado da Esteira

| Etapa | Agente        | Status      | Ciclo | Observações |
|-------|---------------|-------------|-------|-------------|
| 1     | planner       | [APROVADO]  | 1     | PLANO.md criado: visão do produto, inventário de 7 rotas, direção de design (tokens BoardUI) e backlog priorizado — 5 Alta (A1–A5), 8 Média (M1–M8), 5 Baixa (B1–B5) + 6 riscos (R1–R6). Substitui o BACKLOG.md removido. |
| 2     | architect     | [APROVADO]  | 1     | ARQUITETURA.md criado: decisões técnicas de A1–A5, tokens novos para a tokenização, extração de PatientFormModal, regra única de safe area e ordem de execução A2 → A5 → A1 → A3 → A4 (refatorações transversais primeiro). Contratos de teste por item. |
| 3     | mobile-ui     | [REPROVADO]  | 2     | **Ciclo 1 [APROVADO]** (A2 37e40fd, A5 fd9ae31, A1 88419e1, A3+A4 5643eb8). **Ciclo 2 [REPROVADO]** — o header de `/patients` ficou com o botão "Novo Paciente" transbordando a tela em 360–375pt: o container do título não tinha `flexShrink`/`minWidth: 0`. Causa: nenhuma invariante de layout existia na esteira (ver AUDITORIA.md). Corrigido no ciclo 2 com o gate `npm run validate:layout`. |
| 4     | qa-vision     | [REPROVADO]  | 2     | **Ciclo 1 [APROVADO]** — QA.md validou A1–A5 (142/142 testes, cobertura 89–96%), mas **só de forma estática**: nenhum aparelho foi testado e o critério de A5 cobria só posição vertical, não transbordo horizontal. **Ciclo 2 [REPROVADO]** — a auditoria (AUDITORIA.md) mostrou 4 falhas de processo: item de backlog errado (M1 ficou fora do escopo), QA validando só o que foi pedido, ausência de gate de layout e a skill mobile-designer não carregada pela etapa 3. |
| 5     | release-prep  | [APROVADO]  | 1     | eas.json regredido restaurado do HEAD (risco R1 resolvido) — valida com `npm run validate:eas` ✅. app.json conferido: name/slug/version/orientation/scheme/bundleIdentifier/package/buildNumber/versionCode/projectId/owner, todos os 6 assets presentes. expo-doctor 20/20. RELEASE.md reescrito com checklist marcado (5 etapas, não 4) e comandos reais. Secret EXPO_TOKEN e variable EAS_BUILD_ENABLED confirmados no GitHub. Build continua MANUAL por decisão do usuário. |

## Relatório de bugs do QA (preenchido pela etapa 4 quando [REPROVADO])

### Ciclo 2 — [REPROVADO]

**DEF-3 (severidade alta)** — Header de `/patients` com o botão "Novo Paciente"
transbordando a borda direita da tela em aparelhos de 360–375pt.

- **Onde:** `src/app/patients.tsx` — o container do título (`<View>` sem `style`)
  dentro do `row` do header não tinha `flexShrink`/`minWidth: 0`.
- **Por que o ciclo 1 não pegou:** ver `AUDITORIA.md`. Resumo: (1) o item que
  cobria o header ficou fora do escopo da etapa 3; (2) o QA validou apenas
  os critérios de aceite que ele mesmo escreveu, e nenhum cobria transbordo
  horizontal; (3) não existia gate de layout — o RNTL não mede geometria;
  (4) a skill `mobile-designer` não foi carregada pela etapa 3.
- **Escopo real:** 41 containers `row` com o mesmo defeito em 11 arquivos.
  Corrigidos no ciclo 2.
- **Prevenção:** novo gate `npm run validate:layout`
  (`scripts/validate-layout.mjs`), agora no CI. Ele reprova o build quando
  um filho de container `row` não pode encolher ou quando um texto em `row`
  não tem `numberOfLines`.
- **Verificado:** o gate foi testado **reintroduzindo** o bug — ele reprova
  com a mensagem exata (`patients.tsx:179`).

**Pendências do ciclo 2:** ver seção abaixo.

## Relatório de bugs do QA (ciclo 1 — aprovado)
(vazio)

A etapa 4 foi **aprovada** — os defeitos encontrados (DEF-1, DEF-2) foram
corrigidos no commit `b5a696a`. As pendências que sobraram (QA-1 a QA-6)
estão listadas em `QA.md` e não bloqueiam o release: são itens de produto
(B5, M3, M4) e a pendência QA-5 (`eas.json`), que era da etapa 5 e **foi
resolvida** — o `eas.json` foi restaurado e validado.

## Pendências registradas pela etapa 4

| # | Pendência | Destino | Status |
|---|-----------|---------|--------|
| QA-1 | `textTertiary` (#94A3B8) com contraste 2,56:1 — abaixo de WCAG AA | Item B5 do `PLANO.md` | Aberto |
| QA-2 | `brand` (#0D9488) com contraste 3,74:1 — só passa em texto grande | Item B5 do `PLANO.md` | Aberto |
| QA-3 | Áreas de toque abaixo de 44×44 px (backBtn, logoutBtn, iconAction, iconBtn, viewBtn) | Itens M1–M8 / nova rodada | Aberto |
| QA-4 | Seed de demonstração impede ver o primeiro uso real | Item de produto | Aberto |
| QA-5 | `eas.json` regredido | Etapa 5 (release-prep) — risco R1 | ✅ Resolvido |
| QA-6 | Duplicidade da lista de prontuários entre `details.tsx` e `reports.tsx` | Item M3 do `PLANO.md` | Aberto |

## Correções de processo (ciclo 2 — auditoria da esteira)

| # | Correção | Onde | Status |
|---|----------|------|--------|
| P1 | **Gate de layout** — reprova quando um filho de `row` não pode encolher ou quando um texto em `row` não tem `numberOfLines` | `scripts/validate-layout.mjs`, `npm run validate:layout`, CI | ✅ Implementado |
| P2 | **Etapa 4 passa a ter 2 fases** — 4a estática (critérios + invariantes + gates) e **4b em aparelho** (as 7 rotas em 2 larguras). Sem a 4b, a etapa 4 **não pode** ser `[APROVADO]` | Regra da esteira | ⏳ Falta a 4b (precisa do aparelho) |
| P3 | **Todo item de UI carrega a skill `mobile-designer`** e registra quais regras aplicou | `AGENTS.md` | ⏳ Pendente |
| P4 | **Item de backlog transversal** — "nenhum elemento transborda a largura da tela" (T7), aplicável a todas as rotas | `PLANO.md` | ⏳ Pendente |
| P5 | **Critérios de aceite de UI** revisados independentemente dos itens — uma lista de invariantes que vale para toda tela | `PLANO.md` | ⏳ Pendente |

## Riscos do PLANO.md após a esteira

| # | Risco | Status |
|---|-------|--------|
| R1 | `eas.json` regredido | ✅ Resolvido (etapa 5) |
| R2 | Cobertura só protege 2 arquivos | ✅ Resolvido (etapa 4 — agora 7 telas) |
| R3 | `BACKLOG.md` removido | ✅ Resolvido (etapa 1 — `PLANO.md` é a nova fonte) |
| R4 | `android/` existe localmente | ⚠️ Segue — não editar (projeto CNG) |
| R5 | Seed fixa de 2 pacientes | ⚠️ Segue — ver QA-4 |
| R6 | Login sem senha (single-user local) | ⚠️ Segue — dívida de produto |