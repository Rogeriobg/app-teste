# Estado da Esteira

| Etapa | Agente        | Status      | Ciclo | Observações |
|-------|---------------|-------------|-------|-------------|
| 1     | planner       | [APROVADO]  | 1     | PLANO.md criado: visão do produto, inventário de 7 rotas, direção de design (tokens BoardUI) e backlog priorizado — 5 Alta (A1–A5), 8 Média (M1–M8), 5 Baixa (B1–B5) + 6 riscos (R1–R6). Substitui o BACKLOG.md removido. |
| 2     | architect     | [APROVADO]  | 1     | ARQUITETURA.md criado: decisões técnicas de A1–A5, tokens novos para a tokenização, extração de PatientFormModal, regra única de safe area e ordem de execução A2 → A5 → A1 → A3 → A4 (refatorações transversais primeiro). Contratos de teste por item. |
| 3     | mobile-ui     | [APROVADO]  | 1     | A2 tokenização (37e40fd), A5 safe area (fd9ae31), A1 editar paciente funcional (88419e1), A3 busca por telefone + A4 estado vazio contextual (5643eb8). Novo PatientFormModal compartilhado; 140/140 testes, tsc e lint limpos. |
| 4     | qa-vision     | [APROVADO]  | 1     | QA.md criado: A1–A5 validados contra o critério de aceite — 142/142 testes, tsc/lint limpos, cobertura patients 96,5% · profile 92,8% · details 89,4%. 2 defeitos corrigidos (DEF-1 botão × visível com campo vazio; DEF-2 desalinhamento do ×). 6 pendências: contraste textTertiary 2,56:1 (B5), brand 3,74:1, áreas de toque <44px, seed de demo, eas.json regredido (R1), duplicidade de prontuários (M3). |
| 5     | release-prep  | [PENDENTE]  | 0     | Restaurar o eas.json regredido (R1) via git show HEAD:eas.json, validar app.json e entregar checklist de build manual. |

## Relatório de bugs do QA (preenchido pela etapa 4 quando [REPROVADO])
(vazio)

A etapa 4 foi **aprovada** — os defeitos encontrados (DEF-1, DEF-2) foram
corrigidos no commit `b5a696a`. As pendências que sobraram (QA-1 a QA-6)
estão listadas em `QA.md` e não bloqueiam o release: são itens de produto
(B5, M3, M4) e a pendência QA-5 (`eas.json`), que é da etapa 5.

## Pendências registradas pela etapa 4

| # | Pendência | Destino |
|---|-----------|---------|
| QA-1 | `textTertiary` (#94A3B8) com contraste 2,56:1 — abaixo de WCAG AA | Item B5 do `PLANO.md` |
| QA-2 | `brand` (#0D9488) com contraste 3,74:1 — só passa em texto grande | Item B5 do `PLANO.md` |
| QA-3 | Áreas de toque abaixo de 44×44 px (backBtn, logoutBtn, iconAction, iconBtn, viewBtn) | Itens M1–M8 / nova rodada |
| QA-4 | Seed de demonstração impede ver o primeiro uso real | Item de produto |
| QA-5 | `eas.json` regredido | **Etapa 5 (release-prep)** — risco R1 |
| QA-6 | Duplicidade da lista de prontuários entre `details.tsx` e `reports.tsx` | Item M3 do `PLANO.md` |