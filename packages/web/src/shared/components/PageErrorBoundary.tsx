import { useNavigate } from "@tanstack/react-router";
import type React from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import Icon from "./Icon";

interface PageErrorBoundaryProps {
	children: React.ReactNode;
}

const DefaultErrorFallback = () => {
	const navigate = useNavigate();

	return (
		<div className="flex flex-col gap-4 h-screen">
			<PageCrashed
				title="Something went wrong"
				description="There was an error loading this page."
				showRetryButton={true}
				showBackButton={true}
				showHomeButton={false}
				onRetry={() => window.location.reload()}
				onBack={() => navigate({ to: "/" })}
			/>
		</div>
	);
};

const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({ children }) => {
	const handleError = (error: Error) => {
		console.error("Page error:", error);
	};

	return (
		<ErrorBoundary fallback={<DefaultErrorFallback />} onError={handleError}>
			{children}
		</ErrorBoundary>
	);
};

const withPageErrorBoundary =
	<P extends {}>(Component: React.ComponentType<P>) =>
	(props: P) => (
		<PageErrorBoundary>
			<Component {...props} />
		</PageErrorBoundary>
	);

export { PageErrorBoundary, withPageErrorBoundary };

type PageCrashedProps = {
	title?: string;
	description?: string;
	showBackButton?: boolean;
	showHomeButton?: boolean;
	showRetryButton?: boolean;
	onBack?: () => void;
	onHome?: () => void;
	onRetry?: () => void;
};

function PageCrashed({
	title = "Oops! Something went wrong",
	description = "We encountered an unexpected error.",
	showBackButton = true,
	showHomeButton = false,
	showRetryButton = true,
	onBack,
	onHome,
	onRetry,
}: PageCrashedProps) {
	return (
		<div className="flex flex-1 flex-col gap-4 justify-center items-center p-4">
			<div className="space-y-6 max-w-md">
				{/* Crash Illustration */}
				<div className="flex justify-center items-center w-32 h-32 rounded-full bg-gray-100 mx-auto">
					<Icon name="smile" size={48} color="#9ca3af" />
				</div>

				{/* Content */}
				<div className="space-y-3 text-center">
					<h1 className="text-3xl font-bold text-gray-900">{title}</h1>
					<p className="text-gray-600">{description}</p>
				</div>

				{/* Actions */}
				<div className="flex gap-3 flex-wrap justify-center">
					{showBackButton && (
						<button
							type="button"
							onClick={onBack}
							className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
						>
							<Icon name="chevron-left" size={16} />
							Go Back
						</button>
					)}
					{showHomeButton && (
						<button
							type="button"
							onClick={onHome}
							className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
						>
							<Icon name="home" size={16} />
							Go Home
						</button>
					)}
					{showRetryButton && (
						<button
							type="button"
							onClick={onRetry}
							className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
						>
							<Icon name="refresh-cw" size={16} />
							Try Again
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
