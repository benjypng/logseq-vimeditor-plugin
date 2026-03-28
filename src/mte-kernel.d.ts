declare module '@susisu/mte-kernel' {
  class Point {
    constructor(row: number, column: number)
    row: number
    column: number
  }

  class Range {
    constructor(start: Point, end: Point)
    start: Point
    end: Point
  }

  class ITextEditor {
    getCursorPosition(): Point
    setCursorPosition(pos: Point): void
    setSelectionRange(range: Range): void
    getLastRow(): number
    acceptsTableEdit(row: number): boolean
    getLine(row: number): string
    insertLine(row: number, line: string): void
    deleteLine(row: number): void
    replaceLines(startRow: number, endRow: number, lines: string[]): void
    transact(func: () => void): void
  }

  class TableEditor {
    constructor(textEditor: ITextEditor)
    cursorIsInTable(options: object): boolean
    format(options: object): void
    nextCell(options: object): void
    previousCell(options: object): void
    nextRow(options: object): void
  }

  function options(opts: { smartCursor?: boolean }): object
}
