import { RowItem, SchemaItem, GridViewport } from "../lib/types";

/* eslint-disable import/no-webpack-loader-syntax */
import DataLoaderWorker from "worker-loader!../workers/data-loader-worker";

type GridModelLoadingState = "INIT" | "LOADING" | "LOADED";

type MessageResponse = {
  id: number;
  result?: any;
  error?: any;
};

export default class WorkerGridModel {
  _msgIdSync: number;
  _pendingResponses: { [key: number]: any[] };
  _worker: Worker;
  _segment: string;
  _onRefreshHandle: () => void;

  loaded: GridModelLoadingState;
  pxContentHeight: number;
  pxContentWidth: number;
  rows: RowItem[];
  cells: SchemaItem[];
  firstRecordId: number;
  lastRecordId: number;
  numberOfRecords: number;

  constructor(segment: string) {
    this._msgIdSync = 0;
    this._pendingResponses = {};
    this._worker = new DataLoaderWorker();
    this._worker.addEventListener("message", this._onMessage.bind(this));
    this._segment = segment;
    this._onRefreshHandle = () => {};

    this.loaded = "INIT";
    this.pxContentHeight = 0;
    this.pxContentWidth = 0;
    this.rows = [];
    this.cells = [];
    this.firstRecordId = -1;
    this.lastRecordId = -1;
    this.numberOfRecords = 0;
  }

  _onMessage(event: MessageEvent<MessageResponse>) {
    const [resolve, reject] = this._pendingResponses[event.data.id];

    delete this._pendingResponses[event.data.id];

    if (event.data.error) {
      reject(event.data.error);
    } else {
      resolve(event.data.result);
    }
  }

  _sendAndWait(action: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const msgId = this._msgIdSync++;

      this._pendingResponses[msgId] = [resolve, reject];

      this._worker.postMessage({
        id: msgId,
        action,
        payload,
      });
    });
  }

  terminate() {
    this._worker.terminate();
  }

  async configure(): Promise<void> {
    const payload = { segment: this._segment };

    this.loaded = "LOADING";

    const [schema] = await Promise.all([this._sendAndWait("CONFIGURE", payload), this.loadData()]);

    const { contentWidth, contentHeight, cells, firstRecordId, lastRecordId, numberOfRecords } = schema;

    this.loaded = "LOADED";
    this.pxContentWidth = contentWidth;
    this.pxContentHeight = contentHeight;
    this.firstRecordId = firstRecordId;
    this.lastRecordId = lastRecordId;
    this.numberOfRecords = numberOfRecords;
    this.cells = cells;
  }

  loadData(): Promise<void> {
    return new Promise(async (resolve) => {
      const payload = {
        segment: this._segment,
        startAtRecordId: null,
        pageSize: 250,
      };

      var nextRows = await this._sendAndWait("LOAD_NEXT", payload);

      // Resolve now to render first page and keep loading the rest
      this.rows = nextRows;
      resolve(nextRows);

      // Keep loading until all data is loaded
      while (nextRows.length) {
        const payload = {
          segment: this._segment,
          startAtRecordId: nextRows[nextRows.length - 1].id,
          pageSize: 5000,
        };

        nextRows = await this._sendAndWait("LOAD_NEXT", payload);

        this.rows.push(...nextRows);
      }
    });
  }

  calculateNextViewport(
    viewport: GridViewport | null,
    scrollLeft: number,
    scrollTop: number,
    width: number,
    height: number
  ): GridViewport | null {
    const { cells, rows } = this;
    var nextTop = -1;
    var nextLeft = -1;
    var nextBottom = rows.length - 1;
    var nextRight = cells.length - 1;
    const gridBottom = scrollTop + height;
    const gridRight = scrollLeft + width;

    // Find the cells for the left and right sides of the viewport
    for (let cellIdx = 0; cellIdx < cells.length; cellIdx++) {
      const { dimension } = cells[cellIdx];

      if (nextLeft === -1) {
        if (dimension.left <= scrollLeft && dimension.right >= scrollLeft) {
          nextLeft = cellIdx;
        }
      } else if (dimension.left <= gridRight && dimension.right >= gridRight) {
        nextRight = cellIdx;
        break;
      }
    }

    // Find the cells for the top and bottom sides of the viewport
    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const { dimension } = rows[rowIdx];

      if (nextTop === -1) {
        if (dimension.top <= scrollTop && dimension.bottom >= scrollTop) {
          nextTop = rowIdx;
        }
      } else if (dimension.top <= gridBottom && dimension.bottom >= gridBottom) {
        nextBottom = rowIdx;
        break;
      }
    }

    // Exit if scroll offsets are not matching or the dataset is empty
    if (nextTop === -1 || nextLeft === -1 || nextBottom === -1 || nextRight === -1) {
      return null;
    }

    // Check if needing new viewport
    if (
      !viewport ||
      viewport.top !== nextTop ||
      viewport.left !== nextLeft ||
      viewport.bottom !== nextBottom ||
      viewport.right !== nextRight
    ) {
      const pxWidth = cells[nextRight].dimension.right - cells[nextLeft].dimension.left;
      const pxHeight = rows[nextBottom].dimension.bottom - rows[nextTop].dimension.top;

      return {
        top: nextTop,
        left: nextLeft,
        bottom: nextBottom,
        right: nextRight,
        pxWidth,
        pxHeight,
        pxContentHeight: this.pxContentHeight,
        pxContentWidth: this.pxContentWidth,
      };
    }

    return null;
  }

  resizeRow(rowIdx: number, height: number) {
    const { rows } = this;
    var top = rows[rowIdx].dimension.top;

    rows[rowIdx].dimension.height = height;

    for (var idx = rowIdx; idx < rows.length; idx++) {
      const { dimension } = rows[idx];

      dimension.top = top;
      dimension.center = top + dimension.height / 2;
      dimension.bottom = top + dimension.height;

      top = dimension.bottom;
    }

    this.pxContentHeight = top;

    this._onRefreshHandle();
  }

  resizeCell(cellIdx: number, width: number) {
    const { cells } = this;
    var left = cells[cellIdx].dimension.left;

    cells[cellIdx].dimension.width = width;

    for (var idx = cellIdx; idx < cells.length; idx++) {
      const { dimension } = cells[idx];

      dimension.left = left;
      dimension.center = left + dimension.width / 2;
      dimension.right = left + dimension.width;

      left = dimension.right;
    }

    this.pxContentWidth = left;

    this._onRefreshHandle();
  }

  changeCell(cellIdx: number, rowIdx: number, value: string) {
    this.rows[rowIdx].cells[cellIdx] = value;

    this._onRefreshHandle();
  }

  onRefresh(callback: () => void) {
    this._onRefreshHandle = callback;
  }
}
