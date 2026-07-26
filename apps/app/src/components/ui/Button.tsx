import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-guava text-white shadow-card hover:bg-guava-dark disabled:bg-guava/50",
  secondary:
    "bg-card text-ink border border-line hover:border-ink/30 disabled:opacity-50",
  ghost: "text-ink-muted hover:text-ink hover:bg-black/[0.04] disabled:opacity-50",
  danger:
    "text-clay border border-clay/30 hover:bg-clay/[0.06] disabled:opacity-40",
};

const sizeClasses: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  sm: "px-3.5 py-1.5 text-xs",
};

const shared =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type LinkButtonProps = CommonProps & {
  href: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps | LinkButtonProps) {
  const classes = cn(shared, variantClasses[variant], sizeClasses[size], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
