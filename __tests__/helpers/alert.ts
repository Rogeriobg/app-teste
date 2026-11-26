import { Alert } from 'react-native';
import { act } from '@testing-library/react-native';

/**
 * Espiona o `Alert.alert` e devolve helpers para inspecionar e disparar
 * os botões das confirmações.
 */
export function spyOnAlert() {
  return jest.spyOn(Alert, 'alert').mockImplementation(() => {});
}

/** Último `Alert.alert` emitido que tenha botões de confirmação. */
export function lastAlertWithButtons(spy: jest.SpyInstance) {
  const calls = spy.mock.calls.filter((c) => Array.isArray(c[2]));
  if (calls.length === 0) {
    throw new Error('Nenhum Alert.alert com botões foi emitido.');
  }
  return calls[calls.length - 1];
}

/** Dispara o `onPress` do botão do último `Alert.alert` com botões. */
export async function pressAlertButton(
  spy: jest.SpyInstance,
  label: string
): Promise<void> {
  const call = lastAlertWithButtons(spy);
  const buttons = call[2] as Array<{
    text: string;
    onPress?: () => void | Promise<void>;
  }>;
  const button = buttons.find((b) => b.text === label);
  if (!button) {
    throw new Error(
      `Botão "${label}" não encontrado. Disponíveis: ${buttons.map((b) => b.text).join(', ')}`
    );
  }
  await act(async () => {
    await button.onPress?.();
  });
}
