import { Github, MessageCircle, Send, Share2 } from "lucide-react";
import { forwardRef } from "react";

const SOCIAL_LINKS = [
	{ href: "https://twitter.com/pantha", label: "Twitter / X", Icon: Share2 },
	{ href: "https://discord.gg/pantha", label: "Discord", Icon: MessageCircle },
	{ href: "https://t.me/pantha", label: "Telegram", Icon: Send },
	{ href: "https://github.com/pantha", label: "GitHub", Icon: Github },
] as const;

export const Footer = forwardRef<HTMLElement>(function Footer(_, ref) {
	return (
		<footer
			ref={ref}
			className="relative z-10 px-6 md:px-12 py-20 md:py-28"
			style={{ backgroundColor: "#375027", color: "white" }}
		>
			<div className="max-w-5xl mx-auto">
				<h2 className="font-tusker font-bold text-4xl md:text-5xl lg:text-6xl mb-6 md:mb-8">
					Start learning today.
				</h2>
				<p className="text-lg md:text-xl text-white/90 mb-12 md:mb-16 max-w-2xl text-haymer font-bold">
					Join Pantha and transform how you learn. AI-powered courses,
					personalized to you.
				</p>
				<div className="flex flex-wrap gap-4 md:gap-6 text-haymer">
					{SOCIAL_LINKS.map(({ href, label, Icon }) => (
						<a
							key={label}
							href={href}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-[#375027] hover:border-white hover:bg-white/10 transition-colors"
							aria-label={label}
						>
							<Icon size={20} />
							<span className="font-bold text-haymer">{label}</span>
						</a>
					))}
				</div>
				<div className="mt-16 pt-8 border-t-4 border-white">
					<p className="text-white/70 text-sm text-haymer font-bold">
						© {new Date().getFullYear()} Pantha. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
});
