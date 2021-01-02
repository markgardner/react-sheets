import { useEffect, useState } from "react";
import Grid from "./components/Grid";
import { GridModel } from "./lib/types";
import WorkerGridModel from "./models/worker-grid-model";

import "./App.css";

const LOAD_LARGE_DATASET = true;

function App() {
  const [width, setWidth] = useState(window.innerWidth);
  const [height, setHeight] = useState(window.innerHeight);
  const [ready, setReady] = useState(false);
  const [model, setModel] = useState<GridModel | null>(null);

  useEffect(() => {
    const onResize = () => {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (model === null) {
      const model = LOAD_LARGE_DATASET
        ? new WorkerGridModel("population")
        : new WorkerGridModel("education");

      model.configure().then(() => setReady(true));

      setModel(model);
    }

    return () => {
      model?.terminate();
    };
  }, [model]);

  return !!ready && !!model && <Grid model={model} width={width} height={height} />;
}

export default App;
