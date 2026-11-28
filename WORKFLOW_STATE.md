# Estado da Esteira

> **Regra de aprovação (rígida, ciclo 5):** `[APROVADO]` significa
> **nenhum bug aberto de severidade alta ou média atribuído à etapa**.
> Um ciclo verificado não basta — bugs antigos não podem ficar "para trás"
> enquanto se propõe nova funcionalidade.
>
> Bugs de severidade baixa podem ficar abertos, mas precisam estar
> listados no **Gate de release** abaixo. Enquanto houver qualquer bug
> **alto/médio** aberto, a etapa correspondente fica `[REPROVADO]` e
> **nenhuma nova feature entra na esteira**.

| Etapa | Agente        | Status      | Ciclo | Observações |
|-------|---------------|-------------|-------|-------------|
| 1     | planner       | [APROVADO]  | 2     | **R6 (login sem senha) RESOLVIDO** — senha com hash, cadastro de e-mail/senha reais e recuperação por código (ver seção "Senha do usuário"). QA-4/R5 era baixo e não bloqueava. `PLANO.md` segue como fonte de escopo. |
| 2     | architect     | [APROVADO]  | 1     | ARQUITETURA.md: decisões técnicas de A1–A5, tokens novos, extração de PatientFormModal, regra única de safe area e ordem de execução. **Nenhum bug aberto atribuído a esta etapa.** |
| 3     | mobile-ui     | [APROVADO]  | 6     | Histórico: A1–A5 entregues; DEF-3/DEF-5/DEF-6 corrigidos e confirmados no aparelho. **Ciclo 5/6 — todos os bugs médios zerados**: QA-3 (10 alvos → 44px + `validate:touch`), QA-1/QA-2 (`textMuted` 4,76:1, `brandText` 5,21:1 + `validate:contrast`), QA-6 (`details.tsx` fonte única, `reports.tsx` redirect). 129 testes, 4 gates e tsc/lint limpos. |
| 4     | qa-vision     | [APROVADO]  | 6     | Histórico: QA.md, AUDITORIA.md, QA-4B.md e fase 4c executada no aparelho. As aprovações anteriores foram revertidas enquanto havia bugs abertos; agora **zero bugs médios/alto** → `[APROVADO]` legítimo, com gate de release desbloqueado e 4 gates automáticos no CI. |
| 5     | release-prep  | [APROVADO]  | 1     | eas.json restaurado (R1) e validado; app.json e 6 assets conferidos; expo-doctor 19/20 (só mismatches 58.0.x preexistentes); RELEASE.md com checklist das 5 etapas + temas + senha + PDF; EXPO_TOKEN e EAS_BUILD_ENABLED confirmados. **R4 (`android/` local) fica como observação — não é bug de build.** |

---

## 🔐 Senha do usuário (pedido do usuário, fora do Ciclo 2)

**CONCLUÍDO** — R6 do `PLANO.md` resolvido.

