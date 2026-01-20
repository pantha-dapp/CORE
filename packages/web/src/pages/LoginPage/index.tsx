import { useLogin } from "@pantha/react/hooks";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useMatch } from "@tanstack/react-router";
import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import Button from "../../shared/components/Button";
import Input from "../../shared/components/Input";

export default function LoginPage() {
	const match = useMatch({ strict: false });
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const { sendCode, loginWithCode } = useLoginWithEmail();
	const { authenticated, login } = usePrivy();
	const loginMutation = useLogin();

	const [isOpen, setIsOpen] = React.useState(false);
	useEffect(() => {
		if (authenticated && match.routeId === "/login") {
			// Call Pantha login when Privy authentication is complete
			loginMutation.mutateAsync().catch((error) => {
				console.error("Pantha login failed:", error);
				// Handle login failure, perhaps show error or retry
			});
		}
	}, [authenticated, match.routeId, loginMutation]);

	const handleEmailLogin = async () => {
		try {
			await sendCode({ email });
			setIsOpen(true); // 🔑 OPEN OTP DRAWER
		} catch (err) {
			console.error(err);
		}
	};

	const handleVerifyOtp = async () => {
		try {
			await loginWithCode({
				code: code.trim(),
			});
			setIsOpen(false); // 🔑 CLOSE OTP DRAWER
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center px-12 py-8">
			{/* <div className="w-full max-w-md space-y-8">
			{/* Header */}
			<div className="text-center">
				<h1 className="text-3xl font-bold text-white mb-2">
					Sign in to Pantha
				</h1>
				<p className="text-gray-400">Continue your learning journey</p>
			</div>

			{/* Email/Password Form */}
			<form className="space-y-4 w-full " onSubmit={(e) => e.preventDefault()}>
				<div className="space-y-3 w-full">
					{/* Email Input */}
					<div className="relative mt-2 w-full">
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Email"
							className="w-full py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors"
							required
						/>
					</div>
				</div>

				{/* Sign In Button */}
				<Button
					type="button"
					variant="primary"
					size="lg"
					fullWidth
					className="mt-6 text-lg"
					onClick={handleEmailLogin}
				>
					Sign In
				</Button>
				<Drawer.Root dismissible={false} open={isOpen} onOpenChange={setIsOpen}>
					<Drawer.Portal>
						<Drawer.Overlay className="fixed inset-0 bg-black/40" />
						<Drawer.Content className="bg-gray-100 flex flex-col rounded-t-[10px] mt-24 h-fit fixed bottom-0 left-0 right-0 outline-none">
							<div className="p-4 bg-gray-800 rounded-t-[10px] flex-1">
								<div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-8" />
								<div className="max-w-md mx-auto">
									<input
										type="text"
										inputMode="numeric"
										value={code}
										onChange={(e) => {
											const value = e.target.value.replace(/\D/g, ""); // remove non-digits
											if (value.length <= 6) {
												setCode(value);
											}
										}}
										placeholder="Enter OTP"
										className="w-full px-4 py-3 border rounded-md text-white "
									/>

									<button
										type="button"
										disabled={code.length !== 6}
										className="rounded-md mt-4 w-full bg-gray-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
										onClick={handleVerifyOtp}
									>
										Verify OTP
									</button>

									<button
										type="button"
										className="rounded-md mt-4 w-full bg-gray-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
										onClick={() => setIsOpen(false)}
									>
										Close Drawer
									</button>
								</div>
							</div>
						</Drawer.Content>
					</Drawer.Portal>
				</Drawer.Root>
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
			<div className="space-y-3 w-full">
				{/* Google */}
				<Button
					type="button"
					variant="secondary"
					className="w-full flex items-center justify-center gap-3 px-14 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white font-semibold hover:bg-gray-700 transition-colors"
					onClick={() => login({ loginMethods: ["google"] })}
				>
					<img
						src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/500px-Google_%22G%22_logo.svg.png"
						className="w-5 h-5 rounded object-contain"
						alt="Google"
					/>
					SIGN IN WITH GOOGLE
				</Button>

				{/* Apple */}
				<Button
					type="button"
					variant="secondary"
					className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white font-semibold hover:bg-gray-700 transition-colors"
				>
					<img
						src="https://www.freepnglogos.com/uploads/apple-logo-png/apple-logo-png-index-content-uploads-10.png"
						className="w-5 h-5 rounded object-contain"
						alt="Apple"
					/>
					SIGN IN WITH APPLE
				</Button>

				{/* Farcaster */}
				<Button
					type="button"
					variant="secondary"
					className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gray-700/50 border-2 border-gray-600 rounded-xl text-white font-semibold hover:bg-gray-700 transition-colors"
				>
					<img
						src="https://media.licdn.com/dms/image/v2/D560BAQEc_dSldzmxgw/company-logo_200_200/company-logo_200_200/0/1682288978427/farcaster_logo?e=2147483647&v=beta&t=LlO5C8qcczg5gIWyoqwASvJBzKh0CXXyxrhb5DEUCGU"
						className="w-5 h-5 rounded object-contain"
						alt="Farcaster"
					/>
					SIGN IN WITH FARCASTER
				</Button>
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
	);
}
