// use hnsw_rs::prelude::*;

// impl AnnIndex {
//     pub fn new() -> Self {
//         let mut hnsw: Hnsw<f32, DistCosine> = Hnsw::new(
//             MAX_NB_CONN,
//             10_000, //expected max entres
//             DIM,
//             EF_CONSTRUCTION,
//             DistCosine {},
//         );

//         Self { hnsw }
//     }

//     pub fn insert(&mut self, id: usize, vector: &Vec<f32>) {
//         self.hnsw.insert((vector, id));
//     }

//     pub fn search(&self, vector: &Vec<f32>, k: usize) -> Vec<String> {
//         let neighbors = self.hnsw.search(&vector, k, 50);

//         let candidates: Vec<_> = neighbors
//             .into_iter()
//             .filter(|n| n.distance <= 0.25)
//             .map(|n| n.d_id.to_string())
//             .collect();

//         candidates
//     }
// }
