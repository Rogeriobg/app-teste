import { buildPatientsReportHtml } from '@/services/patientsReport';
import { escaparHtml } from '@/services/pdf';
import type { Patient, User } from '@/context/AppContext';

const user: User = {
  id: 'u1',
  name: 'Dra. Ana <Silva> & Costa',
  email: 'ana@consultorio.com',
  role: 'psicologo',
};

const paciente = (overrides: Partial<Patient> = {}): Patient => ({
  id: 'p1',
  name: 'Maria <Oliveira> & "Filha"',
  email: 'maria@email.com',
  phone: '(11) 99999-0000',
  birthDate: '1990-01-01',
  anamnesis: 'DADO CLINICO SECRETO',
  status: 'Ativo',
  createdAt: '2026-01-15T12:00:00.000Z',
  ...overrides,
});

describe('Relatório PDF de pacientes', () => {
  it('escapa HTML de nomes e e-mails', () => {
    expect(escaparHtml('<b>&"\'')).toBe('&lt;b&gt;&amp;&quot;&#39;');
    const html = buildPatientsReportHtml([paciente()], user);
    expect(html).toContain('Maria &lt;Oliveira&gt; &amp; &quot;Filha&quot;');
    expect(html).toContain('Dra. Ana &lt;Silva&gt; &amp; Costa');
    expect(html).not.toContain('<b>');
  });

  it('inclui resumo e todos os pacientes com status e contato', () => {
    const html = buildPatientsReportHtml(
      [
        paciente(),
        paciente({ id: 'p2', name: 'João Silva', status: 'Inativo' }),
        paciente({ id: 'p3', name: 'Ana Costa', status: 'Arquivado' }),
      ],
      user,
      new Date('2026-11-27T10:30:00')
    );

    expect(html).toContain('Relatório de pacientes');
    expect(html).toContain('CONFIDENCIAL');
    expect(html).toContain('João Silva');
    expect(html).toContain('Ana Costa');
    expect(html).toContain('maria@email.com');
    expect(html).toContain('(11) 99999-0000');
    expect(html).toContain('Arquivado');
    // resumo: total 3, um de cada status
    expect(html).toMatch(/class="valor">3</);
    expect(html).toMatch(/class="valor">1</);
    expect(html).toContain('Emitido em 27/11/2026');
  });

  it('não inclui dados clínicos sensíveis', () => {
    const html = buildPatientsReportHtml([paciente()], user);
    expect(html).not.toContain('DADO CLINICO SECRETO');
    expect(html).not.toContain('anamnesis');
  });

  it('mostra estado vazio quando não há pacientes', () => {
    const html = buildPatientsReportHtml([], user);
    expect(html).toContain('Nenhum paciente cadastrado.');
    expect(html).toMatch(/class="valor">0</);
  });
});
