const connectedUsers = new Map();

const socketHandler = (io, socket) => {
  console.log("🔌 New WebSocket connection:", socket.id);

  // Join user-specific room when they authenticate
  socket.on("joinUserRoom", (userId) => {
    if (userId) {
      socket.join(userId);
      connectedUsers.set(socket.id, userId);

      // Broadcast to all clients about online users
      const uniqueUsers = [...new Set(Array.from(connectedUsers.values()))];
      io.emit("userOnline", uniqueUsers);

      console.log(`👤 User ${userId} joined their room`);
      console.log(
        `👥 Currently ${connectedUsers.size} sockets, ${uniqueUsers.length} unique users online`
      );
    }
  });

  // Leave user-specific room
  socket.on("leaveUserRoom", (userId) => {
    if (userId) {
      socket.leave(userId);
      console.log(`👤 User ${userId} left their room`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userId = connectedUsers.get(socket.id);
    if (userId) {
      connectedUsers.delete(socket.id);

      // Update online users list
      const uniqueUsers = [...new Set(Array.from(connectedUsers.values()))];
      io.emit("userOnline", uniqueUsers);
      io.emit("userDisconnected", userId);

      console.log(`👤 User ${userId} disconnected`);
      console.log(
        `👥 Currently ${connectedUsers.size} sockets, ${uniqueUsers.length} unique users online`
      );
    }
  });

  // Handle task events from clients
  socket.on("taskCreate", (task) => {
    console.log(`📝 Task created event received for:`, {
      createdBy: task.createdBy,
      assignee: task.assignee,
    });

    // Emit to task creator
    if (task.createdBy) {
      io.to(task.createdBy.toString()).emit("taskCreated", task);
    }

    // Emit to assignee if different from creator
    if (
      task.assignee &&
      task.assignee._id &&
      task.assignee._id.toString() !== task.createdBy.toString()
    ) {
      io.to(task.assignee._id.toString()).emit("taskCreated", task);
    }
  });

  socket.on("taskUpdate", (task) => {
    console.log(`🔄 Task update event for:`, task._id);

    if (task.createdBy) {
      io.to(task.createdBy.toString()).emit("taskUpdated", task);
    }

    if (
      task.assignee &&
      task.assignee._id &&
      task.assignee._id.toString() !== task.createdBy.toString()
    ) {
      io.to(task.assignee._id.toString()).emit("taskUpdated", task);
    }
  });

  socket.on("taskDelete", (data) => {
    console.log(`🗑️ Task delete event for:`, data.taskId);

    if (data.createdBy) {
      io.to(data.createdBy.toString()).emit("taskDeleted", data.taskId);
    }

    if (
      data.assignee &&
      data.assignee.toString() !== data.createdBy.toString()
    ) {
      io.to(data.assignee.toString()).emit("taskDeleted", data.taskId);
    }
  });
};

module.exports = socketHandler;
