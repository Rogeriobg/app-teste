import React from 'react';
import { Alert } from 'react-native';
import { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { File } from 'expo-file-system';
import { renderWithProvider } from './helpers/renderWithProvider';
import ExportPdfScreen from '@/app/patients/[patientId]/export-pdf';

const mockedUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockedPrintToFileAsync = printToFileAsync as jest.Mock;
const mockedShareAsync = shareAsync as jest.Mock;

const PDF_URI = 'file:///tmp/psi-app-test.pdf';
/** Conteúdo fake do PDF (o que o `expo-print` devolve com `base64: true`). */
const PDF_BASE64 = 'JVBERi0xLjQKJcTl8uXrp/Og0MTGjA==';

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
    mockedPrintToFileAsync.mockImplementation(async () => ({ uri: PDF_URI, base64: PDF_BASE64 }));
    mockedShareAsync.mockReset();
    mockedShareAsync.mockImplementation(async () => undefined);

    // o visualizador nativo é o caminho principal no Android
    (File.canPreview as jest.Mock).mockReset();
    (File.canPreview as jest.Mock).mockResolvedValue(true);
    (File.preview as jest.Mock).mockReset();
    (File.preview as jest.Mock).mockResolvedValue(undefined);

    // limpa o histórico de escritas do File mock
    const fileComHistorico = File as unknown as { __writes: unknown[] };
    if (fileComHistorico.__writes) fileComHistorico.__writes.length = 0;

    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    alertSpy.mockRestore();
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
      /**
       * O PDF é compartilhado a partir do **documentDirectory**, com nome
       * legível — nem o `FileProvider` do `expo-sharing` nem o
       * `expo-file-system` conseguem ler o diretório `Print/` do cache
       * (onde o `expo-print` grava).
       */
      expect(mockedShareAsync).toHaveBeenCalledWith(
        expect.stringContaining('document'),
        expect.objectContaining({ mimeType: 'application/pdf' })
      );
      expect(mockedShareAsync.mock.calls[0][0]).toContain('prontuario-Maria_Oliveira.pdf');

      /**
       * O conteúdo veio como **base64** do `expo-print` e foi escrito no
       * destino com `encoding: 'base64'` — nenhum módulo precisa ler o
       * diretório `Print/`, que não tem permissão de leitura.
       */
      expect(mockedPrintToFileAsync.mock.calls[0][0].base64).toBe(true);
      const escritas = (File as unknown as { __writes: Array<{ uri: string; options?: { encoding?: string } }> }).__writes;
      expect(escritas).toHaveLength(1);
      expect(escritas[0].options).toEqual(expect.objectContaining({ encoding: 'base64' }));

      /**
       * O compartilhamento acontece **antes** de qualquer `Alert`.
       *
       * Um `Alert` nativo fica por cima da tela e, no Android, quebra o
       * share sheet que é aberto em seguida — foi o que fazia o botão
       * "Exportar PDF" falhar com "Não foi possível compartilhar o PDF".
       */
      expect(alertSpy).not.toHaveBeenCalledWith(
        'PDF gerado com sucesso',
        expect.anything()
      );
    });

    it('deve informar erro quando a geração do PDF falha', async () => {
      mockedPrintToFileAsync.mockRejectedValueOnce(new Error('falha ao imprimir'));

      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => expect(screen.getByText('Exportar PDF')).toBeTruthy());
      await fireEvent.press(screen.getByText('Exportar PDF'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Erro',
          expect.stringContaining('Não foi possível gerar o PDF.')
        );
      });
      expect(mockedShareAsync).not.toHaveBeenCalled();
    });

    it('deve abrir o visualizador nativo quando o compartilhamento falha', async () => {
      mockedShareAsync.mockRejectedValueOnce(new Error('falha ao compartilhar'));

      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => expect(screen.getByText('Exportar PDF')).toBeTruthy());
      await fireEvent.press(screen.getByText('Exportar PDF'));

      /**
       * O share sheet pode falhar (sem app para receber PDF, permissão
       * negada, share cancelado). Nesse caso o app abre o **visualizador
       * nativo**, que é o caminho principal no Android e não depende do
       * `FileProvider` do `expo-sharing`.
       */
      await waitFor(() => {
        expect(File.preview).toHaveBeenCalled();
      });
      expect(alertSpy).not.toHaveBeenCalledWith(
        'Erro',
        expect.stringContaining('Não foi possível compartilhar o PDF.')
      );
    });

    it('deve informar erro quando nem o compartilhamento nem o preview funcionam', async () => {
      mockedShareAsync.mockRejectedValueOnce(new Error('falha ao compartilhar'));
      (File.canPreview as jest.Mock).mockResolvedValueOnce(false);

      await renderWithProvider(<ExportPdfScreen />);

      await waitFor(() => expect(screen.getByText('Exportar PDF')).toBeTruthy());
      await fireEvent.press(screen.getByText('Exportar PDF'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Erro',
          expect.stringContaining('Não foi possível compartilhar o PDF.')
        );
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
