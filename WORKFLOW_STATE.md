# Estado da Esteira

| Etapa | Agente        | Status      | Ciclo | Observações |
|-------|---------------|-------------|-------|-------------|
| 1     | planner       | [APROVADO]  | 1     | PLANO.md criado: visão do produto, inventário de 7 rotas, direção de design (tokens BoardUI) e backlog priorizado — 5 Alta (A1–A5), 8 Média (M1–M8), 5 Baixa (B1–B5) + 6 riscos (R1–R6). Substitui o BACKLOG.md removido. |
| 2     | architect     | [APROVADO]  | 1     | ARQUITETURA.md criado: decisões técnicas de A1–A5, tokens novos para a tokenização, extração de PatientFormModal, regra única de safe area e ordem de execução A2 → A5 → A1 → A3 → A4 (refatorações transversais primeiro). Contratos de teste por item. |
| 3     | mobile-ui     | [APROVADO]  | 4     | **Ciclo 1** A2/A5/A1/A3+A4 (37e40fd, fd9ae31, 88419e1, 5643eb8). **Ciclo 2 [REPROVADO]** DEF-3: header de `/patients` transbordando em 360–375pt (41 containers `row` em 11 arquivos) — corrigido f4c5270. **Ciclo 3 [REPROVADO]** DEF-6: `Button` com `flex: 1` no texto esticava no Yoga nativo — corrigido 2373ef3. **Ciclo 4 [APROVADO]** — DEF-5 resolvido (5c0c3af) e **confirmado no aparelho real pelo usuário**: exportação de PDF e layout do header funcionando. O gate `validate:layout` cobre as três causas (transbordo, `flex: 1` em container fixo, texto sem `numberOfLines`). |
| 4     | qa-vision     | [APROVADO]  | 4     | **Ciclo 1** QA.md (estático — lição registrada). **Ciclo 2** auditoria (AUDITORIA.md) + fase 4b (QA-4B.md, 7/7 rotas limpas em 390px; DEF-4 corrigido). **Ciclo 3 [REPROVADO]** DEF-5/DEF-6 só apareceram no aparelho real. **Ciclo 4 [APROVADO]** — fase 4c executada: o usuário percorreu o fluxo principal no celular real (login → pacientes → prontuário → **exportar PDF funcionando**) e confirmou os defeitos corrigidos. 143/143 testes, tsc/lint/validate:layout limpos. |
| 5     | release-prep  | [APROVADO]  | 1     | eas.json regredido restaurado do HEAD (risco R1 resolvido) — valida com `npm run validate:eas` ✅. app.json conferido: name/slug/version/orientation/scheme/bundleIdentifier/package/buildNumber/versionCode/projectId/owner, todos os 6 assets presentes. expo-doctor 20/20. RELEASE.md reescrito com checklist marcado (5 etapas, não 4) e comandos reais. Secret EXPO_TOKEN e variable EAS_BUILD_ENABLED confirmados no GitHub. Build continua MANUAL por decisão do usuário. |

## Relatório de bugs do QA (preenchido pela etapa 4 quando [REPROVADO])

### Ciclo 4 — [APROVADO] (fase 4c: aparelho real)

O usuário percorreu o fluxo principal **no celular real** e confirmou:

- ✅ **Exportação de PDF funcionando** — gera, salva em `Documents` com nome
  legível (`prontuario-<Paciente>.pdf`) e abre o compartilhamento
- ✅ Header de `/patients` com título e botão "Novo Paciente" lado a lado

A fase 4c era o elo que faltava: **nenhuma ferramenta automatizada
reproduz comportamento nativo** (permissão de arquivo, diálogo nativo,
FileProvider, Yoga). Dois defeitos (DEF-5, DEF-6) exigiram **três ciclos**
de correção guiada pelo relatório do usuário no aparelho.

**Regra consolidada para os próximos ciclos:** a etapa 4 só é
`[APROVADO]` com a fase 4c executada — o usuário percorrendo o fluxo
principal no aparelho real.

### Ciclo 3 — [REPROVADO] (aparelho real)

Dois defeitos reportados pelo usuário **no celular real**, que nenhuma
verificação anterior pegou:

**DEF-5 (alta) — Exportar PDF falhava** — ✅ **RESOLVIDO (5c0c3af, confirmado no aparelho)**

