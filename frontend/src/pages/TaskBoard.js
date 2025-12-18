import React from "react";
import { Row, Button, Alert, Spinner } from "react-bootstrap";
import { FaSyncAlt, FaExclamationTriangle } from "react-icons/fa";
import TaskColumn from "../components/TaskColumn";
import TaskModal from "../components/TaskModal";
import TaskService from "../services/TaskService";
import { useSocket } from "../services/SocketService";

function TaskBoard({ user }) {
  const [tasks, setTasks] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState(null);
  const [teamMembers, setTeamMembers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const { socket, emitTaskCreate, emitTaskUpdate, emitTaskDelete } =
    useSocket();

  React.useEffect(() => {
    fetchInitialData();

    // Socket event listeners
    if (socket) {
      const handleTaskCreated = (task) => {
        setTasks((prev) => {
          const exists = prev.find((t) => t._id === task._id);
          if (!exists) {
            return [...prev, task];
          }
          return prev;
        });
      };

      const handleTaskUpdated = (updatedTask) => {
        setTasks((prev) =>
          prev.map((task) =>
            task._id === updatedTask._id ? updatedTask : task
          )
        );
      };

      const handleTaskDeleted = (taskId) => {
        setTasks((prev) => prev.filter((task) => task._id !== taskId));
      };

      socket.on("taskCreated", handleTaskCreated);
      socket.on("taskUpdated", handleTaskUpdated);
      socket.on("taskDeleted", handleTaskDeleted);

      return () => {
        socket.off("taskCreated", handleTaskCreated);
        socket.off("taskUpdated", handleTaskUpdated);
        socket.off("taskDeleted", handleTaskDeleted);
      };
    }
  }, [socket]);

  const fetchInitialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [tasksData, teamData] = await Promise.all([
        TaskService.getTasks(),
        TaskService.getTeamMembers(),
      ]);
      setTasks(tasksData);
      setTeamMembers(teamData);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchInitialData();
  };

  const handleCreateTask = async (taskData) => {
    try {
      const newTask = await TaskService.createTask(taskData);
      setShowModal(false);
      emitTaskCreate(newTask);
    } catch (error) {
      console.error("Error creating task:", error);
      setError("Failed to create task. Please try again.");
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const updatedTask = await TaskService.updateTask(
        selectedTask._id,
        taskData
      );
      setShowModal(false);
      setSelectedTask(null);
      emitTaskUpdate(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await TaskService.deleteTask(taskId);
        emitTaskDelete(taskId);
      } catch (error) {
        console.error("Error deleting task:", error);
        setError("Failed to delete task. Please try again.");
      }
    }
  };
  // In TaskBoard.js, add this test function
  const createTestAllUsersTask = async () => {
    const testTask = {
      title: `🌍 Task for Everyone - ${new Date().toLocaleTimeString()}`,
      description: "This task should appear in ALL team members' boards",
      status: "todo",
      priority: "medium",
      assignee: "all",
      assigneeType: "all",
      deadline: null,
      tags: ["announcement", "team", "all"],
    };

    console.log("🌍 Creating task for ALL users:", testTask);

    try {
      const newTask = await TaskService.createTask(testTask);
      console.log("✅ Task for all users created:", newTask);

      alert(`Task created and visible to ALL team members!
    
This task will appear in EVERYONE'S task board.`);
    } catch (error) {
      console.error("❌ Failed to create all-users task:", error);
      alert("Failed to create task. Check console.");
    }
  };

  // Add this button to your TaskBoard JSX:
  <Button variant="info" className="me-2" onClick={createTestAllUsersTask}>
    🌍 Test All Users
  </Button>;
  const handleDrop = async (taskId, newStatus) => {
    try {
      await TaskService.updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error("Error updating task status:", error);
      setError("Failed to update task status. Please try again.");
    }
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
  };

  // Organize tasks by status
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "inprogress");
  const doneTasks = tasks.filter((task) => task.status === "done");

  const columns = [
    { title: "To Do", status: "todo", tasks: todoTasks },
    { title: "In Progress", status: "inprogress", tasks: inProgressTasks },
    { title: "Done", status: "done", tasks: doneTasks },
  ];

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "60vh" }}
      >
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading tasks...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="task-board">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Task Board</h2>
        <div>
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={refreshData}
            disabled={loading}
          >
            <FaSyncAlt className={`me-1 ${loading ? "spin" : ""}`} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSelectedTask(null);
              setShowModal(true);
            }}
          >
            + New Task
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          <FaExclamationTriangle className="me-2" />
          {error}
        </Alert>
      )}

      <Row>
        {columns.map((column) => (
          <TaskColumn
            key={column.status}
            title={column.title}
            tasks={column.tasks}
            status={column.status}
            onTaskEdit={(task) => {
              setSelectedTask(task);
              setShowModal(true);
            }}
            onTaskDelete={handleDeleteTask}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onAddTask={() => {
              setSelectedTask(null);
              setShowModal(true);
            }}
            user={user} // ADD THIS LINE
          />
        ))}
      </Row>

      <TaskModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        teamMembers={teamMembers}
      />

      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default TaskBoard;
