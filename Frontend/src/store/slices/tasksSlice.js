import { createSlice } from "@reduxjs/toolkit";
import { uid } from "@/lib/uid";

const slice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
  },
  reducers: {
    createTask: {
      reducer(state, { payload }) { state.tasks.push(payload); },
      prepare(input) {
        return {
          payload: {
            id: uid(),
            createdAt: Date.now(),
            status: "Backlog",
            labels: [],
            comments: [],
            subtasks: [],
            history: [],
            attachments: [],
            ...input,
          },
        };
      },
    },
    seedTasks(state, { payload }) {
      payload.forEach(t => {
        if (!state.tasks.find(x => x.id === t.id)) state.tasks.push(t);
      });
    },
    moveTask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.id);
      if (t && t.status !== payload.status) {
        t.history.push({ at: Date.now(), by: payload.by, type: "status_change", from: t.status, to: payload.status });
        t.status = payload.status;
      }
    },
    updateTask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.id);
      if (t) Object.assign(t, payload);
    },
    deleteTask(state, { payload }) {
      state.tasks = state.tasks.filter(t => t.id !== payload);
    },
    addComment(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.taskId);
      if (t) {
        t.comments.push({
          id: uid(),
          authorId: payload.authorId,
          text: payload.text,
          at: Date.now(),
        });
      }
    },
    addSubtask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.taskId);
      if (t) t.subtasks.push({ id: uid(), title: payload.title, done: false });
    },
    toggleSubtask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.taskId);
      if (t) {
        const s = t.subtasks.find(x => x.id === payload.subtaskId);
        if (s) s.done = !s.done;
      }
    },
    submitForReview(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.id);
      if (t) {
        t.status = "In Review";
        t.history.push({ at: Date.now(), by: payload.by, type: "submitted_for_review" });
      }
    },
    approveTask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.id);
      if (t) {
        t.status = "Done";
        t.history.push({ at: Date.now(), by: payload.by, type: "approved" });
      }
    },
    rejectTask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.id);
      if (t) {
        t.status = "In Progress";
        t.history.push({ at: Date.now(), by: payload.by, type: "rejected", note: payload.note });
        if (payload.note) {
          t.comments.push({ id: uid(), authorId: payload.by, text: `Review feedback: ${payload.note}`, at: Date.now() });
        }
      }
    },
    archiveTask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.id);
      if (t) {
        t.archived = true;
        t.archivedAt = Date.now();
        t.history.push({ at: Date.now(), by: payload.by, type: "archived" });
      }
    },
    unarchiveTask(state, { payload }) {
      const t = state.tasks.find(x => x.id === payload.id);
      if (t) {
        t.archived = false;
        t.archivedAt = null;
        t.history.push({ at: Date.now(), by: payload.by, type: "unarchived" });
      }
    },
  },
});

export const {
  createTask, seedTasks, moveTask, updateTask, deleteTask,
  addComment, addSubtask, toggleSubtask,
  submitForReview, approveTask, rejectTask,
  archiveTask, unarchiveTask,
} = slice.actions;
export default slice.reducer;
