import React from "react";
import { Row, Col, Card, ProgressBar, Table } from "react-bootstrap";
import {
  FaTasks,
  FaCheckCircle,
  FaClock,
  FaUserFriends,
  FaChartLine,
} from "react-icons/fa";
import TaskService from "../services/TaskService";

function Dashboard() {
  const [stats, setStats] = React.useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0,
    teamMembers: 0,
  });

  const [recentTasks, setRecentTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tasks, teamMembers] = await Promise.all([
        TaskService.getTasks(),
        TaskService.getTeamMembers(),
      ]);

      const completedTasks = tasks.filter(
        (task) => task.status === "done"
      ).length;
      const inProgressTasks = tasks.filter(
        (task) => task.status === "inprogress"
      ).length;
      const pendingTasks = tasks.filter(
        (task) => task.status === "todo"
      ).length;

      setStats({
        totalTasks: tasks.length,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        teamMembers: teamMembers.length,
      });

      // Get recent tasks (last 4)
      setRecentTasks(tasks.slice(0, 4));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const completionRate =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  const statCards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: <FaTasks size={24} />,
      color: "primary",
      description: "All tasks",
    },
    {
      title: "Completed",
      value: stats.completedTasks,
      icon: <FaCheckCircle size={24} />,
      color: "success",
      description: "Done tasks",
    },
    {
      title: "In Progress",
      value: stats.inProgressTasks,
      icon: <FaClock size={24} />,
      color: "warning",
      description: "Active tasks",
    },
    {
      title: "Team Members",
      value: stats.teamMembers,
      icon: <FaUserFriends size={24} />,
      color: "info",
      description: "Active users",
    },
  ];

  return (
    <div className="dashboard">
      <h2 className="mb-4">Dashboard</h2>

      {/* Stats Cards */}
      <Row className="mb-4">
        {statCards.map((stat, index) => (
          <Col key={index} md={3} sm={6} className="mb-3">
            <Card className="shadow-sm h-100 border-0">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="text-muted mb-2">{stat.title}</h6>
                    <h3 className="mb-0">{loading ? "..." : stat.value}</h3>
                    <small className="text-muted">{stat.description}</small>
                  </div>
                  <div className={`bg-${stat.color} rounded p-3`}>
                    <div className="text-white">{stat.icon}</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Progress Section */}
      <Row className="mb-4">
        <Col md={8}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Body>
              <Card.Title className="d-flex align-items-center">
                <FaChartLine className="me-2 text-primary" />
                Completion Progress
              </Card.Title>
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span>Overall Progress</span>
                  <span>{completionRate}%</span>
                </div>
                <ProgressBar
                  now={completionRate}
                  variant="success"
                  className="mb-3"
                  style={{ height: "10px" }}
                />
                <div className="row text-center">
                  <div className="col">
                    <div className="text-muted small">To Do</div>
                    <div className="h4">{stats.pendingTasks}</div>
                  </div>
                  <div className="col">
                    <div className="text-muted small">In Progress</div>
                    <div className="h4">{stats.inProgressTasks}</div>
                  </div>
                  <div className="col">
                    <div className="text-muted small">Done</div>
                    <div className="h4">{stats.completedTasks}</div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="shadow-sm h-100 border-0">
            <Card.Body>
              <Card.Title>Recent Tasks</Card.Title>
              <div className="mt-3">
                {recentTasks.length > 0 ? (
                  recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="d-flex align-items-center mb-3"
                    >
                      <div
                        className={`status-indicator me-3 ${task.status}`}
                      ></div>
                      <div style={{ flex: 1 }}>
                        <div className="small text-truncate">{task.title}</div>
                        <div className="text-muted small">
                          {task.priority} priority
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-4">
                    No tasks yet
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Tasks Table */}
      <Card className="shadow-sm border-0">
        <Card.Body>
          <Card.Title>Recent Tasks</Card.Title>
          <div className="table-responsive mt-3">
            <Table hover>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assignee</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task._id}>
                    <td className="text-truncate" style={{ maxWidth: "200px" }}>
                      {task.title}
                    </td>
                    <td>
                      <span
                        className={`badge bg-${
                          task.priority === "high"
                            ? "danger"
                            : task.priority === "medium"
                            ? "warning"
                            : "success"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge bg-${
                          task.status === "done"
                            ? "success"
                            : task.status === "inprogress"
                            ? "warning"
                            : "secondary"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td>{task.assignee?.name || "Unassigned"}</td>
                    <td>
                      {task.createdAt
                        ? new Date(task.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      <style jsx>{`
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .status-indicator.todo {
          background-color: #6c757d;
        }
        .status-indicator.inprogress {
          background-color: #ffc107;
        }
        .status-indicator.done {
          background-color: #28a745;
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
