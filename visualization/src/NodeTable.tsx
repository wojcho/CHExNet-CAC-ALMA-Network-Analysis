import { useMemo } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Paper } from "@mui/material";

import type {
  GraphNode,
  NodeMetricKey,
  NodeNames,
} from "./model";

import { NODE_METRICS } from "./model";

type Props = {
  nodes: GraphNode[];
  nodeNames: NodeNames;
};

export default function NodeTable({
  nodes,
  nodeNames,
}: Props) {
  const rows = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        name: n.name ?? nodeNames[n.id] ?? "",
      })),
    [nodes, nodeNames]
  );

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 90,
      },
      {
        field: "name",
        headerName: "Name",
        minWidth: 200,
        flex: 1,
      },

      ...NODE_METRICS.map<GridColDef>((metric: NodeMetricKey) => ({
        field: metric,
        headerName: metric,
        type: "number",
        width: 160,
        valueFormatter: (value) => {
          if (value == null) return "";
          return Number(value).toFixed(4);
        },
      })),
    ],
    []
  );

  return (
    <Paper
      elevation={2}
      sx={{
        mt: 2,
        height: 700,
        width: "100%",
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        // onRowClick={(params) => {
          // console.log(params.row.id);
        // }}
        pageSizeOptions={[25, 50, 100]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: 25,
              page: 0,
            },
          },
          sorting: {
            sortModel: [
              {
                field: "id",
                sort: "asc",
              },
            ],
          },
        }}
      />
    </Paper>
  );
}
