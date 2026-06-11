// Tiny helpers used across the app
import { ROLES } from "@/store/seed";

export const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

export const roleLabel = (role) => ({
  [ROLES.ADMIN]: "Admin",
  [ROLES.TEAM_LEAD]: "Team Lead",
  [ROLES.DEVELOPER]: "Developer",
}[role] || role);

export const roleTone = (role) => ({
  [ROLES.ADMIN]: "bg-[color:var(--primary)]/15 text-[color:var(--primary)] border-[color:var(--primary)]/30",
  [ROLES.TEAM_LEAD]: "bg-foreground/8 text-foreground border-foreground/15",
  [ROLES.DEVELOPER]: "bg-foreground/5 text-muted-foreground border-foreground/10",
}[role] || "bg-foreground/5 text-muted-foreground border-foreground/10");

export const priorityTone = (p) => ({
  Low:     "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  Medium:  "text-amber-500 bg-amber-500/10 border-amber-500/20",
  High:    "text-orange-500 bg-orange-500/10 border-orange-500/20",
  Urgent:  "text-red-500 bg-red-500/10 border-red-500/20",
}[p] || "text-muted-foreground bg-foreground/5 border-foreground/10");

export const typeTone = (t) => ({
  Story: "text-blue-500 bg-blue-500/10",
  Task:  "text-cyan-500 bg-cyan-500/10",
  Bug:   "text-red-500 bg-red-500/10",
  Epic:  "text-violet-500 bg-violet-500/10",
}[t] || "text-muted-foreground bg-foreground/5");

export const formatRelative = (ts) => {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
};

export const formatDate = (ts) => ts ? new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "";
