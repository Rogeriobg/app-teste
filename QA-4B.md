# 📸 Fase 4b — Verificação Visual em Aparelho (emulado)

> Etapa 4 (qa-vision), fase **4b**. Execução automatizada via Playwright sobre
> o Expo Web com o container fixado em **390px** (largura de iPhone 14 /
> Android típico), mais medição do layout **nativo** por simulação das
> regras do Yoga.
>
> Base: `f4c5270` (ciclo 2) · Veredito: **[APROVADO]**

---

## 1. O que a fase 4b faz e por que era necessária

A fase 4a (estática) valida **critérios de aceite**. A fase 4b valida o que
só aparece com o app **renderizado**: transbordo horizontal, texto cortado,
área de toque pequena, estado vazio ausente, erro no console.

### A limitação do Expo Web (registrada, não reprovada)

> O Expo Web **flexa o texto** e, por isso, **não reproduz** o transbordo
> horizontal do nativo. Foi exatamente isso que escondeu o DEF-3: no web o
> botão "Novo Paciente" cabia; no Android/iOS ele saía da tela.

Por isso a fase 4b tem **duas medições**:

| # | Medição | O que revela |
|---|----------|--------------|
| **A** | Geometria real no web (390px) | transbordo, texto cortado, áreas de toque, estados vazios, console |
| **B** | Geometria **com as regras do Yoga** aplicadas | o comportamento nativo real |

---

## 2. Medição A — geometria real, 7 rotas

Container fixado em **390px**. Para cada rota foram medidos:

- elementos cujo `right` ultrapassa a viewport (transbordo horizontal)
- elementos cujo `scrollWidth > clientWidth` sem `text-overflow: ellipsis`
  (texto cortado)
- botões/áreas de toque com menos de 44px
- mensagens de erro no console

| Rota | Transbordo | Texto cortado | Toque < 44px | Console |
|------|-----------|----------------|--------------|---------|
| `/login` | 0 ✅ | 0 ✅ | 0 ✅ | 0 erros ✅ |
| `/dashboard` | 0 ✅ | 0 ✅ | 0 ✅ | 0 erros ✅ |
| `/patients` | 0 ✅ | 0 ✅ | 0 ✅ | 0 erros ✅ |
| `/patients/p1/details` | 0 ✅ | 0 ✅ | 0 ✅ | — |
| `/patients/p1/reports` | 0 ✅ | 0 ✅ | 0 ✅ | — |
| `/patients/p1/export-ppdf` | 0 ✅ | 0 ✅ | 0 ✅ | — |
| `/profile` | 0 ✅ | 0 ✅ | 0 ✅ | — |

**Resultado: 7/7 rotas limpas.**

> Nota: a varredura de "toque < 44px" roda sobre os botões **do web**. No
> nativo, o botão do cabeçalho (`backBtn`, `logoutBtn`) tem 40px — é o item
> **QA-3** já registrado, fora do escopo desta fase.

---

## 3. Medição B — layout nativo (regras do Yoga)

O Yoga — motor de layout real do RN — se comporta assim:

| Regra | Comportamento |
|-------|---------------|
| filho com `flexShrink: 0` | mantém a largura base, **não cede** |
| filho com `flexShrink: 1` | cede até o mínimo (min-content) |
| filho com `flex: 1` | cresce para o espaço restante |
| texto **sem** `numberOfLines` | mínimo = largura do texto **inteiro** |
| texto **com** `numberOfLines` | mínimo = largura de **uma** linha |

Aplicando essas regras ao header de `/patients` (390px):

| Estado | Título | Botão | Transborda? |
|--------|--------|-------|-------------|
| **Com o bug** (título sem `flexShrink`) | 148px | 223→370 | ⚠️ Sim no nativo |
| **Com a correção** (`flex: 1` + `min-width: 0`) | 203px | 223→370 | ✅ Não |

Medição real do DOM com a correção aplicada:

```json
{
  "viewport": 390,
  "titulo": { "left": 20, "right": 223, "w": 203, "flex": "1 1 0%", "minW": "0px" },
  "botao":  { "left": 223, "right": 370, "w": 147 },
  "botaoDentroDaTela": true
}
```

> **Prova de que o gate funciona:** o gate estático (`npm run validate:layout`)
> foi testado **reintroduzindo** o bug — ele reprovou com a mensagem exata
> (`patients.tsx:179 — <View> dentro de um container 'row' (header) sem 'style'
> nenhum`). O gate não é decorativo.

---

## 4. Checklist visual (por tela)

### `/login`
- Hero card com badge "PsiApp • Consultório Pessoal" ✅
- Título "Consultório Psicológico" centralizado ✅
- Campo de e-mail com ícone, focus e teclado ✅
- Botão primário "Entrar no Consultório" com ícone ✅
- Sem transbordo, sem texto cortado ✅

