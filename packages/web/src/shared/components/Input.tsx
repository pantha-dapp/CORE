import clsx from "clsx";
import React from "react";
import Icon, { type IconName } from "./Icon";

type InputVariant = "default" | "error";
type InputSize = "sm" | "md" | "lg";

export interface InputProps
	extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
	variant?: InputVariant;
	size?: InputSize;
	fullWidth?: boolean;
	icon?: IconName;
	iconPosition?: "left" | "right";
	iconSize?: number;
	showPasswordToggle?: boolean;
	label?: string;
	error?: string;
}

const variantClasses: Record<InputVariant, string> = {
	default:
		"bg-gray-700/50 border-gray-600 focus:border-blue-500 text-white placeholder-gray-400",
	error:
		"bg-red-900/20 border-red-500 focus:border-red-400 text-white placeholder-red-300",
};

const sizeClasses: Record<InputSize, string> = {
	sm: "px-3 py-2 text-sm",
	md: "px-4 py-3 text-base",
	lg: "px-4 py-4 text-lg",
};

export default function Input({
	variant = "default",
	size = "md",
	fullWidth = false,
	icon,
	iconPosition = "left",
	iconSize = 20,
	showPasswordToggle = false,
	label,
	error,
	className,
	type = "text",
	disabled,
	id,
	...props
}: InputProps) {
	const [showPassword, setShowPassword] = React.useState(false);
	const inputId = React.useId();
	const finalId = id || inputId;

	const isPasswordType = type === "password";
	const inputType = isPasswordType && showPassword ? "text" : type;

	const inputClasses = clsx(
		"relative w-full rounded-xl border-2 transition-colors duration-200 ease-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
		variantClasses[variant],
		sizeClasses[size],
		fullWidth && "w-full",
		icon && iconPosition === "left" && "pl-10",
		(icon || (isPasswordType && showPasswordToggle)) &&
			iconPosition === "right" &&
			"pr-10",
		className,
	);

	const containerClasses = clsx("relative", fullWidth && "w-full");

	return (
		<div className={containerClasses}>
			{label && (
				<label
					htmlFor={finalId}
					className="block text-sm font-medium text-gray-300 mb-2"
				>
					{label}
				</label>
			)}
			<div className="relative">
				{icon && iconPosition === "left" && (
					<div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
						<Icon name={icon} size={iconSize} />
					</div>
				)}
				<input
					id={finalId}
					type={inputType}
					disabled={disabled}
					className={inputClasses}
					{...props}
				/>
				{icon && iconPosition === "right" && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
						<Icon name={icon} size={iconSize} />
					</div>
				)}
				{isPasswordType && showPasswordToggle && (
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
					>
						<Icon name={showPassword ? "eye-off" : "eye"} size={iconSize} />
					</button>
				)}
			</div>
			{error && <p className="mt-1 text-sm text-red-400">{error}</p>}
		</div>
	);
}
