import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

import { GridViewport, RowItem, SchemaItem } from "../lib/types";

const DOM_DELTA_LINE = 1;
const DELTA_LINE_HEIGHT = 22;

const Container = styled.div`
  display: inline-block;
  position: relative;
  overflow: hidden;
`;

const SelectionBox = styled.div`
  position: absolute;
  box-sizing: border-box;
  outline: 2px solid #4d90fe;
`;

const SelectionBoxEditing = styled(SelectionBox)`
  background: #fff;
  box-shadow: 0px 0px 7px 2px rgba(0,0,0,0.18);
`;

const SelectionBoxInput = styled.input`
  font: 13px Arial;
  color: #212121;
  appearance: none;
  display: block;
  border: none;
  width: 100%;
  box-sizing: border-box;
  padding: 4px;

  &:focus {
    outline: none;
  }
`;

function findCellIdxByCoordinate(viewport: GridViewport, cells: SchemaItem[], offsetX: number): number {
  offsetX += cells[viewport.left].dimension.left;

  for (var idx = viewport.left; idx <= viewport.right; idx++) {
    const { dimension } = cells[idx];

    if (offsetX > dimension.left && offsetX < dimension.right) {
      return idx;
    }
  }

  return -1;
}

function findRowIdxByCoordinate(viewport: GridViewport, rows: RowItem[], offsetY: number): number {
  offsetY += rows[viewport.top].dimension.top;

  for (var idx = viewport.top; idx <= viewport.bottom; idx++) {
    const { dimension } = rows[idx];

    if (offsetY > dimension.top && offsetY < dimension.bottom) {
      return idx;
    }
  }

  return -1;
}

function getCellPosition(
  viewport: GridViewport,
  cellIdx: number,
  cells: SchemaItem[],
  rowIdx: number,
  rows: RowItem[]
): GridCellPosition {
  const { left: viewportLeft } = cells[viewport.left].dimension;
  const { top: viewportTop } = rows[viewport.top].dimension;
  const { left, width } = cells[cellIdx].dimension;
  const { top, height } = rows[rowIdx].dimension;

  return {
    cellIdx,
    rowIdx,
    style: {
      left: left - viewportLeft,
      top: top - viewportTop + 1,
      width: width - 1,
      height: height - 1,
    },
  };
}

function isPositionDifferent(oldStyle: React.CSSProperties, newStyle: React.CSSProperties) {
  return (
    oldStyle.left !== newStyle.left ||
    oldStyle.top !== newStyle.top ||
    oldStyle.width !== newStyle.width ||
    oldStyle.height !== newStyle.height
  );
}

type GridCellPosition = {
  cellIdx: number;
  rowIdx: number;
  style: React.CSSProperties;
};

type GridTableSelectionProps = {
  viewport: GridViewport | null;
  cells: SchemaItem[];
  rows: RowItem[];
  width: number;
  height: number;
  onScrollDelta: (x: number, y: number) => void;
  onChangeCell: (cellIdx: number, rowIdx: number, value: string) => void;
};

const GridTableSelection = ({
  viewport,
  cells,
  rows,
  width,
  height,
  onScrollDelta,
  onChangeCell,
}: GridTableSelectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingDeltaX = useRef(0);
  const pendingDeltaY = useRef(0);
  const [editingCell, setEditingCell] = useState<GridCellPosition | null>(null);
  const [selectedCell, setSelectedCell] = useState<GridCellPosition | null>(null);
  const [cellValue, setCellValue] = useState("");

  useEffect(() => {
    if (viewport) {
      if (selectedCell) {
        const newSelectedCell = getCellPosition(
          viewport,
          selectedCell.cellIdx,
          cells,
          selectedCell.rowIdx,
          rows
        );

        if (isPositionDifferent(selectedCell.style, newSelectedCell.style)) {
          setSelectedCell(newSelectedCell);
        }
      } else if (editingCell) {
        const newEditingCell = getCellPosition(
          viewport,
          editingCell.cellIdx,
          cells,
          editingCell.rowIdx,
          rows
        );

        if (isPositionDifferent(editingCell.style, newEditingCell.style)) {
          setEditingCell(newEditingCell);
        }
      }
    }
  }, [viewport, cells, rows, selectedCell, editingCell]);

  const onWheelHandler = (event: React.WheelEvent<HTMLDivElement>) => {
    const deltaX = event.deltaMode === DOM_DELTA_LINE ? event.deltaX : event.deltaX / DELTA_LINE_HEIGHT;
    const deltaY = event.deltaMode === DOM_DELTA_LINE ? event.deltaY : event.deltaY / DELTA_LINE_HEIGHT;

    pendingDeltaX.current += deltaX;
    pendingDeltaY.current += deltaY;

    const pendingXReady = pendingDeltaX.current > 1 || pendingDeltaX.current < -1;
    const pendingYReady = pendingDeltaY.current > 1 || pendingDeltaY.current < -1;

    if (pendingXReady && pendingYReady) {
      onScrollDelta(pendingDeltaX.current, pendingDeltaY.current);

      pendingDeltaX.current = 0;
      pendingDeltaY.current = 0;
    } else if (pendingXReady) {
      onScrollDelta(pendingDeltaX.current, 0);

      pendingDeltaX.current = 0;
    } else if (pendingYReady) {
      onScrollDelta(0, pendingDeltaY.current);

      pendingDeltaY.current = 0;
    }
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (viewport && event.target === containerRef.current) {
      const { offsetX, offsetY } = event.nativeEvent;
      const cellIdx = findCellIdxByCoordinate(viewport, cells, offsetX);
      const rowIdx = findRowIdxByCoordinate(viewport, rows, offsetY);

      if (cellIdx > -1 && rowIdx > -1) {
        if (editingCell) {
          if (editingCell.cellIdx === cellIdx && editingCell.rowIdx === rowIdx) {
            return;
          }

          setEditingCell(null);
        }

        setSelectedCell(getCellPosition(viewport, cellIdx, cells, rowIdx, rows));
      }
    }
  };

  const onDoubleClick = () => {
    if (viewport && selectedCell) {
      setCellValue(rows[selectedCell.rowIdx].cells[selectedCell.cellIdx]);
      setSelectedCell(null);
      setEditingCell(selectedCell);
    }
  };

  const onKeyUpInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (editingCell) {
      if (event.key === "Escape") {
        setEditingCell(null);
      } else if (event.key === "Enter") {
        onChangeCell(editingCell.cellIdx, editingCell.rowIdx, cellValue);
        setEditingCell(null);
      }
    }
  };

  const onBlurInput = () => {
    if (editingCell) {
      onChangeCell(editingCell.cellIdx, editingCell.rowIdx, cellValue);
      setEditingCell(null);
    }
  };

  return (
    <Container
      ref={containerRef}
      style={{
        width,
        height,
      }}
      onWheel={onWheelHandler}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {selectedCell && <SelectionBox style={selectedCell.style} />}
      {editingCell && (
        <SelectionBoxEditing style={editingCell.style}>
          <SelectionBoxInput
            autoFocus={true}
            value={cellValue}
            onChange={(e) => setCellValue(e.target.value)}
            onKeyUp={onKeyUpInput}
            onBlur={onBlurInput}
          />
        </SelectionBoxEditing>
      )}
    </Container>
  );
};

export default GridTableSelection;
