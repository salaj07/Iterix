import { configureStore } from "@reduxjs/toolkit";
import auth from "./slices/authSlice";
import theme from "./slices/themeSlice";
import workspace from "./slices/workspaceSlice";
import org from "./slices/orgSlice";
import projects from "./slices/projectsSlice";
import sprints from "./slices/sprintsSlice";
import tasks from "./slices/tasksSlice";
import notifications from "./slices/notificationsSlice";
import ui from "./slices/uiSlice";
import { loadState, saveState } from "./persist";

const preloaded = loadState();

export const store = configureStore({
  reducer: { auth, theme, workspace, org, projects, sprints, tasks, notifications, ui },
  preloadedState: preloaded,
});

let saveTimer;
store.subscribe(() => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(store.getState()), 200);
});
