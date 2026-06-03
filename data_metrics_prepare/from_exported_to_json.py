import pandas as pd
from datetime import date
from dateutil.relativedelta import relativedelta
from tqdm import tqdm
from itertools import combinations
import json
from collections import defaultdict

def half_year_windows(start: date, end: date):
    cur = start
    while cur <= end:
        nxt = cur + relativedelta(months=6)   # step by 6 months [web:277]
        yield cur, nxt
        cur = nxt

lo = date(1350, 1, 1)
hi = date(1849, 12, 31)

time_dict = {}
for t_count, (p_start, p_end) in enumerate(half_year_windows(lo, hi)): 
    time_dict[p_start] = t_count

from scipy.sparse import coo_matrix

def edge_list_adj_from_groups(group_tuples, node_ids, weighted=False, normalize_group=False, id_to_name=None):
    """
    Build an edge-list representation from group co-membership (clique projection).

    Inputs:
      - group_tuples: iterable of groups (each group is an iterable of node ids)
      - node_ids: list (or other iterable) of node ids that define the node set and order
      - weighted: if True, edges carry summed weights; if False, edges are unweighted (weight omitted)
      - normalize_group: if True, contribution of a group of size k is 1/(k-1) per pair (matches adj_from_groups)
      - id_to_name: mapping from ids to names, these names would be added to the nodes

    Returns:
      - graph: dict with keys "nodes" and "edges"
         - "nodes": list of {"id": <id>} (optionally with also "name": <name>)
         - "edges": list of {"source": <id1>, "target": <id2>} (optionally with also "weight": <w> when weighted=True)
    """
    acc = {} # key: tuple ordered, value: weight

    for g in group_tuples:
        # keep only nodes that are in node_ids
        g_filtered = [pid for pid in g if pid in node_ids]
        k = len(g_filtered)
        if k < 2:
            continue

        w = 1.0 / (k - 1) if normalize_group else 1.0

        for a, b in combinations(g_filtered, 2):
            # use ordered pair by index to aggregate uniquely
            key = (a, b) if a < b else (b, a)
            acc[key] = acc.get(key, 0.0) + w

    # build nodes list (name uses id to match your example; change if you have separate names)
    nodes = []
    for pid in node_ids:
        node = {"id": pid}
        if id_to_name is not None and pid in id_to_name:
            node["name"] = id_to_name[pid]
        nodes.append(node)

    # build edges list from acc
    edges = []
    for (source, target), w in acc.items():
        # Undirected edges stored without duplication
        current_edge = {"source": source, "target": target}
        if weighted:
            current_edge["weight"] = float(w)
        edges.append(current_edge)

    graph = {"nodes": nodes, "edges": edges}
    return graph

# CAC

df_events = pd.read_pickle("./data/CAC_matched.pkl")
df_names = pd.read_parquet("./data/authority_file_cac_alma.parquet")
df_names_cac = df_names.dropna(subset="cac_id")
cac_id_dict = dict(zip(df_names_cac.cac_id.to_list(), df_names_cac.final_id))

start_col="date_start"
end_col="date_end"
inst_col="event_place_parent_id"
person_col="person_id"
name_col="alma_name"

df_events[start_col] = df_events[start_col].apply(lambda x:x.date())
df_events[end_col] = df_events[end_col].apply(lambda x:x.date())

output_dict = {}

# half-year window starts: Jan/Jul style (6MS = 6-month starts)
win_starts = half_year_windows(df_events[start_col].min(), df_events[end_col].max() ) # TODO what if that min, max is different than lo, hi? will there not be desynchronization

for inst, g in df_events.groupby(inst_col, sort=False):
    for ws, we in win_starts:
        # interval overlap test: [s,e] overlaps [ws,we] iff s <= we and e >= ws
        m = (g[start_col] <= we) & (g[end_col] >= ws)
        cur_people = tuple(set(g.loc[m, person_col]))
        if len(cur_people) > 1:
            cur_people = list(map(lambda x: cac_id_dict[x], cur_people))
            output_dict.setdefault(ws, [])
            output_dict[ws] += [cur_people]

id_to_name_layer1 = df_names.groupby("final_id").apply(
    lambda g: g[name_col].dropna().iat[0] if g[name_col].dropna().shape[0] > 0 else None
).to_dict()

graphs_layer1 = {}
for k, v in output_dict.items():
    t_count = time_dict[k]
    node_ids = sorted(set(pid for grp in v for pid in grp))
    edge_adj = edge_list_adj_from_groups(v, node_ids, weighted=False)
    graphs_layer1[k] = edge_adj

# print(graphs_layer1)

# ALMA

alma_df = pd.read_pickle("./data/ALMA_matched.pkl")
df_combined = alma_df[alma_df["all_names_final_id"].apply(lambda x: len(x) > 1)]
# names as in column "alma_name", are in "all_names" in df_combined, "all_names" column matches "all_names_final_id" which has corresponding ids
# pd.set_option('display.max_columns', None)
# print(df_combined)

id_to_name_layer2 = {}
for _, row in df_combined.iterrows():
    ids_arr = row["all_names_final_id"]
    names_arr = row["all_names"]
    # assume equal length and corresponding order
    for pid, nm in zip(ids_arr, names_arr):
        if pid not in id_to_name_layer2 and pd.notna(nm):
            id_to_name_layer2[pid] = nm

