import { Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";
import { closeTask } from "@/store/slices/uiSlice";

export default function AppShell() {
  const dispatch = useDispatch();
  const sidebarCollapsed = useSelector(s => s.ui.sidebarCollapsed);
  const taskId = useSelector(s => s.ui.taskModalId);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="p-4 md:p-8 max-w-[1600px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TaskDetailModal taskId={taskId} onClose={() => dispatch(closeTask())} />
    </div>
  );
}
