import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user'

export const settings: SettingSchemaDesc[] = [
  {
    key: 'vimEditorWidth',
    type: 'number',
    default: 600,
    title: 'Vim Editor Width',
    description:
      'Width of the Vim editor panel in pixels. You can also drag the left edge to resize.',
  },
]
