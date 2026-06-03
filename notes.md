
CHExNet
Composite of 2 layers
- Corpus Academicum Cracoviense (CAC), an electronic database with around 67,000 records on students and graduates of the University of Kraków during the period 1364–1780. CAC contains information on academic, occupational and personal events in a given person’s life
- ALMA system of BJ. ALMA is an integrated system for the management of around 9 million bibliographic records. ALMA data is structured according to the MARC21 format, thus containing information, among others, about authorship (e.g., authors, editors, translators, illustrators), publication facts (place, publisher, and date), language, and subject/genre metadata
Identifiers of persons between them were not always consistent, so matching had to be manual and it decreased size of datasets

It is a temporal multilayer network G = (V, L, T, E)
V is individuals
L is layers, there are 2 layers
T is time and is represented as six-month bins
E means educational/proffessional co-presence (from CAC) (presence at same institution at the time of 6 months), or collaboration (from ALMA) (being authors or contributors to same record through time within 6-months bin), and edges are unordered and unweighted

In simpler words, it can be treated as two arrays of graphs

Measures which were already done in paper file://./ICCS_2026___Network_Analysis.pdf
Size, Number of connected components, LCC size, LCC diameter, LCC edge density, LCC average path length, LCC average degree, LCC degree assortativity, LCC clustering coefficient

For each shared event, or publication, a clique is formed

https://wiki.iis.uj.edu.pl/courses:wshop:topics:tematy2026wiosna#lvm_applying_network_analysis_to_digital_humanities_kg
https://zenodo.org/records/18715362
file://./ICCS_2026___Network_Analysis.pdf#page=8
http://localhost:5173/
https://graphriccicurvature.readthedocs.io/en/latest/
