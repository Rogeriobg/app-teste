import type { Preset } from './types';

/**
 * Os 4 presets claros da Etapa 6.
 *
 * **Única exceção permitida** à regra "zero hex literal fora de tokens.ts"
 * (decisão registrada no `PLANO.md`). As cores de status continuam vindo de
 * `tokens.ts` — o tema troca só background, surface, primary e texto.
 *
 * `onPrimary` NÃO aparece aqui: é derivado por `getReadableTextColor`.
 *
 * Tema escuro ficou FORA do escopo (decisão do usuário, 2026-11-27):
 * todos os presets são claros, `app.json` permanece `light` e a StatusBar
 * é fixa em `'dark'`.
 */
export const PRESETS: Preset[] = [
  {
    id: 'acolhimento',
    name: 'Acolhimento',
    colors: {
      background: '#FAF8F5',
      surface: '#FFFFFF',
      primary: '#7C6A96',
      text: '#2D2A32',
      textSecondary: '#64748B',
      statusBar: 'dark',
    },
  },
  {
    id: 'jardim',
    name: 'Jardim Calmo',
    colors: {
      background: '#F4F7F4',
      surface: '#FFFFFF',
      // original #5B8266 (4,35:1) falhava AA -> #567C61 (4,72:1)
      primary: '#567C61',
      text: '#233026',
      textSecondary: '#64748B',
      statusBar: 'dark',
    },
  },
  {
    id: 'terracota',
    name: 'Terracota Suave',
    colors: {
      background: '#FDF6F3',
      surface: '#FFFFFF',
      // original #C07A65 (3,38:1) falhava AA -> #A85F4B (4,77:1)
      primary: '#A85F4B',
      text: '#382621',
      textSecondary: '#64748B',
      statusBar: 'dark',
    },
  },
  {
    id: 'brisa',
    name: 'Brisa Serena',
    colors: {
      background: '#F3F7FA',
      surface: '#FFFFFF',
      primary: '#527999',
      text: '#1E2B36',
      textSecondary: '#64748B',
      statusBar: 'dark',
    },
  },
];

/** Preset padrão (restaurar / primeiro uso). */
export const DEFAULT_PRESET_ID = 'acolhimento';

export const getPreset = (id: string): Preset =>
  PRESETS.find((preset) => preset.id === id) ?? PRESETS[0];
