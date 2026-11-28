# 📅 Análise de viabilidade — Etapa 7: Agenda do psicólogo

> Preparado em 2026-11-28, após o **Ciclo 4 ser aprovado no APK instalado**.
> Esta é uma análise de **planejamento**: nenhum código de feature foi escrito.
> Referência: proposta do usuário + documentação do Expo SDK 58
> (`https://docs.expo.dev/versions/v58.0.0/sdk/notifications/`).

---

## 1. Veredito

**Útil e viável.** Uma agenda local com lembrete no próprio aparelho é coerente
com o produto: o psicólogo vê "o que tenho hoje/amanhã", agenda a partir do
prontuário do paciente e recebe o aviso com o som do sistema — sem servidor.

Ressalva principal: `expo-notifications` é módulo nativo novo. **Notificações
locais funcionam no Expo Go**, mas o config plugin (ícone, cor, canais e sons)
só vale em build novo. O QA final precisa ser no APK.

---

## 2. Decisões de produto (fechadas com o usuário em 2026-11-28)

| # | Decisão |
|---|---|
| **DP1** | **Um lembrete por atendimento**, sempre **5 minutos antes** por padrão. Não há notificação na véspera. |
| **DP2** | O psicólogo pode **configurar a antecedência** em `/profile` (botão que abre seletor de minutos). |
| **DP3** | Nível `Atenção` = **alerta de som + marcação visual** na notificação. **Não** gera segundo disparo. |
| **DP4** | **Privacidade máxima:** nunca mostrar nome do paciente nem dado clínico na notificação. **Sem opt-in** — o texto é sempre genérico. |
| **DP5** | Tudo local. A agenda entra no **backup técnico JSON** do Perfil; o PDF de pacientes continua só com lista/resumo. |
| **DP6** | Lembretes **locais** entram na Etapa 7; **push remoto** continua fora do escopo. |

### Correções em relação ao rascunho original

| Rascunho | Adaptação no PsiApp |
|---|---|
| "Regra 7 / Regra 8" | **Já existem** no `PLANO.md` (7 = confirmação para ação destrutiva; 8 = haptic). A agenda reutiliza as duas — não criar nova numeração. |
| Não-objetivo "Notificações push / lembretes" | Reescrito: só **push remoto** fora; lembrete local entra aqui (DP6). |
| `showPatientName` com opt-in | **Removido** — DP4 não admite nome em nenhuma circunstância. |
| Duas notificações para `Atenção` | **Removido** — DP3: som + marcação visual no mesmo disparo. Isso também resolve o limite de 64 do iOS com folga. |
| "Exportação JSON do /profile" | O JSON agora se chama **Backup técnico (JSON)**; o PDF é a ação principal e não inclui agenda (DP5). |
| `database.json` | Está vazio desde a entrega anterior. `appointments: []` entra no seed e no gate `validate:seed`. |

---

## 3. Modelo adaptado

```ts
export type AppointmentStatus = 'agendado' | 'realizado' | 'faltou' | 'cancelado';
export type ReminderLevel = 'normal' | 'atencao';

export interface Appointment {
  id: string;
  patientId: string;          // vínculo com paciente existente
  startsAt: string;           // ISO 8601 com offset
  timeZone: string;           // ex.: 'America/Sao_Paulo' (risco R13)
  durationMin: number;        // padrão 50
  status: AppointmentStatus;
  level: ReminderLevel;
  contactedAt?: string;       // quando o paciente pediu o agendamento
  notes?: string;             // curta; não substitui prontuário
  reminderMinutesBefore: number; // copiado da preferência no momento do cadastro
  notificationId?: string;
  createdAt: string;
}
```

**Preferências** em chave separada do banco (padrão do auth):
`@psi_app_notification_prefs_v1` → `{ enabled: boolean, defaultMinutes: number }`.
Não entra no backup JSON (não é dado clínico) e não muda o formato do `db`.

---

## 4. Arquitetura recomendada

| Camada | Arquivo | Papel |
|---|---|---|
| Dados | `AppContext` | `appointments` no `db`; `addAppointment`, `updateAppointment`, `removeAppointment`; `deletePatient` remove atendimentos e notificações |
| Regras puras | `src/services/appointments.ts` | conflito de horário, próximos 30 dias, texto genérico da notificação — testável no Jest sem nativo |
| Notificações | `src/services/notifications.ts` | handler, canais Android, permissão no 1º agendamento, agendar/cancelar, **reconciliação** |
| Navegação | `src/app/_layout.tsx` | listener de toque → `/agenda/[id]` |
| Telas | `/agenda`, `/agenda/new`, `/agenda/[id]` | visão do dia, formulário, detalhe/ações |
| Atalhos | `/dashboard`, `patients/[id]/details` | "Próximo atendimento", "Agendar sessão", "Próxima sessão" |
| Preferência | `/profile` | botão "Antecedência do lembrete" + ligar/desligar |

