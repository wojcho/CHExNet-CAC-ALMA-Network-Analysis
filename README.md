# CHExNet-CAC-ALMA-Network-Analysis
[Problem statement](https://wiki.iis.uj.edu.pl/courses:wshop:topics:tematy2026wiosna#lvm_applying_network_analysis_to_digital_humanities_kg)

The aim is to identify structural properties and key nodes to aid interpretation and support research within cultural heritage contexts.
Reveal patterns, central entities, and relationships in cultural heritage KGs.

# Visualization Dashboard

## What was Implemented and Why
In the article which introduced the [CHExNet dataset](https://zenodo.org/records/18715362),
code of which paper is available [here](https://github.com/luizdovalle2/CHExNET_Analysis),
analyses over the resulting graph were done mostly on graph-level metrics
(Number of components, LCC size, LCC diameter, LCC edge density, LCC average path length, LCC average degree, LCC degree assortativity, LCC clustering coefficient).
These values were analyzed for individual graphs at various times (slicing) and it was plotted how these values were changing over time, as well as for graphs which were aggregated over time (aggregation).
Additionally, contagion analysis of Polish Writing was done using Discrete-Time Hazard Model.
What has been here added on top of that work, was analysis of node-level and edge-level metrics, also with slicing and aggregation.
An interactive dashboard, which enables visual observation of the graph, as well as of distributions of metrics, and sorting of nodes by metric to reveal patterns in data, has been implemented using web technologies, including TypeScript, React, [Recharts](https://github.com/recharts/recharts), [React Force Graph](https://github.com/vasturiano/react-force-graph), MUI component library, with its code in [visualization folder](./visualization).
Usage of web technologies enabled reliance on established stable approaches, and greater flexibility, latter of which was especially required here, because the situation required heavy customization and interactivity, greater than allowed by static plots.
Although, such choice of technology carried its own set of challenges, becuase graph libraries for the frontend are less advanced than those available for Python.
Computation of metrics was done statically as a preprocessing step of data ultimately used by the dashboard.
Such aproach also allowed to decrease recomputation, after initial time of loading of data.
In [data_metrics_prepare folder](./data_metrics_prepare), the data is stored, along with code which was used to generate it.
That code relied in part on NetworkX library, in part on [GraphRicciCurvature](https://graphriccicurvature.readthedocs.io/en/latest/), the second of which had to be custom-compiled along with its dependencies and dependency checking had to be disabled because of many years of lack of maintenance.

## CHExNet Dataset
Composite of 2 layers
- Corpus Academicum Cracoviense (CAC), an electronic database with around 67,000 records on students and graduates of the University of Kraków during the period 1364–1780. CAC contains information on academic, occupational and personal events in a given person’s life
- ALMA system of BJ. ALMA is an integrated system for the management of around 9 million bibliographic records. ALMA data is structured according to the MARC21 format, thus containing information, among others, about authorship (e.g., authors, editors, translators, illustrators), publication facts (place, publisher, and date), language, and subject/genre metadata
Identifiers of persons between them were not always consistent, so matching had to be manual and it decreased size of datasets

It is a temporal multilayer network $G = (V, L, T, E)$
$V$ is individuals
$L$ is layers, there are 2 layers
$T$ is time and is represented as six-month bins
$E$ means educational/proffessional co-presence (from CAC) (presence at same institution at the time of 6 months), or collaboration (from ALMA) (being authors or contributors to same record through time within 6-months bin), and edges are unordered and unweighted

In simpler words, it can be treated as three (CAC, ALMA, Full) maps of graphs, mapping from time range to a graph

It is worthwhile to note that publications or coexistence data entries can have more participants than 2, in these cases, an edges connect all of them, which causes cliques to be formed, which in cases of smaller graphs and many participants, can influence measures significantly.

## Description of Approach in First Part
The base approaches when working with temporal graphs are slicing and aggregation.
Slicing refers to comparing state of the network at various points in time.
Aggregation refers to using a composite network made of sum of all nodes and edges over all time.
On these individual graphs, usual network analysis can be done.
In the dashboard, the user can browse the data, and choose the features which are of interest to them.

## Description of Metrics
For each of graphs, whether aggregate, or at time slice, the same metrics have been computed.

### Node-Level Metrics
There are various ways to define importance of a node, each of them focuses on different aspects which could make a node important, and thus has different uses, revealing a different pattern in a graph.
Such metrics are usually called [centrality](https://en.wikipedia.org/wiki/Centrality) measures of nodes.
Definitions here are partly reliant on linked Wikipedia articles, and on NetworkX documentation.
Node-level metrics, which were computed:
- [Degree centrality](https://en.wikipedia.org/wiki/Degree_(graph_theory))
  - Amount of direct connections which a node has within a graph (here the graph is undirected, and is not a multigraph, so it is amount of edges which have that node within them, as individual edges are unordered sets)
  - The degree centrality values are normalized by dividing by the maximum possible degree in a simple graph n-1 where n is the number of nodes in G.
- [Betweenness centrality](https://en.wikipedia.org/wiki/Betweenness_centrality)
  - How frequently a node appears on the shortest path between other nodes in the graph
  - Betweenness centrality of a node $v$ is given by the expression $g(v)=\sum _{s\neq v\neq t}{\frac {\sigma _{st}(v)}{\sigma _{st}}}$ where $\sigma _{st}$ is the total amount of shortest paths from node $s$ to node $t$ and $\sigma _{st}(v)$ is the amount of those paths which pass through $v$
- [Closeness centrality](https://en.wikipedia.org/wiki/Closeness_centrality)
  - Inverse under multiplication in $\mathbb{R}$, of the sum of the length of the shortest paths between the node and all other nodes in the graph
  - $C_{B}(x)={\frac {1}{\sum _{y}d(y,x)}}$ where $d(y,x)$ is the length of the shortest path between vertices $x$ and $y$
- [Eigenvector centrality](https://en.wikipedia.org/wiki/Eigenvector_centrality)
  - Relative scores are assigned to all nodes in the network based on the concept that connections to high-scoring nodes contribute more to the score of the node in question than equal connections to low-scoring nodes. A high eigenvector score means that a node is connected to many nodes who themselves have high scores.
  - For a given graph $G:=(V,E)$ with $|V|$ vertices let $A = (a_{v,t})$ be the [[adjacency matrix]], i.e. $a_{v,t} = 1$ if vertex $v$ is linked to vertex $t$, and $a_{v,t} = 0$ otherwise. The relative centrality score, $x_v$, of vertex $v$ can be defined as: $ x_v = \frac 1 \lambda \sum_{t \in M(v)} x_t = \frac 1 \lambda \sum_{t \in V} a_{v,t} x_t $ where $M(v)$ is the set of neighbors of $v$ and $\lambda$ is a constant. With a small rearrangement this can be rewritten in vector notation as the eigenvector equation $\mathbf{Ax} = \lambda \mathbf{x}$.
  - [https://stackoverflow.com/questions/45054397/is-pagerank-always-better-then-eigenvector-or-katz-centrality#70048055]
  - Eigen Vector Centrality assumes that nodes with more important connections are important. For example, people who know the president are probably important. mathematically, this is performed by calculating the centrality measurements by finding the eigen vector of the largest eigenvalue of the adjacency matrix.
- [Katz centrality](https://en.wikipedia.org/wiki/Katz_centrality)
  - It is a variant of eigenvector centrality
  - The problem with Eigen Vector Centrality is that it does not handle directed graphs well as centrality is not passed to incoming edges, leading to lots of zeroes for centrality despite having many outgoing edges. Katz Centrality seeks to fix this problem by adding a small bias term so that no node has strictly zero centrality, thus affecting the centralities of the neighboring nodes as well.
- [PageRank](https://en.wikipedia.org/wiki/PageRank)
  - It is a variant of eigenvector centrality
  - PageRank is based on the normalized eigenvector centrality, or normalized prestige, combined with a random jump assumption
  - However, the problem with Katz Centrality is that when a node becomes very central in a network, it passes its centrality to all of its outgoing links, making all those nodes very popular. For example, even though people who know the president are important, not all of them are (the car driver of the president for example). To fix this, PageRank Centrality utilizes the degree centrality of the node, mixed with Katz centrality to balance this problem.
- [VoteRank](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.centrality.voterank.html)
  - With VoteRank, all nodes vote for each of its in-neighbors and the node with the highest votes is elected iteratively. The voting ability of out-neighbors of elected nodes is decreased in subsequent turns.
- [Local clustering per node]()
  - For unweighted graphs, the clustering of a node $u$ is the fraction of possible triangles through that node that exist, $ c_u = \frac{2 T(u)}{deg(u)(deg(u)-1)}$, where $T(u)$ is the number of triangles through node $u$ and $deg(u)$ is the degree of $u$.

### Description of Edge-Level Metrics
Node-level metrics, which were computed:
- [Forman-Ricci curvature](https://graphriccicurvature.readthedocs.io/en/latest/GraphRicciCurvature.html#module-GraphRicciCurvature.FormanRicci)
  - Weights importance of edges, by using an approach influenced by topology
  - An edge with positive curvature represents an edge within a cluster, while a negatively curved edge tent to be a bridge within clusters. Also, negatively curved edges are highly related to graph connectivity, with negatively curved edges removed from a connected graph, the graph soon become disconnected.
  - https://web.math.princeton.edu/~mw25/files/MWeber_poster2.pdf

### Community Detection
- [Louvain method](https://en.wikipedia.org/wiki/Louvain_method)
  - Greedy optimization method intended to extract non-overlapping communities from large networks
  - The Louvain method works by repeating two phases. In phase one, nodes are sorted into communities based on how the modularity of the graph changes when a node moves communities. In phase two, the graph is reinterpreted so that communities are seen as individual nodes.
- [Label Propagation algorithm](https://arxiv.org/pdf/1103.4550)
  - Algorithm inspired by epidemic spreading
  - Initially, each vertex in the network is assigned a unique label, which will be used to determine the community it belongs to. Subsequently, an iterative process is performed so that connected groups of vertices are able to reach a consensus on some label giving rise to a community. At each step of the process, each vertex updates its label to a new one which corresponds to the most frequent label among its neighbors.

## Use Case Examples

### With Slicing
[Recording of use case](./visualization/video_usecase1.mp4)
User wants to understand, which researcher in winter semester of 1600 was the most important in connecting researchers, which otherwise by themselves would not have had much opportunity to collaborate.
In `Dataset Selection` user has to select `Timed` Dataset Type, `ALMA` Source, Date `1600-01-01`.
After selection of `betweennessCentrality` to control size, a few candidates can be visually spotted.
By hovering on one of these candidates, their names are revealed, and highlit in the table.
Although, sorting directly in table can be more convenient.
By pressing on column header in `betweennessCentrality`, the table will be sorted using that column.
It would then be visible that the most important such researchers are the following:
| Surname, Name         | Betweenness Centrality |
|-----------------------|------------------------|
| Siebeneicher, Jakub   | 0.2187                 |
| Maciejowski, Bernard  | 0.1887                 |
| Piotrkowczyk, Andrzej | 0.1661                 |
For the scientists afterwards, the scores are much smaller, being for them repeatedly (values repeat because of clique projection): 0.0430, 0.0006, 0.0000.
Two of these persons are not actually researchers, but are owners of printing houses, which explains why they took a role which involved collaboration with otherwise not connected researchers.

### With Aggregation
User wants to understand what is the distribution of node degree in full aggregated graph.
In `Dataset Selection` user has to select `Aggregates` Dataset Type, `Full` Source.
In `Node Metric Distribution` user has to select the desired metric, `degreeCentrality`.
Amount of bins can be adjusted, or all unique values can be shown separately.
Comparison between `CAC` and `ALMA` could show, that ALMA Dataset is more sparse than CAC dataset.
Overall, most nodes have small degree, taking part in only a few edges.
`Full` has a few nodes which have unusually large degree, which are very much outliers, even more so than in separate datasets.
| Surname, Name         | Degree Centrality Normalized |
|-----------------------|------------------------------|
| Zawadzki, Stanisław   | 0.0936                       |
| Brożek, Jan           | 0.0922                       |
| Cezary, Franciszek    | 0.0827                       |
Taking part in around 10% of possible edges, these are very important nodes.
Franciszek Cezary owned a printing house, Jan Brożek was a rector of Kraków Academy, Stanisław Zawadzki was also a rector of Kraków Academy.

## Direct Description

### Graph JSON Structure
Initial JSON per 1 graph (of which there are 3 arrays (AUJ, BJ, full) (all indexed by 6-month time window beginning timestamp), and 3 aggregates (AUJ, BJ, full))
- Nodes
  - ID
  - Researcher name
- Edges
  - origin, end
  - Metadata which is associated with that edge 

### Utilied Metrics
Under time slicing (at individual times of bins)/ aggregation (all at once), as AUJ/ BJ/ full (functions for measures per 1 graph -> aggregate -> export)
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

### Structure of Prepared JSON with Metrics
Final JSON per 1 graph (of which there are 3 arrays (AUJ, BJ, full) (all indexed by 6-month time window beginning timestamp), and 3 aggregates (AUJ, BJ, full))
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

### Features of Dashboard
- State of network over time
- Aggregates
- Network-level measures, Node-level measures, Edge-level measures
- For Node-bound measures their distributions over time
- Ordering of nodes per measures increasing/decreasing
- Communities visualization
- Filtering depending on metrics
