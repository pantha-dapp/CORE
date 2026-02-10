import Button from "../../shared/components/Button";

export default function Events() {
	return (
		<div className="min-h-screen bg-linear-to-b from-gray-900 to-gray-800 text-white px-6 py-8 pb-24">
			<div className="max-w-5xl mx-auto space-y-8">
				<div>
					<h1 className="text-3xl font-bold mb-3">Community Events</h1>
					<p className="text-white/70 leading-relaxed">
						Participate in blockchain-verified learning events, collaborate with
						peers worldwide, and earn on-chain credentials for your
						achievements. Every event participation is recorded on the
						blockchain, creating a transparent and verifiable record of your
						learning journey.
					</p>
				</div>

				{/* Featured Banner */}
				<div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-6 border border-purple-500/30">
					<div className="flex items-center gap-3 mb-3">
						<span className="text-2xl">🔗</span>
						<h3 className="text-xl font-bold">Blockchain-Verified Events</h3>
					</div>
					<p className="text-white/80 text-sm">
						All event participations are recorded on-chain, providing immutable
						proof of attendance and achievements. Build your verifiable learning
						portfolio while connecting with a global community.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Blockchain Learning Summit */}
					<div className="bg-gray-800 rounded-2xl p-6 border border-borderApp hover:border-purple-500/50 transition">
						<div className="flex items-center justify-between mb-3">
							<span className="bg-purple-500/20 text-purple-400 text-xs px-3 py-1 rounded-full">
								🔗 On-Chain
							</span>
							<span className="text-xs text-gray-400">50 XP</span>
						</div>
						<h2 className="text-xl font-semibold mb-2">
							Blockchain Learning Summit
						</h2>
						<p className="text-sm text-gray-400 mb-4">
							March 15, 2026 • Virtual Event
						</p>
						<p className="text-gray-300 mb-4">
							Join decentralized learning pioneers to explore how blockchain
							technology is revolutionizing education. Earn NFT credentials upon
							completion.
						</p>
						<Button className="bg-primary text-white px-4 py-2 rounded-xl font-semibold w-full">
							Register & Mint Pass
						</Button>
					</div>

					{/* AI Study Group Challenge */}
					<div className="bg-gray-800 rounded-2xl p-6 border border-borderApp hover:border-green-500/50 transition">
						<div className="flex items-center justify-between mb-3">
							<span className="bg-green-500/20 text-green-400 text-xs px-3 py-1 rounded-full">
								🏆 Challenge
							</span>
							<span className="text-xs text-gray-400">100 XP</span>
						</div>
						<h2 className="text-xl font-semibold mb-2">
							Global AI Study Challenge
						</h2>
						<p className="text-sm text-gray-400 mb-4">
							March 20-27, 2026 • Worldwide
						</p>
						<p className="text-gray-300 mb-4">
							Compete with learners globally in a week-long AI challenge. Top
							performers earn exclusive blockchain badges and rewards
							distributed via smart contracts.
						</p>
						<Button className="bg-primary text-white px-4 py-2 rounded-xl font-semibold w-full">
							Join Challenge
						</Button>
					</div>

					{/* Peer Learning Session */}
					<div className="bg-gray-800 rounded-2xl p-6 border border-borderApp hover:border-blue-500/50 transition">
						<div className="flex items-center justify-between mb-3">
							<span className="bg-blue-500/20 text-blue-400 text-xs px-3 py-1 rounded-full">
								👥 Community
							</span>
							<span className="text-xs text-gray-400">25 XP</span>
						</div>
						<h2 className="text-xl font-semibold mb-2">
							Weekly Peer Study Sessions
						</h2>
						<p className="text-sm text-gray-400 mb-4">
							Every Saturday • 10:00 AM UTC
						</p>
						<p className="text-gray-300 mb-4">
							Connect with study partners, share insights, and collaborate on
							projects. Attendance verified on-chain for transparent
							participation tracking.
						</p>
						<Button className="bg-primary text-white px-4 py-2 rounded-xl font-semibold w-full">
							RSVP Now
						</Button>
					</div>

					{/* Hackathon Event */}
					<div className="bg-gray-800 rounded-2xl p-6 border border-borderApp hover:border-orange-500/50 transition">
						<div className="flex items-center justify-between mb-3">
							<span className="bg-orange-500/20 text-orange-400 text-xs px-3 py-1 rounded-full">
								💻 Hackathon
							</span>
							<span className="text-xs text-gray-400">200 XP</span>
						</div>
						<h2 className="text-xl font-semibold mb-2">
							Learn & Build Hackathon
						</h2>
						<p className="text-sm text-gray-400 mb-4">
							April 5-7, 2026 • Hybrid
						</p>
						<p className="text-gray-300 mb-4">
							48-hour intensive hackathon where you apply your learning to real
							projects. Winners receive crypto rewards and permanent achievement
							NFTs.
						</p>
						<Button className="bg-primary text-white px-4 py-2 rounded-xl font-semibold w-full">
							Register Team
						</Button>
					</div>

					{/* Virtual Meetup */}
					<div className="bg-gray-800 rounded-2xl p-6 border border-borderApp hover:border-yellow-500/50 transition">
						<div className="flex items-center justify-between mb-3">
							<span className="bg-yellow-500/20 text-yellow-400 text-xs px-3 py-1 rounded-full">
								☕ Casual
							</span>
							<span className="text-xs text-gray-400">10 XP</span>
						</div>
						<h2 className="text-xl font-semibold mb-2">Coffee & Code Meetup</h2>
						<p className="text-sm text-gray-400 mb-4">
							March 18, 2026 • Virtual Lounge
						</p>
						<p className="text-gray-300 mb-4">
							Casual networking with fellow learners. Share progress, get
							feedback, and make friends. Blockchain attendance tokens minted
							automatically.
						</p>
						<Button className="bg-primary text-white px-4 py-2 rounded-xl font-semibold w-full">
							Join Meetup
						</Button>
					</div>

					{/* Workshop Series */}
					<div className="bg-gray-800 rounded-2xl p-6 border border-borderApp hover:border-pink-500/50 transition">
						<div className="flex items-center justify-between mb-3">
							<span className="bg-pink-500/20 text-pink-400 text-xs px-3 py-1 rounded-full">
								🎓 Workshop
							</span>
							<span className="text-xs text-gray-400">75 XP</span>
						</div>
						<h2 className="text-xl font-semibold mb-2">
							Advanced ML Workshop Series
						</h2>
						<p className="text-sm text-gray-400 mb-4">
							March 25 - April 8 • 4 Sessions
						</p>
						<p className="text-gray-300 mb-4">
							Deep dive into advanced machine learning concepts with hands-on
							exercises. Complete all sessions to earn a verified certificate
							NFT.
						</p>
						<Button className="bg-primary text-white px-4 py-2 rounded-xl font-semibold w-full">
							Enroll Now
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
