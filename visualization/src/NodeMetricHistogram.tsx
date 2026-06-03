import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { GraphNode, NodeMetricKey } from "./model";
import { Alert } from "@mui/material";

type Props = {
  nodes: GraphNode[];
  metricKey: NodeMetricKey | null;
  bins?: number | null; // defaults to 20
  height?: number; // defaults to 250
};

function buildHistogramData(values: number[], bins: number | null) {
  if (values.length === 0) return [];
  if (bins === null) {
    // one bin per unique value
    const counts = new Map<number, number>();
    for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
    const sorted = Array.from(counts.entries()).sort((a, b) => a[0] - b[0]);
    return sorted.map(([val, count]) => ({ bin: val.toFixed(3), count }));
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ bin: `${min.toFixed(3)}`, count: values.length }];
  }
  const binWidth = (max - min) / bins;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    let ix = Math.floor((v - min) / binWidth);
    if (ix === bins) ix = bins - 1;
    counts[ix] += 1;
  }
  return counts.map((count, i) => {
    const low = min + i * binWidth;
    const high = low + binWidth;
    const label = `${low.toFixed(3)}-${high.toFixed(3)}`;
    return { bin: label, count };
  });
}

export default function NodeMetricHistogram({
  nodes,
  metricKey,
  bins = 20,
  height = 240,
}: Props) {
  // collect numeric values for chosen metric
  const values = useMemo(() => {
    if (!metricKey) return [] as number[];
    return nodes
      .map((n) => (n as any)[metricKey])
      .filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  }, [nodes, metricKey]);

  const histogramData = useMemo(() => buildHistogramData(values, bins), [
    values,
    bins,
  ]);

  // empty-state
  if (!metricKey) {
    return (
      <Alert severity="info">
        Select a metric to display a histogram.
      </Alert>
    );
  }

  if (values.length === 0) {
    return (
      <Alert severity="warning">
        No numeric values available for "
        {metricKey}".
      </Alert>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogramData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bin" tick={{ fontSize: 10 }} interval={Math.ceil(histogramData.length / 8)} angle={-35} textAnchor="end" />
          <YAxis allowDecimals={false} />
          <Tooltip formatter={(value: any) => [value, "count"]} />
          <Bar dataKey="count" fill="#1976d2" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
