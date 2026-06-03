import { useState } from "react";
import type {
  EdgeListGraph,
  NodeNames,
  NodeMetricKey,
  EdgeMetricKey,
} from "./model";
import {
  NODE_METRICS,
  EDGE_METRICS,
} from "./model";
import GraphView from "./GraphView";
import NodeMetricHistogram from "./NodeMetricHistogram";
import NodeTable from "./NodeTable";

type GraphWrapperProps = {
  graph: EdgeListGraph;
  nodeNames: NodeNames;
  initialNodeSizeKey?: NodeMetricKey | null;
  initialEdgeSizeKey?: EdgeMetricKey | null;
  initialColorGroupKey?: NodeMetricKey | null;
  initialPhysicsOn?: boolean;
  onNodeClick?: (node: any) => void;
};

export default function GraphWrapper({
  graph,
  nodeNames,
  initialNodeSizeKey = null,
  initialEdgeSizeKey = null,
  initialColorGroupKey = null,
  initialPhysicsOn = true,
  onNodeClick,
}: GraphWrapperProps) {
  // UI state for controls
  const [nodeSizeKey, setNodeSizeKey] = useState<NodeMetricKey | null>(
    initialNodeSizeKey ?? null
  );
  const [edgeSizeKey, setEdgeSizeKey] = useState<EdgeMetricKey | null>(
initialEdgeSizeKey ?? null
  );
  const [colorGroupKey, setColorGroupKey] = useState<NodeMetricKey | null>(
    initialColorGroupKey ?? null
  );
  const [isPhysicsOn, setIsPhysicsOn] = useState<boolean>(
    initialPhysicsOn ?? true
  );
  const [histMetricKey, setHistMetricKey] = useState<NodeMetricKey | null>(null);
  const [bins, setBins] = useState<number | null>(20);

  const handleNodeSizeKeyChange = (k: string) => {
    setNodeSizeKey(k === "" ? null : (k as NodeMetricKey));
  };
  const handleEdgeSizeKeyChange = (k: string) => {
    setEdgeSizeKey(k === "" ? null : (k as EdgeMetricKey));
  };
  const handleColorGroupKeyChange = (k: string) => {
    setColorGroupKey(k === "" ? null : (k as NodeMetricKey));
  };

  return (
    <div>
      <div>
        <label>
          Node size metric:
          <select
            value={nodeSizeKey ?? ""}
            onChange={(e) => handleNodeSizeKeyChange(e.target.value)}
          >
            <option value="">(fixed)</option>
            {NODE_METRICS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label>
          Edge width metric:
          <select
            value={edgeSizeKey ?? ""}
            onChange={(e) => handleEdgeSizeKeyChange(e.target.value)}
          >
            <option value="">(fixed)</option>
            {EDGE_METRICS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label>
          Color group:
          <select
            value={colorGroupKey ?? ""}
            onChange={(e) => handleColorGroupKeyChange(e.target.value)}
          >
            <option value="">(single color)</option>
            {NODE_METRICS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <label>
          Physics:
          <input
            type="checkbox"
            checked={isPhysicsOn}
            onChange={(e) => setIsPhysicsOn(e.target.checked)}
          />
        </label>
      </div>

      <GraphView
        graph={graph}
        nodeNames={nodeNames}
        nodeSizeKey={nodeSizeKey}
        edgeSizeKey={edgeSizeKey}
        colorGroupKey={colorGroupKey}
        height={450}
        isPhysicsOn={isPhysicsOn}
        onNodeClick={onNodeClick}
      />

      <div>

        <label>
          Histogram metric:
          <select
            value={histMetricKey ?? ""}
            onChange={(e) => setHistMetricKey(e.target.value === "" ? null : (e.target.value as NodeMetricKey))}
          >
            <option value="">(none)</option>
            {NODE_METRICS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        {histMetricKey && (<>
          <label>
            Bins:
            <input
              type="range"
              min={1}
              max={Math.max(1, graph.nodes.length)}
              value={bins === null ? Math.max(1, graph.nodes.length) : bins}
              onChange={(e) => setBins(Number(e.target.value))}
              disabled={bins === null}
            />
            <span style={{ marginLeft: 8 }}>
              {bins === null ? "All unique" : `${bins}`}
            </span>
          </label>

          <label style={{ marginLeft: 12 }}>
            <input
              type="checkbox"
              checked={bins === null}
              onChange={(e) => setBins(e.target.checked ? null : 20)}
            />
            All unique values
          </label>
        </>)}
      </div>

      <NodeMetricHistogram nodes={graph.nodes} metricKey={histMetricKey} bins={bins} height={250} />
      
      <NodeTable nodes={graph.nodes} nodeNames={nodeNames} />
    </div>

  );
}
