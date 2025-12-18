import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  FaCalendarAlt,
  FaTag,
  FaUser,
  FaExclamationCircle,
  FaUsers,
  FaGlobe,
} from "react-icons/fa";

const TaskModal = ({ show, onHide, task, onSubmit, teamMembers, user }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assignee: "",
    assigneeType: "private", // "private", "user", "all"
    deadline: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState(null);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      // Editing existing task
      const assigneeValue = task.assignee?._id || task.assignee || "";
      const assigneeType =
        assigneeValue === "all" ? "all" : assigneeValue ? "user" : "private";

      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        assignee: assigneeValue,
        assigneeType: assigneeType,
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().split("T")[0]
          : "",
        tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
      });

      // Set selected assignee for display
      if (
        assigneeType === "user" &&
        assigneeValue &&
        assigneeValue !== user?._id
      ) {
        const assignee = teamMembers?.find((m) => m._id === assigneeValue);
        setSelectedAssignee(assignee);
      } else {
        setSelectedAssignee(null);
      }
    } else {
      // Creating new task - Start with private
      setFormData({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        assignee: "",
        assigneeType: "private",
        deadline: "",
        tags: "",
      });
      setSelectedAssignee(null);
    }
  }, [task, user, teamMembers]);

  const handleAssigneeTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      assigneeType: type,
      assignee:
        type === "private" ? "" : type === "all" ? "all" : prev.assignee,
    }));

    if (type !== "user") {
      setSelectedAssignee(null);
    }
  };

  const handleUserSelect = (userId) => {
    const assigneeMember = teamMembers?.find((m) => m._id === userId);
    setSelectedAssignee(assigneeMember);
    setFormData((prev) => ({
      ...prev,
      assignee: userId,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);

    try {
      // Prepare assignee value based on type
      let assigneeValue = null;
      let visibilityType = "private";

      if (
        formData.assigneeType === "user" &&
        formData.assignee &&
        formData.assignee !== user?._id
      ) {
        assigneeValue = formData.assignee; // Specific user ID
        visibilityType = "user";
      } else if (formData.assigneeType === "all") {
        assigneeValue = "all"; // Special value for all users
        visibilityType = "all";
      }
      // If private or assignee is current user, assigneeValue remains null

      console.log("🎯 Task Creation Debug:", {
        assigneeType: formData.assigneeType,
        assigneeValue: assigneeValue,
        visibilityType: visibilityType,
        selectedUser: selectedAssignee?.name,
        isAllUsers: visibilityType === "all",
      });

      // Prepare task data
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        status: formData.status,
        priority: formData.priority,
        assignee: assigneeValue,
        assigneeType: visibilityType,
        deadline: formData.deadline || null,
        tags: formData.tags
          ? formData.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      console.log("📤 Sending to backend:", taskData);

      await onSubmit(taskData);
      onHide();
    } catch (err) {
      console.error("❌ Error submitting task:", err);
      setError(err.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "secondary";
    }
  };

  const getVisibilityInfo = () => {
    switch (formData.assigneeType) {
      case "private":
        return {
          text: "👤 Private - Only you can see this task",
          variant: "info",
          icon: <FaUser className="me-1" />,
        };
      case "user":
        return {
          text: `👥 Shared with ${selectedAssignee?.name || "selected user"}`,
          variant: "success",
          icon: <FaUsers className="me-1" />,
        };
      case "all":
        return {
          text: "🌍 Visible to all team members",
          variant: "warning",
          icon: <FaGlobe className="me-1" />,
        };
      default:
        return {
          text: "👤 Private",
          variant: "info",
          icon: <FaUser className="me-1" />,
        };
    }
  };

  const visibilityInfo = getVisibilityInfo();

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {task ? "✏️ Edit Task" : "➕ Create New Task"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationCircle className="me-2" />
              {error}
            </Alert>
          )}

          {/* Visibility Selection */}
          <div className="mb-4">
            <Form.Label className="fw-bold mb-3">
              <FaUsers className="me-2" />
              Task Visibility
            </Form.Label>

            <div className="d-flex flex-wrap gap-2 mb-3">
              <Button
                variant={
                  formData.assigneeType === "private"
                    ? "primary"
                    : "outline-primary"
                }
                onClick={() => handleAssigneeTypeChange("private")}
                className="flex-grow-1"
                size="sm"
              >
                <FaUser className="me-2" />
                Private
              </Button>
              <Button
                variant={
                  formData.assigneeType === "user"
                    ? "primary"
                    : "outline-primary"
                }
                onClick={() => handleAssigneeTypeChange("user")}
                className="flex-grow-1"
                size="sm"
                disabled={!teamMembers || teamMembers.length === 0}
              >
                <FaUsers className="me-2" />
                Share with User
              </Button>
              <Button
                variant={
                  formData.assigneeType === "all"
                    ? "primary"
                    : "outline-primary"
                }
                onClick={() => handleAssigneeTypeChange("all")}
                className="flex-grow-1"
                size="sm"
              >
                <FaGlobe className="me-2" />
                All Team Members
              </Button>
            </div>

            {/* Visibility Alert */}
            <Alert variant={visibilityInfo.variant} className="py-2">
              <div className="d-flex align-items-center">
                {visibilityInfo.icon}
                <strong>{visibilityInfo.text}</strong>
              </div>
              {formData.assigneeType === "user" && selectedAssignee && (
                <div className="small mt-1">
                  Task will appear in both your and {selectedAssignee.name}'s
                  boards
                </div>
              )}
              {formData.assigneeType === "all" && (
                <div className="small mt-1">
                  Task will appear in ALL team members' boards
                </div>
              )}
            </Alert>
          </div>

          {/* User Selection (only shown when "Share with User" is selected) */}
          {formData.assigneeType === "user" && (
            <Form.Group className="mb-4">
              <Form.Label>Select Team Member</Form.Label>
              <Form.Select
                value={formData.assignee || ""}
                onChange={(e) => handleUserSelect(e.target.value)}
                disabled={loading || !teamMembers || teamMembers.length === 0}
              >
                <option value="">Select a team member...</option>
                {Array.isArray(teamMembers) && teamMembers.length > 0 ? (
                  teamMembers.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </option>
                  ))
                ) : (
                  <option disabled>No team members available</option>
                )}
              </Form.Select>
              {selectedAssignee && (
                <Alert variant="light" className="py-2 mt-2">
                  <div className="d-flex align-items-center">
                    <FaUser className="me-2 text-primary" />
                    <div>
                      <strong>Selected: {selectedAssignee.name}</strong>
                      <div className="small">{selectedAssignee.email}</div>
                    </div>
                  </div>
                </Alert>
              )}
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Title *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              required
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the task..."
              disabled={loading}
            />
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="todo">📝 To Do</option>
                  <option value="inprogress">🔄 In Progress</option>
                  <option value="done">✅ Done</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <FaCalendarAlt className="me-1" />
                  Deadline
                </Form.Label>
                <Form.Control
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  disabled={loading}
                  min={new Date().toISOString().split("T")[0]}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  <FaTag className="me-1" />
                  Tags
                </Form.Label>
                <Form.Control
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="urgent, feature, bug"
                  disabled={loading}
                />
                <Form.Text className="text-muted">
                  Separate tags with commas
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Task Preview */}
          <div className="mt-4 p-3 bg-light rounded border">
            <h6 className="fw-bold">📋 Task Preview</h6>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong className="h5">{formData.title || "(No title)"}</strong>
                <div className="small text-muted mt-1">
                  Status: <Badge bg="secondary">{formData.status}</Badge> |
                  Priority:{" "}
                  <Badge bg={getPriorityColor(formData.priority)}>
                    {formData.priority}
                  </Badge>
                </div>
              </div>
              <div className="text-end">
                <div className="d-flex align-items-center justify-content-end">
                  {visibilityInfo.icon}
                  <small className="text-muted">
                    {formData.assigneeType === "private" && "👤 Private to you"}
                    {formData.assigneeType === "user" &&
                      selectedAssignee &&
                      `👥 Shared with ${selectedAssignee.name}`}
                    {formData.assigneeType === "all" && "🌍 Visible to all"}
                  </small>
                </div>
                {formData.deadline && (
                  <small className="text-muted">
                    📅 Due: {new Date(formData.deadline).toLocaleDateString()}
                  </small>
                )}
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                {task ? "Updating..." : "Creating..."}
              </>
            ) : task ? (
              "Update Task"
            ) : (
              "Create Task"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TaskModal;
