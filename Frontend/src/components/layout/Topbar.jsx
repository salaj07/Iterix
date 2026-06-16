import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sun, Moon, Bell, Menu, ChevronDown, LogOut, User, Check } from "lucide-react";
import { toggleTheme } from "@/store/slices/themeSlice";
import { logout } from "@/store/slices/authSlice";
import Avatar from "@/components/common/Avatar";
import { formatRelative } from "@/lib/format";
import { markReadAsync } from "@/store/slices/notificationsSlice";
import { openSearch } from "@/store/slices/uiSlice";

function useClickOutside(cb) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) cb(); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [cb]);
  return ref;
}

export default function Topbar({ onOpenMobileSidebar }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const mode = useSelector(s => s.theme.mode);
  const user = useSelector(s => s.auth.user);
  const notifs = useSelector(s => s.notifications.items) || [];
  const unread = notifs.filter(n => n && !n.read).length;

  const [notifOpen, setNotifOpen] = useState(false);
  const [profOpen, setProfOpen] = useState(false);

  const notifRef = useClickOutside(() => setNotifOpen(false));
  const profRef = useClickOutside(() => setProfOpen(false));

  return (
    <header className="h-16 sticky top-0 z-20 bg-background/70 backdrop-blur-xl border-b border-border flex items-center gap-3 px-4 md:px-6">
      <button className="md:hidden p-2 -ml-1 rounded-lg hover:bg-foreground/5" onClick={onOpenMobileSidebar}>
        <Menu size={20} />
      </button>

      <button 
        onClick={() => dispatch(openSearch())}
        className="hidden md:flex relative max-w-md flex-1 ml-2 items-center text-left text-muted-foreground bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-border/50 h-10 px-3 pl-10 rounded-xl transition-all"
      >
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <span className="text-xs font-normal">Search tasks, projects, members...</span>
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground bg-foreground/5 px-1.5 py-0.5 rounded font-mono font-medium">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => dispatch(toggleTheme())}
          className="p-2.5 rounded-[12px] hover:bg-foreground/5 text-muted-foreground"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mode}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="inline-block"
            >
              {mode === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(o => !o)} className="relative p-2.5 rounded-[12px] hover:bg-foreground/5 text-muted-foreground">
            <Bell size={17} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold px-1 py-0.5 rounded-full bg-[color:var(--primary)] text-white scale-75 ring-2 ring-background">
                {unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-12 w-[calc(100vw-1.5rem)] max-w-[340px] sm:w-[340px] glass-strong p-2 z-50 max-h-[420px] overflow-y-auto"
              >
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="font-semibold text-sm">Notifications ({unread})</span>
                  <button onClick={() => { setNotifOpen(false); navigate("/app/notifications"); }} className="text-xs text-[color:var(--primary)] font-medium">View all</button>
                </div>
                {notifs.filter(n => n && !n.read).length === 0 && (
                  <div className="text-center py-10 text-sm text-muted-foreground">You're all caught up</div>
                )}
                {notifs.filter(n => n && !n.read).slice(0, 5).map(n => (
                  <div key={n.id} className="group/item relative w-full text-left px-3 py-2.5 rounded-lg hover:bg-foreground/5 flex gap-3 items-start">
                    <div className="w-2 h-2 mt-1.5 rounded-full shrink-0 bg-[color:var(--primary)]" />
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="text-xs font-semibold text-foreground truncate">{n.title}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message || n.body}</div>
                      <div className="text-[9px] text-muted-foreground mt-1">{formatRelative(n.createdAt || n.at)}</div>
                    </div>
                    <button
                      onClick={() => dispatch(markReadAsync(n.id))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-foreground/10 text-muted-foreground hover:text-foreground opacity-0 group-hover/item:opacity-100 transition-opacity"
                      title="Mark as read"
                    >
                      <Check size={13} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative ml-1" ref={profRef}>
          <button onClick={() => setProfOpen(o => !o)} className="flex items-center gap-2 p-1 pr-2 rounded-[12px] hover:bg-foreground/5">
            <Avatar name={user?.name} color={user?.avatarColor} size={30} />
            <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
          </button>
          <AnimatePresence>
            {profOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-12 w-64 glass-strong p-2 z-50"
              >
                <div className="px-3 py-2.5 flex items-center gap-3">
                  <Avatar name={user?.name} color={user?.avatarColor} size={38} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{user?.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
                  </div>
                </div>
                <div className="h-px bg-border my-1" />
                <button onClick={() => { setProfOpen(false); navigate("/app/settings"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-foreground/5 text-sm">
                  <User size={15} className="text-muted-foreground" /> Profile & Settings
                </button>
                <button onClick={() => { dispatch(logout()); navigate("/login"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-foreground/5 text-sm text-red-500">
                  <LogOut size={15} /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
