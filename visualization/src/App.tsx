import { useMemo, useState } from "react";
import GraphWrapper from "./GraphWrapper";
import { useGraphs } from "./useGraphs";

export default function App() {
  const { aggregates, timed, nodeNames, loading, error, reload } = useGraphs();

  // New UI state for selecting dataset
  // "aggregates" or "timed"
  const [datasetType, setDatasetType] = useState<"aggregates" | "timed">(
    "timed"
  );
  // source: "CAC" | "ALMA" | "full"
  const [source, setSource] = useState<"CAC" | "ALMA" | "full">("CAC");
  // for aggregates: no date; for timed: pick a date string available under timed[source]
  const availableTimedDates = useMemo(() => {
    if (!timed) return [] as string[];
    return Object.keys(timed[source] ?? {}).sort();
  }, [timed, source]);

  // choose a date index (default to first if available)
  const [timedDate, setTimedDate] = useState<string | null>(() =>
    availableTimedDates.length > 0 ? availableTimedDates[0] : null
  );

  // update timedDate when available dates change
  if (datasetType === "timed" && timed && availableTimedDates.length > 0 && timedDate === null) {
    setTimedDate(availableTimedDates[0]);
  }

  if (loading) {
    return <div>Loading graphs...</div>;
  }

  if (error) {
    return (
      <div>
        <div>Error loading graphs: {String(error.message ?? error)}</div>
        <button onClick={reload}>Retry</button>
      </div>
    );
  }

  if (!aggregates || !timed || !nodeNames) {
    return (
      <div>
        <div>Graph data not available.</div>
        <button onClick={reload}>Reload</button>
      </div>
    );
  }

  // resolve selected graph
  let selectedGraph = aggregates.CAC; // fallback
  if (datasetType === "aggregates") {
    selectedGraph = aggregates[source];
  } else {
    // timed
    const dates = Object.keys(timed[source] ?? {}).sort();
    const chosenDate = timedDate ?? dates[0] ?? null;
    if (chosenDate && timed[source] && timed[source][chosenDate]) {
      selectedGraph = timed[source][chosenDate];
    } else {
      // fallback to first timed entry or aggregate fallback
      if (dates.length > 0) selectedGraph = timed[source][dates[0]];
      else selectedGraph = aggregates[source];
    }
  }

  return (
    <div>
      <div>
        <label>
          Dataset type:
          <select
            value={datasetType}
            onChange={(e) =>
              setDatasetType(e.target.value as "aggregates" | "timed")
            }
          >
            <option value="aggregates">Aggregates</option>
            <option value="timed">Timed</option>
          </select>
        </label>

        <label>
          Source:
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as "CAC" | "ALMA" | "full")}
          >
            <option value="CAC">CAC</option>
            <option value="ALMA">ALMA</option>
            <option value="full">full</option>
          </select>
        </label>

        {datasetType === "timed" && (
          <label>
            Date:
            <select
              value={timedDate ?? ""}
              onChange={(e) => setTimedDate(e.target.value)}
            >
              {availableTimedDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <GraphWrapper
        graph={selectedGraph}
        nodeNames={nodeNames}
      />
    </div>
  );
}
