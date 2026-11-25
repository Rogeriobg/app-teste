import { formatarNome } from '@/utils/nome';

describe('formatarNome', () => {
  it('não duplica o título quando o nome já o possui', () => {
    expect(formatarNome('Dr(a). Psicólogo(a)')).toBe('Dr(a). Psicólogo(a)');
  });

  it('não duplica títulos reais', () => {
    expect(formatarNome('Dra. Ana Costa')).toBe('Dra. Ana Costa');
    expect(formatarNome('Dr. João Silva')).toBe('Dr. João Silva');
    expect(formatarNome('Dra Maria Souza')).toBe('Dra Maria Souza');
  });

  it('adiciona o título genérico quando o nome não tem nenhum', () => {
    expect(formatarNome('Ana Costa')).toBe('Dr(a). Ana Costa');
    expect(formatarNome('Psicólogo')).toBe('Dr(a). Psicólogo');
  });

  it('usa um fallback quando o nome está vazio ou ausente', () => {
    expect(formatarNome('')).toBe('Dr(a). Psicólogo(a)');
    expect(formatarNome('   ')).toBe('Dr(a). Psicólogo(a)');
    expect(formatarNome(null)).toBe('Dr(a). Psicólogo(a)');
    expect(formatarNome(undefined)).toBe('Dr(a). Psicólogo(a)');
  });

  it('ignora espaços nas pontas', () => {
    expect(formatarNome('  Ana Costa  ')).toBe('Dr(a). Ana Costa');
  });
});
