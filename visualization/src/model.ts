type NodeId = number;

interface GraphNode {
  id: NodeId;
  name?: string;

  degreeCentrality: number | null;
  betweennessCentrality: number | null;
  closenessCentrality: number | null;
  eigenvectorCentrality: number | null;
  katzCentrality: number | null;
  pageRank: number | null;
  voterankScore: number | null;

  clustering: number | null;

  louvainCommunity: number | null;
  lpCommunity: number | null;
}

interface GraphEdge {
  source: NodeId;
  target: NodeId;

  formanCurvature: number | null;
}

interface TopLevelMeasures {
  connectedComponentsAmount: number | null;
  diameter: number | null;
  averageShortestPathLength: number | null;
  degreeAssortativity: number | null;
  averageClustering: number | null;
  richClubCoefficient: { [k: string]: number }
}

interface EdgeListGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  topLevelMeasures: TopLevelMeasures;
}

interface SourceTimedGraphs {
  CAC: { [key: string]: EdgeListGraph };
  ALMA: { [key: string]: EdgeListGraph };
  full: { [key: string]: EdgeListGraph };
}

interface AggregateGraphs {
  CAC: EdgeListGraph;
  ALMA: EdgeListGraph;
  full: EdgeListGraph;
}

interface NodeNames { // maps NodeId to name of a node
  [key: string]: string;
}

const NODE_METRICS: NodeMetricKey[] = [
  "degreeCentrality",
  "betweennessCentrality",
  "closenessCentrality",
  "eigenvectorCentrality",
  "katzCentrality",
  "pageRank",
  "voterankScore",
  "clustering",
  "louvainCommunity",
  "lpCommunity",
] as const;
type NodeMetricKey = 
| "degreeCentrality"
| "betweennessCentrality"
| "closenessCentrality"
| "eigenvectorCentrality"
| "katzCentrality"
| "pageRank"
| "voterankScore"
| "clustering"
| "louvainCommunity"
| "lpCommunity";

const EDGE_METRICS = ["formanCurvature"] as const;
type EdgeMetricKey = "formanCurvature";

const TOP_LEVEL_METRICS = [
  "connectedComponentsAmount",
  "diameter",
  "averageShortestPathLength",
  "degreeAssortativity",
  "averageClustering",
  "richClubCoefficient",
] as const;
type TopLevelMetricKey = 
| "connectedComponentsAmount"
| "diameter"
| "averageShortestPathLength"
| "degreeAssortativity"
| "averageClustering"
| "richClubCoefficient";

export type {
  NodeId,
  GraphNode,
  GraphEdge,
  TopLevelMeasures,
  EdgeListGraph,
  SourceTimedGraphs,
  AggregateGraphs,
  NodeNames,
  NodeMetricKey,
  EdgeMetricKey,
  TopLevelMetricKey,
};

export {
  NODE_METRICS,
  EDGE_METRICS,
  TOP_LEVEL_METRICS,
};
