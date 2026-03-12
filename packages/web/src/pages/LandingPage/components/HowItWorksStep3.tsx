import { forwardRef } from "react";
import { FlowText } from "./FlowText";

const SECTION_HEIGHT_VH = 100;

interface HowItWorksStep3Props {
	textTranslateY: number;
	distanceFromCenter: number;
}

export const HowItWorksStep3 = forwardRef<HTMLDivElement, HowItWorksStep3Props>(
	function HowItWorksStep3({ textTranslateY, distanceFromCenter }, ref) {
		const textColor = "#c94245";

		return (
			<section
				ref={ref}
				className="relative font-tusker"
				style={{ minHeight: `${SECTION_HEIGHT_VH}vh` }}
			>
				<div className="sticky top-0 h-screen flex flex-col items-center justify-end px-0 md:px-12 overflow-visible pb-12 md:pb-16">
					<div
						className="flex justify-center items-center px-6 md:px-12 pointer-events-none"
						style={{
							transform: `translateY(${textTranslateY}vh)`,
							willChange: "transform",
						}}
					>
						<FlowText
							text="Get your course 50+ chapters, beginner to advanced"
							textColor={textColor}
							distanceFromCenter={distanceFromCenter}
						/>
					</div>
				</div>
			</section>
		);
	},
);
