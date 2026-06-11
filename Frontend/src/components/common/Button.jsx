import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Premium tactile button with text-slide-up + scale press effect.
 * variants: primary | ghost | outline | subtle
 */
export default function Button({
  children, variant = "primary", size = "md", className,
  asMotion = true, ...props
}) {
  const sizes = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-5 text-base gap-2.5",
    icon: "h-9 w-9",
  };
  const variants = {
    primary: "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] hover:opacity-95 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_color-mix(in_oklab,var(--primary)_20%,transparent)]",
    ghost:   "bg-transparent text-foreground hover:bg-foreground/5",
    outline: "border border-border bg-card text-foreground hover:bg-foreground/5",
    subtle:  "bg-foreground/5 text-foreground hover:bg-foreground/10",
    danger:  "bg-destructive text-destructive-foreground hover:opacity-95",
  };
  const Comp = asMotion ? motion.button : "button";
  return (
    <Comp
      whileTap={asMotion ? { scale: 0.97 } : undefined}
      whileHover={asMotion ? { y: -1 } : undefined}
      transition={asMotion ? { type: "spring", stiffness: 380, damping: 26 } : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-[12px] font-medium select-none whitespace-nowrap",
        "transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none",
        sizes[size], variants[variant], className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
