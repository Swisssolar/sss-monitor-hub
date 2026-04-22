import { forwardRef } from "react";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition " +
  "disabled:opacity-50 disabled:pointer-events-none select-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-swiss-ink text-swiss-paper hover:bg-black border border-swiss-ink",
  secondary:
    "bg-transparent text-swiss-ink border border-swiss-line hover:border-swiss-ink",
  ghost: "bg-transparent text-swiss-ink hover:bg-swiss-line/50",
  danger:
    "bg-swiss-red text-white hover:bg-swiss-redDark border border-swiss-red",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-sm",
  md: "h-10 px-4 text-sm rounded-sm",
  lg: "h-12 px-6 text-base rounded-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  href: string;
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  href,
  ...props
}: LinkButtonProps) {
  const external = href.startsWith("http");
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={cls}
        {...props}
      />
    );
  }
  return <Link href={href} className={cls} {...props} />;
}
