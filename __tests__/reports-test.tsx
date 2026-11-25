import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { renderWithProvider } from './helpers/renderWithProvider';
import { AppContext, AppContextData, useApp } from '@/context/AppContext';
import PatientReportsScreen from '@/app/patients/[patientId]/reports';
import ExportPdfScreen from '@/app/patients/[patientId]/export-pdf';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockedPrintToFileAsync = printToFileAsync as jest.Mock;
const mockedShareAsync = shareAsync as jest.Mock;

const PDF_URI = 'file:///tmp/psi-app-test.pdf';

let alertSpy: jest.SpyInstance;

/**
 * Dispara o `onPress` de um botão de um `Alert.alert` (confirmações).
 * Procura o último alert emitido que tenha botões e clica no texto informado.
 */
const pressAlertButton = async (label: string) => {
  const call = [...alertSpy.mock.calls].reverse().find((c) => Array.isArray(c[2]));
  if (!call) {
    throw new Error('Nenhum Alert.alert com botões foi emitido.');
  }
  const buttons = call[2] as Array<{ text: string; onPress?: () => void | Promise<void> }>;
  const button = buttons.find((b) => b.text === label);
  if (!button) {
    throw new Error(`Botão "${label}" não encontrado no Alert.`);
  }
  await act(async () => {
    await button.onPress?.();
  });
};

