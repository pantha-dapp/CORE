import { useQuery } from "@tanstack/react-query";
import { usePanthaContext } from "../../context/PanthaProvider";

export function useEnrolledCourses() {
	const { wallet, api } = usePanthaContext();

	return useQuery({
		queryKey: ["enrolledCourses", wallet?.account.address],
		queryFn: async () => {
			if (!wallet) {
				throw new Error("not connected");
			}

			const enrollmentsResponseRaw = await api.rpc.courses.enrolled.$get();
			const enrollmentsResponse = await enrollmentsResponseRaw.json();

			if (!enrollmentsResponse.success) {
				throw new Error("failed to fetch enrollments");
			}

			return enrollmentsResponse.data;
		},
	});
}
