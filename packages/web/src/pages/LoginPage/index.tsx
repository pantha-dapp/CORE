import { useState } from "react";
import Button from "../../shared/components/Button";
import Icon from "../../shared/components/Icon";

export default function LoginPage() {
	const [email, setEmail] = useState("");

	const handleEmailLogin = (e: React.FormEvent) => {
		e.preventDefault();
		// Handle email login
		console.log("Email login:", { email });
	};

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center px-4 py-8">
			<div className="w-full max-w-md space-y-8">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-3xl font-bold text-white mb-2">
						Sign in to Pantha
					</h1>
					<p className="text-gray-400">Continue your learning journey</p>
				</div>

				{/* Email/Password Form */}
				<form onSubmit={handleEmailLogin} className="space-y-4">
					<div className="space-y-3">
						{/* Email Input */}
						<div className="relative">
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email"
								className="w-full px-4 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
								required
							/>
						</div>
					</div>

					{/* Sign In Button */}
					<Button
						type="submit"
						variant="primary"
						size="lg"
						fullWidth
						className="mt-6"
					>
						SIGN IN
					</Button>
				</form>

				{/* Divider */}
				<div className="relative my-8">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-600" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-4 bg-gray-900 text-gray-400">
							Or continue with
						</span>
					</div>
				</div>

				{/* Social Login Buttons */}
				<div className="space-y-3">
					{/* Google */}
					<button
						type="button"
						className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white font-semibold hover:bg-gray-700 transition-colors"
					>
						<img
							src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/500px-Google_%22G%22_logo.svg.png"
							className="w-5 h-5 rounded object-contain"
							alt="Google"
						/>
						SIGN IN WITH GOOGLE
					</button>

					{/* Apple */}
					<button
						type="button"
						className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white font-semibold hover:bg-gray-700 transition-colors"
					>
						<img
							src="https://www.freepnglogos.com/uploads/apple-logo-png/apple-logo-png-index-content-uploads-10.png"
							className="w-5 h-5 rounded object-contain"
							alt="Apple"
						/>
						SIGN IN WITH APPLE
					</button>

					{/* Farcaster */}
					<button
						type="button"
						className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white font-semibold hover:bg-gray-700 transition-colors"
					>
						<img
							src="https://media.licdn.com/dms/image/v2/D560BAQEc_dSldzmxgw/company-logo_200_200/company-logo_200_200/0/1682288978427/farcaster_logo?e=2147483647&v=beta&t=LlO5C8qcczg5gIWyoqwASvJBzKh0CXXyxrhb5DEUCGU"
							className="w-5 h-5 rounded object-contain"
							alt="Farcaster"
						/>
						SIGN IN WITH FARCASTER
					</button>

					{/* Web3 Wallet */}
					<button
						type="button"
						className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white font-semibold hover:bg-gray-700 transition-colors"
					>
						<Icon name="wallet" size={20} />
						SIGN IN WITH WEB3 WALLET
					</button>
				</div>

				{/* Terms and Privacy */}
				<p className="text-center text-xs text-gray-400 mt-6">
					By signing in, you agree to our{" "}
					<button
						type="button"
						className="text-cyan-400 hover:text-cyan-300 underline"
					>
						Terms
					</button>{" "}
					and{" "}
					<button
						type="button"
						className="text-cyan-400 hover:text-cyan-300 underline"
					>
						Privacy Policy
					</button>
					.
				</p>
			</div>
		</div>
	);
}
