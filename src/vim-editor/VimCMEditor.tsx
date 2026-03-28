import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { vim } from '@replit/codemirror-vim'
import { useCallback, useEffect, useRef } from 'react'

import {
  cursorIsInTable,
  formatTable,
  nextCell,
  nextRow,
  previousCell,
} from './table-editor'

declare global {
  interface Window {
    __applyVimEditorWidth?: (width: number) => void
  }
}

export const VimCMEditor = ({
  uuid,
  initialContent,
}: {
  uuid: string
  initialContent: string
}) => {
  const editorRef = useRef<HTMLDivElement>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = (logseq.settings?.vimEditorWidth as number) || 600

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(300, startWidth - (moveEvent.clientX - startX))
      window.__applyVimEditorWidth?.(newWidth)
    }

    const onMouseUp = (upEvent: MouseEvent) => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      const finalWidth = Math.max(300, startWidth - (upEvent.clientX - startX))
      logseq.updateSettings({ vimEditorWidth: finalWidth })
      window.__applyVimEditorWidth?.(finalWidth)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  useEffect(() => {
    if (!editorRef.current) return

    let view: EditorView | null = null
    let autosaveId: ReturnType<typeof setInterval> | null = null
    let lastSaved = ''

    const init = () => {
      const content = initialContent
      lastSaved = content

      const state = EditorState.create({
        doc: content,
        extensions: [
          vim(),
          markdown(),
          history(),
          keymap.of([
            {
              key: 'Tab',
              run: (v) => {
                if (cursorIsInTable(v)) {
                  nextCell(v)
                  return true
                }
                return false
              },
            },
            {
              key: 'Shift-Tab',
              run: (v) => {
                if (cursorIsInTable(v)) {
                  previousCell(v)
                  return true
                }
                return false
              },
            },
            {
              key: 'Enter',
              run: (v) => {
                if (cursorIsInTable(v)) {
                  nextRow(v)
                  return true
                }
                return false
              },
            },
            {
              key: 'Mod-Shift-f',
              run: (v) => {
                if (cursorIsInTable(v)) {
                  formatTable(v)
                  return true
                }
                return false
              },
            },
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          lineNumbers(),
          EditorView.lineWrapping,
        ],
      })

      view = new EditorView({
        state,
        parent: editorRef.current!,
      })

      autosaveId = setInterval(() => {
        if (!view) return
        const current = view.state.doc.toString()
        if (current !== lastSaved) {
          lastSaved = current
          logseq.Editor.updateBlock(uuid, current)
        }
      }, 100)

      setTimeout(() => view?.focus(), 100)
    }

    init()

    return () => {
      if (autosaveId) clearInterval(autosaveId)
      if (view) {
        const current = view.state.doc.toString()
        if (current !== lastSaved) {
          logseq.Editor.updateBlock(uuid, current)
        }
        view.destroy()
      }
    }
  }, [uuid, initialContent])

  return (
    <>
      <style>{`
        html, body, #app {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .vim-cm-wrap {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .vim-cm-header {
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #333;
        }
        .vim-cm-editor {
          flex: 1;
          overflow: auto;
        }
        .cm-editor { height: 100%; }
        .vim-cm-drag-handle {
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          cursor: col-resize;
          z-index: 10;
        }
        .vim-cm-drag-handle:hover,
        .vim-cm-drag-handle:active {
          background: var(--ls-selection-background-color, rgba(128,128,128,0.3));
        }
      `}</style>
      <div className="vim-cm-wrap" style={{ position: 'relative' }}>
        <div className="vim-cm-drag-handle" onMouseDown={handleDragStart} />
        <div className="vim-cm-header">
          <span>
            Vim Editor (
            <a
              href="#"
              style={{
                color: 'inherit',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
              onClick={async (e) => {
                e.preventDefault()
                const block = await logseq.Editor.getBlock(uuid)
                if (block?.page?.id) {
                  const page = await logseq.Editor.getPage(block.page.id)
                  if (page?.name) {
                    logseq.Editor.scrollToBlockInPage(page.name, uuid)
                  }
                }
              }}
            >
              {uuid.slice(0, 8)}
            </a>
            )
          </span>
          <button type="button" onClick={() => logseq.hideMainUI()}>
            ✕
          </button>
        </div>
        <div ref={editorRef} className="vim-cm-editor" />
      </div>
    </>
  )
}
