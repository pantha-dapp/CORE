import { useEffect, useState } from "react";

interface CertAttribute {
	trait_type: string;
	value: string | number;
}

interface CertMetadata {
	name: string;
	description: string;
	image?: string;
	external_url?: string;
	attributes?: CertAttribute[];
}

interface CertificateCardProps {
	tokenId: string | number;
	txnHash: string;
	dataUri?: string;
}

function attr(attributes: CertAttribute[], key: string) {
	return attributes.find((a) => a.trait_type === key)?.value;
}

function DescriptionBody({ text }: { text: string }) {
	// Split into intro paragraph(s) and bullet lines starting with "- "
	const lines = text.split("\n");
	const bullets: string[] = [];
	const prose: string[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith("- ")) {
			bullets.push(trimmed.slice(2));
		} else if (trimmed) {
			prose.push(trimmed);
		}
	}

	return (
		<div className="space-y-2 text-xs text-dark-muted font-montserrat leading-relaxed">
			{prose.map((p, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static prose paragraphs
				<p key={i}>{p}</p>
			))}
			{bullets.length > 0 && (
				<ul className="list-disc list-outside pl-4 space-y-1">
					{bullets.map((b, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static bullet list
						<li key={i}>{b}</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default function CertificateCard({
	tokenId,
	txnHash,
	dataUri,
}: CertificateCardProps) {
	const [meta, setMeta] = useState<CertMetadata | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [expanded, setExpanded] = useState(false);

	useEffect(() => {
		if (!dataUri) return;
		setLoading(true);
		fetch(dataUri)
			.then((r) => {
				if (!r.ok) throw new Error("fetch failed");
				return r.json() as Promise<CertMetadata>;
			})
			.then((data) => {
				setMeta(data);
				setLoading(false);
			})
			.catch(() => {
				setError(true);
				setLoading(false);
			});
	}, [dataUri]);

	const attrs = meta?.attributes ?? [];
	const progress = attr(attrs, "progress") as number | undefined;
	const totalChapters = attr(attrs, "totalChapters") as number | undefined;
	const username = attr(attrs, "panthaUsername") as string | undefined;
	const courseId = attr(attrs, "panthaCourseId") as string | undefined;
	const hashchainUrl = attr(attrs, "hashchainUrl") as string | undefined;
	const issuedTo = attr(attrs, "issuedTo") as string | undefined;
	const merkleRoot = attr(attrs, "merkleRoot") as string | undefined;

	const progressPct =
		progress !== undefined && totalChapters
			? Math.round((Number(progress) / Number(totalChapters)) * 100)
			: null;

	return (
		<div className="rounded-xl border border-dark-border bg-linear-to-br from-dark-surface to-dark-surface/30 p-5 flex flex-col gap-3 ">
			{/* Header */}
			<div className="flex items-start gap-3">
				<span className="text-3xl shrink-0">🎓</span>
				<div className="min-w-0 flex-1">
					{loading && (
						<p className="text-sm font-semibold text-dark-text font-montserrat animate-pulse">
							Loading certificate…
						</p>
					)}
					{!loading && meta && (
						<p className="text-sm font-semibold text-dark-text font-montserrat leading-snug">
							{meta.name}
						</p>
					)}
					{!loading && !meta && (
						<p className="text-sm font-semibold text-dark-text font-montserrat">
							Token #{tokenId}
						</p>
					)}
					<p className="text-xs text-dark-muted font-montserrat mt-0.5">
						Issued on-chain
					</p>
				</div>

				{/* Progress badge */}
				{progressPct !== null && (
					<span className="shrink-0 rounded-full bg-dark-accent/15 px-2.5 py-0.5 text-xs font-bold text-dark-accent font-montserrat whitespace-nowrap">
						{progressPct}%
					</span>
				)}
			</div>

			{/* Progress bar */}
			{progress !== undefined && totalChapters && (
				<div>
					<div className="flex justify-between text-xs text-dark-muted font-montserrat mb-1">
						<span>Progress</span>
						<span>
							{progress} / {totalChapters} chapters
						</span>
					</div>
					<div className="w-full h-1.5 rounded-full bg-dark-border overflow-hidden">
						<div
							className="h-full rounded-full bg-dark-accent transition-all"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
				</div>
			)}

			{/* Key attributes */}
			<div className="space-y-1.5 text-xs font-montserrat">
				{username && (
					<div className="flex items-center justify-between">
						<span className="text-dark-muted">Username</span>
						<span className="text-dark-text font-semibold">{username}</span>
					</div>
				)}
				{issuedTo && (
					<div className="flex items-center justify-between gap-2">
						<span className="text-dark-muted shrink-0">Issued to</span>
						<span className="font-mono text-dark-text truncate">
							{issuedTo.slice(0, 8)}…{issuedTo.slice(-6)}
						</span>
					</div>
				)}
				{courseId && (
					<div className="flex items-center justify-between gap-2">
						<span className="text-dark-muted shrink-0">Course ID</span>
						<span className="font-mono text-dark-text truncate text-right">
							{courseId}
						</span>
					</div>
				)}
				<div className="flex items-center justify-between gap-2">
					<span className="text-dark-muted shrink-0">Tx Hash</span>
					<span className="font-mono text-dark-text">
						{txnHash.slice(0, 8)}…{txnHash.slice(-6)}
					</span>
				</div>
				{merkleRoot && (
					<div className="flex items-center justify-between gap-2">
						<span className="text-dark-muted shrink-0">Merkle Root</span>
						<span className="font-mono text-dark-text">
							{merkleRoot.slice(0, 8)}…{merkleRoot.slice(-6)}
						</span>
					</div>
				)}
			</div>

			{/* Description (collapsible) */}
			{meta?.description && (
				<div className="border-t border-dark-border/60 pt-3">
					<button
						type="button"
						onClick={() => setExpanded((v) => !v)}
						className="text-xs font-semibold text-dark-accent font-montserrat flex items-center gap-1 hover:opacity-80 transition-opacity"
					>
						{expanded ? "Hide" : "Show"} description
						<span
							className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
						>
							▾
						</span>
					</button>
					{expanded && (
						<div className="mt-2">
							<DescriptionBody text={meta.description} />
						</div>
					)}
				</div>
			)}

			{/* Error fallback */}
			{error && dataUri && (
				<p className="text-xs text-red-400 font-montserrat">
					Could not load metadata.
				</p>
			)}

			{/* External links */}
			<div className="flex flex-wrap gap-2 mt-auto">
				{hashchainUrl && (
					<a
						href={hashchainUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block rounded-lg bg-dark-accent/10 hover:bg-dark-accent/20 px-3 py-2 text-xs font-semibold text-dark-accent font-montserrat transition text-center"
					>
						Verify on Hash Chain ↗
					</a>
				)}
				{dataUri && (
					<a
						href={dataUri}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-block rounded-lg bg-dark-border/40 hover:bg-dark-border/60 px-3 py-2 text-xs font-semibold text-dark-muted font-montserrat transition text-center"
					>
						Raw Metadata ↗
					</a>
				)}
			</div>
		</div>
	);
}
