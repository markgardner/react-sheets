// eslint-disable-next-line no-restricted-globals
const ctx: Worker = self as any;

ctx.addEventListener("message", (event) => {
  const { action, id, payload } = event.data;

  switch (action) {
    case "CONFIGURE":
      return loadAndConfigureDatasource(id, payload.segment);
    case "LOAD_NEXT":
      return loadNextPageOfData(id, payload.segment, payload.startAtRecordId, payload.pageSize);
    default:
      return _respondToRequest(id, { code: "UNKNOWN_ACTION" }, null);
  }
});

function _respondToRequest(requestId: number, error: any, result: any) {
  ctx.postMessage({
    id: requestId,
    result,
    error,
  });
}

function loadAndConfigureDatasource(requestId: number, segment: string) {
  const url = `/api/v1/${segment}`;

  fetch(url, {
    headers: {
      accept: "application/json",
    },
  })
    .then((res) => res.json())
    .then((result) => {
      const { contentWidth, contentHeight, cells, firstRecordId, lastRecordId, numberOfRows } = result.schema;

      _respondToRequest(requestId, null, {
        contentWidth,
        contentHeight,
        cells,
        firstRecordId,
        lastRecordId,
        numberOfRows,
      });
    });
}

function loadNextPageOfData(requestId: number, segment: string, startAtRecordId: number, pageSize: number) {
  const url = `/api/v1/${segment}/data?startAtRecordId=${startAtRecordId}&pageSize=${pageSize}`;

  fetch(url, {
    headers: {
      accept: "application/json",
    },
  })
    .then((res) => res.json())
    .then((result) => {
      _respondToRequest(requestId, null, result.rows);
    });
}

// Keep webpack happy
const result = {};
export default result;