- Decisões fechadas com o usuário: senha padrão + troca no Perfil; recuperação por código local de 6 dígitos.
- `expo-crypto` instalado: SHA-256 com salt aleatório por instalação. Credenciais em chave separada do banco (`@psi_app_auth_v1`), fora do backup JSON.
- `AppContext`: `login(email, senha)`, `checkPassword`, `changePassword`, `ensureAuth`.
- Telas: campo de senha com mostrar/ocultar + "Esqueci minha senha" (`/recover-password`); Perfil → Segurança → Alterar senha, com código de 6 dígitos exibido uma única vez.
- **Correção de migração (feedback do aparelho):** instalações antigas com `@psi_app_current_user_v1` entravam no dashboard e pulavam a senha. Novo marcador `@psi_app_session_v1` — só uma sessão que passou pelo `login()` restaura o usuário; `currentUser` começa `null` e `index.tsx` espera `authReady` (sem flash de login). O banco de dados é preservado, apenas a sessão antiga é descartada.
- `ProfileScreen` passou a derivar nome/e-mail do `currentUser` (estado de edição separado) porque a sessão agora chega de forma assíncrona — o campo não fica mais vazio se a tela montar antes da carga.
- **Cadastro de e-mail/senha reais (pedido do usuário):** nova rota `/register` acessível por "Cadastrar meu acesso" no login (só enquanto a senha padrão está ativa). Substitui o usuário do seed por nome/e-mail reais, salva a senha com hash, gera código de recuperação exibido uma única vez e volta ao login (não cria sessão). `registerUser()` no `AppContext`. Corrigido `updateUser()` para também atualizar `db.users` — trocar e-mail no Perfil agora reflete no login. Novo helper `mockAsyncStorage()` nos testes.
- **Exportação de pacientes em PDF (pedido do usuário):** Perfil → Exportar dados agora tem "Exportar dados (PDF)" como ação principal e "Backup técnico (JSON)" como item discreto. Novos `src/services/pdf.ts` (escape HTML, geração via base64 em `Paths.document`, share sheet com fallback para preview) e `src/services/patientsReport.ts` (HTML puro, testável: resumo + tabela, sem anamneses/prontuários/notas privadas, aviso CONFIDENCIAL). Decisões fechadas com o usuário: só lista+resumo; campos nome/status/e-mail/telefone/cadastro; JSON mantido como backup. 5 testes novos. Fluxo do prontuário individual (`export-pdf.tsx`) permanece intacto — já validado no aparelho, não foi refatorado.
- 163/163 testes, tsc/lint e 7 gates limpos (inclusive o novo `validate:seed`). Testeável no Expo Go (`expo-crypto` é suportado).
- **Seed removido (pedido do usuário):** `database.json` agora tem `users`, `patients` e `medicalRecords` **vazios** — o app é entregue sem usuário/paciente de teste. Os dados de teste foram movidos para `__tests__/fixtures/database.json` e mapeados no `jest.config.js`, então os 163 testes seguem verdes. `registerUser()` cria o psicólogo do zero quando não há usuário (primeiro acesso = "Cadastrar meu acesso"), e o link de cadastro também aparece se `db.users` estiver vazio. Novo teste cobre a criação de usuário em instalação limpa; novo gate `npm run validate:seed` (no CI) impede que um seed com dados de teste volte. `RELEASE.md` e `TESTE-ANDROID.md` documentam o primeiro acesso e como zerar os dados no celular.
- **Fase 4c desta feature — CONCLUÍDA no aparelho:** usuário confirmou que o **PDF abriu corretamente no celular** via Expo Go (share sheet → arquivo legível com a lista/resumo). Gate de módulo nativo desta entrega fechado. A validação visual de temas/cards e a checagem de senha no aparelho também foram aprovadas pelo usuário — ver Gate do Ciclo 2 **DESBLOQUEADO** abaixo.

---

## 📱 Ciclo 4 — bugs do APK instalado (aparelho real)

Usuário gerou o APK (`eas build --profile preview`), instalou, fez o cadastro,
testou "Esqueci minha senha" com o código de recuperação e entrou com a nova
senha — fluxo de autenticação **aprovado no aparelho**. Três defeitos visuais
/ funcionais foram reportados e corrigidos:

| ID | Severidade | Defeito | Correção | Verificação |
|---|---|---|---|---|
| BUG-7 | **alta** | Modais ("Alterar senha" e "Novo Paciente") abriam no topo e desciam para o centro ao abrir o teclado; últimos campos ficavam cobertos | `AppModal`: overlay `justifyContent: 'flex-start'`, safe area explícita por borda, `animationType: 'fade'`, conteúdo em `ScrollView` com `keyboardShouldPersistTaps` | Gate `validate:layout` estendido (testado com regressão: reprova `center`) |
| BUG-8 | média | Botão "Cadastrar paciente" da dashboard com verde fixo, sem acompanhar o tema | `css.primaryBg` / `css.onPrimary` e seta com `c.onPrimary`; novo `css.onPrimary` em `useThemeStyles()` | Gate `validate:layout` estendido |
| BUG-9 | média | Botão de saída do header não voltava ao login e o nome virava "Dr(a). Psicólogo(a)" | `logout()` agora chama `router.replace('/login')` **antes** de limpar `currentUser` (evita flash do placeholder). Em mobile não existe "fechar app": o botão encerra a sessão | Teste em `AppContext-test` (router.replace) |

