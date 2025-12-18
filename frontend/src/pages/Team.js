import React from "react";
import {
  Row,
  Col,
  Card,
  Badge,
  Button,
  Table,
  Spinner,
  Alert,
  Modal,
  Form,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import {
  FaUserPlus,
  FaEnvelope,
  FaCircle,
  FaComment,
  FaTasks,
  FaExclamationTriangle,
  FaSyncAlt,
  FaCopy,
  FaCheck,
  FaPaperPlane,
  FaTrash,
  FaShareAlt,
} from "react-icons/fa";
import TaskService from "../services/TaskService";

function Team() {
  const [teamMembers, setTeamMembers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Invite Modal States
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("user");
  const [sendingInvite, setSendingInvite] = React.useState(false);
  const [inviteSuccess, setInviteSuccess] = React.useState(false);
  const [inviteError, setInviteError] = React.useState("");

  // Toast Notifications
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");
  const [toastVariant, setToastVariant] = React.useState("success");

  // Copy Link States
  const [copied, setCopied] = React.useState(false);

  // Pending Invites
  const [pendingInvites, setPendingInvites] = React.useState([
    {
      id: 1,
      email: "newuser@example.com",
      role: "user",
      sentDate: "2024-01-15",
      status: "pending",
    },
    {
      id: 2,
      email: "manager@example.com",
      role: "manager",
      sentDate: "2024-01-14",
      status: "expired",
    },
  ]);

  React.useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("👥 Fetching team members from backend...");
      const members = await TaskService.getTeamMembers();
      console.log("✅ Team members response:", members);

      // Ensure members is an array
      if (Array.isArray(members)) {
        // Add mock data for missing fields
        const updatedMembers = members.map((member) => ({
          ...member,
          isOnline: Math.random() > 0.5, // Mock online status
          lastSeen: member.lastSeen || new Date().toISOString(),
          tasks: Math.floor(Math.random() * 15), // Mock task count
          name: member.name || member.email.split("@")[0],
          _id:
            member._id || member.id || Math.random().toString(36).substr(2, 9),
        }));

        setTeamMembers(updatedMembers);
        console.log(
          `✅ Loaded ${updatedMembers.length} team members from backend`
        );
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error fetching team members:", error);
      setError(
        "Failed to load team members from server. Showing mock data instead."
      );

      // Fallback to mock data if API fails
      const mockTeamMembers = [
        {
          _id: "1",
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
          isOnline: true,
          lastSeen: new Date().toISOString(),
          tasks: 12,
          createdAt: "2024-01-01T00:00:00.000Z",
        },
        {
          _id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          role: "developer",
          isOnline: true,
          lastSeen: new Date().toISOString(),
          tasks: 8,
          createdAt: "2024-01-02T00:00:00.000Z",
        },
        {
          _id: "3",
          name: "Bob Johnson",
          email: "bob@example.com",
          role: "designer",
          isOnline: false,
          lastSeen: new Date(Date.now() - 3600000).toISOString(),
          tasks: 5,
          createdAt: "2024-01-03T00:00:00.000Z",
        },
        {
          _id: "4",
          name: "Alice Brown",
          email: "alice@example.com",
          role: "qa",
          isOnline: false,
          lastSeen: new Date(Date.now() - 7200000).toISOString(),
          tasks: 7,
          createdAt: "2024-01-04T00:00:00.000Z",
        },
      ];

      setTeamMembers(mockTeamMembers);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteError("Please enter a valid email address");
      return;
    }

    setSendingInvite(true);
    setInviteError("");

    try {
      // In a real app, this would call an API endpoint
      console.log("📧 Sending invite to:", inviteEmail, "Role:", inviteRole);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Add to pending invites
      const newInvite = {
        id: pendingInvites.length + 1,
        email: inviteEmail,
        role: inviteRole,
        sentDate: new Date().toISOString().split("T")[0],
        status: "pending",
      };

      setPendingInvites((prev) => [newInvite, ...prev]);

      // Show success toast
      showToastNotification("Invitation sent successfully!", "success");

      // Reset form and close modal
      setInviteEmail("");
      setInviteRole("user");
      setShowInviteModal(false);
      setInviteSuccess(true);
    } catch (error) {
      console.error("❌ Error sending invite:", error);
      setInviteError("Failed to send invitation. Please try again.");
      showToastNotification("Failed to send invitation", "danger");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCopyInviteLink = () => {
    // Create invite link (in a real app, this would be a unique link)
    const inviteLink = `${
      window.location.origin
    }/register?invite=team-${Date.now()}`;

    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setCopied(true);
        showToastNotification("Invite link copied to clipboard!", "success");

        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showToastNotification("Failed to copy link", "danger");
      });
  };

  const handleResendInvite = (inviteId) => {
    const invite = pendingInvites.find((i) => i.id === inviteId);
    if (invite) {
      showToastNotification(`Resending invite to ${invite.email}`, "info");

      // Update status
      setPendingInvites((prev) =>
        prev.map((i) =>
          i.id === inviteId
            ? {
                ...i,
                status: "pending",
                sentDate: new Date().toISOString().split("T")[0],
              }
            : i
        )
      );
    }
  };

  const handleRemoveInvite = (inviteId) => {
    setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
    showToastNotification("Invitation removed", "warning");
  };

  const showToastNotification = (message, variant = "success") => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  };

  const getStatusColor = (isOnline) => {
    return isOnline ? "success" : "secondary";
  };

  const formatLastSeen = (date) => {
    if (!date) return "Never";

    try {
      const now = new Date();
      const lastSeen = new Date(date);
      const diffMs = now - lastSeen;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  const formatRole = (role) => {
    const roleMap = {
      admin: "Administrator",
      user: "Team Member",
      manager: "Project Manager",
      developer: "Developer",
      designer: "Designer",
      qa: "QA Engineer",
    };
    return roleMap[role] || role || "Team Member";
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: "danger",
      manager: "warning",
      developer: "info",
      designer: "primary",
      qa: "success",
      user: "secondary",
    };
    return colors[role] || "secondary";
  };

  const getInviteStatusBadge = (status) => {
    const statusMap = {
      pending: { variant: "warning", text: "Pending" },
      accepted: { variant: "success", text: "Accepted" },
      expired: { variant: "danger", text: "Expired" },
      declined: { variant: "secondary", text: "Declined" },
    };
    return statusMap[status] || { variant: "secondary", text: status };
  };

  if (loading) {
    return (
      <div className="team-page">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Team Members</h2>
          <Button variant="primary" disabled>
            <FaUserPlus className="me-2" />
            Invite Member
          </Button>
        </div>
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading team members...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  return (
    <div className="team-page">
      {/* Toast Notifications */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 1050 }}
      >
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          bg={toastVariant}
          className="text-white"
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto">
              {toastVariant === "success"
                ? "Success"
                : toastVariant === "danger"
                ? "Error"
                : toastVariant === "warning"
                ? "Warning"
                : "Info"}
            </strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Invite Modal */}
      <Modal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaUserPlus className="me-2" />
            Invite Team Member
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleInviteSubmit}>
          <Modal.Body>
            <p className="text-muted mb-4">
              Invite new members to join your team. They will receive an email
              invitation.
            </p>

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                disabled={sendingInvite}
              />
              <Form.Text className="text-muted">
                Enter the email address of the person you want to invite
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={sendingInvite}
              >
                <option value="user">Team Member</option>
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="manager">Project Manager</option>
                <option value="qa">QA Engineer</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Select the role for this team member
              </Form.Text>
            </Form.Group>

            {inviteError && (
              <Alert variant="danger" className="py-2">
                <FaExclamationTriangle className="me-2" />
                {inviteError}
              </Alert>
            )}

            <div className="d-grid">
              <Button
                variant="primary"
                type="submit"
                disabled={sendingInvite || !inviteEmail}
              >
                {sendingInvite ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="me-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>

            <div className="text-center mt-3">
              <hr className="my-3" />
              <p className="text-muted small mb-2">Or share invite link</p>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleCopyInviteLink}
              >
                {copied ? (
                  <>
                    <FaCheck className="me-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <FaCopy className="me-2" />
                    Copy Invite Link
                  </>
                )}
              </Button>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowInviteModal(false)}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Team Members</h2>
          <p className="text-muted mb-0">
            Manage your team members and invitations
          </p>
        </div>
        <div>
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={fetchTeamMembers}
            disabled={loading}
          >
            <FaSyncAlt className={`me-1 ${loading ? "spin" : ""}`} />
            {loading ? "Loading..." : "Refresh"}
          </Button>
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            <FaUserPlus className="me-2" />
            Invite Member
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="warning" className="mb-4">
          <FaExclamationTriangle className="me-2" />
          {error}
          <div className="mt-2">
            <small className="text-muted">
              Showing mock data. Make sure backend is running and authenticated.
            </small>
          </div>
        </Alert>
      )}

      {/* Team Stats */}
      <Row className="mb-4">
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="text-center">
              <h3 className="text-primary mb-2">{teamMembers.length || 0}</h3>
              <p className="text-muted mb-0">Total Members</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="text-center">
              <h3 className="text-success mb-2">
                {Array.isArray(teamMembers)
                  ? teamMembers.filter((m) => m.isOnline).length
                  : 0}
              </h3>
              <p className="text-muted mb-0">Online Now</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="text-center">
              <h3 className="text-info mb-2">
                {Array.isArray(pendingInvites) ? pendingInvites.length : 0}
              </h3>
              <p className="text-muted mb-0">Pending Invites</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body className="text-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleCopyInviteLink}
                className="w-100"
              >
                {copied ? (
                  <>
                    <FaCheck className="me-2" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <FaShareAlt className="me-2" />
                    Share Invite Link
                  </>
                )}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pending Invites Section */}
      {Array.isArray(pendingInvites) && pendingInvites.length > 0 && (
        <Card className="shadow-sm border-0 mb-4">
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-center">
              <span>Pending Invitations</span>
              <Badge bg="warning" pill>
                {pendingInvites.length}
              </Badge>
            </Card.Title>
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Sent Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvites.map((invite) => {
                    const status = getInviteStatusBadge(invite.status);
                    return (
                      <tr key={invite.id}>
                        <td>
                          <FaEnvelope className="me-2 text-muted" />
                          {invite.email}
                        </td>
                        <td>
                          <Badge bg={getRoleColor(invite.role)}>
                            {formatRole(invite.role)}
                          </Badge>
                        </td>
                        <td>{invite.sentDate}</td>
                        <td>
                          <Badge bg={status.variant}>{status.text}</Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {invite.status === "pending" && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleResendInvite(invite.id)}
                              >
                                <FaPaperPlane size={12} />
                              </Button>
                            )}
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveInvite(invite.id)}
                            >
                              <FaTrash size={12} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Team Members Grid */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Card.Title className="d-flex justify-content-between align-items-center mb-4">
            <span>Team Members</span>
            <div>
              <Badge bg="light" text="dark" className="me-2">
                <FaCircle className="text-success me-1" size={8} />
                Online:{" "}
                {Array.isArray(teamMembers)
                  ? teamMembers.filter((m) => m.isOnline).length
                  : 0}
              </Badge>
              <Badge bg="light" text="dark">
                <FaCircle className="text-secondary me-1" size={8} />
                Total: {Array.isArray(teamMembers) ? teamMembers.length : 0}
              </Badge>
            </div>
          </Card.Title>

          <Row>
            {Array.isArray(teamMembers) && teamMembers.length > 0 ? (
              teamMembers.map((member) => {
                const memberId =
                  member._id ||
                  member.id ||
                  Math.random().toString(36).substr(2, 9);
                const memberName =
                  member.name || member.email?.split("@")[0] || "Unknown";
                const memberEmail = member.email || "No email";
                const memberRole = member.role || "user";
                const isOnline = Boolean(member.isOnline);
                const taskCount = member.tasks || 0;
                const lastSeen = member.lastSeen;

                return (
                  <Col key={memberId} md={6} lg={4} xl={3} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="text-center">
                        <div className="position-relative d-inline-block mb-3">
                          <div
                            className="avatar-lg mx-auto"
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "32px",
                              fontWeight: "bold",
                              backgroundColor: "#007bff",
                              color: "white",
                            }}
                          >
                            {memberName.charAt(0).toUpperCase()}
                          </div>
                          <Badge
                            bg={getStatusColor(isOnline)}
                            className="position-absolute bottom-0 end-0 p-1 border border-white"
                            pill
                            style={{
                              bottom: "5px",
                              right: "5px",
                            }}
                          >
                            <FaCircle size={8} />
                          </Badge>
                        </div>

                        <Card.Title className="h5 mb-1">
                          {memberName}
                        </Card.Title>
                        <Card.Subtitle className="text-muted mb-3">
                          <Badge bg={getRoleColor(memberRole)}>
                            {formatRole(memberRole)}
                          </Badge>
                        </Card.Subtitle>

                        <div className="mb-3">
                          <Badge bg="light" text="dark" className="px-3 py-2">
                            <FaTasks className="me-1" />
                            {taskCount} Tasks
                          </Badge>
                        </div>

                        <div className="text-muted small mb-3">
                          <div className="d-flex align-items-center justify-content-center mb-1">
                            <FaEnvelope className="me-2" size={12} />
                            <span
                              className="text-truncate"
                              style={{ maxWidth: "200px" }}
                            >
                              {memberEmail}
                            </span>
                          </div>
                          <div className="d-flex align-items-center justify-content-center">
                            <FaCircle
                              className={`me-2 text-${getStatusColor(
                                isOnline
                              )}`}
                              size={8}
                            />
                            <span>
                              {isOnline
                                ? "Online now"
                                : `Last seen ${formatLastSeen(lastSeen)}`}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex justify-content-center gap-2">
                          <Button variant="outline-primary" size="sm">
                            <FaComment className="me-1" />
                            Message
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            View Profile
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })
            ) : (
              <Col>
                <Card className="shadow-sm border-0">
                  <Card.Body className="text-center py-5">
                    <FaCircle className="text-muted mb-3" size={48} />
                    <h5>No Team Members Found</h5>
                    <p className="text-muted">
                      There are no team members in the system yet.
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => setShowInviteModal(true)}
                      className="me-2"
                    >
                      <FaUserPlus className="me-2" />
                      Invite Members
                    </Button>
                    <Button
                      variant="outline-primary"
                      onClick={fetchTeamMembers}
                    >
                      <FaSyncAlt className="me-2" />
                      Refresh
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Team Performance Table */}
      {Array.isArray(teamMembers) && teamMembers.length > 0 && (
        <Card className="shadow-sm border-0">
          <Card.Body>
            <Card.Title className="d-flex justify-content-between align-items-center mb-4">
              <span>Team Performance Overview</span>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={fetchTeamMembers}
                disabled={loading}
              >
                <FaSyncAlt className="me-1" />
                Refresh Data
              </Button>
            </Card.Title>

            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Active Tasks</th>
                    <th>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((member) => {
                    const memberId =
                      member._id ||
                      member.id ||
                      Math.random().toString(36).substr(2, 9);
                    const memberName =
                      member.name || member.email?.split("@")[0] || "Unknown";
                    const memberEmail = member.email || "No email";
                    const memberRole = member.role || "user";
                    const isOnline = Boolean(member.isOnline);
                    const taskCount = member.tasks || 0;

                    const completedTasks = Math.floor(Math.random() * 20) + 10;
                    const totalTasks = taskCount + completedTasks;
                    const performance =
                      totalTasks > 0
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0;

                    return (
                      <tr key={memberId}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="avatar me-2"
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                backgroundColor: "#e9ecef",
                                color: "#495057",
                              }}
                            >
                              {memberName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-medium">{memberName}</div>
                              <div className="text-muted small">
                                ID: {memberId.toString().substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getRoleColor(memberRole)}>
                            {formatRole(memberRole)}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getStatusColor(isOnline)}>
                            {isOnline ? "Online" : "Offline"}
                          </Badge>
                        </td>
                        <td>
                          <small className="text-muted">{memberEmail}</small>
                        </td>
                        <td>
                          {member.createdAt
                            ? new Date(member.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <FaTasks className="me-2 text-primary" size={14} />
                            <span className="fw-medium">{taskCount}</span>
                            <small className="text-muted ms-1">active</small>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div
                              className="progress flex-grow-1 me-2"
                              style={{ height: "6px" }}
                            >
                              <div
                                className="progress-bar bg-success"
                                style={{
                                  width: `${Math.min(performance, 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="fw-medium">{performance}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            <div className="text-center mt-4">
              <Button
                variant="primary"
                onClick={() => setShowInviteModal(true)}
                className="me-2"
              >
                <FaUserPlus className="me-2" />
                Invite More Members
              </Button>
              <Button variant="outline-primary" onClick={handleCopyInviteLink}>
                <FaShareAlt className="me-2" />
                Share Invite Link
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

export default Team;
