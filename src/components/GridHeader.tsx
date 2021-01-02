import { useRef, useLayoutEffect, useState } from "react";
import styled from "styled-components";

import GridHeaderColumns, { ResizingCell } from "./GridHeaderColumns";
import { ScrollCorner, SCROLLBAR_SIZE } from "./GridScrollbar";
import { useWindowEvent } from "../lib/window-hooks";
import { SchemaItem, ROW_NUMS_WIDTH, GridViewport } from "../lib/types";

const Container = styled.div`
  padding-left: ${ROW_NUMS_WIDTH}px;
  background: #d8d8d8;
  box-sizing: border-box;
  white-space: nowrap;
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

const GridHeader = ({
  viewport,
  cells,
  width,
  gridHeight,
  onChangeHeight,
  onResizeCell,
}: GridHeaderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizingCell, setResizingCell] = useState<ResizingCell | null>(null);
  const [resizingCellWidth, setResizingCellWidth] = useState(0);

  // Allow for a dynamic content based column height
  useLayoutEffect(() => {
    if (containerRef.current) {
      onChangeHeight(containerRef.current.clientHeight);
    }
  });

  useWindowEvent(
    "mouseup",
    () => {
      if (resizingCell) {
        if (cells && viewport) {
          const newHeight = Math.max(MIN_CELL_WIDTH, resizingCellWidth);

          onResizeCell(resizingCell.idx, newHeight);
        }

        setResizingCell(null);
      }
    },
    [resizingCell, resizingCellWidth, viewport, cells, onResizeCell]
  );

  useWindowEvent(
    "mousemove",
    (e: MouseEvent) => {
      if (resizingCell) {
        const { startingX, startingWidth } = resizingCell;

        setResizingCellWidth(Math.max(MIN_CELL_WIDTH, startingWidth + (e.pageX - startingX)));
      }
    },
    [resizingCell]
  );

  const onResizeStart = (cellIdx: number, pageX: number) => {
    const { width } = cells[cellIdx].dimension;

    setResizingCellWidth(width);
    setResizingCell({
      idx: cellIdx,
      startingX: pageX,
      startingWidth: width,
    });
  };

  if (!viewport) {
    return null;
  }

  return (
    <Container ref={containerRef} style={{ width }}>
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
      <GridHeaderColumns
        viewport={viewport}
        cells={cells}
        resizingCell={resizingCell}
        resizingCellWidth={resizingCellWidth}
        gridHeight={gridHeight}
        onResizeStart={onResizeStart}
      />
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
