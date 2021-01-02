import { useRef, useLayoutEffect, useState } from "react";
import styled from "styled-components";

import { ScrollCorner, SCROLLBAR_SIZE } from "./GridScrollbar";
import { useWindowEvent } from '../lib/window-hooks';
import { SchemaItem, ROW_NUMS_WIDTH, GridViewport } from "../lib/types";

const Container = styled.div`
  padding-left: ${ROW_NUMS_WIDTH}px;
  background: #d8d8d8;
  box-sizing: border-box;
  white-space: nowrap;
`;

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

  &:hover {
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

const MIN_CELL_WIDTH = 60;

type GridHeaderProps = {
  viewport: GridViewport | null;
  cells: SchemaItem[];
  width: number;
  gridHeight: number;
  onChangeHeight: (value: number) => void;
  onResizeCell: (cellIdx: number, width: number) => void;
};

type ResizingCell = {
  idx: number
  startingX: number
  startingWidth: number
}

const GridHeader = ({ viewport, cells, width, gridHeight, onChangeHeight, onResizeCell }: GridHeaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizingCell, setResizingCell] = useState<ResizingCell | null>(null);
  const [resizingCellWidth, setResizingCellWidth] = useState(0);
  const elements = [];

  // Allow for a dynamic content based column height
  useLayoutEffect(() => {
    if (containerRef.current) {
      onChangeHeight(containerRef.current.clientHeight);
    }
  });

  useWindowEvent('mouseup', () => {
    if (resizingCell) {
      if (cells && viewport) {
        const newHeight = Math.max(MIN_CELL_WIDTH, resizingCellWidth);

        onResizeCell(resizingCell.idx, newHeight);
      }

      setResizingCell(null);
    }
  }, [resizingCell, resizingCellWidth, viewport, cells, onResizeCell]);

  const onResizeMouseDown = (cellIdx: number) => (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const { width } = cells[cellIdx].dimension;

    setResizingCellWidth(width);
    setResizingCell({
      idx: cellIdx,
      startingX: e.pageX,
      startingWidth: width,
    });
  }

  const onContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (resizingCell) {
      const { startingX, startingWidth } = resizingCell;

      setResizingCellWidth(Math.max(MIN_CELL_WIDTH, startingWidth + (e.pageX - startingX)));
    }
  }

  if (!viewport) {
    return null;
  }

  for (var idx = viewport.left; idx < cells.length && idx <= viewport.right; idx++) {
    const {
      label,
      id,
      dimension,
    } = cells[idx];

    const isResizingCell = resizingCell && resizingCell.idx === idx;
    const width = isResizingCell ? resizingCellWidth : dimension.width;

    elements.push(
      <Column key={id} style={{ width }} title={label}>
        <ColumnLabel>{label}</ColumnLabel>
        <ColumnResizeHandle onMouseDown={onResizeMouseDown(idx)} />
        {isResizingCell && (
          <ColumnResizeMarker style={{ bottom: -gridHeight - 1 }} />
        )}
      </Column>
    );
  }

  return (
    <Container ref={containerRef} style={{ width }} onMouseMove={onContainerMouseMove}>
      <ScrollCorner
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: ROW_NUMS_WIDTH,
          borderTopWidth: 0,
          borderLeftWidth: 0,
          borderColor: "#c3c3c3",
        }}
      />
      {elements}
      <ScrollCorner
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: SCROLLBAR_SIZE,
          borderTopWidth: 0,
          borderRightWidth: 0,
          borderColor: "#c3c3c3",
        }}
      />
    </Container>
  );
};

export default GridHeader;
