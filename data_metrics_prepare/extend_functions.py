import networkx as nx
# from GraphRicciCurvature.OllivierRicci import OllivierRicci
from GraphRicciCurvature.FormanRicci import FormanRicci

def extend_graph(graph: dict[str, list[dict]]) -> dict[str, list[dict]]:
    """
    Extend the given graph (undirected but without duplicates in both directions, unweighted) with top-level measures, node level measures

    Input graph format:
      - graph["nodes"] : list of {"id": <id>, ...}
      - graph["edges"] : list of {"source": <id1>, "target": <id2>}
      - graph may already contain "topLevelMeasures" (will be overwritten)

    Output modifies and returns the same structure but with these added:
      - graph["topLevelMeasures"] containing measures which are about the entire graph, or its largest connected component
      - each node dict in graph["nodes"] has added additional keys for centralities
    """
    # Build NetworkX graph
    G = nx.Graph()
    # Add nodes (keep original ids as node keys)
    node_list: List[Dict[str, Any]] = graph.get("nodes", [])
    for node in node_list:
        node_id = node.get("id")
        G.add_node(node_id)

    # Add edges
    for e in graph.get("edges", []):
        src = e.get("source")
        tgt = e.get("target")
        # Only add edge if both endpoints exist in G
        if src in G.nodes and tgt in G.nodes:
            if src != tgt: # Ignore self-loops
                G.add_edge(src, tgt)
                G.add_edge(tgt, src)

    # -------- Top-level measures
    n_components = nx.number_connected_components(G) if G.number_of_nodes() > 0 else 0
    num_nodes = G.number_of_nodes()

    # For measures defined only on connected graphs:
    diameter = None
    avg_shortest_path = None
    if num_nodes > 0:
        # use largest connected component for diameter and avg shortest path if graph is disconnected
        largest_cc = max(nx.connected_components(G), key=len)
        G_lcc = G.subgraph(largest_cc)
        if G_lcc.number_of_nodes() > 1:
            try:
                diameter = nx.diameter(G_lcc)
            except Exception:
                diameter = None
            try:
                avg_shortest_path = nx.average_shortest_path_length(G_lcc)
            except Exception:
                avg_shortest_path = None
        else:
            # single node => diameter 0, avg shortest path 0
            diameter = 0
            avg_shortest_path = 0.0

    # Measures defined for whole graph (NetworkX handles empty graphs for these with exceptions; guard accordingly)
    try:
        degree_assortativity = nx.degree_assortativity_coefficient(G) if num_nodes > 0 else None
    except Exception:
        degree_assortativity = None

    try:
        avg_clustering = nx.average_clustering(G) if num_nodes > 0 else None
    except Exception:
        avg_clustering = None

    try:
        if num_nodes > 0:
            rich_club = nx.rich_club_coefficient(G, normalized=False)
        else:
            rich_club = None
    except Exception:
        rich_club = None

    top_measures = {
        "connectedComponentsAmount": n_components,
        "diameter": diameter,
        "averageShortestPathLength": avg_shortest_path,
        "degreeAssortativity": degree_assortativity,
        "averageClustering": avg_clustering,
        "richClubCoefficient": rich_club,
    }

    # Set/overwrite topLevelMeasures
    graph["topLevelMeasures"] = top_measures

    # -------- Centrality measures

    # Degree (integer)
    degrees = dict(G.degree())
    # Degree centrality
    deg_centrality = nx.degree_centrality(G) if num_nodes > 0 else {}
    # Betweenness centrality
    bet_centrality = nx.betweenness_centrality(G, normalized=True) if num_nodes > 0 else {}
    # Closeness centrality
    clos_centrality = nx.closeness_centrality(G) if num_nodes > 0 else {}
    # Eigenvector centrality (may fail on disconnected graphs; compute on each connected component and merge)
    eig_centrality = {}
    if num_nodes > 0:
        try:
            eig_centrality = nx.eigenvector_centrality_numpy(G)
        except Exception:
            # fallback: compute per-component
            for comp in nx.connected_components(G):
                sub = G.subgraph(comp)
                if sub.number_of_nodes() == 1:
                    n = next(iter(sub.nodes()))
                    eig_centrality[n] = 1.0
                else:
                    try:
                        vals = nx.eigenvector_centrality(sub, max_iter=1000)
                        eig_centrality.update(vals)
                    except Exception:
                        # final fallback
                        for n in sub.nodes():
                            eig_centrality[n] = None

    # Katz centrality (needs alpha less than 1 / largest_eigenvalue; use small alpha and try)
    katz_centrality = {}
    if num_nodes > 0:
        try:
            katz_centrality = nx.katz_centrality_numpy(G, alpha=0.1, beta=1.0)
        except Exception:
            try:
                katz_centrality = nx.katz_centrality(G, alpha=0.01, beta=1.0, max_iter=2000)
            except Exception:
                for n in G.nodes():
                    katz_centrality[n] = None

    # PageRank
    pagerank = {}
    if num_nodes > 0:
        try:
            pagerank = nx.pagerank(G)
        except Exception:
            for n in G.nodes():
                pagerank[n] = None
    
    # # Second order centrality (only defined for connected graphs)
    # second_order = {}
    # if num_nodes > 0:
    #     for comp in nx.connected_components(G):
    #         sub = G.subgraph(comp)
    #         if sub.number_of_nodes() > 1:
    #             try:
    #                 vals = nx.second_order_centrality(sub)
    #                 second_order.update(vals)
    #             except Exception:
    #                 for n in sub.nodes():
    #                     second_order[n] = None
    #         else:
    #             n = next(iter(sub.nodes()))
    #             second_order[n] = 0.0  # trivial case

    # VoteRank (returns ordered influential nodes)
    voterank_scores = {}
    if num_nodes > 0:
        try:
            ranked = nx.voterank(G)
            # Assign descending score (higher rank = higher score)
            for i, node_id in enumerate(ranked):
                voterank_scores[node_id] = len(ranked) - i
        except Exception:
            pass

    # Local clustering per node
    clustering = nx.clustering(G) if num_nodes > 0 else {}

    # Attach centralities to nodes in input structure
    id_to_node = {node.get("id"): node for node in node_list}
    for node_id in G.nodes():
        node_obj = id_to_node.get(node_id)
        if node_obj is None:
            # If node wasn't in original list, skip, but it should not happen, but just to be safe
            continue
        node_obj["degree"] = degrees.get(node_id, None)
        node_obj["degreeCentrality"] = deg_centrality.get(node_id, None)
        node_obj["betweennessCentrality"] = bet_centrality.get(node_id, None)
        node_obj["closenessCentrality"] = clos_centrality.get(node_id, None)
        node_obj["eigenvectorCentrality"] = eig_centrality.get(node_id, None)
        node_obj["katzCentrality"] = katz_centrality.get(node_id, None)
        node_obj["clustering"] = clustering.get(node_id, None)
        node_obj["pageRank"] = pagerank.get(node_id, None)
        # node_obj["secondOrderCentrality"] = second_order.get(node_id, None)
        node_obj["voterankScore"] = voterank_scores.get(node_id, None)

    # -------- Edge-level measures

    try:
        # Only compute when there is at least one edge
        if G.number_of_edges() > 0:
            # Create a copy for the ricci library since it mutates the graph object
            G_for_ricci = G.copy()

            # # Ollivier-Ricci curvature (standard)
            # try:
            #     orc = OllivierRicci(G_for_ricci, alpha=0.5, verbose="ERROR")
            #     orc.compute_ricci_curvature()
            #     # copy results back to our main G (and to edge list)
            #     for u, v, data in orc.G.edges(data=True):
            #         # library uses "ricciCurvature"
            #         val = data.get("ricciCurvature")
            #         if G.has_edge(u, v):
            #             G[u][v]["ollivierCurvature"] = val
            # except Exception:
            #     # skip ollivier if it fails
            #     pass

            # Forman-Ricci curvature
            try:
                frc = FormanRicci(G_for_ricci)
                frc.compute_ricci_curvature()
                for u, v, data in frc.G.edges(data=True):
                    val = data.get("formanCurvature")
                    if G.has_edge(u, v):
                        G[u][v]["formanCurvature"] = val
            except Exception:
                pass

            # # Compute Ollivier Ricci Flow using OTD method and derive communities
            # try:
            #     orc_otd = OllivierRicci(G_for_ricci, alpha=0.5, method="OTD", verbose="ERROR")
            #     # run a modest number of iterations; choose 10 as reasonable default
            #     orc_otd.compute_ricci_flow(iterations=10)
            #     # ricci_flow stores updated edge weights or distances under "OTD" or "ricciFlow" keys depending on lib version
            #     for u, v, data in orc_otd.G.edges(data=True):
            #         # try common keys
            #         otd_val = data.get("OTD") or data.get("ricciFlow") or data.get("ricciCurvature")
            #         if G.has_edge(u, v):
            #             G[u][v]["ollivierRicciFlow"] = otd_val
            #     # attempt ricci-based community detection
            #     # try:
            #     #     communities = orc_otd.ricci_community()
            #     #     graph.setdefault("topLevelMeasures", {})
            #     #     graph["topLevelMeasures"]["ricciCommunities"] = communities
            #     # except Exception as e:
            #     #     pass
            # except Exception:
            #     pass
    except Exception:
        pass
    
    edge_map = {}
    for u, v, data in G.edges(data=True):
        # normalize ordering to match input edge direction if needed
        key = (u, v) if (u, v) in [(e.get("source"), e.get("target")) for e in graph.get("edges", [])] else (u, v)
        edge_map.setdefault((u, v), {}).update({
            # "ollivierCurvature": data.get("ollivierCurvature"),
            "formanCurvature": data.get("formanCurvature"),
            # "ollivierRicciFlow": data.get("ollivierRicciFlow"),
        })

    # Attach to original edge dicts
    for e in graph.get("edges", []):
        src = e.get("source")
        tgt = e.get("target")
        # edges in input may be undirected, check both orders
        val = edge_map.get((src, tgt)) or edge_map.get((tgt, src)) or {}
        if val:
            # e["ollivierCurvature"] = val.get("ollivierCurvature")
            e["formanCurvature"] = val.get("formanCurvature")
            # e["ollivierRicciFlow"] = val.get("ollivierRicciFlow")

    # -------- Community assignment

    # Assigning communities using Louvain method, it identifies communities with large modularity
    try:
        louvain_communities_list = nx.algorithms.community.louvain_communities(G)
        louvain_community_map = {}
        for idx, community in enumerate(louvain_communities_list):
            for node in community:
                louvain_community_map[node] = idx
    except Exception as e:
        print(f"Error in Louvain Method: {e}")
        louvain_community_map = {}

    # Assigning communities using Label Propagation algorithm
    try:
        communities_lp = nx.algorithms.community.label_propagation_communities(G)
        lp_community_map = {}
        for idx, community in enumerate(communities_lp):
            for node in community:
                lp_community_map[node] = idx
    except Exception as e:
        print(f"Error in Label Propagation: {e}")
        lp_community_map = {}

    # Add community information to each node
    for node_id in G.nodes():
        node_obj = id_to_node.get(node_id)
        if node_obj is None:
            continue
        node_obj["louvainCommunity"] = louvain_community_map.get(node_id, None)
        node_obj["lpCommunity"] = lp_community_map.get(node_id, None)

    return graph
