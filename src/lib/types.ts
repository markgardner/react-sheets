export const CELL_WIDTH = 108;
export const ROW_HEIGHT = 22;

export const ROW_NUMS_WIDTH = 46;
export const COLUMN_HEADER_HEIGHT = 20;

export type GridViewport = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  pxWidth: number;
  pxHeight: number;
  pxContentHeight: number;
  pxContentWidth: number;
};

export type GridModel = {
  rows: RowItem[];
  cells: SchemaItem[];
  calculateNextViewport: (
    current: GridViewport | null,
    scrollLeft: number,
    scrollTop: number,
    width: number,
    height: number
  ) => GridViewport | null;
  resizeRow: (rowIdx: number, height: number) => void;
  resizeCell: (cellIdx: number, width: number) => void;
  changeCell: (cellIdx: number, rowIdx: number, value: string) => void;
  terminate: () => void;
  onRefresh: (callback: () => void) => void;
};

export type GridModelState = {
  viewport: GridViewport | null;
  rows: RowItem[] | null;
};

export type SchemaItem = {
  id: number;
  label: string;
  type: "keyword" | "text" | "number" | "datetime" | "duration";
  dimension: {
    left: number;
    center: number;
    right: number;
    width: number;
  };
  possibleValues?: string[];
};

export type RowItem = {
  id: number;
  label: string;
  dimension: {
    top: number;
    center: number;
    bottom: number;
    height: number;
  };
  cells: string[];
};
