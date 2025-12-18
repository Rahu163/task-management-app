import React from "react";
import { Card, Badge, Button } from "react-bootstrap";
import {
  FaEdit,
  FaTrash,
  FaUser,
  FaClock,
  FaGlobe,
  FaUsers,
} from "react-icons/fa"; // ADDED MISSING IMPORTS
import { format } from "date-fns";

function TaskCard({ task, onEdit, onDelete, onDragStart }) {
  const getPriorityBadge = (priority) => {
    const colors = {
      high: "danger",
      medium: "warning",
      low: "success",
    };
    return colors[priority] || "secondary";
  };

  const getStatusClass = (status) => {
    const classes = {
      todo: "task-status-todo",
      inprogress: "task-status-inprogress",
      done: "task-status-done",
    };
    return classes[status] || "";
  };

  const formatDate = (date) => {
    if (!date) return "No deadline";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.setData("currentStatus", task.status);
    if (onDragStart) onDragStart(e, task._id);
  };

  // Visibility badge function
  const getVisibilityBadge = () => {
    if (task.assignee === "all") {
      return (
        <Badge bg="warning" className="ms-2">
          <FaGlobe className="me-1" /> All
        </Badge>
      );
    } else if (task.assignee && task.assignee._id) {
      return (
        <Badge bg="success" className="ms-2">
          <FaUsers className="me-1" /> Shared
        </Badge>
      );
    } else {
      return (
        <Badge bg="secondary" className="ms-2">
          <FaUser className="me-1" /> Private
        </Badge>
      );
    }
  };

  return (
    <Card
      className={`task-card ${getStatusClass(task.status)} task-priority-${
        task.priority
      } mb-3`}
      draggable
      onDragStart={handleDragStart}
    >
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div className="d-flex align-items-center" style={{ flex: 1 }}>
            <Card.Title className="h6 mb-0">{task.title}</Card.Title>
            {getVisibilityBadge()}
          </div>
          <div className="d-flex">
            <Button
              variant="link"
              size="sm"
              className="text-muted p-0 me-1"
              onClick={() => onEdit(task)}
            >
              <FaEdit size={14} />
            </Button>
            <Button
              variant="link"
              size="sm"
              className="text-danger p-0"
              onClick={() => onDelete(task._id)}
            >
              <FaTrash size={14} />
            </Button>
          </div>
        </div>

        <Card.Text className="text-muted small mb-3">
          {task.description || "No description"}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <Badge bg={getPriorityBadge(task.priority)} className="me-2">
            {task.priority}
          </Badge>

          <div className="d-flex align-items-center text-muted small">
            <FaClock className="me-1" size={12} />
            <span>{formatDate(task.deadline)}</span>
          </div>
        </div>

        {task.assignee && task.assignee !== "all" && task.assignee._id && (
          <div className="d-flex align-items-center mt-2">
            <FaUser className="me-2 text-muted" size={12} />
            <div
              className="avatar me-2"
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#007bff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {task.assignee.name?.charAt(0) || "A"}
            </div>
            <small className="text-truncate">
              {task.assignee.name || "Assigned"}
            </small>
          </div>
        )}

        {task.assignee === "all" && (
          <div className="d-flex align-items-center mt-2">
            <FaGlobe className="me-2 text-warning" size={12} />
            <small className="text-muted">Visible to all team members</small>
          </div>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="mt-3 d-flex flex-wrap gap-1">
            {task.tags.map((tag, idx) => (
              <Badge key={idx} bg="light" text="dark" className="px-2 py-1">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-3 d-flex justify-content-between align-items-center">
          <small className="text-muted">
            Created by: {task.createdBy?.name || "Unknown"}
          </small>
          <small className="text-muted">
            {format(new Date(task.createdAt), "MMM dd")}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
}

export default TaskCard;
