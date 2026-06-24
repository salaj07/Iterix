import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { MessageSquare, Send, History, Check, X, AlertCircle, Plus, Square, CheckSquare, Calendar, User } from "lucide-react";
import Modal from "@/components/common/Modal";
import Avatar from "@/components/common/Avatar";
import Button from "@/components/common/Button";
import { Badge, Textarea, Input, Select } from "@/components/common/Primitives";
import { priorityTone, typeTone, formatRelative, formatDate } from "@/lib/format";
import {
  updateTask, addComment, addSubtask, toggleSubtask, moveTask,
  submitForReview, approveTask, rejectTask,
  changeTaskStatusAsync, assignTaskAsync, approveTaskAsync, requestChangesAsync,
  updateTaskDetailsAsync, fetchCommentsAsync, addCommentAsync, deleteTaskAsync,
} from "@/store/slices/tasksSlice";
import { fetchProjectMembers } from "@/store/slices/projectsSlice";
import { PRIORITIES, ROLES } from "@/store/seed";
import { can, ACTIONS } from "@/lib/rbac";

export default function TaskDetailModal({ taskId, onClose }) {
  const dispatch = useDispatch();
  const task = useSelector(s => s.tasks.tasks.find(t => t.id === taskId));
  const members = useSelector(s => s.org.members);
  const projects = useSelector(s => s.projects.projects);
  const sprints = useSelector(s => s.sprints.sprints);
  const user = useSelector(s => s.auth.user);
  const me = members.find(m => m.id === user?.id);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const storeProjectMembers = useSelector(s => s.projects.projectMembers) || [];
  const [comment, setComment] = useState("");
  const [newSub, setNewSub] = useState("");
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [edited, setEdited] = useState({});

  useEffect(() => {
    setEdited({});
    if (taskId) {
      dispatch(fetchCommentsAsync(taskId));
    }
  }, [taskId, dispatch]);

  useEffect(() => {
    if (task?.projectId) {
      dispatch(fetchProjectMembers(task.projectId));
    }
  }, [task?.projectId, dispatch]);

  const hasChanges = Object.keys(edited).length > 0;

  const handleUpdate = async () => {
    if (edited.title !== undefined && !edited.title.trim()) {
      toast.error("Title cannot be empty");
      return;
    }
    const result = await dispatch(updateTaskDetailsAsync({ taskId: task.id, data: edited }));
    if (updateTaskDetailsAsync.fulfilled.match(result)) {
      toast.success("Task updated successfully");
      setEdited({});
    } else {
      toast.error(result.payload?.message || "Failed to update task");
    }
  };

  if (!task) return <Modal open={false} onClose={onClose} />;

  const assignee = members.find(m => m.id === task.assigneeId);
  const reporter = members.find(m => m.id === task.reporterId);
  const project = projects.find(p => p.id === task.projectId);
  const sprint = sprints.find(s => s.id === task.sprintId);
  const projectSprints = (sprints || []).filter(s => s && s.projectId === task.projectId);
  const role = me?.role;
  const projectRole = project?.memberRole || "DEVELOPER";
  const isViewer = projectRole === "VIEWER";
  const isDeveloper = projectRole === "DEVELOPER";
  const isMeAdmin = me?.role === "ADMIN";
  const isMeLead = project?.teamLeadId === user?.id || project?.createdBy === user?.id || (
    (project?.id === currentProjectId || project?._id === currentProjectId) &&
    storeProjectMembers.some(x => (x.id || x.userId || x.user?._id || x.user) === user?.id && x.role === "TEAM_LEAD")
  );
  const isDevRestricted = isViewer || (isDeveloper && !isMeAdmin && !isMeLead);
  const projectMembers = storeProjectMembers.map(pm => {
    const memberUser = pm.user || pm;
    const userId = pm.id || pm.userId || memberUser._id || memberUser.id || pm.user;
    const name = pm.name || memberUser.name || "Unknown";
    const email = pm.email || memberUser.email || "";
    return { id: String(userId), name, email };
  }).filter(m => m.id);
  const isAssignee = task.assigneeId && task.assigneeId === user?.id;
  const canMoveAny = !isViewer && can(role, ACTIONS.MOVE_TASK_ANY);
  const canReview = !isViewer && can(role, ACTIONS.APPROVE_TASK) && task.status === "In Review";
  const canSubmitForReview = !isViewer && task.status === "In Progress" && (canMoveAny || isAssignee);
  const canStartTodo = !isViewer && task.status === "Todo" && (canMoveAny || isAssignee);
  const canPickFromBacklog = !isViewer && task.status === "Backlog" && canMoveAny;
  const canDelete = !isViewer && can(role, ACTIONS.DELETE_TASK);
  const canEditFields = !isViewer && (canMoveAny || isAssignee);

  const submitComment = () => {
    if (!comment.trim()) return;
    dispatch(addCommentAsync({ taskId: task.id, content: comment.trim() }));
    setComment("");
  };

  const addSub = () => {
    if (!newSub.trim()) return;
    const updatedSubtasks = [...(task.subtasks || []), { title: newSub.trim(), done: false }];
    dispatch(updateTaskDetailsAsync({ taskId: task.id, data: { subtasks: updatedSubtasks } }));
    setNewSub("");
  };

  const doApprove = () => {
    dispatch(approveTask({ id: task.id, by: user.id }));
    dispatch(approveTaskAsync(task.id));
  };

  const doReject = () => {
    if (!rejectNote.trim()) return;
    dispatch(rejectTask({ id: task.id, by: user.id, note: rejectNote.trim() }));
    dispatch(requestChangesAsync({ taskId: task.id, note: rejectNote.trim() }));
    setRejectMode(false); setRejectNote("");
  };

  return (
    <Modal open={!!task} onClose={onClose} size="xl"
      title={`${project?.key || "TASK"}-${task.id.slice(0, 4).toUpperCase()}`}>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main */}
        <div className="md:col-span-2 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={typeTone(task.type)} className="border-transparent">{task.type}</Badge>
            <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
            <Badge>{task.status}</Badge>
            {task.points != null && <Badge>{task.points} pts</Badge>}
          </div>

          <input
            disabled={isViewer}
            value={edited.title !== undefined ? edited.title : task.title}
            onChange={(e) => setEdited(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-transparent text-2xl font-display font-bold outline-none border-b border-transparent focus:border-border pb-1 disabled:opacity-80"
          />

          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Description</div>
            <Textarea
              disabled={isViewer}
              value={edited.description !== undefined ? edited.description : (task.description || "")}
              placeholder="Add a description…"
              onChange={(e) => setEdited(prev => ({ ...prev, description: e.target.value }))}
              rows={5}
            />
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Subtasks</div>
              <span className="text-[11px] text-muted-foreground">{task.subtasks.filter(s => s.done).length}/{task.subtasks.length}</span>
            </div>
            <div className="space-y-1.5">
              {task.subtasks.map(s => (
                <button key={s.id} onClick={() => {
                  if (isViewer) return;
                  const updatedSubtasks = (task.subtasks || []).map(sub =>
                    sub.id === s.id ? { ...sub, done: !sub.done } : sub
                  );
                  dispatch(updateTaskDetailsAsync({ taskId: task.id, data: { subtasks: updatedSubtasks } }));
                }}
                  disabled={isViewer}
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-left ${isViewer ? "cursor-default opacity-80" : "hover:bg-foreground/5"}`}>
                  {s.done ? <CheckSquare size={16} className="text-[color:var(--primary)]" /> : <Square size={16} className="text-muted-foreground" />}
                  <span className={`text-sm ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                </button>
              ))}
              {!isViewer && (
                <div className="flex gap-2 mt-2">
                  <Input className="h-9 text-sm" placeholder="Add subtask…" value={newSub} onChange={(e) => setNewSub(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSub()} />
                  <Button variant="outline" size="sm" onClick={addSub}><Plus size={14} /></Button>
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
              <MessageSquare size={12} /> Comments
            </div>
            <div className="space-y-3">
              {task.comments.map(c => {
                const author = members.find(m => m.id === c.authorId);
                const authorName = author?.name || c.authorName || "Unknown";
                return (
                  <div key={c.id} className="flex gap-3">
                    <Avatar name={authorName} color={author?.avatarColor} size={30} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs"><span className="font-semibold">{authorName}</span> <span className="text-muted-foreground">{formatRelative(c.at)}</span></div>
                      <div className="text-sm mt-0.5 whitespace-pre-wrap">{c.text}</div>
                    </div>
                  </div>
                );
              })}
              {!isViewer && (
                <div className="flex gap-3 pt-1">
                  <Avatar name={user?.name} color={user?.avatarColor} size={30} />
                  <div className="flex-1 flex gap-2">
                    <Input className="h-10" placeholder="Add a comment…" value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitComment()} />
                    <Button size="md" onClick={submitComment}><Send size={14} /></Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* History */}
          {task.history.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2"><History size={12} /> Activity</div>
              <ul className="space-y-1.5">
                {task.history.slice().reverse().slice(0, 8).map((h, i) => {
                  const by = members.find(m => m.id === h.by);
                  return (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="text-foreground/80">{by?.name || "Someone"}</span>
                      <span>
                        {h.type === "created" && "created the task"}
                        {h.type === "status_change" && <>moved <b>{h.from}</b> → <b>{h.to}</b></>}
                        {h.type === "submitted_for_review" && "submitted for review"}
                        {h.type === "approved" && "approved this task"}
                        {h.type === "rejected" && "requested changes"}
                      </span>
                      <span className="ml-auto">{formatRelative(h.at)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-flat p-4 space-y-3">
            <Field label="Assignee">
              <Select disabled={isViewer} value={edited.assigneeId !== undefined ? (edited.assigneeId || "") : (task.assigneeId || "")} onChange={(e) => {
                const val = e.target.value || null;
                setEdited(prev => ({ ...prev, assigneeId: val }));
              }}>
                <option value="">Unassigned</option>
                {isDeveloper && (!isMeAdmin || isMeLead) ? (
                  <option value={user?.id}>{user?.name} (You)</option>
                ) : (
                  projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                )}
              </Select>
            </Field>
            <Field label="Priority">
              <Select disabled={isDevRestricted} value={edited.priority !== undefined ? edited.priority : task.priority} onChange={(e) => {
                setEdited(prev => ({ ...prev, priority: e.target.value }));
              }}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </Select>
            </Field>
            <Field label="Story points">
              <Input type="number" disabled={isDevRestricted} value={edited.points !== undefined ? (edited.points ?? "") : (task.points ?? "")} min={0} onChange={(e) => {
                const val = e.target.value === "" ? null : Number(e.target.value);
                setEdited(prev => ({ ...prev, points: val }));
              }} />
            </Field>
            <Field label="Due date">
              <Input type="date" disabled={isDevRestricted}
                value={edited.dueDate !== undefined 
                  ? (edited.dueDate ? new Date(edited.dueDate).toISOString().slice(0,10) : "") 
                  : (task.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : "")}
                onChange={(e) => {
                  const val = e.target.value ? new Date(e.target.value).getTime() : null;
                  setEdited(prev => ({ ...prev, dueDate: val }));
                }} />
            </Field>
            <Field label="Sprint">
              <Select disabled={isViewer} value={edited.sprintId !== undefined ? (edited.sprintId || "") : (task.sprintId || "")} onChange={(e) => {
                const val = e.target.value || null;
                setEdited(prev => ({ ...prev, sprintId: val }));
              }}>
                <option value="">Backlog / Unscheduled</option>
                {projectSprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                ))}
              </Select>
            </Field>
            <Field label="Reporter">
              <div className="flex items-center gap-2 text-sm">
                {reporter && <><Avatar name={reporter.name} color={reporter.avatarColor} size={22} /> <span>{reporter.name}</span></>}
              </div>
            </Field>
          </div>

          {hasChanges && !isViewer && (
            <Button variant="primary" className="w-full flex items-center justify-center gap-1.5" onClick={handleUpdate}>
              Update task
            </Button>
          )}

          <div className="space-y-2">
            {canPickFromBacklog && (
              <Button variant="outline" className="w-full" onClick={() => {
                dispatch(moveTask({ id: task.id, status: "Todo", by: user.id }));
                dispatch(changeTaskStatusAsync({ taskId: task.id, status: "Todo" }));
              }}>
                Move to Todo
              </Button>
            )}
            {canStartTodo && (
              <Button variant="primary" className="w-full" onClick={() => {
                dispatch(moveTask({ id: task.id, status: "In Progress", by: user.id }));
                dispatch(changeTaskStatusAsync({ taskId: task.id, status: "In Progress" }));
              }}>
                Move to In Progress
              </Button>
            )}
            {canSubmitForReview && (
              <Button variant="primary" className="w-full" onClick={() => {
                dispatch(submitForReview({ id: task.id, by: user.id }));
                dispatch(changeTaskStatusAsync({ taskId: task.id, status: "In Review" }));
              }}>
                Move to In Review
              </Button>
            )}
            {canReview && !rejectMode && (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" onClick={doApprove}><Check size={15} /> Approve</Button>
                <Button variant="outline" onClick={() => setRejectMode(true)}><X size={15} /> Reject</Button>
              </div>
            )}
            {canReview && rejectMode && (
              <div className="glass-flat p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs"><AlertCircle size={13} className="text-orange-500" /> Add feedback before rejecting</div>
                <Textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="What needs to change?" rows={3} />
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setRejectMode(false); setRejectNote(""); }}>Cancel</Button>
                  <Button variant="danger" size="sm" onClick={doReject} disabled={!rejectNote.trim()}>Send feedback</Button>
                </div>
              </div>
            )}
            {task.status === "Done" && canMoveAny && (
              <Button variant="outline" className="w-full" onClick={() => {
                dispatch(moveTask({ id: task.id, status: "In Progress", by: user.id }));
                dispatch(changeTaskStatusAsync({ taskId: task.id, status: "In Progress" }));
              }}>
                Reopen task
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" className="w-full text-red-500" onClick={() => { dispatch(deleteTaskAsync(task.id)); onClose(); }}>Delete task</Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}
