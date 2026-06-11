import { useDispatch, useSelector } from "react-redux";
import { Bell, CheckCheck, MessageSquare, UserPlus, FolderPlus, Check, X, Play } from "lucide-react";
import { GlassCard } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import { markRead, markAllRead, clearAll } from "@/store/slices/notificationsSlice";
import { formatRelative } from "@/lib/format";

const iconFor = (type) => ({
  task_assigned: UserPlus,
  task_approved: Check,
  task_rejected: X,
  sprint_started: Play,
  comment: MessageSquare,
  review_request: Bell,
  task_done: CheckCheck,
  project_assigned: FolderPlus,
}[type] || Bell);

export default function Notifications() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const items = useSelector(s => s.notifications.items.filter(n => n.userId === user?.id));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{items.filter(i => !i.read).length} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => dispatch(markAllRead(user.id))}>Mark all read</Button>
          <Button variant="ghost" size="sm" onClick={() => dispatch(clearAll(user.id))}>Clear all</Button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-3"><Bell size={18} className="text-muted-foreground" /></div>
            <p className="text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map(n => {
              const Icon = iconFor(n.type);
              return (
                <li key={n.id}>
                  <button onClick={() => dispatch(markRead(n.id))} className="w-full text-left flex gap-3 items-start px-5 py-4 hover:bg-foreground/[0.03]">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.read ? "bg-foreground/5 text-muted-foreground" : "bg-[color:var(--primary)]/15 text-[color:var(--primary)]"}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">{formatRelative(n.at)}</div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[color:var(--primary)] mt-2" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
