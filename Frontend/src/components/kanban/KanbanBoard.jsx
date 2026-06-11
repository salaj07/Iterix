import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { MessageSquare, CheckSquare, Calendar, Plus, Archive } from "lucide-react";
import { toast } from "sonner";
import { moveTask, archiveTask } from "@/store/slices/tasksSlice";
import { openTask } from "@/store/slices/uiSlice";
import { push as pushNotif } from "@/store/slices/notificationsSlice";
import { KANBAN_STATUSES as STATUSES } from "@/store/seed";
import Avatar from "@/components/common/Avatar";
import { Badge } from "@/components/common/Primitives";
import { priorityTone, typeTone, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function KanbanBoard({ projectId = null, onCreateTask }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const allTasks = useSelector(s => s.tasks.tasks);
  const members = useSelector(s => s.org.members);

  const visible = (projectId ? allTasks.filter(t => t.projectId === projectId) : allTasks).filter(t => !t.archived);
  const tasks = visible;
  const grouped = STATUSES.reduce((acc, s) => { acc[s] = tasks.filter(t => t.status === s); return acc; }, {});

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    const oldStatus = source.droppableId;
    dispatch(moveTask({ id: draggableId, status: newStatus, by: user?.id }));

    if (newStatus === "In Review" && oldStatus !== "In Review") {
      const task = tasks.find(t => t.id === draggableId);
      if (task) {
        dispatch(pushNotif({
          userId: task.reporterId,
          type: "review_request",
          title: "Review request",
          body: `${task.title} is ready for review`,
        }));
      }
    }
    if (newStatus === "Done" && oldStatus !== "Done") {
      const task = tasks.find(t => t.id === draggableId);
      if (task && task.assigneeId) {
        dispatch(pushNotif({
          userId: task.assigneeId,
          type: "task_done",
          title: "Task completed",
          body: `${task.title} moved to Done`,
        }));
      }
    }
  };

  const onArchive = (e, taskId, title) => {
    e.stopPropagation();
    dispatch(archiveTask({ id: taskId, by: user?.id }));
    toast.success("Moved to project history", { description: title });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none -mx-4 px-4 md:mx-0 md:px-0">
        {STATUSES.map(status => (
          <Column
            key={status}
            status={status}
            tasks={grouped[status]}
            members={members}
            onCardClick={(id) => dispatch(openTask(id))}
            onAddTask={() => onCreateTask?.(status)}
            onArchive={onArchive}
          />
        ))}
      </div>
    </DragDropContext>
  );
}

function Column({ status, tasks, members, onCardClick, onAddTask, onArchive }) {
  return (
    <div className="w-[85vw] sm:w-[300px] shrink-0 snap-start">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", statusDot(status))} />
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{status}</span>
          <span className="text-[11px] text-muted-foreground bg-foreground/5 rounded-full px-1.5">{tasks.length}</span>
        </div>
        <button onClick={onAddTask} className="p-1 rounded-md hover:bg-foreground/5 text-muted-foreground">
          <Plus size={14} />
        </button>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef} {...provided.droppableProps}
            className={cn(
              "min-h-[200px] p-2 rounded-[16px] transition-colors space-y-2 border",
              snapshot.isDraggingOver
                ? "bg-[color:var(--primary)]/8 border-[color:var(--primary)]/30"
                : "bg-foreground/[0.02] border-transparent"
            )}
          >
            {tasks.map((task, idx) => (
              <Draggable key={task.id} draggableId={task.id} index={idx}>
                {(prov, snap) => (
                  <motion.div
                    ref={prov.innerRef}
                    {...prov.draggableProps} {...prov.dragHandleProps}
                    layout
                    onClick={() => onCardClick(task.id)}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 360, damping: 28 }}
                    className={cn(
                      "group cursor-pointer rounded-[14px] p-3 bg-card border border-border",
                      "backdrop-blur-md transition-shadow",
                      snap.isDragging ? "shadow-[0_20px_40px_rgba(0,0,0,0.2)] rotate-1" : "hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
                    )}
                    style={prov.draggableProps.style}
                    >
                    <TaskCardContent task={task} members={members} />
                    {status === "Done" && (
                      <button
                        onClick={(e) => onArchive(e, task.id, task.title)}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-[11px] font-medium px-2 py-1.5 rounded-[10px] bg-[color:var(--primary)]/10 text-[color:var(--primary)] hover:bg-[color:var(--primary)]/20 transition-colors"
                        title="Move to project history"
                      >
                        <Archive size={12} /> Move to history
                      </button>
                    )}
                  </motion.div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function TaskCardContent({ task, members }) {
  const assignee = members.find(m => m.id === task.assigneeId);
  const subtasksDone = task.subtasks?.filter(s => s.done).length || 0;
  return (
    <>
      <div className="flex items-center justify-between gap-2 mb-2">
        <Badge tone={typeTone(task.type)} className="border-transparent">{task.type}</Badge>
        <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
      </div>
      <h4 className="text-sm font-medium leading-snug line-clamp-2">{task.title}</h4>
      {task.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.slice(0, 3).map(l => (
            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded-md bg-foreground/5 text-muted-foreground">{l}</span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        {task.points != null && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-foreground/5 font-semibold text-foreground/70">{task.points}</span>
        )}
        {task.comments?.length > 0 && (
          <span className="inline-flex items-center gap-1"><MessageSquare size={12} />{task.comments.length}</span>
        )}
        {task.subtasks?.length > 0 && (
          <span className="inline-flex items-center gap-1"><CheckSquare size={12} />{subtasksDone}/{task.subtasks.length}</span>
        )}
        {task.dueDate && (
          <span className="inline-flex items-center gap-1"><Calendar size={12} />{formatDate(task.dueDate)}</span>
        )}
        <div className="ml-auto">
          {assignee ? <Avatar size={22} name={assignee.name} color={assignee.avatarColor} /> :
            <div className="w-[22px] h-[22px] rounded-full border border-dashed border-border" />}
        </div>
      </div>
    </>
  );
}

function statusDot(s) {
  return {
    "Backlog": "bg-foreground/30",
    "Todo": "bg-blue-500",
    "In Progress": "bg-amber-500",
    "In Review": "bg-violet-500",
    "Done": "bg-emerald-500",
  }[s];
}
