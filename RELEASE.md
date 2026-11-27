# 🚀 Checklist de Release (manual)

> O build do PsiApp é **manual**. Nenhum `eas build` roda sozinho no CI:
> o job `build-preview` só dispara em execução manual (Actions → Run workflow)
> e com a variable `EAS_BUILD_ENABLED = true`.
>
> Estado da esteira: `WORKFLOW_STATE.md`.

---

## 🔑 Senha inicial (primeiro acesso)

- E-mail: `psicologo@psicowave.com`
- Senha padrão: **`PsiApp2026`**
- Ao entrar, abra **Perfil → Segurança → Alterar senha**. A troca gera um
  **código de recuperação de 6 dígitos** exibido uma única vez — guarde-o em
  local seguro. Sem servidor/e-mail, é o único caminho de recuperação.
- A senha nunca é salva em texto puro: SHA-256 com salt, em chave separada
  do banco (fora do backup JSON).
- **Quem usava o app antes da senha:** ao atualizar, a sessão antiga é
  descartada e o app abre no login (os dados de pacientes/prontuários ficam
  intactos). Entre com a senha padrão acima.

---

## 1. Antes do build

### Esteira e qualidade

- [x] **Etapas 1–4 `[APROVADO]`** em `WORKFLOW_STATE.md`
- [x] `npx tsc --noEmit` → 0 erros
- [x] `npx expo lint` → 0 erros, 0 warnings
- [x] `npx jest --ci` → 142/142, 8/8 suítes
- [x] `npx expo-doctor` → 20/20 checks passed
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
