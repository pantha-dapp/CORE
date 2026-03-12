import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { TokenEconomy } from "./components/TokenEconomy";

export default function LandingPage() {
	return (
		<div className="overflow-x-hidden">
			<Hero />
			<HowItWorks />
			<TokenEconomy />
			<Footer />
		</div>
	);
}
