import { forwardRef } from "react";
import { FlowText } from "./FlowText";

const SECTION_HEIGHT_VH = 100;

interface HowItWorksStep1Props {
	textTranslateY: number;
	distanceFromCenter: number;
}

export const HowItWorksStep1 = forwardRef<HTMLDivElement, HowItWorksStep1Props>(
	function HowItWorksStep1({ textTranslateY, distanceFromCenter }, ref) {
		const textColor = "#f8c1ba";

		return (
			<section
				ref={ref}
				className="relative font-titillium"
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
							text="Answer questions — What do you want to learn?"
							textColor={textColor}
							distanceFromCenter={distanceFromCenter}
						/>
					</div>
				</div>
			</section>
		);
	},
);
