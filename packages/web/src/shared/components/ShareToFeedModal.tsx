import { X } from "lucide-react";

interface ShareToFeedModalProps {
	title: string;
	description: string;
	emoji: string;
	onConfirm: () => void;
	onDismiss: () => void;
	isLoading?: boolean;
}

export function ShareToFeedModal({
	title,
	description,
	emoji,
	onConfirm,
	onDismiss,
	isLoading,
}: ShareToFeedModalProps) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<div className="bg-dark-surface border border-dark-border rounded-2xl p-6 max-w-sm w-full shadow-xl">
				<div className="flex items-center justify-between mb-4">
					<div className="text-4xl">{emoji}</div>
					<button
						type="button"
						onClick={onDismiss}
						className="p-1.5 hover:bg-dark-border rounded-lg transition"
					>
						<X className="w-4 h-4 text-dark-muted" />
					</button>
				</div>
				<h3 className="text-lg font-bold text-dark-text font-montserrat mb-1">
					{title}
				</h3>
				<p className="text-sm text-dark-muted font-montserrat mb-6">
					{description}
				</p>
				<div className="flex gap-3">
					<button
						type="button"
						onClick={onDismiss}
						className="flex-1 py-2.5 rounded-xl bg-dark-border text-dark-text text-sm font-semibold font-montserrat hover:bg-dark-border/80 transition"
					>
						Skip
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={isLoading}
						className="flex-1 py-2.5 rounded-xl bg-dark-accent text-dark-bg text-sm font-semibold font-montserrat hover:bg-dark-accent/90 disabled:opacity-50 transition"
					>
						{isLoading ? "Sharing..." : "Share to Feed 🚀"}
					</button>
				</div>
			</div>
		</div>
	);
}
