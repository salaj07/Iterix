import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard, FolderKanban, Users, ListChecks, Trello, Layers,
  BarChart3, Bell, Settings, Boxes, Mail, ChevronLeft, ChevronRight, X, Sparkles,
} from "lucide-react";
import { toggleSidebar } from "@/store/slices/uiSlice";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/workspaces", label: "Workspaces", icon: Boxes },
  { to: "/app/projects", label: "Projects", icon: FolderKanban },
  { to: "/app/backlog", label: "Backlog", icon: Layers },
  { to: "/app/kanban", label: "Kanban", icon: Trello },
  { to: "/app/sprints", label: "Sprints", icon: ListChecks },
  { to: "/app/teams", label: "Teams", icon: Users },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/notifications", label: "Notifications", icon: Bell },
  { to: "/app/inbox", label: "Email templates", icon: Mail },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function SidebarInner({ collapsed, onCloseMobile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const unread = useSelector(s => s.notifications.items.filter(i => !i.read).length);

  return (
    <div className="h-full flex flex-col bg-[color:var(--sidebar)] backdrop-blur-xl border-r border-[color:var(--sidebar-border)]">
      <div className="h-16 flex items-center px-4 border-b border-[color:var(--sidebar-border)] gap-3">
        <button onClick={() => navigate("/app/dashboard")} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[color:var(--primary)] flex items-center justify-center text-white shrink-0">
            <Sparkles size={16} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }}
                className="font-display font-bold text-[15px] tracking-tight"
              >Iterix</motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          className="ml-auto p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground hidden md:block"
          onClick={() => dispatch(toggleSidebar())}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button className="ml-auto p-1.5 rounded-lg hover:bg-foreground/5 text-muted-foreground md:hidden" onClick={onCloseMobile}>
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const showBadge = item.label === "Notifications" && unread > 0;
          return (
            <NavLink
              key={item.to} to={item.to} onClick={onCloseMobile}
              className={({ isActive }) => cn(
                "group relative flex items-center gap-3 px-3 h-10 rounded-[12px] text-sm font-medium transition-colors",
                isActive
                  ? "bg-[color:var(--sidebar-accent)] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-pill"
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[color:var(--primary)]"
                    />
                  )}
                  <Icon size={18} className="shrink-0" />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                        className="truncate"
                      >{item.label}</motion.span>
                    )}
                  </AnimatePresence>
                  {showBadge && !collapsed && (
                    <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)]">
                      {unread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

    </div>
  );
}

export default function Sidebar({ collapsed, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 76 : 248 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="hidden md:block shrink-0 h-screen sticky top-0 z-30"
      >
        <SidebarInner collapsed={collapsed} />
      </motion.aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onCloseMobile}
            />
            <motion.aside
              className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px]"
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
            >
              <SidebarInner collapsed={false} onCloseMobile={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
