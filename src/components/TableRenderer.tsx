import { useRef, useEffect } from "react";
import styled from "styled-components";

import { RowItem, SchemaItem, ROW_NUMS_WIDTH, GridViewport } from "../lib/types";

const RATIO = window.devicePixelRatio || 1;
const SHARP_LINE_OFFSET = 0.5;

const Canvas = styled.canvas`
  position: absolute;
  background: #fff;
`;

function renderRowNumberHeader(context: CanvasRenderingContext2D, rows: RowItem[], viewport: GridViewport) {
  context.save();

  // Set the background for the row number column
  context.fillStyle = "#f8f8f8";
  context.fillRect(0, 0, ROW_NUMS_WIDTH, viewport.pxHeight);

  // Help improve render type by configuring the context upfront.
  context.lineWidth = 1;
  context.strokeStyle = "#c3c3c3";
  context.fillStyle = "#6b6b6b";
  context.font = "13px Roboto,RobotoDraft,Helvetica,Arial,sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Draw the right border for the row number column
  context.beginPath();
  context.moveTo(ROW_NUMS_WIDTH - SHARP_LINE_OFFSET, 0);
  context.lineTo(ROW_NUMS_WIDTH - SHARP_LINE_OFFSET, viewport.pxHeight);

  const textCenter = ROW_NUMS_WIDTH / 2;
  const offsetTop = rows[viewport.top].dimension.top;

  // Draw the row number bottom border for each row
  for (let idx = viewport.top; idx < rows.length && idx <= viewport.bottom; idx++) {
    const { label, dimension } = rows[idx];
    const lineY = dimension.bottom + SHARP_LINE_OFFSET - offsetTop;

    context.moveTo(0, lineY);
    context.lineTo(ROW_NUMS_WIDTH, lineY);

    context.fillText(label, textCenter, dimension.center + 2 - offsetTop, ROW_NUMS_WIDTH);
  }

  context.closePath();

  context.stroke();
  context.fill();

  context.restore();
}

function renderTable(
  context: CanvasRenderingContext2D,
  cells: SchemaItem[],
  rows: RowItem[],
  viewport: GridViewport
) {
  context.save();

  // Clear the grid viewport
  context.fillStyle = "#fff";
  context.fillRect(ROW_NUMS_WIDTH, 0, viewport.pxWidth, viewport.pxHeight);

  // Help improve render type by configuring the context upfront.
  context.lineWidth = 1;
  context.strokeStyle = "#eaeaea";
  context.fillStyle = "#212121";
  context.font = "13px Arial";
  context.textAlign = "left";
  context.textBaseline = "bottom";

  const offsetLeft = cells[viewport.left].dimension.left;
  const offsetTop = rows[viewport.top].dimension.top;

  context.beginPath();

  // Draw the lines for the visible columns in the table grid
  for (let cellIdx = viewport.left; cellIdx < cells.length && cellIdx <= viewport.right; cellIdx++) {
    const { dimension } = cells[cellIdx];
    const lineX = ROW_NUMS_WIDTH + dimension.right - SHARP_LINE_OFFSET - offsetLeft;

    context.moveTo(lineX, 0);
    context.lineTo(lineX, viewport.pxHeight);
  }

  // Draw the lines for the visible rows in the table grid
  for (let rowIdx = viewport.top; rowIdx < rows.length && rowIdx <= viewport.bottom; rowIdx++) {
    const { dimension } = rows[rowIdx];
    const lineY = dimension.bottom + SHARP_LINE_OFFSET - offsetTop;

    context.moveTo(ROW_NUMS_WIDTH, lineY);
    context.lineTo(ROW_NUMS_WIDTH + viewport.pxWidth, lineY);
  }

  context.closePath();

  context.stroke();
  context.fill();

  // Write the column text for each cell visible
  for (let rowIdx = viewport.top; rowIdx < rows.length && rowIdx <= viewport.bottom; rowIdx++) {
    const { dimension: rowDimension, cells: rowData } = rows[rowIdx];
    const lineY = rowDimension.bottom + SHARP_LINE_OFFSET - offsetTop;

    for (let dataIdx = viewport.left; dataIdx < rowData.length && dataIdx <= viewport.right; dataIdx++) {
      const label = rowData[dataIdx];
      const { dimension: cellDimension } = cells[dataIdx];

      const rectX = ROW_NUMS_WIDTH + cellDimension.left + SHARP_LINE_OFFSET - offsetLeft;
      const rectTop = rowDimension.top + SHARP_LINE_OFFSET - offsetTop;

      context.save();
      context.beginPath();
      context.rect(rectX + 4, rectTop + 4, cellDimension.width - 8, rowDimension.height - 8);
      context.clip();
      context.fillText(label, rectX + 4, lineY - 4);
      context.restore();
    }
  }

  context.restore();
}

function renderEmptySpace(
  context: CanvasRenderingContext2D,
  viewport: GridViewport,
  width: number,
  height: number
) {
  context.save();

  context.fillStyle = "#d8d8d8";

  // Render a dark gray background for empty space at the right
  if (viewport.pxWidth < width) {
    context.fillRect(ROW_NUMS_WIDTH + viewport.pxWidth, 0, width - viewport.pxWidth - 1, height);
  }

  // Render a dark gray background for empty space at the bottom
  if (viewport.pxHeight < height) {
    context.fillRect(0, viewport.pxHeight + 1, width, height - viewport.pxHeight - 1);
  }

  context.restore();
}

type TableRendererProps = {
  viewport: GridViewport | null;
  cells: SchemaItem[];
  rows: RowItem[];
  top: number;
  left: number;
  width: number;
  height: number;
};

const TableRenderer = ({ viewport, cells, rows, left, top, width, height }: TableRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (viewport) {
      const requestId = requestAnimationFrame(() => {
        const context = canvasRef.current?.getContext("2d");

        if (context) {
          if (RATIO > 1) {
            context.setTransform(RATIO, 0, 0, RATIO, 0, 0);
          }

          renderTable(context, cells, rows, viewport);
          renderRowNumberHeader(context, rows, viewport);
          renderEmptySpace(context, viewport, width, height);
        }
      });

      return () => {
        cancelAnimationFrame(requestId);
      };
    }
  }, [viewport, rows, cells, width, height]);

  const canvasWidth = RATIO * width;
  const canvasHeight = RATIO * height;

  return (
    <Canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{ top, left, width, height }}
    />
  );
};

export default TableRenderer;
