import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import { FaPlus, FaGlobe, FaUsers, FaUser } from "react-icons/fa";
import TaskCard from "./TaskCard";

function TaskColumn({
  title,
  tasks,
  status,
  onTaskEdit,
  onTaskDelete,
  onDragOver,
  onDrop,
  onAddTask,
  user, // Added user prop for visibility filtering
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    if (onDragOver) onDragOver(e, status);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && onDrop) {
      onDrop(taskId, status);
    }
  };

  const getStatusColor = () => {
    const colors = {
      todo: "secondary",
      inprogress: "warning",
      done: "success",
    };
    return colors[status] || "secondary";
  };

  // Calculate task statistics for this column
  const getColumnStats = () => {
    if (!tasks || tasks.length === 0) return null;

    const stats = {
      total: tasks.length,
      private: tasks.filter(
        (t) =>
          !t.assignee ||
          (t.assignee !== "all" &&
            (!t.assignee._id || t.assignee._id === t.createdBy._id))
      ).length,
      shared: tasks.filter(
        (t) =>
          t.assignee &&
          t.assignee !== "all" &&
          t.assignee._id &&
          t.assignee._id !== t.createdBy._id
      ).length,
      all: tasks.filter((t) => t.assignee === "all").length,
    };

    return stats;
  };

  const columnStats = getColumnStats();

  return (
    <div className="col-md-4">
      <Card className={`h-100 border-0 ${isDragOver ? "drag-over" : ""}`}>
        <Card.Header className="bg-white border-0 pb-0">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h6 className="mb-0 fw-bold">{title}</h6>
              <Badge bg={getStatusColor()} className="mt-1">
                {tasks.length} task{tasks.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onAddTask(status)}
            >
              <FaPlus />
            </Button>
          </div>

          {/* Column Statistics */}
          {columnStats && (
            <div className="d-flex flex-wrap gap-1 mt-2">
              {columnStats.private > 0 && (
                <Badge bg="secondary" className="d-flex align-items-center">
                  <FaUser size={10} className="me-1" />
                  {columnStats.private}
                </Badge>
              )}
              {columnStats.shared > 0 && (
                <Badge bg="success" className="d-flex align-items-center">
                  <FaUsers size={10} className="me-1" />
                  {columnStats.shared}
                </Badge>
              )}
              {columnStats.all > 0 && (
                <Badge bg="warning" className="d-flex align-items-center">
                  <FaGlobe size={10} className="me-1" />
                  {columnStats.all}
                </Badge>
              )}
            </div>
          )}
        </Card.Header>

        <Card.Body
          className="p-3 task-column"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={onTaskEdit}
              onDelete={onTaskDelete}
            />
          ))}

          {tasks.length === 0 && (
            <div className="text-center text-muted p-4 border rounded">
              <small>Drag tasks here or click + to add new</small>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default TaskColumn;
