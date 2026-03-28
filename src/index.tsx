import '@logseq/libs'

import { BlockEntity } from '@logseq/libs/dist/LSPlugin'
import { createRoot } from 'react-dom/client'

import { handlePopup } from './handle-popup'
import css from './index.css?raw'
import RTE from './RTE'
import { settings } from './settings'

const main = async () => {
  console.log('logseq-richtexteditor-plugin loaded')
  // Used to handle any popups
  handlePopup()
  logseq.provideStyle(css)

  logseq.Editor.registerSlashCommand('Insert rich text editor', async (e) => {
    await logseq.Editor.insertAtEditingCursor(`{{renderer :rte_${e.uuid}}}`)
    await logseq.Editor.insertBlock(e.uuid, '', {
      sibling: false,
      before: false,
    })
    await logseq.Editor.setBlockCollapsed(e.uuid, true)
    await logseq.Editor.exitEditingMode(true)
  })

  logseq.App.onMacroRendererSlotted(
    async ({ slot, payload: { uuid, arguments: args } }) => {
      const [type] = args
      if (!type || !type.startsWith(':rte_')) return
      const rteId = `rte_${uuid}_${slot}`
      const rootBlk = await logseq.Editor.getBlock(uuid, {
        includeChildren: true,
      })
      if (!rootBlk) return

      const contentBlock = rootBlk.children?.[0] as BlockEntity
      if (!contentBlock) return

      logseq.provideUI({
        key: rteId,
        slot,
        reset: true,
        template: `<div id="${rteId}"></div>`,
      })

      setTimeout(() => {
        const el = parent.document.getElementById(rteId)
        if (!el || !el.isConnected) return
        const root = createRoot(el)
        root.render(<RTE contentBlock={contentBlock} rteId={rteId} />)
      }, 0)
    },
  )
}

logseq.useSettingsSchema(settings).ready(main).catch(console.error)
