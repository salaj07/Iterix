import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bell, CheckCheck, MessageSquare, UserPlus, FolderPlus, Check, X, Play, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import { markReadAsync, markAllReadAsync, fetchNotifications, deleteNotificationAsync } from "@/store/slices/notificationsSlice";
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
  const { items, loading } = useSelector((s) => s.notifications);
  const unread = items.filter((i) => !i.read).length;

  // Fetch notifications from API on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkRead = (id) => dispatch(markReadAsync(id));
  const handleMarkAllRead = () => dispatch(markAllReadAsync());
  const handleDelete = (id) => dispatch(deleteNotificationAsync(id));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">{unread} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={unread === 0}>
            Mark all read
          </Button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-muted-foreground" size={22} />
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-3">
              <Bell size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">You're all caught up.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((n) => {
              const id = n._id || n.id;
              const Icon = iconFor(n.type);
              return (
                <li key={id} className="flex items-start gap-3 px-5 py-4 hover:bg-foreground/[0.03]">
                  <button
                    onClick={() => !n.read && handleMarkRead(id)}
                    className="flex-1 flex gap-3 items-start text-left"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.read ? "bg-foreground/5 text-muted-foreground" : "bg-[color:var(--primary)]/15 text-[color:var(--primary)]"}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{n.title || n.message}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.body || n.description}</div>
                    </div>
                    <div className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatRelative(n.at || n.createdAt)}
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-[color:var(--primary)] mt-2 shrink-0" />}
                  </button>
                  <button
                    onClick={() => handleDelete(id)}
                    className="text-muted-foreground hover:text-foreground mt-1 shrink-0"
                    title="Dismiss"
                  >
                    <X size={14} />
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
