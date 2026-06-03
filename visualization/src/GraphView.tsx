import { useCallback, useMemo, useRef } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import type {
  EdgeListGraph,
  GraphNode,
  GraphEdge,
  NodeNames,
  NodeMetricKey,
  EdgeMetricKey,
} from "./model";

type Props = {
  graph: EdgeListGraph; // EdgeListGraph to render
  nodeNames: NodeNames; // map of node id -> name
  nodeSizeKey?: NodeMetricKey | null; // metric to drive node radius (if omitted or null, fixed size)
  edgeSizeKey?: EdgeMetricKey | null; // metric to drive edge width (if omitted or null, fixed width)
  colorGroupKey?: NodeMetricKey | null; // metric key used to group/color nodes (if omitted, single color)
  width?: number;
  height?: number; // width, height optionally passed to canvas component; otherwise it will fill container
  onNodeClick?: (node: GraphNode) => void;
  isPhysicsOn?: boolean;
  hoveredNodeId?: number | null;
  onNodeHover?: (
    id: number | null
  ) => void;
};

function safeGetNodeMetric(node: GraphNode, key?: NodeMetricKey | null): number | null {
  if (!key) return null;
  const v = (node as any)[key];
  if (v === undefined || v === null) return null;
  return typeof v === "number" ? v : Number(v);
}

function safeGetEdgeMetric(edge: GraphEdge, key?: EdgeMetricKey | null): number | null {
  if (!key) return null;
  const v = (edge as any)[key];
  if (v === undefined || v === null) return null;
  return typeof v === "number" ? v : Number(v);
}

const DEFAULT_NODE_RADIUS = 5;
const MIN_NODE_RADIUS = 3;
const MAX_NODE_RADIUS = 30;
const DEFAULT_EDGE_WIDTH = 1;
const MIN_EDGE_WIDTH = 0.3;
const MAX_EDGE_WIDTH = 6;

// simple categorical color palette
const COLOR_PALETTE = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

// map nodes/edges to force-graph format
function toForceGraph(graph: EdgeListGraph) {
  const nodes = graph.nodes.map((n) => ({ id: n.id, __raw: n }));
  const links = graph.edges.map((e, idx) => {
    const id = `${e.source}-${e.target}-${idx}`;
    (e as any).__edgeId = id;           // <- attach to raw edge
    return { id, source: e.source, target: e.target, __raw: e, __edgeId: id };
  });
  return { nodes, links };
}

