import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { Input, Label, Select, Textarea } from "@/components/common/Primitives";
import { createTaskAsync } from "@/store/slices/tasksSlice";
import { push as pushNotif } from "@/store/slices/notificationsSlice";
import { PRIORITIES, TASK_TYPES, STATUSES } from "@/store/seed";

export default function CreateTaskModal({ open, onClose, projectId, defaultStatus = "Backlog", defaultSprintId = undefined }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const projects = useSelector(s => s.projects.projects);
  const sprints = useSelector(s => s.sprints.sprints);
  const members = useSelector(s => s.org.members);
  const me = members.find(m => m.id === user?.id);
  const currentProjectId = useSelector(s => s.projects.currentProjectId);
  const storeProjectMembers = useSelector(s => s.projects.projectMembers) || [];
  const [type, setType] = useState("Task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [points, setPoints] = useState(3);
  const [status, setStatus] = useState(defaultStatus);
  const [assigneeId, setAssigneeId] = useState("");
  const [proj, setProj] = useState(projectId || projects[0]?.id || "");
  const [sprintId, setSprintId] = useState("");

  const projectSprints = sprints.filter(s => s && s.projectId === proj);
  const selectedProject = projects.find(p => p.id === proj);
  const isDeveloper = selectedProject && selectedProject.memberRole === "DEVELOPER";
  const isMeAdmin = me?.role === "ADMIN";
  const isMeLead = selectedProject?.teamLeadId === user?.id || selectedProject?.createdBy === user?.id || (
    (selectedProject?.id === currentProjectId || selectedProject?._id === currentProjectId) &&
    storeProjectMembers.some(x => (x.id || x.userId || x.user?._id || x.user) === user?.id && x.role === "TEAM_LEAD")
  );
  const projectMembers = members.filter(m => {
    const isMember = selectedProject?.memberIds?.includes(m.id) || m.id === selectedProject?.createdBy;
    if (!isMember) return false;
    if (m.role !== "ADMIN") return true;

    if (selectedProject?.teamLeadId === m.id || selectedProject?.createdBy === m.id) {
      return true;
    }
    if (selectedProject?.id === currentProjectId || selectedProject?._id === currentProjectId) {
      const pm = storeProjectMembers.find(x => (x.id || x.userId || x.user?._id || x.user) === m.id);
      if (pm && pm.role === "TEAM_LEAD") {
        return true;
      }
    }
    return false;
  });

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

      // Default to passed defaultSprintId, or active sprint of the selected project, or backlog
      const activeSprint = sprints.find(s => s.projectId === (projectId || projects[0]?.id) && s.status === "active");
      if (defaultSprintId !== undefined) {
        setSprintId(defaultSprintId === "backlog" ? "" : defaultSprintId);
      } else {
        setSprintId(activeSprint?.id || "");
      }
    }
  }, [open, defaultStatus, projectId, projects, defaultSprintId, sprints]);

  // Sync sprint default when project dropdown is manually changed in the modal
  useEffect(() => {
    if (open && proj) {
      const activeSprint = sprints.find(s => s.projectId === proj && s.status === "active");
      setSprintId(activeSprint?.id || "");
    }
  }, [proj, open, sprints]);

  const submit = () => {
    if (!title.trim() || !proj) return;
    dispatch(createTaskAsync({
      title: title.trim(), description, type, priority,
      points: Number(points), status,
      projectId: proj, sprintId: sprintId || null,
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
            <Label>Sprint</Label>
            <Select className="mt-1.5" value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
              <option value="">Backlog / Unscheduled</option>
              {projectSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Assignee</Label>
            <Select className="mt-1.5" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
              <option value="">Unassigned</option>
              {isDeveloper && (!isMeAdmin || isMeLead) ? (
                <option value={user?.id}>{user?.name} (You)</option>
              ) : (
                projectMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
              )}
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select className="mt-1.5" disabled={isDeveloper} value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Story points</Label>
            <Input className="mt-1.5" type="number" disabled={isDeveloper} min={0} value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
