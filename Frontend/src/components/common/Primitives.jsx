import { cn } from "@/lib/utils";

export function GlassCard({ className, children, strong = false, ...props }) {
  return (
    <div
      className={cn(strong ? "glass-strong" : "glass", "p-5", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Badge({ children, className, tone }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
      tone || "bg-foreground/5 text-muted-foreground border-foreground/10",
      className
    )}>
      {children}
    </span>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[12px] px-3.5 bg-foreground/[0.04] border border-border",
        "text-foreground placeholder:text-muted-foreground/70",
        "outline-none focus:border-[color:var(--primary)]/50 focus:ring-2 focus:ring-[color:var(--primary)]/20",
        "transition-colors",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[12px] px-3.5 py-2.5 bg-foreground/[0.04] border border-border",
        "text-foreground placeholder:text-muted-foreground/70 min-h-[88px]",
        "outline-none focus:border-[color:var(--primary)]/50 focus:ring-2 focus:ring-[color:var(--primary)]/20",
        "transition-colors resize-y",
        className
      )}
      {...props}
    />
  );
}

export function Label({ children, className, ...props }) {
  return (
    <label className={cn("text-xs font-medium text-muted-foreground", className)} {...props}>
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "select-glass h-11 w-full rounded-[12px] px-3 pr-9 border border-border text-foreground appearance-none",
        "outline-none focus:border-[color:var(--primary)]/50 focus:ring-2 focus:ring-[color:var(--primary)]/20",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-[10px] bg-foreground/[0.06]", className)} />;
}

export function Divider({ className }) {
  return <div className={cn("h-px bg-border w-full", className)} />;
}
