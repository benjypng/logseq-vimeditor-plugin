import '@logseq/libs'

import { createRoot } from 'react-dom/client'

import { settings } from './settings'
import { VimCMEditor } from './vim-editor/VimCMEditor'

const main = async () => {
  setTimeout(() => {
    logseq.UI.showMsg('logseq-vimeditor-plugin loaded')
  })

  const applyWidth = (width: number) => {
    logseq.provideStyle({
      key: 'vim-editor-styles',
      style: `
        body {
          display: flex !important;
          flex-direction: row !important;
          height: 100vh !important;
          overflow: hidden !important;
        }
        div#root {
          flex: 1 !important;
          overflow-y: auto !important;
          min-width: 0 !important;
        }
        div#logseq-vimeditor-plugin_lsp_main {
          width: ${width}px !important;
          flex-shrink: 0 !important;
          height: 100% !important;
          position: relative !important;
          top: auto !important;
          left: auto !important;
          overflow-y: auto !important;
          background: var(--ls-primary-background-color);
          border-left: 1px solid var(--lx-gray-09, #333);
          order: 1;
        }
        div.preboot-loading {
          display: none !important;
        }`,
    })
    logseq.setMainUIInlineStyle({
      position: 'fixed',
      zIndex: 11,
      top: 0,
      right: 0,
      left: 'auto',
      width: `${width}px`,
      height: '100vh',
    })
  }

  const initialWidth = (logseq.settings?.vimEditorWidth as number) || 600
  applyWidth(initialWidth)

  window.__applyVimEditorWidth = applyWidth

  const el = document.getElementById('app')
  if (!el) return
  const root = createRoot(el)

  logseq.Editor.registerSlashCommand('Edit in VIM mode', async (e) => {
    logseq.hideMainUI()
    const block = await logseq.Editor.getBlock(e.uuid)
    const content = block?.content ?? ''
    await logseq.Editor.exitEditingMode(true)
    root.render(
      <VimCMEditor
        uuid={e.uuid}
        initialContent={content}
        key={e.uuid + Date.now()}
      />,
    )
    logseq.showMainUI()
  })
}

logseq.useSettingsSchema(settings).ready(main).catch(console.error)
