import { EditorView } from '@codemirror/view'
import {
  ITextEditor,
  options,
  Point,
  Range,
  TableEditor,
} from '@susisu/mte-kernel'

class CMTextEditor extends ITextEditor {
  private view: EditorView

  constructor(view: EditorView) {
    super()
    this.view = view
  }

  getCursorPosition(): Point {
    const pos = this.view.state.selection.main.head
    const line = this.view.state.doc.lineAt(pos)
    return new Point(line.number - 1, pos - line.from)
  }

  setCursorPosition(pos: Point) {
    const line = this.view.state.doc.line(pos.row + 1)
    const offset = line.from + pos.column
    this.view.dispatch({
      selection: { anchor: offset },
    })
  }

  setSelectionRange(range: Range) {
    const startLine = this.view.state.doc.line(range.start.row + 1)
    const endLine = this.view.state.doc.line(range.end.row + 1)
    const from = startLine.from + range.start.column
    const to = endLine.from + range.end.column
    this.view.dispatch({
      selection: { anchor: from, head: to },
    })
  }

  getLastRow(): number {
    return this.view.state.doc.lines - 1
  }

  acceptsTableEdit(_row: number): boolean {
    return true
  }

  getLine(row: number): string {
    const lineCount = this.view.state.doc.lines
    if (row < 0 || row >= lineCount) return ''
    return this.view.state.doc.line(row + 1).text
  }

  insertLine(row: number, line: string) {
    const doc = this.view.state.doc
    if (row >= doc.lines) {
      const lastLine = doc.line(doc.lines)
      this.view.dispatch({
        changes: { from: lastLine.to, insert: `\n${line}` },
      })
    } else {
      const targetLine = doc.line(row + 1)
      this.view.dispatch({
        changes: { from: targetLine.from, insert: `${line}\n` },
      })
    }
  }

  deleteLine(row: number) {
    const doc = this.view.state.doc
    const line = doc.line(row + 1)
    if (row === doc.lines - 1 && row > 0) {
      const prevLine = doc.line(row)
      this.view.dispatch({
        changes: { from: prevLine.to, to: line.to },
      })
    } else {
      this.view.dispatch({
        changes: { from: line.from, to: Math.min(line.to + 1, doc.length) },
      })
    }
  }

  replaceLines(startRow: number, endRow: number, lines: string[]) {
    const doc = this.view.state.doc
    const from = doc.line(startRow + 1).from
    const to = doc.line(endRow).to
    this.view.dispatch({
      changes: { from, to, insert: lines.join('\n') },
    })
  }

  transact(func: () => void) {
    func()
  }
}

const mteOptions = options({
  smartCursor: true,
})

const createTableEditor = (view: EditorView): TableEditor =>
  new TableEditor(new CMTextEditor(view))

export const cursorIsInTable = (view: EditorView): boolean =>
  createTableEditor(view).cursorIsInTable(mteOptions)

export const formatTable = (view: EditorView) =>
  createTableEditor(view).format(mteOptions)

export const nextCell = (view: EditorView) =>
  createTableEditor(view).nextCell(mteOptions)

export const previousCell = (view: EditorView) =>
  createTableEditor(view).previousCell(mteOptions)

export const nextRow = (view: EditorView) =>
  createTableEditor(view).nextRow(mteOptions)
