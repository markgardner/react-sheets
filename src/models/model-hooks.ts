import { useState, useEffect } from "react";
import { GridModel, GridViewport, RowItem, SchemaItem } from "../lib/types";

export function useModelState(
  model: GridModel,
  scrollLeft: number,
  scrollTop: number,
  width: number,
  height: number
): [GridViewport | null, SchemaItem[], RowItem[]] {
  const [currentViewport, setCurrentViewport] = useState<GridViewport | null>(null);

  useEffect(() => {
    // This function will return a new state if there needs to be a re-render.
    // Reacts to scroll events
    const nextViewport = model.calculateNextViewport(currentViewport, scrollLeft, scrollTop, width, height);

    if (nextViewport) {
      setCurrentViewport(nextViewport);
    }

    // Allow the model to sync with react with out of state changes
    model.onRefresh(() => {
      const nextViewport = model.calculateNextViewport(null, scrollLeft, scrollTop, width, height);

      setCurrentViewport(nextViewport);
    });
  }, [currentViewport, model, scrollLeft, scrollTop, width, height]);

  return [currentViewport, model.cells, model.rows];
}