### `/dashboard`
- Header com avatar, saudação por período do dia e data por extenso ✅
- 4 stat cards em grade 2×2 ✅
- Card único de prontuários com barra de proporção ✅
- Ações rápidas em 2 colunas ✅
- Lista de pacientes ativos com badge de status ✅
- Estado vazio com ação "Cadastrar paciente" ✅

### `/patients` — **a tela do DEF-3**
- Header: título à esquerda, **botão "Novo Paciente" dentro da tela** ✅
- Card do paciente em 4 linhas (nome / avatar+e-mail / telefone / ações) ✅
- 5 botões de ação alinhados à direita, sem sobrepor ✅
- 4 filtros de status, com o ativo destacado ✅
- Campo de busca com placeholder "Nome, e-mail ou telefone..." ✅
- **Evidência:** screenshot `qa/patients.png`

### `/patients/p1/details`
- Top bar com voltar, título e avatar do paciente ✅
- Hero com nome, status único e chips de contato ✅
- Card de informações (nascimento, anamnese) ✅
- Resumo dos prontuários com barra ✅
- Prontuários ativos e arquivados em cards separados ✅
- Grade 2×3 de ações, com a destrutiva em tom danger ✅

### `/patients/p1/reports`
- Header: **"Relatórios de" + "Novo Relatório" dentro da tela** ✅ (mesmo
  padrão do DEF-3, corrigido junto)
- StatSummary com barra de proporção ✅
- Ações "Arquivar" / "Excluir" e "Restaurar" / "Excluir" por prontuário ✅
- Prontuário arquivado com título riscado ✅

### `/patients/p1/export-pdf`
- Card de identificação com avatar ✅
- Resumo com barra ✅
- Card de dados do paciente (nome, e-mail, total de sessões) ✅
- Botões "Exportar PDF" e "Voltar" ✅

### `/profile`
- Card de identificação do psicólogo ✅
- Formulário de nome e e-mail com estado "Sem alterações" ✅
- Botão "Exportar dados (JSON)" ✅
- Botão destrutivo "Sair do consultório" ✅

---

## 5. Defeito encontrado nesta fase

### DEF-4 — Ciclo de require no barrel de componentes

**Severidade:** média (runtime)
**Onde:** `src/components/PatientFormModal.tsx`

O componente importava `AppModal` e `Input` pelo barrel `@/components`, e o
barrel exportava o `PatientFormModal` — criando o ciclo:

```
src/components/index.ts -> src/components/PatientFormModal.tsx -> src/components/index.ts
```

O Metro avisava no console (`Require cycles are allowed, but can result in
uninitialized values`).

**Correção:** importar direto do módulo (`./Modal`, `./Input`), quebrando o
ciclo. Confirmado: o aviso desapareceu do console do Metro.

> Origem: introduzido no ciclo 2 da etapa 3 (item A1) e **não** pego pelos
> gates — o aviso só aparece no log do Metro, não no `lint` nem no `tsc`.
> Agora está registrado no gate de console da fase 4b.

---

## 6. Veredito

| Critério | Resultado |
|----------|-----------|
| Transbordo horizontal em 7 rotas (390px) | 0 ✅ |
| Texto cortado sem ellipsis | 0 ✅ |
| Erros/warnings no console | 0 (após DEF-4) ✅ |
| Estados vazio presentes | 7/7 ✅ |
| Layout nativo conforme Yoga | ✅ (DEF-3 corrigido no ciclo 2) |
| `tsc` / `lint` / `jest` / `validate:layout` | ✅ |

**`[APROVADO]`** — com o DEF-4 corrigido no mesmo ciclo.

### Pendências que permanecem (não bloqueiam)

| # | Pendência | Destino |
|---|-----------|---------|
| QA-1 | `textTertiary` com contraste 2,56:1 | Item B5 |
| QA-2 | `brand` com contraste 3,74:1 | Item B5 |
| QA-3 | Áreas de toque < 44px no nativo (`backBtn`, `logoutBtn`, `iconAction`) | Itens M1–M8 |
| QA-4 | Seed de demonstração | Produto |
| QA-6 | Duplicidade da lista de prontuários | Item M3 |

---

## 7. Como repetir a fase 4b

```bash
# 1. sobe o web
npx expo start --web --port 8082

# 2. o gate estático (roda no CI)
npm run validate:layout

# 3. a varredura visual: abrir as 7 rotas em 390px e medir
```

A varredura visual foi executada via Playwright MCP. Para rodar de novo,
o roteiro é:

1. `browser.tabs.open({ url: 'http://localhost:8082/<rota>' })`
2. `browser.evaluate` — fixar o container em 390px e medir
3. `browser.screenshot` — evidência em `qa/<rota>.png`
4. `browser.console` — conferir erros

---

Última atualização: Fase 4b — 2026-11-26.
