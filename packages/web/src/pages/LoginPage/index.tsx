import { useIsLoggedIn, useLogin } from "@pantha/react/hooks";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import React, { useEffect, useState } from "react";
import { Drawer } from "vaul";
import { useWalletClient } from "wagmi";
import { DotsBackground } from "../../shared/components/DotsBackground";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const { sendCode, loginWithCode } = useLoginWithEmail();
	const { login } = usePrivy();
	const [isOpen, setIsOpen] = React.useState(false);
	const { mutateAsync: loginPantha } = useLogin();
	const { data: wallet } = useWalletClient();
	const { data: isLoggedIn } = useIsLoggedIn();

	const handleEmailLogin = async () => {
		try {
			await sendCode({ email });
			setIsOpen(true);
		} catch (err) {
			console.error(err);
		}
	};

	const handleVerifyOtp = async () => {
		try {
			await loginWithCode({ code: code.trim() });
			setIsOpen(false);
		} catch (err) {
			console.error(err);
		}
	};

	useEffect(() => {
		if (wallet && isLoggedIn === false) {
			loginPantha();
		}
	}, [wallet, isLoggedIn]);

	return (
		<div className="min-h-screen relative overflow-hidden bg-landing-hero-bg dark:bg-dark-bg">
			<DotsBackground className="absolute inset-0 dark:opacity-30" />
			<div className="absolute inset-3 rounded-lg pointer-events-none bg-landing-hero-bg dark:bg-dark-bg" />
			<div className="absolute inset-3 border-4 border-black dark:border-gray-600 rounded-lg pointer-events-none" />
			<div className="absolute inset-6 pointer-events-auto flex flex-col items-center justify-center px-6 py-8">
				<div className="w-full max-w-sm">
					<h1 className="text-3xl font-bold mb-2 text-center text-landing-hero-text dark:text-dark-text">
						Sign in to Pantha
					</h1>
					<p className="text-center text-white/90 dark:text-dark-muted font-bold mb-6">
						Start your learning journey
					</p>

					<div className="bg-white dark:bg-dark-card rounded-lg p-6 shadow-sm">
						<form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="Email"
								className="w-full py-3 px-4 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
								required
							/>

							<button
								type="button"
								onClick={handleEmailLogin}
								className="w-full py-3 px-4 rounded-md font-medium transition-colors bg-landing-button-primary text-white hover:opacity-90"
							>
								Sign in with email
							</button>
						</form>

						<div className="my-5 border-t border-gray-200 dark:border-gray-600" />

						<div className="space-y-2">
							<SocialButton
								onClick={() => login({ loginMethods: ["google"] })}
								icon="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/500px-Google_%22G%22_logo.svg.png"
								label="Google"
							/>
							<SocialButton
								onClick={() => login()}
								icon="https://www.freepnglogos.com/uploads/apple-logo-png/apple-logo-png-index-content-uploads-10.png"
								label="Apple"
							/>
							<SocialButton
								onClick={() => login()}
								icon="https://media.licdn.com/dms/image/v2/D560BAQEc_dSldzmxgw/company-logo_200_200/company-logo_200_200/0/1682288978427/farcaster_logo?e=2147483647&v=beta&t=LlO5C8qcczg5gIWyoqwASvJBzKh0CXXyxrhb5DEUCGU"
								label="Farcaster"
							/>
						</div>
					</div>

					<p className="text-center text-xs font-light font-montserrat text-white mt-6">
						Continue your learning journey. By signing in, you agree to our
						Terms and Privacy Policy.
					</p>
				</div>
			</div>

			<OTPDrawer
				isOpen={isOpen}
				onOpenChange={setIsOpen}
				code={code}
				onCodeChange={setCode}
				onVerify={handleVerifyOtp}
			/>
		</div>
	);
}

function SocialButton({
	onClick,
	icon,
	label,
}: {
	onClick: () => void;
	icon: string;
	label: string;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md border border-gray-300 font-medium hover:bg-gray-50 transition-colors bg-landing-button-light-bg text-landing-button-text"
		>
			<img src={icon} className="w-4 h-4" alt="" />
			{label}
		</button>
	);
}

function OTPDrawer({
	isOpen,
	onOpenChange,
	code,
	onCodeChange,
	onVerify,
}: {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	code: string;
	onCodeChange: (code: string) => void;
	onVerify: () => void;
}) {
	return (
		<Drawer.Root dismissible={false} open={isOpen} onOpenChange={onOpenChange}>
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 bg-black/30" />
				<Drawer.Content className="bg-white dark:bg-dark-card flex flex-col rounded-t-lg mt-24 h-fit fixed bottom-0 left-0 right-0 outline-none">
					<div className="p-6">
						<div className="mx-auto w-10 h-1 rounded-full bg-gray-300 mb-6" />
						<div className="max-w-sm mx-auto">
							<input
								type="text"
								inputMode="numeric"
								value={code}
								onChange={(e) => {
									const value = e.target.value.replace(/\D/g, "");
									if (value.length <= 6) onCodeChange(value);
								}}
								placeholder="Enter code"
								className="w-full px-4 py-3 border border-gray-300 rounded text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400"
							/>
							<button
								type="button"
								disabled={code.length !== 6}
								onClick={onVerify}
								className="mt-4 w-full py-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-landing-button-primary text-white hover:opacity-90"
							>
								Verify
							</button>
							<button
								type="button"
								onClick={() => onOpenChange(false)}
								className="mt-2 w-full py-3 rounded border border-gray-300 dark:border-gray-600 font-medium hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-landing-button-text dark:text-dark-text"
							>
								Cancel
							</button>
						</div>
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}
