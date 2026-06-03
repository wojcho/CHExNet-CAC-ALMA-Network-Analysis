import json
from extend_functions import extend_graph
from tqdm import tqdm

# It is a list of {"CAC": {...: graph_c0, ...: graph_c1, ...}, "ALMA": {...: graph_a0, ...: graph_a1, ...}, "full": {...: graph_f0, ...: graph_f1, ...}}
# Each graph is a dict with keys "nodes" and "edges" (edge list representation)
# - "nodes": list of {"id": <id>}
# - "edges": list of {"source": <id1>, "target": <id2>}

# Deserialize
with open("./data/basic.json", "r", encoding="utf-8") as f:
    dict_of_series_of_graphs = json.load(f)

# Extend
for source_name in tqdm(list(dict_of_series_of_graphs.keys()), desc="sources"):
    graph_series = dict_of_series_of_graphs[source_name]
    for date_iso in tqdm(list(graph_series.keys()), desc=f"{source_name} dates", leave=False):
        dict_of_series_of_graphs[source_name][date_iso] = extend_graph(dict_of_series_of_graphs[source_name][date_iso])

# Serialize
with open("./data/extended.json", "w", encoding="utf-8") as f:
    json.dump(dict_of_series_of_graphs, f, ensure_ascii=True)

# Handle aggregates
# They have structure {"CAC": graph0, "ALMA": graph1, "full": graph2}

with open("./data/aggregates_basic.json", "r", encoding="utf-8") as f:
    aggregates = json.load(f)

for source_name in tqdm(list(aggregates.keys()), desc="aggregate sources"):
    aggregates[source_name] = extend_graph(aggregates[source_name]) # It could take around 10 minutes to run

with open("./data/aggregates_extended.json", "w", encoding="utf-8") as f:
    json.dump(aggregates, f, ensure_ascii=True)
