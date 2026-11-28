# 📲 Testar no Android com APK (sem Google Play)

> O build é **manual**: nenhum `eas build` é executado por agente ou pelo CI automático.
> Esta é a forma de gerar um `.apk` instalável e enviá-lo para qualquer celular Android.

---

## 1. Quem gera o APK (no computador)

Pré-requisitos:

- Conta **Expo gratuita** em <https://expo.dev/signup>. O plano gratuito permite
  builds limitados por mês (fila de baixa prioridade); as cotas resetam todo mês.
  Consulte <https://expo.dev/pricing> para o limite atual.
- **Não é preciso conta do Google Play** nem publicar na loja.

```bash
# 1) entrar na conta Expo (uma vez por máquina)
npx eas-cli@latest login

# 2) gerar o APK de teste
npm run eas:build:preview
```

O script já aponta para o perfil correto:

```json
"preview": {
  "extends": "base",
  "distribution": "internal",
  "android": { "buildType": "apk" }
}
```

`distribution: internal` + `buildType: apk` é exatamente o que o EAS exige para
gerar um APK instalável (um AAB só serve para a Play Store).

### 3) Pegar o link ou o arquivo

Ao terminar, o CLI mostra o link do build. No dashboard do projeto:

**Build details → Build artifact → Install**

- aparece um **QR code** e uma **URL do APK** — copie a URL; ou
- baixe o `.apk` no computador e envie o arquivo.

Envie o link ou o arquivo por WhatsApp, e-mail, Drive, etc.

---

## 2. Quem instala (no celular Android)

1. Abra o link no navegador do celular (ou receba o `.apk`).
2. Quando o Android pedir, permita **"Instalar aplicativos desconhecidos"**
   para o navegador/app de arquivos que abriu o link.
   - Configurações → Apps → Navegador usado → Instalar apps desconhecidos → Permitir.
3. Toque em **Instalar** e abra o **PsiApp**.
4. Entre com o e-mail e a senha cadastrados no app
   (ou com a senha padrão, se ainda não trocou).

> Se o Play Protect bloquear: abra o Play Store → Play Protect → desative a
> verificação por um momento, instale e reative depois.

---

## Observações importantes

| Item | Detalhe |
|---|---|
| **Link público** | Por padrão, qualquer pessoa com a URL baixa o APK. Para exigir login com conta Expo, desative **"Unauthenticated access to internal builds"** em *Project settings* no expo.dev. |
| **Atualizações** | Cada mudança de código exige um **novo build** — não há OTA (EAS Update) configurado neste projeto. |
| **Assinatura** | O EAS gerencia o keystore. Use sempre o mesmo `android.package` (`com.psicowave.psiapp`) para instalar uma versão nova sobre a anterior sem perder os dados locais. |
| **Dados** | O banco é local (AsyncStorage). Atualizar o APK sobre o anterior preserva pacientes e prontuários; desinstalar apaga tudo. |
| **CI** | O job `EAS Build (preview)` do GitHub Actions também existe, mas depende do job de qualidade. Use o comando local acima para não depender disso. |

---

## 🧹 Zerar os dados de teste no celular

O app é **local-first**: tudo fica no AsyncStorage do próprio app. Não existe
botão "limpar banco" na interface — para começar do zero:

**Se você usa Expo Go:**

1. Android: **Configurações → Apps → Expo Go → Armazenamento → Limpar dados**
   (ou desinstale e reinstale o Expo Go).
2. iPhone: desinstale o Expo Go e reinstale (não há "limpar dados" por app no iOS).
3. Abra o app de novo: a tela de login aparece com **Cadastrar meu acesso**.

> Isso apaga **todos** os projetos salvos no Expo Go, não só o PsiApp.

**Se você instalou o APK standalone:**

1. **Configurações → Apps → PsiApp → Armazenamento → Limpar dados**; ou
2. desinstale e reinstale o APK.
3. O próximo acesso é o cadastro do seu e-mail/senha reais.

⚠️ Isso apaga **pacientes e prontuários** que você cadastrou nos testes.
Se quiser guardar algo antes, use **Perfil → Exportar dados (PDF)** ou o
backup JSON.

---

## Solução de problemas

- **`expo-doctor` acusa versões desatualizadas** (situação atual: 19/20, apenas
  mismatches `58.0.x`): rode `npx expo install --fix`, depois repita
  `npx tsc --noEmit`, `npx expo lint`, `npx jest --ci` e os gates antes do build.
- **`Not allowed to read file under given url`**: é o problema já resolvido do
  `expo-print` — o PDF é gravado em `Paths.document` antes de compartilhar.
- **Build falha por credenciais**: rode `npx eas-cli@latest whoami` para
  confirmar que está logado na conta certa (a do `owner: rogeriobg`).
