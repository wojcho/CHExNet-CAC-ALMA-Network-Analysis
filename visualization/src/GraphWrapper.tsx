import { useState } from "react";

import {
  Box,
  Paper,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Slider,
  Checkbox,
} from "@mui/material";

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
  const [nodeSizeKey, setNodeSizeKey] =
    useState<NodeMetricKey | null>(initialNodeSizeKey);

  const [edgeSizeKey, setEdgeSizeKey] =
    useState<EdgeMetricKey | null>(initialEdgeSizeKey);

  const [colorGroupKey, setColorGroupKey] =
    useState<NodeMetricKey | null>(initialColorGroupKey);

  const [isPhysicsOn, setIsPhysicsOn] =
    useState<boolean>(initialPhysicsOn);

  const [histMetricKey, setHistMetricKey] =
    useState<NodeMetricKey | null>(null);

  const [bins, setBins] =
    useState<number | null>(20);

  return (
    <Stack spacing={3}>
      {/* Controls */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Graph Controls
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
        >
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Node Size</InputLabel>
            <Select
              label="Node Size"
              value={nodeSizeKey ?? ""}
              onChange={(e) =>
                setNodeSizeKey(e.target.value)
              }
            >
              <MenuItem value="">Fixed</MenuItem>

              {NODE_METRICS.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Edge Width</InputLabel>
            <Select
              label="Edge Width"
              value={edgeSizeKey ?? ""}
              onChange={(e) =>
                setEdgeSizeKey(e.target.value as EdgeMetricKey)
              }
            >
              <MenuItem value="">Fixed</MenuItem>

              {EDGE_METRICS.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Color Group</InputLabel>
            <Select
              label="Color Group"
              value={colorGroupKey ?? ""}
              onChange={(e) =>
                setColorGroupKey(e.target.value)
              }
            >
              <MenuItem value="">Single Color</MenuItem>

              {NODE_METRICS.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={isPhysicsOn}
                onChange={(e) =>
                  setIsPhysicsOn(e.target.checked)
                }
              />
            }
            label="Physics"
          />
        </Stack>
      </Paper>

      {/* Graph */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Network Graph
        </Typography>

        <Box sx={{ height: 450, overflow: "hidden" }}>
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
        </Box>
      </Paper>

      {/* Histogram */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Node Metric Distribution
        </Typography>

        <Stack spacing={2}>
          <FormControl size="small" sx={{ maxWidth: 320 }}>
            <InputLabel>Metric</InputLabel>

            <Select
              label="Metric"
              value={histMetricKey ?? ""}
              onChange={(e) =>
                setHistMetricKey(e.target.value)
              }
            >
              <MenuItem value="">None</MenuItem>

              {NODE_METRICS.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {histMetricKey && (
            <>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={bins === null}
                    onChange={(e) =>
                      setBins(
                        e.target.checked
                          ? null
                          : 20
                      )
                    }
                  />
                }
                label="All unique values"
              />

              <Box sx={{ maxWidth: 500 }}>
                <Typography gutterBottom>
                  Bins:{" "}
                  {bins === null
                    ? "All unique"
                    : bins}
                </Typography>

                <Slider
                  disabled={bins === null}
                  min={1}
                  max={Math.max(
                    1,
                    graph.nodes.length
                  )}
                  value={
                    bins ??
                    Math.max(
                      1,
                      graph.nodes.length
                    )
                  }
                  onChange={(_, value) =>
                    setBins(value as number)
                  }
                />
              </Box>
            </>
          )}

          <NodeMetricHistogram
            nodes={graph.nodes}
            metricKey={histMetricKey}
            bins={bins}
            height={250}
          />
        </Stack>
      </Paper>

      {/* Table */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Nodes
        </Typography>

        <NodeTable
          nodes={graph.nodes}
          nodeNames={nodeNames}
        />
      </Paper>
    </Stack>
  );
}
