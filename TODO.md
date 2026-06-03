reveal patterns, central entities, and relationships in cultural heritage KGs
The aim is to identify structural properties and key nodes to aid interpretation and support research within cultural heritage contexts.

- Initial JSON per 1 graph (of which there are 3 arrays (AUJ, BJ, full) (all indexed by 6-month time window beginning timestamp), and 3 aggregates (AUJ, BJ, full))
    - Nodes
        - ID
        - Researcher name
    - Edges
        - origin, end
        - Metadata which is associated with that edge

- Under time slicing (at individual times of bins)/ aggregation (all at once), as AUJ/ BJ/ full (write functions for measures per 1 graph -> aggregate -> export)
    - Measures over entire network
        - Amount of nodes
        - Amount of edges
        - Number of connected components
        - LCC size
        - LCC diameter
        - LCC edge density
        - LCC average path length
        - LCC average degree
        - LCC degree assortativity
        - LCC clustering coefficient
    - Measures over nodes (For these, averages, standard deviations, maximums, minimums, distribution histograms)
        - Node centrality measures (degree, eigenvector, betweenness, PageRank)
        - Does degree distribution (from above) follow a known distribution, for example a power law to make it a scale-free network
    - Measures over edges (For these, averages, standard deviations, maximums, minimums, distribution histograms)
        - Curvature (which edges/collaborations are the most important/ between widely collaborating researchers)
    - Community detection (potentially using heuristics if exact methods would not scale enough)

- Output JSON per 1 graph (of which there are 3 arrays (AUJ, BJ, full) (all indexed by 6-month time window beginning timestamp), and 3 aggregates (AUJ, BJ, full))
    - Global measures
        - Already done measures: Size, Number of connected components, LCC size, LCC diameter, LCC edge density, LCC average path length, LCC average degree, LCC degree assortativity, LCC clustering coefficient
        - averages, standard deviations, maximums, minimums, distribution histograms
            - Centrality measures: degree, eigenvector, betweenness, PageRank
    - Nodes
        - ID
        - Researcher name
        - Centrality measures: degree, eigenvector, betweenness, PageRank
        - Community assignment: Louvain, label propagation, spectral clustering, stochastic block model
    - Edges
        - origin, end
        - Metadata which is associated with that edge
        - Curvature

- Dashboard (React)
    - State of network over time
    - Aggregates
    - Network-level measures, Node-level measures, edge-level measures
    - For local-bound measures their distributions over time
    - Ordering of nodes per measures increasing/decreasing
    - Communities visualization
https://github.com/vasturiano/react-force-graph
https://github.com/recharts/recharts

- Analysis on dataset recreated as weighted network/graph from ALMA, comparison of results with unweighted

- Agent Based Modelling
