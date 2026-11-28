# 🚀 Checklist de Release (manual)

> O build do PsiApp é **manual**. Nenhum `eas build` roda sozinho no CI:
> o job `build-preview` só dispara em execução manual (Actions → Run workflow)
> e com a variable `EAS_BUILD_ENABLED = true`.
>
> Estado da esteira: `WORKFLOW_STATE.md`.
> Distribuição interna de teste (APK Android, sem loja): `TESTE-ANDROID.md`.

---

## 🔑 Primeiro acesso (sem dados de teste)

**O app é entregue vazio:** não há usuário, paciente nem prontuário de teste.
O seed de produção (`database.json`) tem `users`, `patients` e `medicalRecords`
vazios. Os dados usados nos testes automatizados ficam isolados em
`__tests__/fixtures/database.json`.

1. Na tela de login, toque em **Cadastrar meu acesso**.
2. Informe **nome, e-mail e senha reais** (mínimo 6 caracteres).
3. Guarde o **código de recuperação de 6 dígitos** exibido uma única vez —
   sem servidor/e-mail, é o único caminho para recuperar a senha.
4. O app volta ao login: entre com o e-mail e a senha recém-cadastrados.
5. Depois, em **Perfil → Segurança → Alterar senha**, você pode trocar a senha
   (a troca gera um novo código de recuperação).

A senha nunca é salva em texto puro: SHA-256 com salt, em chave separada do
banco (fora do backup JSON). Trocar o e-mail em **Perfil** também atualiza o
e-mail de login.

> **Botão de saída do cabeçalho:** em Android/iOS não é possível "fechar" um
> app por código. O ícone de saída **encerra a sessão e volta ao login** — os
> dados locais são preservados. Para encerrar o app, use o gesto do sistema.

> Instalações antigas que tinham sessão salva antes da senha são descartadas;
> os dados de pacientes/prontuários são preservados. Para **zerar tudo**,
> limpe os dados do app no celular (ver `TESTE-ANDROID.md`).

## 🎨 Temas e aparência (Etapa 6)

- Quatro presets **claros** (sem tema escuro na v1): **Acolhimento**, **Jardim
  Calmo**, **Terracota Suave** e **Brisa Serena**.
- Acesso em **Perfil → Temas e fonte**. A prévia é aplicada só na tela; o tema
  muda de fato ao tocar em **Aplicar tema**. **Personalizado** só aceita fundos
  claros suaves (luminância ≥ 0,6 e croma ≤ 0,12) e calcula `onPrimary` por
  luminância para manter contraste AA.
- Tamanho de fonte: **Pequeno (0,9x)**, **Padrão (1,0x)** e **Grande (1,125x)**.
- O tema alcança fundo de página, botões, ícones, cards, bordas, barras de
  prontuários e tipografia. Cores de **status** (Ativo/Inativo/Arquivado)
  permanecem semânticas — não seguem a marca, por definição.
- `app.json` permanece `userInterfaceStyle: light` (sem `Appearance`/StatusBar
  dinâmica); nenhum plugin nativo novo foi necessário.

## 📄 Relatório de pacientes (PDF)

- Em **Perfil → Exportar dados**, o botão principal gera um **PDF com lista e
  resumo dos pacientes** (nome, status, e-mail, telefone e data de cadastro),
  com cabeçalho confidencial e rodapé informando que o documento foi gerado
  localmente. **Não inclui** anamneses, prontuários nem notas privadas — esses
  dados continuam apenas no PDF individual de cada paciente.
- O gerador roda 100% no aparelho (`expo-print` → base64 → arquivo no diretório
  de documentos → share sheet nativo), sem envio para servidor.
- O antigo **backup JSON** permanece como item discreto "Backup técnico (JSON)"
  para futura migração/importação. Para leitura e compartilhamento, use o PDF.

---

## 1. Antes do build

### Esteira e qualidade

- [x] **Etapas 1–5 do Ciclo 1 e 1–5 do Ciclo 2 `[APROVADO]`** em `WORKFLOW_STATE.md`
- [x] `npx tsc --noEmit` → 0 erros
- [x] `npx expo lint` → 0 erros, 0 warnings
- [x] `npx jest --ci` → 163/163, 13/13 suítes
- [x] `npm run validate:seed` → `database.json` sem dados de teste
- [x] `npx expo-doctor` → 19/20 (restam apenas mismatches de versão 58.0.x preexistentes, não bloqueantes)
- [x] `npm run validate:eas` → `eas.json` VÁLIDO (schema oficial do EAS CLI)
- [x] `npm run validate:workflow` → `ci.yml` VÁLIDO (schema oficial do GitHub)

