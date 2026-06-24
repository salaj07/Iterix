import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCurrentWorkspace } from "@/store/slices/workspaceSlice";
import { setCurrentProjectId } from "@/store/slices/projectsSlice";
import { openTask } from "@/store/slices/uiSlice";
import { markReadAsync } from "@/store/slices/notificationsSlice";

export function useNotificationRedirect() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRedirect = async (notification) => {
    if (!notification) return;

    // 1. Mark as read if not already read
    if (!notification.read) {
      dispatch(markReadAsync(notification.id || notification._id));
    }

    const { type, projectId, taskId, workspaceId } = notification;

    // 2. Select the correct workspace if provided
    if (workspaceId) {
      dispatch(setCurrentWorkspace(workspaceId));
    }

    // 3. Select the correct project if provided
    if (projectId) {
      dispatch(setCurrentProjectId(projectId));
    }

    // 4. Open the task detail modal if a taskId is provided
    if (taskId) {
      dispatch(openTask(taskId));
    }

    // 5. Navigate based on notification type
    const normalizedType = type?.toUpperCase();
    const titleUpper = notification.title?.toUpperCase() || "";

    if (titleUpper.includes("JOIN REQUEST RECEIVED") || normalizedType === "MEMBER_JOINED") {
      navigate("/app/workspace-members");
    } else if (normalizedType === "INVITATION") {
      navigate("/app/workspaces");
    } else if (normalizedType === "PROJECT_ASSIGNED") {
      if (projectId) {
        navigate(`/app/projects/${projectId}`);
      } else {
        navigate("/app/projects");
      }
    } else if (
      normalizedType === "TASK_ASSIGNED" ||
      normalizedType === "TASK_APPROVED" ||
      normalizedType === "TASK_REJECTED" ||
      normalizedType === "COMMENT" ||
      normalizedType === "SPRINT" ||
      normalizedType === "REVIEW_REQUEST" ||
      normalizedType === "TASK_DONE"
    ) {
      // Navigate to Kanban page. Since currentProjectId was updated, 
      // the KanbanPage will automatically render the tasks for this project.
      navigate("/app/kanban");
    } else {
      // General fallbacks
      if (projectId) {
        navigate(`/app/projects/${projectId}`);
      } else {
        navigate("/app/dashboard");
      }
    }
  };

  return handleRedirect;
}
