import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Input, Label, Select, Textarea } from "@/components/common/Primitives";
import { createTaskAsync } from "@/store/slices/tasksSlice";
import { push as pushNotif } from "@/store/slices/notificationsSlice";
import { PRIORITIES, TASK_TYPES, STATUSES } from "@/store/seed";

export default function CreateTaskModal({ open, onClose, projectId, defaultStatus = "Backlog" }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const projects = useSelector(s => s.projects.projects);
  const sprints = useSelector(s => s.sprints.sprints);
  const members = useSelector(s => s.org.members);
  const [type, setType] = useState("Task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [points, setPoints] = useState(3);
  const [status, setStatus] = useState(defaultStatus);
  const [assigneeId, setAssigneeId] = useState("");
  const [proj, setProj] = useState(projectId || projects[0]?.id || "");
  const sprintForProj = sprints.find(s => s.projectId === proj && s.status === "active");
  const selectedProject = projects.find(p => p.id === proj);
  const isDeveloper = selectedProject && selectedProject.memberRole === "DEVELOPER";

  useEffect(() => {
    if (open) {
      setStatus(defaultStatus);
      setType("Task");
      setTitle("");
      setDescription("");
      setPriority("Medium");
      setPoints(3);
      setAssigneeId("");
      setProj(projectId || projects[0]?.id || "");
    }
  }, [open, defaultStatus, projectId, projects]);

  const submit = () => {
    if (!title.trim() || !proj) return;
    dispatch(createTaskAsync({
      title: title.trim(), description, type, priority,
      points: Number(points), status,
      projectId: proj, sprintId: sprintForProj?.id || null,
      assigneeId: assigneeId || null, reporterId: user.id,
    }));
    if (assigneeId && assigneeId !== user.id) {
      dispatch(pushNotif({ userId: assigneeId, type: "task_assigned", title: "Task assigned", body: `${user.name} assigned you "${title.trim()}"` }));
    }
    setTitle(""); setDescription(""); setAssigneeId("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create task" size="md"
      footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={!title.trim() || !proj}>Create task</Button></div>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Type</Label><Select className="mt-1.5" value={type} onChange={(e) => setType(e.target.value)}>{TASK_TYPES.map(t => <option key={t}>{t}</option>)}</Select></div>
          <div><Label>Status</Label><Select className="mt-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</Select></div>
        </div>
        <div><Label>Title</Label><Input className="mt-1.5" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short, action-oriented summary" /></div>
        <div><Label>Description</Label><Textarea className="mt-1.5" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Add context, links, acceptance criteria…" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Project</Label><Select className="mt-1.5" value={proj} onChange={(e) => setProj(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
          <div>
            <Label>Assignee</Label>
            <Select className="mt-1.5" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {isDeveloper ? (
                <option value={user?.id}>{user?.name} (You)</option>
              ) : (
                members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
              )}
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select className="mt-1.5" disabled={isDeveloper} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div>
            <Label>Story points</Label>
            <Input className="mt-1.5" type="number" disabled={isDeveloper} min={0} value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