- **Onde:** `src/app/patients/[patientId]/export-pdf.tsx`
- **Causa raiz (1ª tentativa, incompleta):** o `Alert.alert('PDF gerado com sucesso')`
  era exibido **antes** do `shareAsync`. No Android o diálogo nativo fica
  **por cima** da tela e o share sheet aberto em seguida falha. O exemplo
  oficial do `expo-print` compartilha direto, sem alerta intermediário.
- **Causa raiz (2ª tentativa):** o erro exato do aparelho foi
  `Not allowed to read file under given url`, que vem de
  `SharingModule.getLocalFileFoUrl` → `isAllowedToRead(path)`. O
  `expo-print` grava o PDF em `<cacheDir>/Print/<uuid>.pdf` e o
  `FileProvider` do `expo-sharing` **não consegue ler** esse caminho.
- **Causa raiz (3ª tentativa, definitiva):** após a cópia, o erro mudou para
  `FileSystem.copy has been rejected: Missing 'READ' permission for
  accessing the file` — o `expo-file-system` **também** não consegue ler o
  diretório `Print/` do cache. Conclusão: **nenhum módulo** pode ler o PDF
  gerado ali; só o próprio `expo-print` (que o criou).
- **Correção final:** pedir o PDF como **base64** (`printToFileAsync({ html,
  base64: true })`) — o `expo-print` lê o próprio arquivo internamente — e
  escrever o conteúdo direto no destino com
  `destino.write(base64, { encoding: 'base64' })`. Nenhum módulo toca no
  diretório `Print/`.
- **Por que escapou:** o teste automatizado mockava o `shareAsync` (sempre
  resolvia), e o web **não reproduz** a permissão de leitura do
  `FileProvider` nem a sobreposição de diálogo nativo.

**DEF-6 (alta) — Botão "Novo Paciente" ocupava a largura toda no celular** — ✅ **RESOLVIDO (2373ef3, confirmado no aparelho)**

- **Onde:** `src/components/Button.tsx` (afeta `/patients` e `/reports`)
- **Causa raiz:** o `Button` tinha **`flex: 1` no texto**. No Yoga nativo o
  texto cresce até a largura do pai e o botão inteiro estica, empurrando o
  título para fora da tela. **No web não reproduz** (o botão tem `width: auto`
  em CSS, e o texto cede espaço) — por isso só apareceu no aparelho.
- **Correção:** `Button.text` → `flexShrink: 1` + `minWidth: 0`;
  `Button.container` → `flexBasis: auto`, `flexGrow: 0`, `flexShrink: 0`.
- **Medição após a correção** (390px): título 20→223 (203px), botão 223→370
  (147px), `flex: 0 0 auto` — dentro da tela.
- **Prevenção:** o gate `validate:layout` ganhou a regra *"`flex: 1` dentro de
  container fixo"*, testada reintroduzindo o bug.

> **Lição de processo:** três defeitos seguidos (DEF-3, DEF-5, DEF-6) só
> apareceram no **aparelho real**. O web e os testes automatizados **não são
> suficientes** para layout e para comportamento nativo. A fase 4b precisa
> incluir o aparelho do usuário como etapa obrigatória, não apenas o web.

> **Lição técnica (módulos nativos do Expo):** o diretório
> `<cacheDir>/Print/` onde o `expo-print` grava PDFs **não é legível** por
> nenhum outro módulo — nem o `expo-sharing` (`FileProvider`), nem o
> `expo-file-system`. Só o próprio `expo-print` acessa. O padrão correto é
> `printToFileAsync({ base64: true })` + `File.write(base64,
> { encoding: 'base64' })` no `Paths.document`, e compartilhar a partir
> dali. Registrado como invariante em `AGENTS.md` (seção Layout/nativos).

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
| P2 | **Etapa 4 passa a ter 3 fases** — 4a estática (critérios + invariantes + gates), 4b no web renderizado (7 rotas em 2 larguras + console) e **4c no aparelho real** (o usuário percorre o fluxo principal). Sem a 4c, a etapa 4 **não pode** ser `[APROVADO]` | Regra da esteira | ✅ **4c executada no ciclo 4** — exportação de PDF e layout confirmados no aparelho |
| P3 | **Todo item de UI carrega a skill `mobile-designer`** e registra quais regras aplicou | `AGENTS.md` | ✅ Implementado |
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