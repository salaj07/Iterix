import { useState } from "react";
import { useSelector } from "react-redux";
import { Mail, Check, X, Bell, FolderPlus, UserPlus, ListChecks } from "lucide-react";
import { GlassCard } from "@/components/common/Primitives";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  { id: "invite", icon: UserPlus, subject: "You're invited to join Acme Studio on Iterix", title: "Organization Invitation" },
  { id: "project", icon: FolderPlus, subject: "You've been added to Atlas Web Platform", title: "Project Assignment" },
  { id: "task", icon: ListChecks, subject: "New task assigned to you: Polish onboarding states", title: "Task Assignment" },
  { id: "approved", icon: Check, subject: "Your task was approved 🎉", title: "Review Approved" },
  { id: "rejected", icon: X, subject: "Changes requested on your task", title: "Review Rejected" },
  { id: "digest", icon: Bell, subject: "Your weekly Iterix activity", title: "Activity Digest" },
];

export default function Inbox() {
  const [active, setActive] = useState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find(t => t.id === active);
  const user = useSelector(s => s.auth.user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Email templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Preview the transactional emails your team receives.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        <GlassCard className="lg:col-span-4 p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {TEMPLATES.map(t => {
              const Ic = t.icon;
              return (
                <li key={t.id}>
                  <button onClick={() => setActive(t.id)}
                    className={cn("w-full text-left flex gap-3 px-4 py-3 hover:bg-foreground/[0.04]", active === t.id && "bg-foreground/[0.04]")}>
                    <div className="w-9 h-9 rounded-full bg-[color:var(--primary)]/12 text-[color:var(--primary)] flex items-center justify-center shrink-0"><Ic size={14} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{t.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{t.subject}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <div className="lg:col-span-8">
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-foreground/[0.02]">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={13} /> noreply@Iterix.app
              </div>
              <div className="mt-1 text-sm font-semibold">{tpl.subject}</div>
              <div className="text-xs text-muted-foreground">to {user?.email || "you@company.com"}</div>
            </div>
            <EmailBody id={tpl.id} user={user} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function EmailBody({ id, user }) {
  const Btn = ({ children }) => (
    <a className="inline-block mt-5 px-5 py-2.5 rounded-[10px] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] text-sm font-medium">{children}</a>
  );
  const Shell = ({ children }) => (
    <div className="p-6 md:p-10 bg-[color:var(--popover)] text-[color:var(--popover-foreground)] min-h-[420px]">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-[8px] bg-[color:var(--primary)] flex items-center justify-center text-white font-bold text-sm">F</div>
          <span className="font-display font-bold">Iterix</span>
        </div>
        {children}
        <div className="mt-10 pt-6 border-t border-border text-[11px] text-muted-foreground">
          Sent by Iterix · You're receiving this because you have an account.
        </div>
      </div>
    </div>
  );

  switch (id) {
    case "invite": return <Shell>
      <h2 className="font-display text-xl font-bold mb-3">You've been invited</h2>
      <p className="text-sm leading-relaxed">Hi {user?.name?.split(" ")[0] || "there"}, <b>Maya Lindgren</b> has invited you to join <b>Acme Studio</b> on Iterix as a <b>Project Lead</b>.</p>
      <Btn>Accept invitation</Btn>
    </Shell>;
    case "project": return <Shell>
      <h2 className="font-display text-xl font-bold mb-3">You're on a new project</h2>
      <p className="text-sm">You've been added to <b>Atlas Web Platform</b>. The current sprint is <b>Sprint 14 — Polish week</b>.</p>
      <Btn>Open project</Btn>
    </Shell>;
    case "task": return <Shell>
      <h2 className="font-display text-xl font-bold mb-3">A task is waiting for you</h2>
      <div className="mt-3 p-4 rounded-[12px] border border-border bg-foreground/[0.03] text-sm">
        <div className="text-[11px] text-muted-foreground">ATL-204 · Story · 5 pts</div>
        <div className="font-semibold mt-1">Polish onboarding empty states</div>
      </div>
      <Btn>View task</Btn>
    </Shell>;
    case "approved": return <Shell>
      <h2 className="font-display text-xl font-bold mb-3">Your task was approved</h2>
      <p className="text-sm">Great work — <b>Kanban drag-and-drop polish</b> has been moved to <b>Done</b>.</p>
      <Btn>See activity</Btn>
    </Shell>;
    case "rejected": return <Shell>
      <h2 className="font-display text-xl font-bold mb-3">Changes requested</h2>
      <p className="text-sm">Your task <b>Sprint velocity chart</b> needs a small tweak before merging.</p>
      <div className="mt-3 p-4 rounded-[12px] border border-border bg-foreground/[0.03] text-sm italic text-muted-foreground">"Please adjust the date range, it's still showing the previous sprint."</div>
      <Btn>Re-open task</Btn>
    </Shell>;
    case "digest": return <Shell>
      <h2 className="font-display text-xl font-bold mb-3">This week on Atlas</h2>
      <ul className="text-sm space-y-2">
        <li>• <b>12</b> tasks completed</li>
        <li>• <b>4</b> tasks moved to In Review</li>
        <li>• <b>3</b> comments needing your reply</li>
      </ul>
      <Btn>Open Iterix</Btn>
    </Shell>;
    default: return null;
  }
}