**Status: [APROVADO]** — usuário confirmou que os três itens foram resolvidos
no último build instalado. Zero bugs alto/médio abertos: a esteira está livre
para receber a Etapa 7. 163/163 testes, tsc/lint e 7 gates limpos.

---

## 📅 Etapa 7 — Agenda do psicólogo (em execução)

Planejamento em `ANALISE-ETAPA7.md`; decisões DP1–DP6 fechadas com o usuário.
Esteira desbloqueada após o Ciclo 4 ser aprovado no APK.

| Item | Status | Evidência |
|---|---|---|
| **G1 — Modelo + persistência** | **[APROVADO]** | `Appointment` + `NewAppointment` no `AppContext`; `appointments: []` no seed e no fixture; migração de bancos antigos sem o campo; CRUD (`addAppointment`, `updateAppointment`, `removeAppointment`); agenda exportada no backup JSON; 5 testes novos |
| G2 — Tela `/agenda` | [PENDENTE] | — |
| G3 — Formulário com `DateTimePicker` | [PENDENTE] | — |
| G4 — Lembrete local (5 min, configurável) | [PENDENTE] | — |
| G5 — Nível Atenção (som + visual) | [PENDENTE] | — |
| G6 — Privacidade (texto genérico fixo) | [PENDENTE] | — |
| G7 — Permissão no 1º agendamento | [PENDENTE] | — |
| G8 — Integração com paciente | [PENDENTE] | — |
| G9 — Status pós-sessão | [PENDENTE] | — |
| G10 — Backup JSON | [PARCIAL] | G1 já inclui `appointments` no JSON exportado |

Verificação do G1: 168/168 testes (13 suítes), tsc/lint limpos, 7 gates válidos.
Nenhum módulo nativo novo foi tocado neste item — Fase 4c não se aplica ainda.

---

# ♻️ Ciclo 2 — Etapa 6: Temas e Aparência

> Iniciado em 2026-11-27 após o Ciclo 1 fechar com gate **DESBLOQUEADO**.
> Esta é a **mesma esteira de 5 etapas**, reaplicada à Etapa 6 do `PLANO.md`.
> O histórico do Ciclo 1 acima fica intacto.
>
> Análise de viabilidade: `ANALISE-ETAPA6.md` — **viável com 6 correções**.
> Decisões do architect (D1–D3) **pré-resolvidas pela análise**, mas sujeitas
> a confirmação formal na etapa 2 deste ciclo.
>
> **Decisão de produto (2026-11-27): tema escuro FORA do escopo.**
> 4 presets claros apenas; `app.json` permanece `light`; sem
> `Appearance.setColorScheme`, sem StatusBar dinâmica e sem splash variante
> dark. R13 eliminado; R14 adicionado (Personalizado não pode permitir fundo
> escuro, senão o problema volta pela porta dos fundos).

