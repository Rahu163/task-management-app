import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Container } from "react-bootstrap";
import { SocketProvider } from "./services/SocketService";
import AuthService from "./services/AuthService";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import TaskBoard from "./pages/TaskBoard";
import Team from "./pages/Team";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./styles/App.css";

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // First check localStorage for stored user
      const storedUser = AuthService.getStoredUser();
      const token = AuthService.getToken();

      if (token && storedUser) {
        // Validate token by fetching current user
        const currentUser = await AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        } else {
          // Token invalid, clear storage
          AuthService.logout();
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      AuthService.logout();
    } finally {
      setLoading(false);
    }
  };

  const handleSetUser = (userData) => {
    setUser(userData);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <Router>
        <div className="App">
          {user && <Navbar user={user} setUser={setUser} />}
          <Container fluid className="main-content">
            <Routes>
              <Route
                path="/"
                element={user ? <Dashboard /> : <Navigate to="/login" />}
              />
              <Route
                path="/login"
                element={
                  !user ? (
                    <Login setUser={handleSetUser} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  !user ? (
                    <Register setUser={handleSetUser} />
                  ) : (
                    <Navigate to="/" />
                  )
                }
              />
              <Route
                path="/tasks"
                element={
                  user ? <TaskBoard user={user} /> : <Navigate to="/login" />
                }
              />
              <Route
                path="/team"
                element={user ? <Team /> : <Navigate to="/login" />}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
