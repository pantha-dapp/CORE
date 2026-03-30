import { usePanthaContext } from "@pantha/react";
import {
	usePurchaseShopItem,
	useShopItems,
	useUserPurchases,
} from "@pantha/react/hooks";
import { useRouter } from "@tanstack/react-router";
import { AlertCircle, Gift, Package, ShoppingBag, Zap } from "lucide-react";
import { useState } from "react";
import Button from "../../shared/components/Button";
import PageHeaderWithStats from "../../shared/components/PageHeaderWithStats";
import { useHapticFeedback } from "../../shared/utils/haptics";

export default function Shop() {
	const { wallet } = usePanthaContext();
	const router = useRouter();
	const hapticFeedback = useHapticFeedback();

	// Fetch shop items
	const shopItemsQuery = useShopItems();
	const purchaseMutation = usePurchaseShopItem();
	const inventoryQuery = useUserPurchases();
	const [selectedItem, setSelectedItem] = useState<string | null>(null);

	const getPurchaseKey = (purchase: {
		itemId: string;
		purchasedAt: string | Date;
		consumed: number;
	}) =>
		`${purchase.itemId}-${String(purchase.purchasedAt)}-${purchase.consumed}`;

	if (!wallet) {
		return (
			<div className="dark min-h-screen flex items-center justify-center bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg">
				<div className="text-center px-6 py-8 rounded-2xl bg-dark-card/95 backdrop-blur-xl">
					<div className="text-dark-text text-2xl font-bold mb-4 font-titillium">
						Connect Your Wallet
					</div>
					<p className="text-dark-muted mb-6">
						You need to connect your wallet to access the shop.
					</p>
					<Button
						onClick={() => router.navigate({ to: "/login" })}
						className="px-6 py-3 bg-dark-accent hover:bg-dark-accent/90 text-dark-bg rounded-full font-semibold transition-colors"
					>
						Connect Wallet
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="dark min-h-screen bg-linear-to-br from-dark-bg via-dark-surface/50 to-dark-bg py-8 px-4 sm:px-6 lg:px-8 pb-28">
			<div className="mx-auto max-w-6xl">
				<PageHeaderWithStats
					badge="Marketplace"
					title="Shop"
					subtitle="Boost your learning with special items"
				/>

				{/* Loading State */}
				{shopItemsQuery.isLoading && (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="h-64 rounded-2xl animate-pulse bg-dark-surface"
							/>
						))}
					</div>
				)}

				{/* Error State */}
				{shopItemsQuery.isError && (
					<div className="rounded-2xl p-6 flex items-center gap-4 bg-red-900/20 border border-red-800">
						<AlertCircle className="text-red-400" />
						<div>
							<h3 className="font-bold text-red-400">
								Failed to load shop items
							</h3>
							<p className="text-red-300">Please try refreshing the page.</p>
						</div>
					</div>
				)}

				{/* Shop Items Grid */}
				{shopItemsQuery.data && shopItemsQuery.data.items.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{shopItemsQuery.data.items.map((item) => (
							<div
								key={item.id}
								className="rounded-2xl p-6 bg-linear-to-br from-dark-card/95 to-dark-surface/50 backdrop-blur-xl border border-dark-border"
							>
								{/* Item Icon */}
								<div className="mb-4 text-5xl">
									{item.id === "STRKFRZ0" ? "❄️" : "🎁"}
								</div>

								{/* Item Name */}
								<h3 className="text-2xl font-bold text-dark-text mb-2 font-titillium">
									{item.name}
								</h3>

								{/* Item Description */}
								<p className="text-dark-muted mb-4 text-sm leading-relaxed">
									{item.description}
								</p>

								{/* Item Warning */}
								{item.warning && (
									<div className="mb-4 p-3 rounded-lg text-xs bg-gray-800 text-gray-300">
										{item.warning}
									</div>
								)}
								<div className="flex items-center justify-between mt-6">
									<div className="flex items-center gap-2">
										<Zap className="text-yellow-500" size={20} />
										<span className="text-xl font-bold text-dark-text">
											{(item.priceHuman / 100).toFixed(0)}
										</span>
									</div>

									<Button
										onClick={() => setSelectedItem(item.id)}
										className="px-6 py-2 rounded-full font-semibold transition-all bg-dark-accent hover:bg-dark-accent/90 text-dark-bg"
									>
										{purchaseMutation.isPending && selectedItem === item.id
											? "Buying..."
											: "Buy"}
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-12 rounded-2xl bg-dark-surface">
						<Gift className="mx-auto mb-4 text-dark-muted" size={48} />
						<p className="text-lg text-dark-muted">
							No items available right now
						</p>
					</div>
				)}

				{/* Purchase History */}
				<div className="mt-12">
					{inventoryQuery.isLoading && (
						<div className="space-y-3">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className="h-16 rounded-xl animate-pulse bg-dark-surface"
								/>
							))}
						</div>
					)}

					{inventoryQuery.data &&
						(() => {
							const available = inventoryQuery.data.history.filter(
								(p) => p.consumed === 0,
							);
							const used = inventoryQuery.data.history.filter(
								(p) => p.consumed !== 0,
							);

							return (
								<>
									{/* Your Items — unconsumed */}
									<h2 className="text-xl font-bold text-dark-text font-titillium mb-4 flex items-center gap-2">
										<Package size={22} className="text-dark-accent" />
										Your Items
									</h2>

									{available.length === 0 ? (
										<div className="text-center py-8 rounded-2xl bg-dark-surface mb-10">
											<Package
												className="mx-auto mb-3 text-dark-muted"
												size={36}
											/>
											<p className="text-dark-muted text-sm">
												You have no unused items
											</p>
										</div>
									) : (
										<div className="space-y-3 mb-10">
											{available.map((purchase) => {
												const shopItem = shopItemsQuery.data?.items.find(
													(i) => i.id === purchase.itemId,
												);
												return (
													<div
														key={getPurchaseKey(purchase)}
														className="flex items-center justify-between rounded-xl px-5 py-4 bg-dark-card/80 border border-dark-accent/30"
													>
														<div className="flex items-center gap-3">
															<span className="text-2xl">
																{purchase.itemId === "STRKFRZ0" ? "❄️" : "🎁"}
															</span>
															<div>
																<p className="font-semibold text-dark-text text-sm">
																	{shopItem?.name ?? purchase.itemId}
																</p>
																<p className="text-dark-muted text-xs mt-0.5">
																	Purchased{" "}
																	{new Date(
																		purchase.purchasedAt,
																	).toLocaleDateString(undefined, {
																		year: "numeric",
																		month: "short",
																		day: "numeric",
																	})}
																</p>
															</div>
														</div>
														<span className="text-xs font-semibold px-3 py-1 rounded-full bg-dark-accent/20 text-dark-accent">
															Available
														</span>
													</div>
												);
											})}
										</div>
									)}

									{/* History — consumed */}
									<h2 className="text-xl font-bold text-dark-text font-titillium mb-4 flex items-center gap-2">
										<ShoppingBag size={22} className="text-dark-muted" />
										History
									</h2>

									{used.length === 0 ? (
										<div className="text-center py-8 rounded-2xl bg-dark-surface">
											<ShoppingBag
												className="mx-auto mb-3 text-dark-muted"
												size={36}
											/>
											<p className="text-dark-muted text-sm">
												No used items yet
											</p>
										</div>
									) : (
										<div className="space-y-3">
											{used.map((purchase) => {
												const shopItem = shopItemsQuery.data?.items.find(
													(i) => i.id === purchase.itemId,
												);
												return (
													<div
														key={getPurchaseKey(purchase)}
														className="flex items-center justify-between rounded-xl px-5 py-4 bg-dark-card/60 border border-dark-border opacity-70"
													>
														<div className="flex items-center gap-3">
															<span className="text-2xl grayscale">
																{purchase.itemId === "STRKFRZ0" ? "❄️" : "🎁"}
															</span>
															<div>
																<p className="font-semibold text-dark-text text-sm">
																	{shopItem?.name ?? purchase.itemId}
																</p>
																<p className="text-dark-muted text-xs mt-0.5">
																	{shopItem?.description
																		? shopItem.description
																		: purchase.itemId}{" "}
																	· Used on{" "}
																	{new Date(
																		purchase.purchasedAt,
																	).toLocaleDateString(undefined, {
																		year: "numeric",
																		month: "short",
																		day: "numeric",
																	})}
																</p>
															</div>
														</div>
														<div className="flex items-center gap-2">
															<Zap className="text-yellow-500/60" size={14} />
															<span className="text-sm font-bold text-dark-muted">
																{shopItem
																	? (shopItem.priceHuman / 100).toFixed(0)
																	: "—"}
															</span>
															<span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-700 text-gray-400 ml-2">
																Used
															</span>
														</div>
													</div>
												);
											})}
										</div>
									)}
								</>
							);
						})()}
				</div>

				{/* Purchase Modal */}
				{selectedItem && shopItemsQuery.data && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<div className="bg-dark-card/95 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full">
							<h2 className="text-2xl font-bold text-dark-text mb-4 font-titillium">
								Confirm Purchase
							</h2>

							<div className="bg-gray-800 rounded-xl p-4 mb-6">
								<p className="text-dark-muted">
									{
										shopItemsQuery.data?.items.find(
											(i) => i.id === selectedItem,
										)?.name
									}
								</p>
								<p className="text-2xl font-bold text-dark-text mt-2 flex items-center gap-2">
									<Zap className="text-yellow-500" size={20} />
									{shopItemsQuery.data?.items
										.find((i) => i.id === selectedItem)
										?.priceHuman.toFixed(2)}
								</p>
							</div>

							<p className="text-dark-muted text-sm mb-6">
								You'll need to sign a transaction to complete this purchase.
							</p>

							<div className="flex gap-4">
								<Button
									type="button"
									onClick={() => setSelectedItem(null)}
									disabled={purchaseMutation.isPending}
									className="flex-1 px-4 py-3 rounded-full font-semibold transition-colors bg-gray-800 text-dark-text hover:bg-gray-700"
								>
									Cancel
								</Button>

								<Button
									type="button"
									onClick={async () => {
										hapticFeedback.tap();
										try {
											if (!selectedItem) return;
											await purchaseMutation.mutateAsync({
												itemId: selectedItem,
											});
											setSelectedItem(null);
											inventoryQuery.refetch();
										} catch (error) {
											console.error("Purchase failed:", error);
										}
									}}
									disabled={purchaseMutation.isPending}
									className={`flex-1 px-4 py-3 rounded-full font-semibold text-dark-bg transition-colors ${
										purchaseMutation.isPending
											? "bg-dark-accent/60 cursor-not-allowed"
											: "bg-dark-accent hover:bg-dark-accent/90"
									}`}
								>
									{purchaseMutation.isPending ? "Processing..." : "Confirm"}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