**Texto padrão da notificação (fixo, sem dados do paciente):**

- `normal`: "Você tem uma sessão em 5 minutos."
- `atencao`: "🔔 Atenção: sua sessão começa em 5 minutos." + som/canal de maior importância.

---

## 5. Decisões técnicas (D4–D6) — arquitect

- **D4 — Seletor de data/hora:** reaproveitar o `@react-native-community/datetimepicker`
  já usado em `PatientFormModal` (M5). Mantém consistência e evita dependência nova.
- **D5 — Reconciliação:** rodar na abertura do app (efeito no `AppProvider`) e após
  qualquer mutação de atendimentos: `cancelAllScheduledNotificationsAsync()` →
  reagendar os **próximos 30 dias** a partir dos atendimentos `agendado`.
  Isso resolve órfãos (R14) e o limite do iOS (R15).
- **D6 — Prioridade:** entra agora (Ciclo 4 aprovado), executando na ordem G1 → G10.

---

## 6. Backlog adaptado

| # | Item | Critério de aceite |
|---|---|---|
| **G1** | Modelo + persistência | `appointments` no seed vazio, CRUD no contexto, testes de criar/editar/excluir, `validate:seed` estendido |
| **G2** | Tela `/agenda` | lista do dia ordenada por horário, faixa semanal, estado vazio com "Agendar sessão", `validate:layout` válido |
| **G3** | Formulário | `DateTimePicker` nativo, validação inline, bloqueia data passada e sobreposição de horários |
| **G4** | Lembrete local | 5 min antes por padrão (configurável no Perfil), **um por atendimento**, som padrão do sistema |
| **G5** | Nível `Atenção` | alerta de som + marcação visual (canal HIGH no Android, `interruptionLevel: 'active'` no iOS), **sem segundo disparo** |
| **G6** | Privacidade | texto sempre genérico; nenhum nome/dado clínico; sem opção na interface |
| **G7** | Permissão | pedida no primeiro agendamento; se negada, app funciona e mostra aviso discreto com atalho para ajustes |
| **G8** | Integração | atalhos no paciente; excluir paciente cancela atendimentos e notificações (confirmação, Regra 7) |
| **G9** | Status pós-sessão | realizado / faltou / cancelado; "Criar prontuário desta sessão" |
| **G10** | Backup | agenda incluída no backup técnico JSON; PDF de pacientes permanece sem agenda |

---

## 7. Riscos adaptados

| # | Risco | Mitigação |
|---|---|---|
| **R11** | Android 12+: alarmes exatos exigem `SCHEDULE_EXACT_ALARM`; Android 14 nega por padrão | declarar `android.permissions` no `app.json` e pedir `requestExactAlarmPermissionsAsync()` no primeiro agendamento; sem permissão o aviso chega aproximado — avisar o usuário |
| **R12** | Nome na tela bloqueada | eliminado por DP4: texto genérico fixo |
| **R13** | Fuso/horário de verão | ISO com offset + `timeZone` explícito; teste de troca de fuso |
| **R14** | Notificações órfãs | reconciliação na abertura e após mutações (D5) |
| **R15** | iOS: limite de 64 agendadas | um lembrete por atendimento + janela de 30 dias (folga ampla) |
| **R16** | Módulo nativo novo | `npx expo install expo-notifications`, plugin com `enableRemoteNotifications: false`, canais Android, novo build; conferir `expo-doctor` |
| **R17** | Modo silencioso / foco | som **não** toca nesses modos — não prometer o contrário; G5 usa apenas som padrão e importância maior |

---

## 8. Portões de qualidade (inalteráveis)

Antes de cada etapa ser aprovada:

```bash
npx tsc --noEmit
npx expo lint
npx jest --ci
npm run validate:layout
npm run validate:touch
npm run validate:contrast
npm run validate:font
npm run validate:seed
npm run validate:workflow
npm run validate:eas
```

Fase 4c no aparelho: notificação com app fechado, tela bloqueada, após reiniciar
o celular, e com permissão negada. Somente depois disso a etapa é `[APROVADO]`.
