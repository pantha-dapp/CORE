import type React from "react";
import Icon, { type IconName } from "./Icon";
import clsx from "clsx";
import type { UseMutationResult } from "@tanstack/react-query";

type ButtonVariant =
	| "primary"
	| "secondary"
	| "danger"
	| "outline"
	| "ghost"
	| "success";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps<
	TData = unknown,
	TError = unknown,
	TVariables = void,
> extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	fullWidth?: boolean;
	icon?: IconName;
	iconPosition?: "left" | "right";
	iconSize?: number;
	loading?: boolean;
	vibrate?: boolean;
	mutation?: UseMutationResult<TData, TError, TVariables>;
	mutationVariables?: TVariables;
	onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-green-500 text-white border-b-4 border-green-700 hover:bg-green-600 active:border-b-0",
	secondary:
		"bg-blue-500 text-white border-b-4 border-blue-700 hover:bg-blue-600 active:border-b-0",
	danger:
		"bg-red-500 text-white border-b-4 border-red-700 hover:bg-red-600 active:border-b-0",
	outline:
		"bg-white text-gray-700 border-2 border-gray-300 border-b-4 border-b-gray-400 hover:bg-gray-50 active:border-b-2",
	ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200",
	success:
		"bg-emerald-500 text-white border-b-4 border-emerald-700 hover:bg-emerald-600 active:border-b-0",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "px-4 py-2 text-sm",
	md: "px-6 py-3 text-base",
	lg: "px-8 py-4 text-lg",
};

export default function Button<
	TData = unknown,
	TError = unknown,
	TVariables = void,
>({
	children,
	variant = "primary",
	size = "md",
	fullWidth = false,
	icon,
	iconPosition = "left",
	iconSize = 20,
	loading = false,
	vibrate = true,
	disabled,
	className,
	mutation,
	mutationVariables,
	onClick,
	...props
}: ButtonProps<TData, TError, TVariables>) {
	const isMutationLoading = mutation?.isPending ?? false;
	const isDisabled = disabled || loading || isMutationLoading;
	const isLoading = loading || isMutationLoading;

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (mutation && mutationVariables !== undefined) {
			mutation.mutate(mutationVariables);
		} else if (mutation) {
			// For mutations that don't need variables (TVariables = void)
			mutation.mutate(undefined as TVariables);
		}

		// Also call the custom onClick if provided
		onClick?.(e);

		// Trigger vibration if enabled
		if (vibrate && "vibrate" in navigator) {
			navigator.vibrate(200);
		}
	};

	const buttonClasses = clsx(
		"inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-1",
		variantClasses[variant],
		sizeClasses[size],
		fullWidth && "w-full",
		className,
	);

	return (
		<button
			type="button"
			disabled={isDisabled}
			className={buttonClasses}
			onClick={mutation ? handleClick : onClick}
			{...props}
		>
			{isLoading && (
				<Icon name="loader-2" size={iconSize} className="animate-spin" />
			)}
			{!isLoading && icon && iconPosition === "left" && (
				<Icon name={icon} size={iconSize} />
			)}
			{children}
			{!isLoading && icon && iconPosition === "right" && (
				<Icon name={icon} size={iconSize} />
			)}
		</button>
	);
}
