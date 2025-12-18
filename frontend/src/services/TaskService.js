import { api } from "./AuthService";

const TaskService = {
  // Get team members
  getTeamMembers: async () => {
    try {
      console.log(" Fetching team members...");
      const response = await api.get("/tasks/team-members");
      console.log(
        " Team members fetched:",
        response.data?.users?.length || 0,
        "members"
      );
      return response.data?.users || [];
    } catch (error) {
      console.error(" Error fetching team members:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Message:", error.message);

      // Return empty array if error
      return [];
    }
  },

  // Get all tasks
  getTasks: async () => {
    try {
      console.log(" Fetching tasks...");
      const response = await api.get("/tasks");
      console.log("Tasks fetched:", response.data?.tasks?.length || 0, "tasks");
      return response.data?.tasks || [];
    } catch (error) {
      console.error(" Error fetching tasks:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Message:", error.message);
      throw error;
    }
  },

  // In TaskService.js, update createTask for "all" support
  createTask: async (taskData) => {
    try {
      console.log(" Creating task:", {
        title: taskData.title,
        assigneeType: taskData.assigneeType || "private",
        isForAll: taskData.assignee === "all",
        assignee: taskData.assignee,
      });

      const response = await api.post("/tasks", taskData);

      const message =
        response.data.visibility === "all"
          ? "Task created and visible to ALL team members!"
          : response.data.visibility === "user"
          ? "Task created and shared with assignee!"
          : "Task created (private)";

      console.log("", message);

      return response.data.task;
    } catch (error) {
      console.error(" Error creating task:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Message:", error.message);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (taskId, status) => {
    try {
      console.log(" Updating task status:", taskId, "->", status);
      const response = await api.patch(`/tasks/${taskId}/status`, { status });
      return response.data.task;
    } catch (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
  },

  // Update task
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data.task;
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  // Add comment to task
  addComment: async (taskId, comment) => {
    try {
      const response = await api.post(`/tasks/${taskId}/comments`, {
        text: comment,
      });
      return response.data.comments;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  },
};

export default TaskService;
