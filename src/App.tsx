import { useEffect, useState } from "react";
import styled from "styled-components";

import Grid from "./components/Grid";
import { GridModel } from "./lib/types";
import { useWindowEvent } from "./lib/window-hooks";
import WorkerGridModel from "./models/worker-grid-model";

import "./App.css";

const HEADER_HEIGHT = 40;

const Container = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  h1 {
    margin: 0 0 30px;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: start;
  align-items: center;
  height: ${HEADER_HEIGHT}px;
  box-sizing: border-box;
  border-bottom: 1px solid #c3c3c3;
  padding-left: 10px;
`;

const DatasetButton = styled.button`
  display: block;
  font-size: 24px;
  margin-bottom: 10px;
  padding: 6px 14px;
`;

function App() {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight - HEADER_HEIGHT);
  const [ready, setReady] = useState(false);
  const [model, setModel] = useState<GridModel | null>(null);

  useWindowEvent(
    "resize",
    () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight - HEADER_HEIGHT);
    },
    []
  );

  useEffect(() => {
    return () => {
      model?.terminate();
    };
  }, [model]);

  const onClickDataset = (segment: string) => async () => {
    const nextModel = new WorkerGridModel(segment);

    setModel(nextModel);

    await nextModel.configure();

    setReady(true);
  };

  const onClickClose = () => {
    setModel(null);
    setReady(false);
  };

  if (!model) {
    return (
      <Container>
        <h1>Select a dataset to view</h1>

        <DatasetButton onClick={onClickDataset("education")}>
          US County Education Stats (3,283 Records)
        </DatasetButton>
        <DatasetButton onClick={onClickDataset("population")}>
          US City Population Stats (81,434 Records)
        </DatasetButton>
      </Container>
    );
  }

  return (
    !!ready &&
    !!model && (
      <>
        <Header>
          <button onClick={onClickClose}>Close Dataset</button>
        </Header>
        <Grid model={model} width={width} height={height} />
      </>
    )
  );
}

export default App;
