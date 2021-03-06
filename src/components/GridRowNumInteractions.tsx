import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { useWindowEvent } from "../lib/window-hooks";
import { GridViewport, RowItem, ROW_HEIGHT } from "../lib/types";

const Container = styled.div`
  display: inline-block;
`;

const Resizer = styled.div`
  position: absolute;
  left: 0;
  height: 6px;
  background: #4d90fe;
  cursor: ns-resize;
`;

const DragHandle = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background: rgba(77, 144, 254, 0.6);
`;

type GridRowNumInteractionsProps = {
  viewport: GridViewport | null;
  rows: RowItem[] | null;
  width: number;
  height: number;
  onResizeRow: (rowIdx: number, height: number) => void;
};

const GridRowNumInteractions = ({
  viewport,
  rows,
  width,
  height,
  onResizeRow,
}: GridRowNumInteractionsProps) => {
  const containerOffsetY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [resizingRowIdx, setResizingRowIdx] = useState(-1);
  const [resizerPos, setResizerPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // The viewport changes everytime the grid changes size
  useEffect(() => {
    containerOffsetY.current = null;
  }, [viewport]);

  useWindowEvent(
    "mouseup",
    () => {
      if (isDragging) {
        if (rows && viewport) {
          const gridOffsetY = rows[viewport.top].dimension.top;
          const newBottom = gridOffsetY + resizerPos + 6;
          const lastDimension = rows[resizingRowIdx].dimension;
          const newHeight = Math.max(ROW_HEIGHT, newBottom - lastDimension.top);

          onResizeRow(resizingRowIdx, newHeight);
        }

        setIsDragging(false);
        setResizingRowIdx(-1);
      }
    },
    [isDragging, resizerPos, resizingRowIdx, rows, viewport, onResizeRow]
  );

  useWindowEvent(
    "mousemove",
    (e: MouseEvent) => {
      if (viewport && rows) {
        if (!isDragging && e.target === containerRef.current) {
          if (containerOffsetY.current === null) {
            const rect = containerRef.current?.getBoundingClientRect();

            containerOffsetY.current = rect?.top || 0;
          }

          const gridOffsetY = rows[viewport.top].dimension.top;
          const gridPositionY = gridOffsetY + e.pageY - containerOffsetY.current;

          for (var idx = viewport.top; idx <= viewport.bottom; idx++) {
            const { bottom } = rows[idx].dimension;

            if (bottom - 6 < gridPositionY && gridPositionY < bottom) {
              setResizerPos(bottom - gridOffsetY - 6);
              setResizingRowIdx(idx);
              return;
            } else if (bottom > gridPositionY && resizingRowIdx > -1) {
              setResizingRowIdx(-1);
              return;
            }
          }
        } else if (isDragging) {
          setResizerPos(e.pageY - (containerOffsetY.current || 0) - 3);
        }
      }
    },
    [viewport, rows, isDragging, resizingRowIdx]
  );

  const onContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (resizingRowIdx > -1) {
      setIsDragging(true);
    }
  };

  const onContainerMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDragging) {
      setResizingRowIdx(-1);
      setResizerPos(0);
    }
  };

  return (
    <Container
      ref={containerRef}
      style={{ width, height }}
      onMouseDown={onContainerMouseDown}
      onMouseLeave={onContainerMouseLeave}
    >
      {resizingRowIdx > -1 && <Resizer style={{ top: resizerPos, width }} />}
      {isDragging && <DragHandle style={{ top: resizerPos + 2 }} />}
    </Container>
  );
};

export default GridRowNumInteractions;
