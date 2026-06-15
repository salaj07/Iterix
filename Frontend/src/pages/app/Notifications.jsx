import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bell, CheckCheck, MessageSquare, UserPlus, FolderPlus, Check, X, Play, Loader2, Mail } from "lucide-react";
import { GlassCard } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import { markReadAsync, markAllReadAsync, fetchNotifications, deleteNotificationAsync } from "@/store/slices/notificationsSlice";
import { fetchMyInvitations, acceptInvitationAsync } from "@/store/slices/orgSlice";
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";
import { formatRelative, roleLabel } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  const { items, loading } = useSelector((s) => s.notifications) || { items: [], loading: false };
  const myInvitations = useSelector((s) => s.org.myInvitations) || [];
  const [activeTab, setActiveTab] = useState("unread");
  const unread = (items || []).filter((i) => i && !i.read).length;

  const NotificationSkeleton = () => (
    <div className="flex items-center justify-between gap-3 px-5 py-4 animate-pulse">
      <div className="flex-1 flex gap-3 items-start min-w-0">
        <div className="w-9 h-9 rounded-full bg-foreground/10 shrink-0" />
        <div className="flex-1 min-w-0 pr-4">
          <div className="h-4 w-32 bg-foreground/10 rounded" />
          <div className="h-3 w-48 bg-foreground/10 rounded mt-1.5" />
          <div className="h-2.5 w-16 bg-foreground/10 rounded mt-2" />
        </div>
      </div>
      <div className="h-8 w-16 bg-foreground/10 rounded-md shrink-0" />
    </div>
  );

  // Fetch notifications and workspace invitations from API on mount
  useEffect(() => {
    dispatch(fetchNotifications());
    dispatch(fetchMyInvitations());
  }, [dispatch]);

  const handleMarkRead = (id) => dispatch(markReadAsync(id));
  const handleMarkAllRead = () => dispatch(markAllReadAsync());
  const handleDelete = (id) => dispatch(deleteNotificationAsync(id));

  const handleAcceptInvite = async (inviteId) => {
    const result = await dispatch(acceptInvitationAsync(inviteId));
    if (acceptInvitationAsync.fulfilled.match(result)) {
      toast.success("Joined workspace successfully!");
      dispatch(fetchWorkspaces());
      dispatch(fetchMyInvitations());
    } else {
      toast.error(result.payload?.message || "Failed to join workspace");
    }
  };

  const pendingInvites = myInvitations.filter(inv => inv && inv.status === "pending");
  const unreadItems = items.filter(n => n && !n.read);
  const readItems = items.filter(n => n && n.read);
  const displayedItems = activeTab === "unread" ? unreadItems : readItems;

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

      {pendingInvites.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
            <Mail size={13} /> Workspace Invitations
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pendingInvites.map((inv) => (
              <GlassCard key={inv.id} className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{inv.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Role: {roleLabel(inv.role)}</div>
                </div>
                <Button size="sm" onClick={() => handleAcceptInvite(inv.id)}>
                  Join
                </Button>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("unread")}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "unread" ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Unread ({unreadItems.length})
          {activeTab === "unread" && (
            <motion.span
              layoutId="notifications-active-tab"
              className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[color:var(--primary)] rounded-full"
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("read")}
          className={cn(
            "relative px-4 py-2.5 text-sm font-medium transition-colors",
            activeTab === "read" ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Archive / Read ({readItems.length})
          {activeTab === "read" && (
            <motion.span
              layoutId="notifications-active-tab"
              className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[color:var(--primary)] rounded-full"
            />
          )}
        </button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        {loading && displayedItems.length === 0 ? (
          <div className="divide-y divide-border">
            <NotificationSkeleton />
            <NotificationSkeleton />
            <NotificationSkeleton />
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-3">
              <Bell size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {activeTab === "unread" ? "You're all caught up." : "No notifications in archive."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {displayedItems.map((n) => {
              const id = n._id || n.id;
              const Icon = iconFor(n.type);
              return (
                <li key={id} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-foreground/[0.02]">
                  <div className="flex-1 flex gap-3 items-start text-left min-w-0">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.read ? "bg-foreground/5 text-muted-foreground" : "bg-[color:var(--primary)]/15 text-[color:var(--primary)]"}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="text-sm font-medium text-foreground">{n.title || n.message}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{n.body || n.description}</div>
                      <div className="text-[10px] text-muted-foreground mt-1.5">
                        {formatRelative(n.at || n.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => handleMarkRead(id)}
                        className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-[color:var(--primary)]"
                        title="Mark as read"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hover:text-red-500"
                      title="Dismiss"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
