import React, { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token || !userStr) {
      console.log("No token or user found, skipping socket connection");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      console.log(" Initializing socket connection for user:", user._id);

      // Create socket connection
      const newSocket = io(
        process.env.REACT_APP_SOCKET_URL || "http://localhost:5001",
        {
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          query: { userId: user._id },
        }
      );

      newSocket.on("connect", () => {
        console.log(" Socket connected:", newSocket.id);
        setIsConnected(true);

        // Join user-specific room
        if (user._id) {
          newSocket.emit("joinUserRoom", user._id);
          console.log(" Joined user room:", user._id);
        }
      });

      newSocket.on("userOnline", (users) => {
        console.log(" Online users update:", users);
        setOnlineUsers(Array.isArray(users) ? users : []);
      });

      newSocket.on("userConnected", (userId) => {
        console.log(" User connected:", userId);
        setOnlineUsers((prev) => {
          if (!prev.includes(userId)) {
            return [...prev, userId];
          }
          return prev;
        });
      });

      newSocket.on("userDisconnected", (userId) => {
        console.log("User disconnected:", userId);
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      newSocket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setIsConnected(false);
      });

      newSocket.on("connect_error", (error) => {
        console.error(" Socket connection error:", error.message);
        setIsConnected(false);
      });

      newSocket.on("reconnect", (attemptNumber) => {
        console.log(" Socket reconnected after", attemptNumber, "attempts");
        setIsConnected(true);

        // Re-join user room after reconnection
        if (user._id) {
          newSocket.emit("joinUserRoom", user._id);
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        console.log("🧹 Cleaning up socket connection");
        if (newSocket && newSocket.connected) {
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error(" Error parsing user data for socket:", error);
    }
  }, []);

  // Function to manually join user room (call after login)
  const joinUserRoom = (userId) => {
    if (socket && socket.connected && userId) {
      socket.emit("joinUserRoom", userId);
      console.log(" Manually joined user room:", userId);
    }
  };

  // Function to leave user room (call before logout)
  const leaveUserRoom = (userId) => {
    if (socket && userId) {
      socket.emit("leaveUserRoom", userId);
      console.log("👤 Left user room:", userId);
    }
  };

  // Emit task events
  const emitTaskCreate = (task) => {
    if (socket && isConnected) {
      socket.emit("taskCreate", task);
      console.log("Emitted taskCreate:", task._id);
    } else {
      console.warn(" Socket not connected, cannot emit taskCreate");
    }
  };

  const emitTaskUpdate = (task) => {
    if (socket && isConnected) {
      socket.emit("taskUpdate", task);
      console.log(" Emitted taskUpdate:", task._id);
    } else {
      console.warn(" Socket not connected, cannot emit taskUpdate");
    }
  };

  const emitTaskDelete = (taskId, createdBy, assignee) => {
    if (socket && isConnected) {
      const data = { taskId, createdBy, assignee };
      socket.emit("taskDelete", data);
      console.log(" Emitted taskDelete:", taskId);
    } else {
      console.warn(" Socket not connected, cannot emit taskDelete");
    }
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    currentUser,
    joinUserRoom,
    leaveUserRoom,
    emitTaskCreate,
    emitTaskUpdate,
    emitTaskDelete,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
