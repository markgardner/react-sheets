const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");

function buildDataset(filepath) {
  var left = 0,
    top = 0;
  const fileRawData = fs.readFileSync(path.resolve(__dirname, filepath), { encoding: "utf8" });
  const csvRows = parse(fileRawData, {});
  const [headerCells] = csvRows.splice(0, 1);

  const cells = headerCells.map((label, idx) => {
    const width = 108;
    const cell = {
      id: idx,
      label,
      type: "text",
      dimension: {
        width,
        left,
        center: left + width / 2,
        right: left + width,
      },
    };

    left += width;

    return cell;
  });

  const rows = csvRows.map((cells, idx) => {
    const height = 22;
    const row = {
      id: idx,
      label: (idx + 1).toString(),
      dimension: {
        height,
        top,
        center: top + height / 2,
        bottom: top + height,
      },
      cells,
    };

    top += height;

    return row;
  });

  const schema = {
    contentHeight: top,
    contentWidth: left,
    firstRecordId: rows[0].id,
    lastRecordId: rows[rows.length - 1].id,
    numberOfRows: rows.length,
    cells,
  };

  return [schema, rows];
}

module.exports = function (app) {
  const [educationSchema, educationRows] = buildDataset("../Education.csv");
  const [populationSchema, populationRows] = buildDataset("../Population.csv");

  app.get("/api/v1/education", (req, res) => {
    res.send({
      schema: educationSchema,
    });
  });

  app.get("/api/v1/education/data", (req, res) => {
    const { startAtRecordId, pageSize } = req.query;

    const startIdx = (startAtRecordId === "null" ? -1 : parseInt(startAtRecordId, 10)) + 1;
    const rows = educationRows.slice(startIdx, startIdx + parseInt(pageSize, 10));

    res.send({
      rows,
    });
  });

  app.get("/api/v1/population", (req, res) => {
    res.send({
      schema: populationSchema,
    });
  });

  app.get("/api/v1/population/data", (req, res) => {
    const { startAtRecordId, pageSize } = req.query;

    const startIdx = (startAtRecordId === "null" ? -1 : parseInt(startAtRecordId, 10)) + 1;
    const rows = populationRows.slice(startIdx, startIdx + parseInt(pageSize, 10));

    res.send({
      rows,
    });
  });
};
