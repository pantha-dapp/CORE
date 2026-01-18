import { useNavigate } from "@tanstack/react-router";

export default function LandingPage() {
	const navigate = useNavigate();
	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 flex flex-col justify-center items-center px-4 py-8">
			{/* Hero Section */}
			<div className="text-center space-y-6 max-w-4xl">
				<h1 className="text-6xl font-bold text-white leading-tight">
					Welcome to Pantha
				</h1>
				<p className="text-xl text-gray-400 max-w-2xl mx-auto">
					Discover amazing courses and accelerate your learning journey with our
					AI-powered platform.
				</p>
				<div className="flex gap-4 justify-center mt-8">
					<button
						type="button"
						className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors border-b-4 border-green-700 active:border-b-0"
						onClick={() => navigate({ to: "/login" })}
					>
						Get Started
					</button>
					<button
						type="button"
						className="border border-gray-600 hover:border-gray-500 text-gray-300 px-8 py-3 rounded-lg font-semibold transition-colors"
					>
						Learn More
					</button>
				</div>
			</div>

			{/* Features Section */}
			<div className="mt-20 text-center space-y-12 max-w-6xl">
				<h2 className="text-4xl font-bold text-white">Why Choose Pantha?</h2>
				<div className="grid md:grid-cols-3 gap-8">
					<div className="bg-gray-700/50 p-8 rounded-xl border border-gray-600">
						<h3 className="text-xl font-semibold text-white mb-3">
							AI-Powered Learning
						</h3>
						<p className="text-gray-400">
							Personalized learning paths tailored to your needs.
						</p>
					</div>
					<div className="bg-gray-700/50 p-8 rounded-xl border border-gray-600">
						<h3 className="text-xl font-semibold text-white mb-3">
							Expert Courses
						</h3>
						<p className="text-gray-400">
							High-quality content from industry experts.
						</p>
					</div>
					<div className="bg-gray-700/50 p-8 rounded-xl border border-gray-600">
						<h3 className="text-xl font-semibold text-white mb-3">
							Interactive Experience
						</h3>
						<p className="text-gray-400">
							Engage with content through interactive exercises.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
