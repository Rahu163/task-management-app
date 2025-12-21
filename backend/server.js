const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketio = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const socketHandler = require("./socket");
const teamRoutes = require("./routes/team");
const app = express();
const server = http.createServer(app);

// Socket.io configuration with better settings
const io = socketio(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://task-management-app.vercel.app",
  "https://task-management-app-git-main-yourusername.vercel.app",
  "https://task-management-app-yourusername.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use("/api/team", teamRoutes);

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/taskmanagement"
  )
  .then(() => {
    console.log(" MongoDB connected successfully");

    // Load models AFTER connection is established
    require("./models/User");
    require("./models/Task");
    console.log(" Models loaded");
  })
  .catch((err) => {
    console.error(" MongoDB connection error:", err.message);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

// Socket.io connection
io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);
  socketHandler(io, socket);
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Task Management API",
    mongo: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
    socket: io.engine.clientsCount + " clients connected",
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(` API: http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Test endpoint: http://localhost:${PORT}/api/test`);
});
