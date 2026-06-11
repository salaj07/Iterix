import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export default function Avatar({ name = "", color = "#A79277", size = 28, className }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0",
        className
      )}
      style={{
        width: size, height: size,
        background: color,
        fontSize: Math.max(10, size * 0.4),
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

export function AvatarStack({ members = [], max = 4, size = 26 }) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;
  return (
    <div className="flex items-center">
      {visible.map((m, i) => (
        <div key={m.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
          <Avatar name={m.name} color={m.avatarColor} size={size} className="ring-2 ring-background" />
        </div>
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-semibold bg-foreground/10 text-foreground"
          style={{ width: size, height: size, marginLeft: -8 }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}
