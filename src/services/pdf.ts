import { printToFileAsync } from 'expo-print';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

/**
 * Helpers compartilhados de PDF do PsiApp.
 *
 * O `expo-print` grava o PDF em `<cacheDir>/Print/<uuid>.pdf`, um diretório
 * que nem o `FileProvider` do `expo-sharing` nem o `expo-file-system`
 * conseguem ler. Por isso pedimos `base64: true` e gravamos o conteúdo num
 * arquivo nosso, no `documentDirectory`, antes de compartilhar.
 */

/** Escapa texto do usuário antes de interpolá-lo no HTML do PDF. */
export const escaparHtml = (valor: string | null | undefined): string =>
  String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Gera o arquivo PDF a partir de HTML e devolve o `File` gravado. */
export const gerarPdf = async (
  html: string,
  nomeArquivo: string
): Promise<File> => {
  const { base64 } = await printToFileAsync({ html, base64: true });
  if (!base64) {
    throw new Error('O gerador de PDF não devolveu o conteúdo do arquivo.');
  }
  const destino = new File(Paths.document, nomeArquivo);
  await destino.write(base64, { encoding: 'base64' });
  return destino;
};

/**
 * Abre o share sheet nativo; se não houver compartilhamento disponível ou
 * ele falhar, usa o visualizador nativo. Nunca chamar `Alert.alert` antes
 * desta função — o diálogo nativo cobre a share sheet.
 */
export const compartilharPdf = async (
  arquivo: File,
  titulo: string
): Promise<void> => {
  if (await isAvailableAsync()) {
    try {
      await shareAsync(arquivo.uri, {
        mimeType: 'application/pdf',
        UTI: '.pdf',
        dialogTitle: titulo,
      });
      return;
    } catch {
      // cai no visualizador nativo (caminho principal no Android)
    }
  }

  if (await File.canPreview(arquivo)) {
    await File.preview(arquivo, { title: titulo });
    return;
  }

  throw new Error('Não foi possível compartilhar o PDF.');
};