positions = []
graphs_layer2 = {}
ids = []
for t_count, (p_start, p_end) in enumerate(tqdm(list(half_year_windows(lo,hi)))):
    current_match = df_combined[df_combined.apply(lambda row: p_start <= row.date_end and row.date_start <= p_end, axis=1)]['all_names_final_id'].to_list()
    if len(current_match)> 0:
        node_ids = sorted(set(pid for grp in current_match for pid in grp))
        ids.append(node_ids)
        edge_adj = edge_list_adj_from_groups(current_match, node_ids, weighted=False)
        graphs_layer2[p_start] = edge_adj

# print(graphs_layer2)

# Combine

def merge_two_graphs(g1, g2, keep_weight=False):
    """
    Merge two graph dicts (each: {"nodes":[{"id":...,"name":...}], "edges":[{"source":..,"target":..,( "weight":.. )}]})
    Returns merged graph with deduplicated nodes and undirected-edge deduplication.
    If keep_weight True sums weights when present, otherwise edges are unweighted.
    """
    # merge nodes: prefer first occurrence name if available
    node_map = {} # id -> {"id": id, "name": name?}
    for g in (g1, g2):
        if g is None: continue
        for n in g.get("nodes", []):
            nid = n["id"]
            if nid not in node_map:
                node_map[nid] = {"id": nid}
                if "name" in n and n["name"] is not None:
                    node_map[nid]["name"] = n["name"]

    # merge edges as undirected: key is (min,max)
    edge_acc = defaultdict(float) # (a,b) -> weight (1.0 if unweighted)
    for g in (g1, g2):
        if g is None: continue
        for e in g.get("edges", []):
            a, b = e["source"], e["target"]
            if a == b:
                continue
            key = (a, b) if a < b else (b, a)
            w = float(e.get("weight", 1.0)) if keep_weight else 1.0
            if keep_weight:
                edge_acc[key] += w
            else:
                edge_acc[key] = 1.0

    # Build result
    nodes = list(node_map.values())
    edges = []
    for (a, b), w in edge_acc.items():
        edge = {"source": a, "target": b}
        if keep_weight:
            edge["weight"] = float(w)
        edges.append(edge)

    return {"nodes": nodes, "edges": edges}

# Example: merge per time key where either layer may have data
def combine_layers(graphs_layer1, graphs_layer2, keep_weight=False):
    combined = {}
    keys = set(graphs_layer1.keys()) | set(graphs_layer2.keys())
    for k in keys:
        g1 = graphs_layer1.get(k)
        g2 = graphs_layer2.get(k)
        combined[k] = merge_two_graphs(g1, g2, keep_weight=keep_weight)
    return combined

combined_layer = combine_layers(graphs_layer1, graphs_layer2, keep_weight=False)

# Serialize combined

combined = {"CAC": graphs_layer1, "ALMA": graphs_layer2, "full": combined_layer}

def safe_to_serialize(obj):
    # Avoid TypeError: keys must be str, int, float, bool or None, not date
    if isinstance(obj, dict):
        new = {}
        for k, v in obj.items():
            if isinstance(k, (date)):
                k2 = k.isoformat()
            else:
                k2 = str(k) if not isinstance(k, (str, int, float, bool, type(None))) else k
            new[k2] = safe_to_serialize(v)
        return new
    if isinstance(obj, list):
        return [safe_to_serialize(i) for i in obj]
    return obj

combined_safe_keys = safe_to_serialize(combined)

def merge_name_maps(map1, map2, prefer_first=True):
    merged = {}
    # iterate union of keys to be deterministic (sorted)
    for pid in sorted(set(map1.keys()) | set(map2.keys())):
        n1 = map1.get(pid)
        n2 = map2.get(pid)
        if prefer_first:
            name = n1 if (n1 is not None) else n2
        else:
            name = n2 if (n2 is not None) else n1
        if name is not None:
            merged[pid] = name
    return merged

id_to_name_combined = merge_name_maps(id_to_name_layer1, id_to_name_layer2, prefer_first=True)

with open("./data/basic.json", "w", encoding="utf-8") as f:
    json.dump(combined_safe_keys, f, ensure_ascii=True)

with open("./data/node_names.json", "w", encoding="utf-8") as f:
    json.dump(id_to_name_combined, f, ensure_ascii=True)

# Aggregate

def aggregate_graphs(graphs_dict, keep_weight=False):
    agg = {"nodes": [], "edges": []}
    node_map = {}
    edge_acc = defaultdict(float)
    for g in graphs_dict.values():
        if g is None:
            continue
        # nodes
        for n in g.get("nodes", []):
            nid = n["id"]
            if nid not in node_map:
                node_map[nid] = {"id": nid}
                if "name" in n and n["name"] is not None:
                    node_map[nid]["name"] = n["name"]
        # edges
        for e in g.get("edges", []):
            a, b = e["source"], e["target"]
            if a == b:
                continue
            key = (a, b) if a < b else (b, a)
            if keep_weight:
                edge_acc[key] += float(e.get("weight", 1.0))
            else:
                edge_acc[key] = 1.0

    agg["nodes"] = list(node_map.values())
    for (a, b), w in edge_acc.items():
        edge = {"source": a, "target": b}
        if keep_weight:
            edge["weight"] = float(w)
        agg["edges"].append(edge)

    return agg

agg_CAC = aggregate_graphs(graphs_layer1, keep_weight=False)
agg_ALMA = aggregate_graphs(graphs_layer2, keep_weight=False)
agg_full = aggregate_graphs(combined_layer, keep_weight=False)

aggregates = {"CAC": agg_CAC, "ALMA": agg_ALMA, "full": agg_full}
aggregates_safe = safe_to_serialize(aggregates)

with open("./data/aggregates_basic.json", "w", encoding="utf-8") as f:
    json.dump(aggregates_safe, f, ensure_ascii=True)
