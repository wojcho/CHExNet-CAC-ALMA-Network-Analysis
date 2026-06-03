import { useEffect, useState } from "react";
import type { AggregateGraphs, SourceTimedGraphs, NodeNames } from "./model";

type UseGraphsResult = {
  aggregates: AggregateGraphs | null;
  timed: SourceTimedGraphs | null;
  nodeNames: NodeNames | null;
  loading: boolean;
  error: Error | null;
  reload: () => void;
};

const AGG_PATH = "/aggregates_extended.json";
const TIMED_PATH = "/extended.json";
const NAMES_PATH = "/node_names.json";

export function useGraphs(): UseGraphsResult {
  const [aggregates, setAggregates] = useState<AggregateGraphs | null>(null);
  const [timed, setTimed] = useState<SourceTimedGraphs | null>(null);
  const [nodeNames, setNodeNames] = useState<NodeNames | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState<number>(0); // to trigger reload

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    // fetch all three in parallel
    Promise.all([
      fetch(AGG_PATH).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ${AGG_PATH}: ${r.statusText}`);
        return r.json() as Promise<AggregateGraphs>;
      }),
      fetch(TIMED_PATH).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ${TIMED_PATH}: ${r.statusText}`);
        return r.json() as Promise<SourceTimedGraphs>;
      }),
      fetch(NAMES_PATH).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch ${NAMES_PATH}: ${r.statusText}`);
        return r.json() as Promise<NodeNames>;
      })
    ])
      .then(([aggJson, timedJson, namesJson]) => {
        if (cancelled) return;
        setAggregates(aggJson);
        setTimed(timedJson);
        setNodeNames(namesJson);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = () => setVersion((v) => v + 1);

  return { aggregates, timed, nodeNames, loading, error, reload };
}