| Etapa | Agente | Status | Ciclo | Observações |
|-------|--------|--------|-------|-------------|
| 1 | planner | [APROVADO] | 2 | Proposta validada (`ANALISE-ETAPA6.md` + `PLANO.md`): 6 ajustes técnicos aceitos, tema escuro fora, 3 decisões fechadas (DP1 4 presets claros, DP2 Personalizado só fundo claro, DP3 prévia com ThemeScope). Definidos 4 marcos (M1 base → M2 migração → M3 interface → M4 personalização) e 5 regras de produto (escala 0,9/1,0/1,125; fundo luminância ≥0,6 e saturação ≤25%; onPrimary calculado; prévia fidedigna só após M2; entrada no /profile com 44px). Inventário corrigido: 8 rotas, /reports é redirect. |
| 2 | architect | [APROVADO] | 2 | `ARQUITETURA-ETAPA6.md`: D1 AsyncStorage + SplashScreen (MMKV fora — Expo Go), D2 `reanimated-color-picker@5.2.0` é Pure JS e peers reanimated 4.8/gesture-handler 3.5 OK (instalar só no M4, com plano B swatches), D3 migração componente a componente. Definidos `ThemeScope`, `onPrimary` derivado com propriedade matemática ≥4,5:1, `isSoftLightBackground` (luminância ≥0,6 + saturação ≤25%), escala de fonte 0,9/1,0/1,125, StatusBar fixa `'dark'`, evolução dos gates e 4 marcos. |
| 3 | mobile-ui | [APROVADO] | 2 | **M1** P1/P4/P3/P5 (fundação, 11 testes). **M2** P2 (10 componentes + 8 rotas com overrides; `applyTheme()` atômico corrigiu gravação parcial da fonte). **M4** P8: `reanimated-color-picker@5.3.0` instalado (peers reanimated 4.8, gesture-handler 3.5 e worklets adicionados ao package.json — `expo-doctor` voltou a 19/20,只剩下 mismatches de patch preexistentes 58.0.x vs 58.1.x). Seletor aparece ao tocar "Personalizado", com limites: fundo exige luminância ≥0,6 e croma ≤0,12 (R14) e primária sempre com `onPrimary` legível. Gates de toque/layout pegaram cards `width:'30%'` na tela nova e foram corrigidos. 145 testes (11 suítes), tsc/lint e 6 gates limpos. |
| 4 | qa-vision | [APROVADO] | 2 | **Fase 4c concluída no aparelho.** Usuário aprovou o visual dos temas/cards e a checagem da senha no celular. Correções das 3 rodadas anteriores validadas: `patientRow`/`emptyCard` do dashboard, `headerCard` do perfil, `patientCard`/`emptyCard` da lista e `RecordCard` dos prontuários usam `css.cardTint`/`css.cardBorder`; avatar/botão do perfil, barras do `StatSummary`, badge "Ativo" e ícones de ação seguem a primária. `StatusBadge` semântico permanece. 162 testes, tsc/lint/6 gates limpos. |
| 5 | release-prep | [APROVADO] | 2 | **`app.json` inalterado** (`userInterfaceStyle: light`); nenhum plugin nativo novo (D2: `reanimated-color-picker` é Pure JS); `RELEASE.md` documenta os 4 presets (Acolhimento, Jardim Calmo, Terracota Suave, Brisa Serena), as 3 escalas de fonte, a senha e o relatório PDF. Números de testes/doctor atualizados (163/163; 7 gates; doctor 19/20 só com mismatches preexistentes). |

### Gate do Ciclo 2 — **DESBLOQUEADO**

| # | Verificação | Status |
|---|-------------|--------|
| G1 | `validate:contrast` estendido — **4 presets** × fundo próprio × `onPrimary` | ✅ Criado e verde |
| G2 | `validate:font-scale` — 3 escalas conservadoras (limite 360dp) | ✅ Criado e verde; medição visual 360/430 aprovada no aparelho (G5) |
| G3 | `validate:touch` — 44px | ✅ Reutilizado e verde |
| G4 | `validate:workflow` | ✅ Reutilizado e verde |
| G5 | Fase 4c — temas/cards + senha no aparelho real | ✅ Aprovado pelo usuário |

**Regra:** se qualquer bug **médio/alto** deste ciclo ficar aberto, o gate volta a
`BLOQUEADO` e nenhum item novo entra — mesma regra do Ciclo 1.

---

## 🚦 Gate de release (Ciclo 1) — **DESBLOQUEADO**

> Todos os bugs de severidade alta e média foram resolvidos. Os itens
> baixos seguem listados, mas não bloqueiam a esteira.
>
> Este campo é o verificador único: se algum bug alto/médio reaparecer,
> o gate volta a `BLOQUEADO` e nenhuma nova feature entra.