### Identidade do app (`app.json`)

| Campo | Valor | Status |
|-------|-------|--------|
| `name` | `PsiApp` | ✅ |
| `slug` | `psi-app` | ✅ |
| `version` | `1.0.0` | ✅ |
| `orientation` | `portrait` | ✅ |
| `userInterfaceStyle` | `light` | ✅ |
| `scheme` | `psiapp` | ✅ |
| `ios.bundleIdentifier` | `com.psicowave.psiapp` | ✅ |
| `ios.buildNumber` | `1` | ✅ |
| `android.package` | `com.psicowave.psiapp` | ✅ |
| `android.versionCode` | `1` | ✅ |
| `extra.eas.projectId` | `75093bc5-2f6d-41b9-9404-dcd5f858b322` | ✅ vinculado |
| `owner` | `rogeriobg` | ✅ |

### Assets (todos presentes)

- [x] `./assets/icon.png` — ícone principal (iOS + Android)
- [x] `./assets/splash-icon.png` — splash via plugin `expo-splash-screen`
- [x] `./assets/android-icon-{foreground,background,monochrome}.png` — adaptive icon
- [x] `./assets/favicon.png` — web

### Configuração de build (`eas.json`)

- [x] `cli.version: ">= 16.0.0"` e `appVersionSource: "local"`
- [x] Perfil `base` com `node: 22.23.3` (fixa a versão do Node no build)
- [x] Perfis `development` / `preview` / `production` com `EXPO_PUBLIC_APP_VARIANT`
- [x] `preview` → APK, `distribution: internal`
- [x] `production` → AAB, `distribution: store`, `autoIncrement: true`
- [x] `submit.production` com `track: internal`, `releaseStatus: draft`, `language: pt-BR`

### GitHub (Actions)

- [x] Secret `EXPO_TOKEN` gravado
- [x] Variable `EAS_BUILD_ENABLED = true`
- [ ] **Rodar o app no celular real** via Expo Go (`npx expo start --go --clear`) — checklist da `QA.md`

---

## 2. Build manual

> Execute **localmente**, na sua máquina. Não há build automático.

```powershell
# Teste interno (APK Android, distribuição interna)
npx eas-cli@latest build --platform android --profile preview

# Produção (AAB Android + IPA iOS, para as lojas)
npx eas-cli@latest build --platform all --profile production
```

Alternativa pelo GitHub (build na nuvem, ~30 min):

1. Actions → **EAS Build (preview)** → **Run workflow**
2. Acompanhar o job `build-preview` (só roda com `EAS_BUILD_ENABLED = true`)

Builds de produção concluídos anteriormente:
`d853a5cb-3c25-4b74-94b6-fd155e1da350` · `9fe1a11c-f7ed-41e8-b307-d9e835c80031`

### Primeira build local (necessita token)

```powershell
npm run eas:setup      # grava o EXPO_TOKEN (digitação mascarada, valida antes)
npm run eas:check-token
```

---

## 3. Depois do build

- [ ] Instalar o APK no aparelho e testar o fluxo principal:
  login → dashboard → pacientes → prontuário → exportar PDF → perfil
- [ ] Confirmar que os dados persistem entre reaberturas do app
- [ ] Conferir o ícone e o splash na tela inicial do sistema
- [ ] Testar o PDF gerado (abrir o arquivo compartilhado)
- [ ] Só então `eas submit` (se for publicar):

```powershell
npx eas-cli@latest submit --profile production --platform android
```

---

## 4. Pendências conhecidas (não bloqueiam o release)

| # | Item | Gravidade | Onde |
|---|------|-----------|------|
| QA-1 | `textTertiary` (#94A3B8) com contraste 2,56:1 — abaixo de WCAG AA | Média | Item B5 do `PLANO.md` |
| QA-2 | `brand` (#0D9488) com contraste 3,74:1 — só passa em texto grande | Média | Item B5 do `PLANO.md` |
| QA-3 | Áreas de toque abaixo de 44×44 px (`backBtn`, `logoutBtn`, `iconAction`, `iconBtn`, `viewBtn`) | Média | Itens M1–M8 |
| QA-4 | Seed de demonstração sempre presente — o primeiro uso real nunca aparece | Baixa | Produto |
| QA-6 | Duas listas de prontuários para o mesmo paciente (`details.tsx` + `reports.tsx`) | Média | Item M3 do `PLANO.md` |

> R1 (`eas.json` regredido) e R2 (cobertura parcial) foram **resolvidos**:
> `eas.json` restaurado em `f0e1c47` e `coverageThreshold` agora cobre 7 telas.

---

Última atualização: Etapa 5 (release-prep) — 2026-11-26.
