import { forwardRef } from "react";
import { FlowText } from "./FlowText";

const SECTION_HEIGHT_VH = 100;

interface HowItWorksStep2Props {
	textTranslateY: number;
	distanceFromCenter: number;
}

export const HowItWorksStep2 = forwardRef<HTMLDivElement, HowItWorksStep2Props>(
	function HowItWorksStep2({ textTranslateY, distanceFromCenter }, ref) {
		const textColor = "#ac4f98";

		return (
			<section
				ref={ref}
				className="relative font-tusker"
				style={{ minHeight: `${SECTION_HEIGHT_VH}vh` }}
			>
				<div className="sticky top-0 h-screen flex flex-col items-center justify-end px-6 md:px-12 overflow-visible pb-12 md:pb-16">
					<div
						className="flex justify-center items-center px-6 md:px-12 pointer-events-none"
						style={{
							transform: `translateY(${textTranslateY}vh)`,
							willChange: "transform",
						}}
					>
						<FlowText
							text="AI refines your goals — Follow up questions to personalize"
							textColor={textColor}
							distanceFromCenter={distanceFromCenter}
						/>
					</div>
				</div>
			</section>
		);
	},
);
