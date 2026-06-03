import { useMemo, useState } from "react";
import type { GraphNode, NodeMetricKey, NodeNames } from "./model";
import { NODE_METRICS } from "./model";

type Props = {
  nodes: GraphNode[];
  nodeNames: NodeNames;
};

const COLUMNS: (NodeMetricKey | "name" | "id")[] = ["id", "name", ...NODE_METRICS];

export default function NodeTable({ nodes, nodeNames }: Props) {
  const [sortBy, setSortBy] = useState<NodeMetricKey | "name" | "id" | null>("id");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: NodeMetricKey | "name" | "id" | null) => {
    if (key === sortBy) setDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setDir("asc");
    }
  };

  const sorted = useMemo(() => {
    const copy = [...nodes];
    const compare = (a: GraphNode, b: GraphNode) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (sortBy == "name") {
        if (!va) {
          va = nodeNames[a.id];
        }
        if (!vb) {
          vb = nodeNames[b.id];
        }
      }

      // undefined/null, order at end
      const aNull = va === null || va === undefined;
      const bNull = vb === null || vb === undefined;
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;

      // numeric sort when both are numbers
      if (typeof va === "number" && typeof vb === "number") {
        return va - vb;
      }

      // fallback to string compare
      return String(va).localeCompare(String(vb));
    };

    copy.sort((a, b) => (dir === "asc" ? compare(a, b) : -compare(a, b)));
    return copy;
  }, [nodes, sortBy, dir]);

  return (
    <table>
      <thead>
        <tr>
          {COLUMNS.map(c => (
            <th key={c}>
              <button type="button" onClick={() => toggleSort(c)}>
                {c}
                {sortBy === c ? (dir === "asc" ? " ▲" : " ▼") : ""}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map(n => (
          <tr key={n.id}>
            <td>{n.id}</td>
            <td>{n.name ?? nodeNames[n.id] ?? ""}</td>
            <td>{n.degreeCentrality ?? ""}</td>
            <td>{n.betweennessCentrality ?? ""}</td>
            <td>{n.closenessCentrality ?? ""}</td>
            <td>{n.eigenvectorCentrality ?? ""}</td>
            <td>{n.katzCentrality ?? ""}</td>
            <td>{n.pageRank ?? ""}</td>
            <td>{n.voterankScore ?? ""}</td>
            <td>{n.clustering ?? ""}</td>
            <td>{n.louvainCommunity ?? ""}</td>
            <td>{n.lpCommunity ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
