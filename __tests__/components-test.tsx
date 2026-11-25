import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Button, Input, Card, StatusBadge, AppModal } from '@/components';

describe('Button', () => {
  it('deve renderizar os filhos (children)', async () => {
    await render(<Button onPress={jest.fn()}>Salvar</Button>);

    expect(screen.getByText('Salvar')).toBeTruthy();
  });

  it('deve usar a prop title como fallback quando children não é informado', async () => {
    await render(<Button title="Cadastrar" onPress={jest.fn()} />);

    expect(screen.getByText('Cadastrar')).toBeTruthy();
  });

  it('deve chamar onPress ao ser pressionado', async () => {
    const onPress = jest.fn();
    await render(<Button onPress={onPress}>Salvar</Button>);

    await fireEvent.press(screen.getByText('Salvar'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não deve chamar onPress quando disabled', async () => {
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress} disabled>
        Salvar
      </Button>
    );

    await fireEvent.press(screen.getByText('Salvar'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('não deve chamar onPress quando loading', async () => {
    const onPress = jest.fn();
    await render(
      <Button onPress={onPress} loading>
        Salvar
      </Button>
    );

    // em loading o texto é substituído pelo indicador de atividade
    await fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('deve exibir o indicador de carregamento e ocultar o texto quando loading', async () => {
    await render(
      <Button onPress={jest.fn()} loading>
        Salvar
      </Button>
    );

    expect(screen.queryByText('Salvar')).toBeNull();
  });

  it('deve aplicar o accessibilityLabel informado', async () => {
    await render(
      <Button onPress={jest.fn()} accessibilityLabel="Cadastrar novo paciente">
        Novo
      </Button>
    );

    expect(screen.getByLabelText('Cadastrar novo paciente')).toBeTruthy();
  });
});

describe('Input', () => {
  it('deve renderizar o label informado', async () => {
    await render(<Input label="Nome completo" value="" onChangeText={jest.fn()} />);

    expect(screen.getByText('Nome completo')).toBeTruthy();
  });

  it('deve exibir o valor atual', async () => {
    await render(<Input label="Nome" value="Maria Oliveira" onChangeText={jest.fn()} />);

    expect(screen.getByDisplayValue('Maria Oliveira')).toBeTruthy();
  });

  it('deve chamar onChangeText ao digitar', async () => {
    const onChangeText = jest.fn();
    await render(<Input label="Nome" value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByDisplayValue(''), 'João');

    expect(onChangeText).toHaveBeenCalledWith('João');
  });

  it('deve exibir o texto de erro quando error está ativo', async () => {
    await render(
      <Input label="E-mail" value="" onChangeText={jest.fn()} error errorText="E-mail inválido" />
    );

    expect(screen.getByText('E-mail inválido')).toBeTruthy();
  });

  it('não deve exibir texto de erro quando error está inativo', async () => {
    await render(
      <Input label="E-mail" value="" onChangeText={jest.fn()} errorText="E-mail inválido" />
    );

    expect(screen.queryByText('E-mail inválido')).toBeNull();
  });
});

describe('Card', () => {
  it('deve renderizar os filhos', async () => {
    await render(
      <Card>
        <Text>Conteúdo do card</Text>
      </Card>
    );

    expect(screen.getByText('Conteúdo do card')).toBeTruthy();
  });
});

describe('StatusBadge', () => {
  it('deve exibir o status do paciente', async () => {
    await render(<StatusBadge status="Ativo" />);

    expect(screen.getByText('Ativo')).toBeTruthy();
  });

  it('deve exibir o status do prontuário', async () => {
    await render(<StatusBadge recordStatus="Arquivado" />);

    expect(screen.getByText('Arquivado')).toBeTruthy();
  });

  it('deve priorizar o label customizado', async () => {
    await render(<StatusBadge status="Ativo" label="Em tratamento" />);

    expect(screen.getByText('Em tratamento')).toBeTruthy();
  });

  it('deve renderizar sem texto quando nenhum status é informado', async () => {
    await render(<StatusBadge />);

    expect(screen.queryByText('Ativo')).toBeNull();
  });
});

describe('AppModal', () => {
  it('não deve renderizar o conteúdo quando visible é false', async () => {
    await render(
      <AppModal visible={false} onDismiss={jest.fn()} title="Título">
        <Text>Conteúdo</Text>
      </AppModal>
    );

    expect(screen.queryByText('Conteúdo')).toBeNull();
  });

  it('deve renderizar título e conteúdo quando visible é true', async () => {
    await render(
      <AppModal visible onDismiss={jest.fn()} title="Editar Paciente">
        <Text>Conteúdo</Text>
      </AppModal>
    );

    expect(screen.getByText('Editar Paciente')).toBeTruthy();
    expect(screen.getByText('Conteúdo')).toBeTruthy();
  });

  it('deve chamar onConfirm ao pressionar o botão de confirmação', async () => {
    const onConfirm = jest.fn();
    await render(
      <AppModal visible onDismiss={jest.fn()} title="Título" onConfirm={onConfirm}>
        <Text>Conteúdo</Text>
      </AppModal>
    );

    await fireEvent.press(screen.getByText('Confirmar'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onDismiss ao pressionar o botão de cancelamento', async () => {
    const onDismiss = jest.fn();
    await render(
      <AppModal visible onDismiss={onDismiss} title="Título">
        <Text>Conteúdo</Text>
      </AppModal>
    );

    await fireEvent.press(screen.getByText('Cancelar'));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('deve usar os títulos customizados de cancelamento e confirmação', async () => {
    await render(
      <AppModal
        visible
        onDismiss={jest.fn()}
        title="Título"
        cancelTitle="Voltar"
        confirmTitle="Salvar alterações"
      >
        <Text>Conteúdo</Text>
      </AppModal>
    );

    expect(screen.getByText('Voltar')).toBeTruthy();
    expect(screen.getByText('Salvar alterações')).toBeTruthy();
  });

  it('não deve chamar onConfirm quando confirmDisabled está ativo', async () => {
    const onConfirm = jest.fn();
    await render(
      <AppModal visible onDismiss={jest.fn()} title="Título" onConfirm={onConfirm} confirmDisabled>
        <Text>Conteúdo</Text>
      </AppModal>
    );

    await fireEvent.press(screen.getByText('Confirmar'));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
