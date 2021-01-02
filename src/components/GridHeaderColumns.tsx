import styled from "styled-components";

import { SchemaItem, GridViewport } from "../lib/types";

const Column = styled.div`
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  padding: 6px 8px;
  border-right: 1px solid #c3c3c3;
  border-bottom: 1px solid #c3c3c3;
  background: #f8f8f8;
  vertical-align: top;
  cursor: default;
`;

const ColumnLabel = styled.div`
  white-space: nowrap;
  font-weight: 700;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const ColumnResizeHandle = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: ew-resize;

  &:hover,
  &.active {
    background: #4d90fe;
  }
`;

const ColumnResizeMarker = styled.div`
  position: absolute;
  right: 2px;
  top: 100%;
  bottom: 0;
  width: 1px;
  background: rgba(77, 144, 254, 0.6);
`;

export type ResizingCell = {
  idx: number;
  startingX: number;
  startingWidth: number;
};

type GridHeaderColumnsProps = {
  viewport: GridViewport;
  cells: SchemaItem[];
  resizingCell: ResizingCell | null;
  resizingCellWidth: number;
  gridHeight: number;
  onResizeStart: (cellIdx: number, pageX: number) => void;
};

const GridHeaderColumns = ({
  viewport,
  cells,
  resizingCell,
  resizingCellWidth,
  gridHeight,
  onResizeStart,
}: GridHeaderColumnsProps) => {
  const onResizeMouseDown = (cellIdx: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    onResizeStart(cellIdx, e.pageX);
  };

  const elements = [];

  for (var idx = viewport.left; idx < cells.length && idx <= viewport.right; idx++) {
    const { label, id, dimension } = cells[idx];

    const isResizingCell = resizingCell && resizingCell.idx === idx;
    const width = isResizingCell ? resizingCellWidth : dimension.width;

    elements.push(
      <Column key={id} style={{ width }} title={label}>
        <ColumnLabel>{label}</ColumnLabel>
        {isResizingCell ? (
          <>
            <ColumnResizeHandle className="active" />
            <ColumnResizeMarker style={{ bottom: -gridHeight - 1 }} />
          </>
        ) : (
          <ColumnResizeHandle onMouseDown={onResizeMouseDown(idx)} />
        )}
      </Column>
    );
  }

  return <>{elements}</>;
};

export default GridHeaderColumns;
