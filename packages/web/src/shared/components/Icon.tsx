import { DynamicIcon, type IconName } from "lucide-react/dynamic";

interface IProps {
	name: IconName;
	color?: string;
	size?: number;
	className?: string;
}

export default function Icon(props: IProps) {
	return (
		<DynamicIcon
			name={props.name}
			color={props.color}
			size={props.size}
			className={props.className}
		/>
	);
}

export type { IconName };
