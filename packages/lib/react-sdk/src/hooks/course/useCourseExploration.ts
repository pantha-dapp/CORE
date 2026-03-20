import { useQuery } from "@tanstack/react-query";
import { parseResponse } from "hono/client";
import { UMAP } from "umap-js";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useCourseExploration(args: { id?: string }) {
	const { id } = args;
	const { wallet, api } = usePanthaContext();

	const enabled = !!wallet && !!id;

	return useQuery({
		queryKey: ["courseById", id],
		queryFn: async () => {
			if (!enabled) {
				throw new Error("not connected");
			}

			const courses = await parseResponse(api.rpc.courses.explore.$get());

			if (!courses.success) {
				throw new Error("Failed to retrieve courses");
			}
			const vectors = courses.data.courses.map((item) => item.vector);

			const normalized = vectors.map(normalize);

			const umap = new UMAP({
				nNeighbors: 5,
				minDist: 0.1,
				nComponents: 2,
			});

			const points2D = umap.fit(normalized);

			const explore = courses.data.courses.map((item, i) => {
				const point = points2D[i];
				if (!point) {
					console.warn(`SKIPPING bcz No 2D point for course ${item.id}`);
					return { ...item, point: { x: 0, y: 0 } };
				}
				return { ...item, point: { x: point[0], y: point[1] } };
			});

			return { explore, suggestions: courses.data.suggestions };
		},
		enabled,
	});
}

function normalize(vec: number[]): number[] {
	const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
	return vec.map((x) => x / norm);
}
