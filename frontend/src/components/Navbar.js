import React from "react";
import { Navbar, Nav, Container, NavDropdown, Badge } from "react-bootstrap";
import {
  FaTasks,
  FaUserFriends,
  FaBell,
  FaSignOutAlt,
  FaUser,
  FaHome,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import AuthService from "../services/AuthService";
import { useSocket } from "../services/SocketService";

function NavigationBar({ user, setUser }) {
  const navigate = useNavigate();
  const { socket, isConnected, leaveUserRoom } = useSocket();
  const [notifications] = React.useState([]);
  const [onlineCount, setOnlineCount] = React.useState(0);

  // Count online users from socket connection status
  React.useEffect(() => {
    if (isConnected) {
      setOnlineCount(1); // Current user is online
    } else {
      setOnlineCount(0);
    }
  }, [isConnected]);

  const handleLogout = async () => {
    try {
      // Leave socket room before logging out
      if (user?._id) {
        leaveUserRoom(user._id);
      }

      await AuthService.logout();
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Navbar bg="white" expand="lg" className="navbar shadow-sm py-2">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
          <FaTasks className="me-2" />
          TaskFlow
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className="mx-2">
              <FaHome className="me-1" />
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/tasks" className="mx-2">
              <FaTasks className="me-1" />
              Task Board
            </Nav.Link>
            <Nav.Link as={Link} to="/team" className="mx-2">
              <FaUserFriends className="me-1" />
              Team {onlineCount > 0 && `(${onlineCount})`}
            </Nav.Link>
          </Nav>

          <Nav className="align-items-center">
            {/* Notifications */}
            <NavDropdown
              title={
                <>
                  <FaBell />
                  {notifications.length > 0 && (
                    <Badge pill bg="danger" className="ms-1">
                      {notifications.length}
                    </Badge>
                  )}
                </>
              }
              align="end"
              className="me-3"
            >
              {notifications.length > 0 ? (
                <>
                  <NavDropdown.Header>Notifications</NavDropdown.Header>
                  {notifications.slice(0, 5).map((notif, idx) => (
                    <NavDropdown.Item key={idx} as="div">
                      <small>{notif.message}</small>
                    </NavDropdown.Item>
                  ))}
                  <NavDropdown.Divider />
                  <NavDropdown.Item as="div">
                    <small className="text-primary">View all</small>
                  </NavDropdown.Item>
                </>
              ) : (
                <NavDropdown.Item as="div">
                  <small className="text-muted">No notifications</small>
                </NavDropdown.Item>
              )}
            </NavDropdown>

            {/* User Profile */}
            <NavDropdown
              title={
                <div className="d-inline-flex align-items-center">
                  <div
                    className="avatar me-2"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "#007bff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="d-none d-md-inline">
                    {user?.name || user?.email || "User"}
                  </span>
                </div>
              }
              align="end"
            >
              <NavDropdown.Header>
                <div className="text-center">
                  <div
                    className="avatar mx-auto mb-2"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "#007bff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="fw-bold">{user?.name || "User"}</div>
                  <small className="text-muted">{user?.email || ""}</small>
                </div>
              </NavDropdown.Header>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/profile">
                <FaUser className="me-2" />
                My Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/settings">
                <FaUser className="me-2" />
                Settings
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <FaSignOutAlt className="me-2 text-danger" />
                <span className="text-danger">Logout</span>
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>

      <style>{`
        .navbar {
          min-height: 70px;
        }
        
        .nav-link {
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .nav-link:hover {
          color: #007bff !important;
        }
        
        .navbar-nav .nav-link.active {
          color: #007bff;
          font-weight: 600;
        }
        
        .dropdown-menu {
          border: none;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          padding: 0;
        }
        
        .dropdown-item {
          padding: 0.75rem 1.5rem;
          transition: background-color 0.2s;
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
        }
        
        .dropdown-header {
          padding: 1rem 1.5rem;
          background-color: #f8f9fa;
          border-radius: 8px 8px 0 0;
        }
        
        .navbar-brand:hover {
          color: #0056b3 !important;
        }
        
        @media (max-width: 991px) {
          .navbar-collapse {
            padding: 1rem 0;
          }
          
          .nav-link {
            padding: 0.5rem 0;
          }
          
          .dropdown-menu {
            box-shadow: none;
            border: 1px solid #dee2e6;
          }
        }
      `}</style>
    </Navbar>
  );
}

export default NavigationBar;