| Bug | Severidade | Etapa responsável | Status | Bloqueia? |
|-----|-----------|-------------------|--------|-----------|
| DEF-5 — exportar PDF (3 causas) | Alta | 3 mobile-ui | ✅ Resolvido e confirmado no aparelho (5c0c3af) | Não |
| DEF-6 — botão "Novo Paciente" esticava no Yoga | Alta | 3 mobile-ui | ✅ Resolvido e confirmado no aparelho (2373ef3) | Não |
| DEF-3 — header transbordando em 360–375pt | Alta | 3 mobile-ui | ✅ Resolvido (f4c5270) | Não |
| DEF-4 — ciclo de require no barrel | Média | 3 mobile-ui | ✅ Resolvido (edb1719) | Não |
| **QA-3 — áreas de toque < 44px** (`backBtn` 40, `iconAction` 34, `iconBtn` ~38, `viewBtn` ~30) | **Média** | 3 mobile-ui | ✅ **Resolvido** — 10 alvos corrigidos para 44px + gate `validate:touch` | Não |
| **QA-1 — contraste `textTertiary` 2,56:1** (abaixo de WCAG AA 4,5:1) | **Média** | 3 mobile-ui | ✅ **Resolvido** — `textMuted` 4,76:1 + gate `validate:contrast` | Não |
| **QA-2 — contraste `brand` 3,74:1** (só passa em texto grande) | **Média** | 3 mobile-ui | ✅ **Resolvido** — `brandText` 5,21:1 + gate `validate:contrast` | Não |
| **QA-6 — duas listas de prontuários com CRUD duplicado** | **Média** | 3 mobile-ui | ✅ **Resolvido** — `details.tsx` é a fonte única; `reports.tsx` virou redirect | Não |
| QA-4/R5 — seed fixa impede ver o primeiro uso real | Baixa | 1 planner | ⚠️ Aberto | Não |
| R6 — login sem senha (single-user local) | Baixa | 1 planner | ⚠️ Aberto | Não |
| R4 — `android/` existe localmente (CNG) | Baixa | 5 release-prep | ⚠️ Observação | Não |

**Resultado do gate: zero bugs médios/alto abertos → DESBLOQUEADO.**

### Correções aplicadas na fila de bloqueio

1. ~~**QA-3** — areas de toque~~ ✅ gate `validate:touch`
2. ~~**QA-1/QA-2** — contraste~~ ✅ gate `validate:contrast`
3. ~~**QA-6** — duplicidade de prontuários~~ ✅ `details.tsx` virou fonte
   única de listagem/CRUD; `reports.tsx` só redireciona (`router.replace`)
   para manter links antigos funcionando; a ação "Ver prontuários" virou
   "Nova sessão" (atalho real, sem duplicar conteúdo).

Com isso, a esteira está pronta para **reabrir** — mas nenhum novo item
deve ser iniciado sem antes confirmar o gate no aparelho real (fase 4c).

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
| QA-1 | `textTertiary` (#94A3B8) com contraste 2,56:1 — abaixo de WCAG AA | Item B5 do `PLANO.md` | ✅ Resolvido — `textMuted` |
| QA-2 | `brand` (#0D9488) com contraste 3,74:1 — só passa em texto grande | Item B5 do `PLANO.md` | ✅ Resolvido — `brandText` |
| QA-3 | Áreas de toque abaixo de 44×44 px (backBtn, logoutBtn, iconAction, iconBtn, viewBtn) | Itens M1–M8 / nova rodada | Aberto |
| QA-4 | Seed de demonstração impede ver o primeiro uso real | Item de produto | Aberto |
| QA-5 | `eas.json` regredido | Etapa 5 (release-prep) — risco R1 | ✅ Resolvido |
| QA-6 | Duplicidade da lista de prontuários entre `details.tsx` e `reports.tsx` | Item M3 do `PLANO.md` | Aberto |

## Correções de processo (ciclo 2 — auditoria da esteira)

| # | Correção | Onde | Status |
|---|----------|------|--------|
| P1 | **Gate de layout** — reprova quando um filho de `row` não pode encolher ou quando um texto em `row` não tem `numberOfLines` | `scripts/validate-layout.mjs`, `npm run validate:layout`, CI | ✅ Implementado |
| P2 | **Etapa 4 passa a ter 3 fases** — 4a estática (critérios + invariantes + gates), 4b no web renderizado (7 rotas em 2 larguras + console) e **4c no aparelho real** (o usuário percorre o fluxo principal). Sem a 4c, a etapa 4 **não pode** ser `[APROVADO]` | Regra da esteira | ✅ **4c executada** — exportação de PDF e layout confirmados no aparelho |
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