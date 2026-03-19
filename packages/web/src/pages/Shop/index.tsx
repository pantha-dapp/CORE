import { usePanthaContext } from "@pantha/react";
import {
	useBuyShopItems,
	useShopInventory,
	useShopItems,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, Gift, Zap } from "lucide-react";
import { useState } from "react";
import Button from "../../shared/components/Button";
import { useHapticFeedback } from "../../shared/utils/haptics";

export default function Shop() {
	const { wallet } = usePanthaContext();
	const router = useRouter();
	const hapticFeedback = useHapticFeedback();

	// Fetch shop items
	const shopItemsQuery = useShopItems();
	const buyMutation = useBuyShopItems();
	const inventoryQuery = useShopInventory();
	const [selectedItem, setSelectedItem] = useState<string | null>(null);

	if (!wallet) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-landing-hero-bg dark:bg-dark-bg">
				<div className="text-center px-6 py-8 rounded-2xl bg-white dark:bg-dark-surface">
					<div className="text-gray-900 dark:text-dark-text text-2xl font-bold mb-4 font-tusker">
						Connect Your Wallet
					</div>
					<p className="text-gray-600 dark:text-dark-muted mb-6">
						You need to connect your wallet to access the shop.
					</p>
					<Button
						onClick={() => router.navigate({ to: "/login" })}
						className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-semibold transition-colors"
					>
						Connect Wallet
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-linear-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg py-8 px-4 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-6xl">
				{/* Header */}
				<div className="mb-8 flex items-center justify-between">
					<div>
						<h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-dark-text font-tusker mb-2">
							Shop
						</h1>
						<p className="text-lg text-gray-600 dark:text-dark-muted">
							Boost your learning with special items
						</p>
					</div>
					<div className="text-right">
						<div className="text-sm text-gray-600 dark:text-dark-muted mb-1">
							Owned Items
						</div>
						<div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
							{inventoryQuery.data?.items?.length || 0}
						</div>
					</div>
				</div>

				{/* Loading State */}
				{shopItemsQuery.isLoading && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-64 rounded-2xl animate-pulse bg-white dark:bg-dark-surface"
							/>
						))}
					</div>
				)}

				{/* Error State */}
				{shopItemsQuery.isError && (
					<div className="rounded-2xl p-6 flex items-center gap-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
						<AlertCircle className="text-red-600 dark:text-red-400" />
						<div>
							<h3 className="font-bold text-red-900 dark:text-red-400">
								Failed to load shop items
							</h3>
							<p className="text-red-800 dark:text-red-300">
								Please try refreshing the page.
							</p>
						</div>
					</div>
				)}

				{/* Shop Items Grid */}
				{shopItemsQuery.data && shopItemsQuery.data.items.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{shopItemsQuery.data.items.map((item) => (
							<div
								key={item.id}
								className="rounded-2xl p-6 bg-white dark:bg-dark-surface backdrop-blur-xl border border-gray-200 dark:border-gray-700"
							>
								{/* Item Icon */}
								<div className="mb-4 text-5xl">
									{item.id === "STRKFRZ0" ? "❄️" : "🎁"}
								</div>

								{/* Item Name */}
								<h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2 font-tusker">
									{item.name}
								</h3>

								{/* Item Description */}
								<p className="text-gray-600 dark:text-dark-muted mb-4 text-sm leading-relaxed">
									{item.description}
								</p>

								{/* Item Warning */}
								{item.warning && (
									<div className="mb-4 p-3 rounded-lg text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
										{item.warning}
									</div>
								)}

								{/* Price and Buy Button */}
								<div className="flex items-center justify-between mt-6">
									<div className="flex items-center gap-2">
										<Zap className="text-yellow-500" size={20} />
										<span className="text-xl font-bold text-gray-900 dark:text-dark-text">
											{(item.priceBps / 100).toFixed(0)}
										</span>
									</div>

									<Button
										onClick={() => setSelectedItem(item.id)}
										className="px-6 py-2 rounded-full font-semibold transition-all bg-purple-500 hover:bg-purple-600 text-white"
									>
										{buyMutation.isPending && selectedItem === item.id
											? "Buying..."
											: "Buy"}
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-12 rounded-2xl bg-white dark:bg-dark-surface">
						<Gift
							className="mx-auto mb-4 text-gray-400 dark:text-dark-muted"
							size={48}
						/>
						<p className="text-lg text-gray-600 dark:text-dark-muted">
							No items available right now
						</p>
					</div>
				)}

				{/* Purchase Modal */}
				{selectedItem && shopItemsQuery.data && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<div className="bg-white dark:bg-dark-surface rounded-2xl p-8 max-w-md w-full">
							<h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-4 font-tusker">
								Confirm Purchase
							</h2>

							<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
								<p className="text-gray-600 dark:text-dark-muted">
									{
										shopItemsQuery.data?.items.find(
											(i) => i.id === selectedItem,
										)?.name
									}
								</p>
								<p className="text-2xl font-bold text-gray-900 dark:text-dark-text mt-2 flex items-center gap-2">
									<Zap className="text-yellow-500" size={20} />
									{(
										(shopItemsQuery.data?.items.find(
											(i) => i.id === selectedItem,
										)?.priceBps || 0) / 100
									).toFixed(0)}
								</p>
							</div>

							<p className="text-gray-600 dark:text-dark-muted text-sm mb-6">
								You'll need to sign a transaction to complete this purchase.
							</p>

							<div className="flex gap-4">
								<Button
									type="button"
									onClick={() => setSelectedItem(null)}
									disabled={buyMutation.isPending}
									className="flex-1 px-4 py-3 rounded-full font-semibold transition-colors bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-dark-text hover:bg-gray-300 dark:hover:bg-gray-700"
								>
									Cancel
								</Button>

								<Button
									type="button"
									onClick={async () => {
										hapticFeedback.tap();
										try {
											if (!selectedItem) return;
											await buyMutation.mutateAsync({
												itemId: selectedItem,
												signature: "", // TODO: Get from wallet
												deadline: "", // TODO: Get from wallet
											});
											setSelectedItem(null);
											inventoryQuery.refetch();
										} catch (error) {
											console.error("Purchase failed:", error);
										}
									}}
									disabled={buyMutation.isPending}
									className={`flex-1 px-4 py-3 rounded-full font-semibold text-white transition-colors ${
										buyMutation.isPending
											? "bg-purple-400 cursor-not-allowed"
											: "bg-purple-500 hover:bg-purple-600"
									}`}
								>
									{buyMutation.isPending ? "Processing..." : "Confirm"}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
