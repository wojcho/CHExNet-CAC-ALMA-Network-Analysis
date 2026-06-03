import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

import GraphWrapper from "./GraphWrapper";
import { useGraphs } from "./useGraphs";

export default function App() {
  const {
    aggregates,
    timed,
    nodeNames,
    loading,
    error,
    reload,
  } = useGraphs();

  const [datasetType, setDatasetType] =
    useState<"aggregates" | "timed">("timed");

  const [source, setSource] =
    useState<"CAC" | "ALMA" | "full">("CAC");

  const availableTimedDates = useMemo(() => {
    if (!timed) return [];
    return Object.keys(timed[source] ?? {}).sort();
  }, [timed, source]);

  const [timedDate, setTimedDate] =
    useState<string | null>(null);

  useEffect(() => {
    if (
      datasetType === "timed" &&
      availableTimedDates.length > 0 &&
      !timedDate
    ) {
      setTimedDate(availableTimedDates[0]);
    }
  }, [
    datasetType,
    availableTimedDates,
    timedDate,
  ]);

  useEffect(() => {
    if (
      timedDate &&
      !availableTimedDates.includes(timedDate)
    ) {
      setTimedDate(
        availableTimedDates[0] ?? null
      );
    }
  }, [availableTimedDates, timedDate]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography>
          Loading graph data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={reload}
            >
              Retry
            </Button>
          }
        >
          Error loading graphs:{" "}
          {String(error.message ?? error)}
        </Alert>
      </Container>
    );
  }

  if (!aggregates || !timed || !nodeNames) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={reload}
            >
              Reload
            </Button>
          }
        >
          Graph data not available.
        </Alert>
      </Container>
    );
  }

  let selectedGraph = aggregates.CAC;

  if (datasetType === "aggregates") {
    selectedGraph = aggregates[source];
  } else {
    const dates = Object.keys(
      timed[source] ?? {}
    ).sort();

    const chosenDate =
      timedDate ?? dates[0] ?? null;

    if (
      chosenDate &&
      timed[source]?.[chosenDate]
    ) {
      selectedGraph =
        timed[source][chosenDate];
    } else if (dates.length > 0) {
      selectedGraph =
        timed[source][dates[0]];
    } else {
      selectedGraph =
        aggregates[source];
    }
  }

  return (
    <Container
      maxWidth="xl"
      sx={{ py: 3 }}
    >
      <Stack spacing={3}>

        <Paper sx={{ p: 2 }}>
          <Typography
            variant="h6"
            gutterBottom
          >
            Dataset Selection
          </Typography>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
          >
            <FormControl
              size="small"
              sx={{ minWidth: 180 }}
            >
              <InputLabel>
                Dataset Type
              </InputLabel>

              <Select
                label="Dataset Type"
                value={datasetType}
                onChange={(e) =>
                  setDatasetType(
                    e.target.value as
                      | "aggregates"
                      | "timed"
                  )
                }
              >
                <MenuItem value="aggregates">
                  Aggregates
                </MenuItem>
                <MenuItem value="timed">
                  Timed
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{ minWidth: 180 }}
            >
              <InputLabel>
                Source
              </InputLabel>

              <Select
                label="Source"
                value={source}
                onChange={(e) =>
                  setSource(
                    e.target.value as
                      | "CAC"
                      | "ALMA"
                      | "full"
                  )
                }
              >
                <MenuItem value="CAC">
                  CAC
                </MenuItem>
                <MenuItem value="ALMA">
                  ALMA
                </MenuItem>
                <MenuItem value="full">
                  Full
                </MenuItem>
              </Select>
            </FormControl>

            {datasetType === "timed" && (
              <FormControl
                size="small"
                sx={{ minWidth: 220 }}
              >
                <InputLabel>
                  Date
                </InputLabel>

                <Select
                  label="Date"
                  value={timedDate ?? ""}
                  onChange={(e) =>
                    setTimedDate(
                      e.target.value
                    )
                  }
                >
                  {availableTimedDates.map(
                    (date) => (
                      <MenuItem
                        key={date}
                        value={date}
                      >
                        {date}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            )}
          </Stack>
        </Paper>

        <GraphWrapper
          graph={selectedGraph}
          nodeNames={nodeNames}
        />
      </Stack>
    </Container>
  );
}