export default function GraphView({
  graph,
  nodeNames,
  nodeSizeKey = null,
  edgeSizeKey = null,
  colorGroupKey = null,
  width,
  height,
  onNodeClick,
  isPhysicsOn = true,
  hoveredNodeId = null,
  onNodeHover,
}: Props) {
  const fgRef = useRef<ForceGraphMethods | null>(null);

  // Prepare data
  const data = useMemo(() => toForceGraph(graph), [graph]);

  // Compute node radii mapping if requested
  const nodeRadiusMap = useMemo(() => {
    if (!nodeSizeKey) return null;
    const vals = graph.nodes
      .map((n) => safeGetNodeMetric(n, nodeSizeKey))
      .filter((v): v is number => v !== null && !Number.isNaN(v));
    if (vals.length === 0) return null;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const map = new Map<number, number>();
    graph.nodes.forEach((n) => {
      const v = safeGetNodeMetric(n, nodeSizeKey);
      if (v === null || Number.isNaN(v)) {
        map.set(n.id, DEFAULT_NODE_RADIUS);
      } else {
        const norm = (v - min) / span;
        const r = MIN_NODE_RADIUS + norm * (MAX_NODE_RADIUS - MIN_NODE_RADIUS);
        map.set(n.id, r);
      }
    });
    return map;
  }, [graph.nodes, nodeSizeKey]);

  // Compute edge width mapping if requested
  const edgeWidthMap = useMemo(() => {
    if (!edgeSizeKey) return null;
    const vals = graph.edges
      .map((e) => safeGetEdgeMetric(e, edgeSizeKey))
      .filter((v): v is number => v !== null && !Number.isNaN(v));
    if (vals.length === 0) return null;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = max - min || 1;
    const map = new Map<string, number>();
    graph.edges.forEach((e, idx) => {
      const raw = safeGetEdgeMetric(e, edgeSizeKey);
      const id = `${e.source}-${e.target}-${idx}`;
      if (raw === null || Number.isNaN(raw)) {
        map.set(id, DEFAULT_EDGE_WIDTH);
      } else {
        const norm = (raw - min) / span;
        const w = MIN_EDGE_WIDTH + norm * (MAX_EDGE_WIDTH - MIN_EDGE_WIDTH);
        map.set(id, w);
      }
    });
    return map;
  }, [graph.edges, edgeSizeKey]);

  // Color grouping for nodes
  const nodeColorMap = useMemo(() => {
    if (!colorGroupKey) {
      // single default color
      const map = new Map<number, string>();
      graph.nodes.forEach((n) => map.set(n.id, COLOR_PALETTE[0]));
      return map;
    }
    // create category -> color mapping
    const categories = new Map<string | number, number>(); // category -> palette index
    let nextIdx = 0;
    const map = new Map<number, string>();
    graph.nodes.forEach((n) => {
      const raw = (n as any)[colorGroupKey];
      const cat = raw === null || raw === undefined ? "__null" : String(raw);
      if (!categories.has(cat)) {
        categories.set(cat, nextIdx++);
      }
      const paletteIdx = categories.get(cat)! % COLOR_PALETTE.length;
      map.set(n.id, COLOR_PALETTE[paletteIdx]);
    });
    return map;
  }, [graph.nodes, colorGroupKey]);

  // Node paint: draws circle and optionally label
  const nodePaint = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n: GraphNode = node.__raw;
      const name = nodeNames[String(n.id)] ?? n.name ?? String(n.id);

      const isHovered = hoveredNodeId === n.id;
      const radius =
        nodeRadiusMap?.get(n.id) ?? DEFAULT_NODE_RADIUS;
      const color = nodeColorMap.get(n.id) ?? COLOR_PALETTE[0];

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(
        node.x as number,
        node.y as number,
        isHovered ? radius * 1.6 : radius,
        0,
        2 * Math.PI
      );
      ctx.fill();
      if (isHovered) {
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // draw label if zoomed in enough
      const labelFontSize = Math.max(4, Math.min(16, 12 * (1 / globalScale)));
      if (globalScale < 2) {
        // when zoomed out, smaller labels or none
      } else {
        ctx.font = `${labelFontSize}px Sans-Serif`;
        ctx.fillStyle = "#222";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(name, node.x as number, (node.y as number) + radius + 2);
      }
    },
    [nodeNames, nodeRadiusMap, nodeColorMap, hoveredNodeId]
  );

  // Link width accessor
  const linkWidth = useCallback(
    (link: any) => {
      const id = (link.__raw && (link.__raw as any).__edgeId) ?? link.__edgeId ?? link.id;
      return edgeWidthMap?.get(id) ?? DEFAULT_EDGE_WIDTH;
    },
    [edgeWidthMap]
  );

  // Provide node label tooltip
  const nodeLabel = useCallback(
    (node: any) => {
      const n: GraphNode = node.__raw;
      const name = nodeNames[String(n.id)] ?? n.name ?? String(n.id);
      return `${name} (id: ${n.id})`;
    },
    [nodeNames]
  );

  return (
    <div style={{ width: width ?? "80%", height: height ?? "100%" }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeId="id"
        linkWidth={linkWidth}
        nodeCanvasObject={nodePaint}
        width={width}
        height={height}
        onNodeClick={(nodeObj) => {
          const n: GraphNode = (nodeObj).__raw;
          if (onNodeClick) onNodeClick(n);
          // center on node
          const fg = fgRef.current;
          if (fg && (nodeObj).x !== undefined) {
            fg.centerAt((nodeObj).x, (nodeObj).y, 400);
            fg.zoom(1.5, 400);
          }
        }}
        nodeLabel={nodeLabel}
        cooldownTicks={isPhysicsOn === false ? 0 : 100}
        d3VelocityDecay={isPhysicsOn === false ? 1 : 0.2}
        onNodeHover={(node) => {
          const raw =
            (node as any)?.__raw;

          onNodeHover?.(
            raw ? raw.id : null
          );
        }}
      />
    </div>
  );
}
