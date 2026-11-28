import type { Patient, User } from '@/context/AppContext';
import { escaparHtml } from './pdf';

/**
 * HTML do "Relatório de pacientes" — função pura, sem módulos nativos,
 * para poder ser testada no Jest e reutilizada em qualquer plataforma.
 *
 * Deliberadamente NÃO inclui anamnesis, conteúdo de prontuários nem notas
 * privadas: são dados clínicos sensíveis e já têm exportação própria por
 * paciente. Aqui vai só o que ajuda o psicólogo a conferir sua carteira.
 */

const formatarData = (valor: string | undefined): string => {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const rotuloStatus: Record<Patient['status'], string> = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
  Arquivado: 'Arquivado',
};

const corStatus: Record<Patient['status'], string> = {
  Ativo: '#047857',
  Inativo: '#B45309',
  Arquivado: '#475569',
};

export const buildPatientsReportHtml = (
  patients: Patient[],
  user: User | null,
  agora: Date = new Date()
): string => {
  const total = patients.length;
  const ativos = patients.filter((p) => p.status === 'Ativo').length;
  const inativos = patients.filter((p) => p.status === 'Inativo').length;
  const arquivados = patients.filter((p) => p.status === 'Arquivado').length;

  const linhas = patients
    .map((p) => {
      const nome = escaparHtml(p.name);
      const email = escaparHtml(p.email);
      const telefone = escaparHtml(p.phone) || '—';
      const status = rotuloStatus[p.status] ?? p.status;
      const cor = corStatus[p.status] ?? '#475569';

      return `
        <tr>
          <td class="nome">${nome}</td>
          <td><span style="color:${cor};font-weight:700;">${status}</span></td>
          <td>${email || '—'}</td>
          <td>${telefone}</td>
          <td>${formatarData(p.createdAt)}</td>
        </tr>`;
    })
    .join('');

  const corpo =
    total === 0
      ? `<tr><td colspan="5" class="vazio">Nenhum paciente cadastrado.</td></tr>`
      : linhas;

  const profissional = escaparHtml(user?.name || 'Psicólogo(a)');
  const emailProfissional = escaparHtml(user?.email || '');
  const dataEmissao = agora.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaEmissao = agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>Relatório de pacientes - PsiApp</title>
    <style>
      @page { size: A4; margin: 16mm 12mm 18mm 12mm; }
      * { box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #1E293B; font-size: 11px; line-height: 1.45; margin: 0;
      }
      .marca { color: #0D9488; font-weight: 800; letter-spacing: 1px; font-size: 12px; }
      .cabecalho {
        border-bottom: 2px solid #0D9488; padding-bottom: 12px; margin-bottom: 16px;
        display: flex; justify-content: space-between; align-items: flex-start;
      }
      h1 { font-size: 19px; margin: 4px 0 2px; color: #133E2B; }
      .sub { color: #64748B; margin: 0; }
      .confidencial {
        color: #B91C1C; border: 1px solid #FCA5A5; background: #FEF2F2;
        padding: 5px 8px; border-radius: 6px; font-weight: 800; font-size: 9px;
        letter-spacing: 1px;
      }
      .resumo { display: flex; gap: 8px; margin-bottom: 18px; }
      .caixa {
        flex: 1; border: 1px solid #E2E8F0; border-radius: 8px;
        padding: 10px; background: #F8FAFC;
      }
      .caixa .rotulo { color: #64748B; font-size: 9px; text-transform: uppercase; font-weight: 700; }
      .caixa .valor { font-size: 20px; font-weight: 800; color: #133E2B; }
      table { width: 100%; border-collapse: collapse; }
      thead th {
        text-align: left; background: #133E2B; color: #FFFFFF;
        padding: 8px 7px; font-size: 9px; text-transform: uppercase; letter-spacing: .5px;
      }
      tbody td { border-bottom: 1px solid #E2E8F0; padding: 7px; vertical-align: top; }
      tbody tr { break-inside: avoid; }
      tbody tr:nth-child(even) { background: #F8FAFC; }
      .nome { font-weight: 700; color: #0F172A; }
      .vazio { text-align: center; color: #64748B; padding: 22px; }
      .rodape {
        margin-top: 18px; border-top: 1px solid #E2E8F0; padding-top: 8px;
        color: #94A3B8; font-size: 9px;
      }
    </style>
  </head>
  <body>
    <div class="cabecalho">
      <div>
        <div class="marca">PSIAPP</div>
        <h1>Relatório de pacientes</h1>
        <p class="sub">${profissional}${emailProfissional ? ` &middot; ${emailProfissional}` : ''}</p>
        <p class="sub">Emitido em ${dataEmissao} às ${horaEmissao}</p>
      </div>
      <div class="confidencial">CONFIDENCIAL</div>
    </div>

    <div class="resumo">
      <div class="caixa"><div class="rotulo">Total</div><div class="valor">${total}</div></div>
      <div class="caixa"><div class="rotulo">Ativos</div><div class="valor">${ativos}</div></div>
      <div class="caixa"><div class="rotulo">Inativos</div><div class="valor">${inativos}</div></div>
      <div class="caixa"><div class="rotulo">Arquivados</div><div class="valor">${arquivados}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Paciente</th><th>Status</th><th>E-mail</th><th>Telefone</th><th>Cadastro</th>
        </tr>
      </thead>
      <tbody>${corpo}</tbody>
    </table>

    <div class="rodape">
      Documento gerado localmente no PsiApp. Nenhum dado foi enviado para servidores.
      Não inclui anamneses, prontuários ou notas privadas.
    </div>
  </body>
</html>`;
};