describe('Relatórios e Exportação', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

    mockedUseLocalSearchParams.mockReturnValue({});

    // comportamento padrão dos mocks nativos (reset limpa as implementações "once")
    mockedPrintToFileAsync.mockReset();
    mockedPrintToFileAsync.mockImplementation(async () => ({ uri: PDF_URI }));
    mockedShareAsync.mockReset();
    mockedShareAsync.mockImplementation(async () => undefined);

    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  /* ------------------------------------------------------------------ */
  /* PatientReportsScreen — src/app/patients/[patientId]/reports.tsx      */
  /* ------------------------------------------------------------------ */
  describe('PatientReportsScreen', () => {
    beforeEach(() => {
      mockedUseLocalSearchParams.mockReturnValue({
        patientId: 'p1',
        patientName: 'Maria Oliveira',
      });
    });

    it('deve renderizar o cabeçalho com o nome do paciente', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Relatórios de Maria Oliveira')).toBeTruthy();
      });
      expect(screen.getByText('Prontuário e histórico de sessões')).toBeTruthy();
    });

    it('deve exibir o resumo de prontuários (total, ativos e arquivados)', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy());

      expect(screen.getByText('Relatórios')).toBeTruthy();
      expect(screen.getByText('Ativos')).toBeTruthy();
      expect(screen.getByText('Arquivados')).toBeTruthy();

      // Maria Oliveira (p1) possui 2 prontuários: 1 ativo e 1 arquivado
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getAllByText('1')).toHaveLength(2);
    });

    it('deve listar os prontuários ativos e arquivados', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Prontuários Ativos')).toBeTruthy();
        expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy();
        expect(screen.getByText('Prontuários Arquivados')).toBeTruthy();
        expect(screen.getByText('Sessão de Acompanhamento')).toBeTruthy();
      });

      // o prontuário ativo oferece arquivar; o arquivado oferece restaurar
      expect(screen.getByText('Arquivar')).toBeTruthy();
      expect(screen.getByText('Restaurar')).toBeTruthy();
    });

    it('deve exibir estado vazio quando o paciente não possui prontuários', async () => {
      mockedUseLocalSearchParams.mockReturnValue({
        patientId: 'p-inexistente',
        patientName: 'Paciente Fantasma',
      });

      await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum relatório cadastrado')).toBeTruthy();
      });
      expect(screen.getByText('Nenhum relatório ativo')).toBeTruthy();
    });

    it('deve abrir o modal de novo relatório com título e data pré-preenchidos', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await fireEvent.press(screen.getByText('Novo Relatório'));

      await waitFor(() => {
        expect(screen.getByText('Novo Relatório de Sessão')).toBeTruthy();
      });
      expect(screen.getByDisplayValue('Sessão Terapêutica')).toBeTruthy();
      expect(screen.getByText('Criar Relatório')).toBeTruthy();
    });

    it('deve validar que o título do relatório foi informado', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await fireEvent.press(screen.getByText('Novo Relatório'));
      await waitFor(() => expect(screen.getByText('Novo Relatório de Sessão')).toBeTruthy());

      await fireEvent.changeText(screen.getByDisplayValue('Sessão Terapêutica'), '   ');
      await fireEvent.press(screen.getByText('Criar Relatório'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Informe o título do relatório.');
      });
    });

    it('deve validar que o conteúdo do prontuário foi informado', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await fireEvent.press(screen.getByText('Novo Relatório'));
      await waitFor(() => expect(screen.getByText('Novo Relatório de Sessão')).toBeTruthy());

      await fireEvent.press(screen.getByText('Criar Relatório'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Informe o conteúdo do prontuário.');
      });
    });

    it('deve criar um novo relatório e listá-lo na tela', async () => {
      const { current } = await renderWithProvider(<PatientReportsScreen />);

      await fireEvent.press(screen.getByText('Novo Relatório'));
      await waitFor(() => expect(screen.getByText('Novo Relatório de Sessão')).toBeTruthy());

      await fireEvent.changeText(
        screen.getByLabelText('Conteúdo do prontuário'),
        'Sessão de retorno com foco em reestruturação cognitiva.'
      );
      await fireEvent.press(screen.getByText('Criar Relatório'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório criado com sucesso!');
      });

      await waitFor(() => {
        expect(screen.getByText('Sessão de retorno com foco em reestruturação cognitiva.')).toBeTruthy();
      });

      // o novo prontuário foi persistido no contexto (3 do seed + 1 novo)
      await waitFor(() => expect(current.db.medicalRecords).toHaveLength(4));
    });

    it('deve abrir o modal de edição preenchido e salvar as alterações', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => expect(screen.getByText('Sessão Inicial - Anamnese')).toBeTruthy());

      await fireEvent.press(screen.getByLabelText('Editar relatório Sessão Inicial - Anamnese'));

      await waitFor(() => {
        expect(screen.getByText('Editar Relatório / Prontuário')).toBeTruthy();
      });
      expect(screen.getByDisplayValue('Sessão Inicial - Anamnese')).toBeTruthy();
      expect(screen.getByText('Salvar Alterações')).toBeTruthy();

      await fireEvent.changeText(
        screen.getByDisplayValue('Sessão Inicial - Anamnese'),
        'Sessão Inicial - Revisada'
      );
      await fireEvent.press(screen.getByText('Salvar Alterações'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório atualizado com sucesso!');
      });
      await waitFor(() => {
        expect(screen.getByText('Sessão Inicial - Revisada')).toBeTruthy();
      });
    });

    it('deve arquivar um prontuário ativo', async () => {
      const { current } = await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => expect(screen.getByText('Arquivar')).toBeTruthy());

      await fireEvent.press(screen.getByText('Arquivar'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório arquivado.');
      });

      await waitFor(() => {
        const archived = current.db.medicalRecords.find((r) => r.id === 'm1');
        expect(archived?.status).toBe('Arquivado');
        expect(archived?.archivedAt).not.toBeNull();
      });
    });

    it('deve restaurar um prontuário arquivado', async () => {
      const { current } = await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => expect(screen.getByText('Restaurar')).toBeTruthy());

      await fireEvent.press(screen.getByText('Restaurar'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório restaurado para ativo.');
      });

      await waitFor(() => {
        const restored = current.db.medicalRecords.find((r) => r.id === 'm2');
        expect(restored?.status).toBe('Ativo');
        expect(restored?.archivedAt).toBeNull();
      });
    });

    it('deve excluir um prontuário somente após a confirmação', async () => {
      const { current } = await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => expect(screen.getAllByText('Excluir').length).toBeGreaterThan(0));

      // o primeiro "Excluir" pertence ao prontuário ativo (Sessão Inicial)
      await fireEvent.press(screen.getAllByText('Excluir')[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Confirmar Exclusão',
          expect.stringContaining('Sessão Inicial - Anamnese'),
          expect.any(Array)
        );
      });

      // antes da confirmação nada é removido
      expect(current.db.medicalRecords).toHaveLength(3);

      await pressAlertButton('Excluir');

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Relatório excluído.');
      });
      await waitFor(() => {
        expect(current.db.medicalRecords).toHaveLength(2);
      });
    });

    it('deve manter o prontuário quando a exclusão é cancelada', async () => {
      const { current } = await renderWithProvider(<PatientReportsScreen />);

      await waitFor(() => expect(screen.getAllByText('Excluir').length).toBeGreaterThan(0));
      await fireEvent.press(screen.getAllByText('Excluir')[0]);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Confirmar Exclusão',
          expect.any(String),
          expect.any(Array)
        );
      });

      await pressAlertButton('Cancelar');

      expect(current.db.medicalRecords).toHaveLength(3);
    });

    it('deve informar erro quando o salvamento do relatório falha', async () => {
      const FailingProvider = ({ children }: { children: React.ReactNode }) => {
        const ctx = useApp();
        const value: AppContextData = {
          ...ctx,
          addMedicalRecord: async () => {
            throw new Error('falha ao salvar');
          },
        };
        return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
      };

      await renderWithProvider(
        <FailingProvider>
          <PatientReportsScreen />
        </FailingProvider>
      );

      await fireEvent.press(screen.getByText('Novo Relatório'));
      await waitFor(() => expect(screen.getByText('Novo Relatório de Sessão')).toBeTruthy());

      await fireEvent.changeText(
        screen.getByLabelText('Conteúdo do prontuário'),
        'Conteúdo que não será persistido.'
      );
      await fireEvent.press(screen.getByText('Criar Relatório'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível salvar o relatório.');
      });
    });

    it('deve abrir o seletor de data e aplicar a data escolhida', async () => {
      await renderWithProvider(<PatientReportsScreen />);

      await fireEvent.press(screen.getByText('Novo Relatório'));
      await waitFor(() => expect(screen.getByText('Novo Relatório de Sessão')).toBeTruthy());

      await fireEvent.press(screen.getByLabelText('Selecionar data da sessão'));

      const picker = screen.getByTestId('date-time-picker');
      await act(async () => {
        picker.props.onChange({}, new Date('2026-01-15T12:00:00Z'));
      });

      await waitFor(() => {
        expect(screen.getByText('2026-01-15')).toBeTruthy();
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* ExportPdfScreen — src/app/patients/[patientId]/export-pdf.tsx        */
  /* ------------------------------------------------------------------ */
  describe('ExportPdfScreen', () => {
    beforeEach(() => {
      mockedUseLocalSearchParams.mockReturnValue({ patientId: 'p1' });
    });

    it('deve exibir o cabeçalho e os dados do paciente', async () => {
      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => {
        expect(screen.getByText('Exportar Prontuário')).toBeTruthy();
      });
      expect(
        screen.getByText('Gerar PDF com os dados e prontuários de Maria Oliveira')
      ).toBeTruthy();
      expect(screen.getByText('maria.oliveira@email.com')).toBeTruthy();
      expect(screen.getByText('Total de sessões')).toBeTruthy();
    });

    it('deve exibir o resumo de prontuários ativos e arquivados', async () => {
      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => expect(screen.getByText('Resumo')).toBeTruthy());

      expect(screen.getByText('Prontuários')).toBeTruthy();
      expect(screen.getByText('Ativos')).toBeTruthy();
      expect(screen.getByText('Arquivados')).toBeTruthy();
      // "2" aparece no resumo (total) e em "Total de sessões"
      expect(screen.getAllByText('2')).toHaveLength(2);
      expect(screen.getAllByText('1')).toHaveLength(2);
    });

    it('deve gerar o PDF e compartilhar o arquivo', async () => {
      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => expect(screen.getByText('Exportar PDF')).toBeTruthy());

      await fireEvent.press(screen.getByText('Exportar PDF'));

      await waitFor(() => expect(mockedPrintToFileAsync).toHaveBeenCalledTimes(1));

      const options = mockedPrintToFileAsync.mock.calls[0][0];
      expect(options.html).toContain('Prontuário Clínico');
      expect(options.html).toContain('Maria Oliveira');
      expect(options.html).toContain('maria.oliveira@email.com');
      expect(options.html).toContain('Sessão Inicial - Anamnese');
      expect(options.html).toContain('Sessão de Acompanhamento');

      await waitFor(() => expect(mockedShareAsync).toHaveBeenCalledTimes(1));
      expect(mockedShareAsync).toHaveBeenCalledWith(
        PDF_URI,
        expect.objectContaining({ mimeType: 'application/pdf' })
      );

      expect(alertSpy).toHaveBeenCalledWith(
        'PDF gerado com sucesso',
        expect.stringContaining('Maria Oliveira')
      );
    });

    it('deve informar erro quando a geração do PDF falha', async () => {
      mockedPrintToFileAsync.mockRejectedValueOnce(new Error('falha ao imprimir'));

      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => expect(screen.getByText('Exportar PDF')).toBeTruthy());
      await fireEvent.press(screen.getByText('Exportar PDF'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível gerar o PDF.');
      });
      expect(mockedShareAsync).not.toHaveBeenCalled();
    });

    it('deve informar erro quando o compartilhamento falha', async () => {
      mockedShareAsync.mockRejectedValueOnce(new Error('falha ao compartilhar'));

      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => expect(screen.getByText('Exportar PDF')).toBeTruthy());
      await fireEvent.press(screen.getByText('Exportar PDF'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível compartilhar o PDF.');
      });
    });

    it('deve exibir estado vazio e voltar quando o paciente não existe', async () => {
      mockedUseLocalSearchParams.mockReturnValue({ patientId: 'p-inexistente' });

      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => {
        expect(screen.getByText('Paciente não encontrado')).toBeTruthy();
      });

      await fireEvent.press(screen.getByText('Voltar'));

      expect(router.back).toHaveBeenCalled();
    });
  });
});
