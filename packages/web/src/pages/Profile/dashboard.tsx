import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "@tanstack/react-router";

export default function Dashboard() {
	const { logout } = usePrivy();
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center text-white">
			<button
				onClick={async () => {
					await logout(); // 🔑 clears auth session
					router.navigate({ to: "/login", replace: true });
				}}
				type="button"
				className="bg-red-500 px-4 py-2 rounded"
			>
				Logout
			</button>
		</div>
	);
}
