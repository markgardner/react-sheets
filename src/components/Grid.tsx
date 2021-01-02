import { useRef, useState } from "react";
import styled from "styled-components";

import TableRenderer from "./TableRenderer";
import GridHeader from "./GridHeader";
import GridRowNumInteractions from "./GridRowNumInteractions";
import GridTableInteractions from "./GridTableInteractions";
import GridScrollbar, { ScrollCorner, SCROLLBAR_SIZE } from "./GridScrollbar";
import { ROW_NUMS_WIDTH, GridModel } from "../lib/types";
import { useModelState } from "../models/model-hooks";

const Wrap = styled.div`
  position: relative;
  background: #f8f8f8;
`;
const Group = styled.div`
  position: relative;
`;

type GridProps = {
  model: GridModel;
  width: number;
  height: number;
};

const Grid = ({ model, width, height }: GridProps) => {
  const verticalScrollRef = useRef<HTMLDivElement>(null);
  const horizontalScrollRef = useRef<HTMLDivElement>(null);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, cells, rows] = useModelState(model, scrollLeft, scrollTop, width, height);

  const maxScrollHeight = (viewport?.pxContentHeight || 0) + 80;
  const maxScrollWidth = (viewport?.pxContentWidth || 0) + 120;
  const midGroupHeight = height - headerHeight - SCROLLBAR_SIZE;
  const bottomGroupHeight = SCROLLBAR_SIZE;

  const onScrollDelta = (deltaX: number, deltaY: number) => {
    if (viewport) {
      if (verticalScrollRef.current && deltaY) {
        const jumpRows =
          deltaY > 0
            ? rows.slice(viewport.top, viewport.top + deltaY)
            : rows.slice(Math.max(viewport.top + deltaY, 0), viewport.top);
        const jumpRowDistance =
          deltaY > 0
            ? jumpRows.reduce((res, cur) => res + cur.dimension.height, 0)
            : jumpRows.reduce((res, cur) => res - cur.dimension.height, 0);

        verticalScrollRef.current.scrollTop += jumpRowDistance;
      }

      if (horizontalScrollRef.current && deltaX) {
        const jumpCells =
          deltaX > 0
            ? cells.slice(viewport.left, viewport.left + deltaX)
            : cells.slice(Math.max(viewport.left + deltaX, 0), viewport.left);
        const jumpCellDistance =
          deltaX > 0
            ? jumpCells.reduce((res, cur) => res + cur.dimension.width, 0)
            : jumpCells.reduce((res, cur) => res - cur.dimension.width, 0);

        horizontalScrollRef.current.scrollLeft += jumpCellDistance;
      }
    }
  };

  const onResizeRow = (rowIdx: number, height: number) => {
    model.resizeRow(rowIdx, height);
  };

  const onResizeCell = (cellIdx: number, width: number) => {
    model.resizeCell(cellIdx, width);
  };

  const onChangeCell = (cellIdx: number, rowIdx: number, value: string) => {
    model.changeCell(cellIdx, rowIdx, value);
  }

  return (
    <Wrap style={{ width, height }}>
      {viewport && rows && (
        <TableRenderer
          viewport={viewport}
          cells={cells}
          rows={rows}
          top={headerHeight}
          left={0}
          width={width - SCROLLBAR_SIZE}
          height={midGroupHeight}
        />
      )}
      <Group style={{ width, height: headerHeight }}>
        <GridHeader
          viewport={viewport}
          cells={cells}
          width={width}
          gridHeight={midGroupHeight}
          onChangeHeight={setHeaderHeight}
          onResizeCell={onResizeCell}
        />
      </Group>
      <Group style={{ width, height: midGroupHeight }}>
        <GridRowNumInteractions
          viewport={viewport}
          rows={rows}
          width={ROW_NUMS_WIDTH}
          height={midGroupHeight}
          onResizeRow={onResizeRow}
        />
        <GridTableInteractions
          viewport={viewport}
          cells={cells}
          rows={rows}
          width={width - ROW_NUMS_WIDTH - SCROLLBAR_SIZE}
          height={midGroupHeight}
          onScrollDelta={onScrollDelta}
          onChangeCell={onChangeCell}
        />
        <GridScrollbar
          ref={verticalScrollRef}
          contentSize={maxScrollHeight}
          width={SCROLLBAR_SIZE}
          height={midGroupHeight}
          orientation="vertical"
          onScroll={setScrollTop}
        />
      </Group>
      <Group style={{ width, height: bottomGroupHeight }}>
        <ScrollCorner
          style={{
            width: ROW_NUMS_WIDTH,
            height: bottomGroupHeight,
            borderLeftWidth: 0,
            borderBottomWidth: 0,
          }}
        />
        <GridScrollbar
          ref={horizontalScrollRef}
          contentSize={maxScrollWidth}
          width={width - ROW_NUMS_WIDTH - SCROLLBAR_SIZE}
          height={bottomGroupHeight}
          orientation="horizontal"
          onScroll={setScrollLeft}
        />
        <ScrollCorner
          style={{
            width: SCROLLBAR_SIZE,
            height: bottomGroupHeight,
            borderBottomWidth: 0,
            borderRightWidth: 0,
          }}
        />
      </Group>
    </Wrap>
  );
};

export default Grid;
