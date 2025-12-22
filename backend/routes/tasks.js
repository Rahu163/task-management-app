const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Apply auth middleware to all task routes
router.use(authMiddleware);

// Get all tasks (visible to user)
router.get("/", async (req, res) => {
  console.log("Getting tasks for user:", req.user?.email, req.user?._id);

  try {
    // Get tasks where:
    // 1. User is creator OR
    // 2. User is assignee OR
    // 3. Task is visible to all users (assignee = "all")
    const tasks = await Task.find({
      $or: [
        { createdBy: req.user._id },
        { assignee: req.user._id },
        { assignee: "all" },
      ],
    })
      .populate("assignee", "name email _id")
      .populate("createdBy", "name email _id")
      .sort({ createdAt: -1 });

    console.log(` Found ${tasks.length} tasks for user ${req.user.email}`);

    // Log breakdown
    const breakdown = {
      createdByUser: tasks.filter(
        (t) => t.createdBy._id.toString() === req.user._id.toString()
      ).length,
      assignedToUser: tasks.filter(
        (t) =>
          t.assignee &&
          t.assignee._id &&
          t.assignee._id.toString() === req.user._id.toString()
      ).length,
      visibleToAll: tasks.filter((t) => t.assignee === "all").length,
      total: tasks.length,
    };

    console.log("Task breakdown:", breakdown);

    res.json({
      success: true,
      count: tasks.length,
      tasks,
      breakdown,
    });
  } catch (error) {
    console.error(" Get tasks error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
});

// Create new task - WITH ALL USERS SUPPORT
router.post("/", async (req, res) => {
  console.log("Creating new task for user:", req.user?.email, req.user?._id);
  console.log("Task data from frontend:", req.body);

  try {
    const {
      title,
      description,
      status,
      priority,
      assignee,
      assigneeType,
      deadline,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    // Handle assignee based on type
    let finalAssignee = null;
    let finalAssigneeType = "private";

    if (
      assigneeType === "user" &&
      assignee &&
      assignee !== req.user._id.toString()
    ) {
      // Assign to specific user
      finalAssignee = assignee;
      finalAssigneeType = "user";
      console.log(`Task assigned to specific user: ${assignee}`);
    } else if (assigneeType === "all") {
      // Visible to all users
      finalAssignee = "all";
      finalAssigneeType = "all";
      console.log("Task visible to ALL users");
    } else {
      // Private task
      console.log("Task is private (only creator can see)");
    }

    const task = new Task({
      title: title.trim(),
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      assignee: finalAssignee,
      assigneeType: finalAssigneeType,
      createdBy: req.user._id,
      deadline: deadline || null,
      tags: tags || [],
    });

    await task.save();
    console.log(`Task created: ${task._id}`);
    console.log("Task visibility:", finalAssigneeType);

    // Populate references - BUT BE CAREFUL WITH "all"
    await task.populate("createdBy", "name email _id");

    // Only populate assignee if it's a valid ObjectId (not "all")
    if (finalAssigneeType === "user" && finalAssignee) {
      try {
        await task.populate("assignee", "name email _id");
        console.log(" Populated assignee:", task.assignee?.email);
      } catch (error) {
        console.log(
          "Could not populate assignee (might be invalid ID):",
          error.message
        );
      }
    } else if (finalAssigneeType === "all") {
      console.log("Task is for all users - no specific assignee to populate");
    }

    // Get all users for "all" visibility
    let allUsers = [];
    if (finalAssigneeType === "all") {
      allUsers = await User.find({}, { _id: 1, email: 1 });
      console.log(`Task visible to ${allUsers.length} users`);
    }

    // Prepare task data for socket emission
    const taskData = task.toObject();

    // Add assignee info for "all" case
    if (finalAssigneeType === "all") {
      taskData.assignee = "all";
      taskData.assigneeType = "all";
    }

    // Emit socket events
    if (req.io) {
      // Always emit to creator
      req.io.to(req.user._id.toString()).emit("taskCreated", taskData);
      console.log(` Emitted to creator: ${req.user.email}`);

      if (finalAssigneeType === "user" && task.assignee && task.assignee._id) {
        // Emit to specific assignee
        req.io.to(task.assignee._id.toString()).emit("taskCreated", taskData);
        console.log(`Emitted to assignee: ${task.assignee.email}`);
      } else if (finalAssigneeType === "all") {
        // Emit to ALL users (except creator, already done)
        allUsers.forEach((user) => {
          if (user._id.toString() !== req.user._id.toString()) {
            req.io.to(user._id.toString()).emit("taskCreated", taskData);
          }
        });
        console.log(`Emitted to ${allUsers.length - 1} other users`);
      }
    }

    res.status(201).json({
      success: true,
      message:
        finalAssigneeType === "all"
          ? "Task created and visible to all team members!"
          : finalAssigneeType === "user"
          ? "Task created and shared with assignee!"
          : "Task created (private)",
      task: taskData, // Send the prepared task data
      visibility: finalAssigneeType,
    });
  } catch (error) {
    console.error(" Create task error:", error.message);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get team members
router.get("/team-members", async (req, res) => {
  console.log(" Getting team members for:", req.user?.email);

  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("name email role isOnline lastSeen _id")
      .sort({ name: 1 });

    console.log(` Found ${users.length} team members`);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(" Get team members error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch team members",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get single task
router.get("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ createdBy: req.user._id }, { assignee: req.user._id }],
    })
      .populate("assignee", "name email _id")
      .populate("createdBy", "name email _id")
      .populate("comments.user", "name email _id");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to view it",
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
    });
  }
});
// Create new task - WITH ALL USERS SUPPORT
router.post("/", async (req, res) => {
  console.log(" Creating new task for user:", req.user?.email, req.user?._id);
  console.log("Task data from frontend:", req.body);

  try {
    const {
      title,
      description,
      status,
      priority,
      assignee,
      assigneeType,
      deadline,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    // Handle assignee based on type
    let finalAssignee = null;
    let finalAssigneeType = "private";

    if (assigneeType === "user" && assignee && assignee !== req.user._id) {
      // Assign to specific user
      finalAssignee = assignee;
      finalAssigneeType = "user";
      console.log(`Task assigned to specific user: ${assignee}`);
    } else if (assigneeType === "all") {
      // Visible to all users
      finalAssignee = "all";
      finalAssigneeType = "all";
      console.log("Task visible to ALL users");
    } else {
      // Private task
      console.log(" Task is private (only creator can see)");
    }

    const task = new Task({
      title: title.trim(),
      description: description || "",
      status: status || "todo",
      priority: priority || "medium",
      assignee: finalAssignee,
      assigneeType: finalAssigneeType,
      createdBy: req.user._id,
      deadline: deadline || null,
      tags: tags || [],
    });

    await task.save();
    console.log(` Task created: ${task._id}`);
    console.log(" Task visibility:", finalAssigneeType);

    // Populate references
    await task.populate("assignee", "name email _id");
    await task.populate("createdBy", "name email _id");

    // Get all users for "all" visibility
    let allUsers = [];
    if (finalAssigneeType === "all") {
      allUsers = await User.find({}, { _id: 1 });
      console.log(` Task visible to ${allUsers.length} users`);
    }

    // Emit socket events
    if (req.io) {
      const taskData = task.toObject();

      // Always emit to creator
      req.io.to(req.user._id.toString()).emit("taskCreated", taskData);
      console.log(` Emitted to creator: ${req.user.email}`);

      if (finalAssigneeType === "user" && task.assignee && task.assignee._id) {
        // Emit to specific assignee
        req.io.to(task.assignee._id.toString()).emit("taskCreated", taskData);
        console.log(` Emitted to assignee: ${task.assignee.email}`);
      } else if (finalAssigneeType === "all") {
        // Emit to ALL users (except creator, already done)
        allUsers.forEach((user) => {
          if (user._id.toString() !== req.user._id.toString()) {
            req.io.to(user._id.toString()).emit("taskCreated", taskData);
          }
        });
        console.log(` Emitted to ${allUsers.length - 1} other users`);
      }
    }

    res.status(201).json({
      success: true,
      message:
        finalAssigneeType === "all"
          ? "Task created and visible to all team members!"
          : finalAssigneeType === "user"
          ? "Task created and shared with assignee!"
          : "Task created (private)",
      task,
      visibility: finalAssigneeType,
    });
  } catch (error) {
    console.error(" Create task error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
// Update task
router.put("/:id", async (req, res) => {
  try {
    const { title, description, status, priority, assignee, deadline, tags } =
      req.body;

    // Find task that user has access to
    let task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { assignee: req.user._id },
        { assignee: "all" },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to update it",
      });
    }

    // Save old assignee for socket notifications
    const oldAssignee = task.assignee;

    // Update fields
    task.title = title || task.title;
    task.description = description || task.description;
    task.status = status || task.status;
    task.priority = priority || task.priority;
    task.assignee = assignee || task.assignee;
    task.deadline = deadline || task.deadline;
    task.tags = tags || task.tags;
    task.updatedAt = Date.now();

    await task.save();

    // Populate references
    await task.populate("assignee", "name email _id");
    await task.populate("createdBy", "name email _id");

    // Emit socket event to relevant users
    if (req.io) {
      const taskData = task.toObject();

      // Notify task creator
      req.io.to(task.createdBy._id.toString()).emit("taskUpdated", taskData);

      // Notify new assignee if different from creator
      if (
        task.assignee &&
        task.assignee._id.toString() !== task.createdBy._id.toString()
      ) {
        req.io.to(task.assignee._id.toString()).emit("taskUpdated", taskData);
      }

      // Notify old assignee if they were removed or changed
      if (
        oldAssignee &&
        oldAssignee !== "all" &&
        task.assignee &&
        task.assignee !== "all" &&
        oldAssignee.toString() !== task.assignee._id.toString() &&
        oldAssignee.toString() !== task.createdBy._id.toString()
      ) {
        req.io.to(oldAssignee.toString()).emit("taskDeleted", task._id);
      }
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
});

// Update task status
router.patch("/:id/status", async (req, res) => {
  console.log(`Updating task status: ${req.params.id} -> ${req.body.status}`);
  console.log("User making request:", req.user?.email);

  try {
    const { status } = req.body;

    if (!status) {
      console.error(" No status provided in request body");
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    if (!["todo", "inprogress", "done"].includes(status)) {
      console.error("Invalid status value:", status);
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be todo, inprogress, or done",
      });
    }

    console.log(` Looking for task: ${req.params.id}`);
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { createdBy: req.user._id },
        { assignee: req.user._id },
        { assignee: "all" },
      ],
    });

    if (!task) {
      console.error(" Task not found or no permission:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to update it",
      });
    }

    console.log(` Task found: ${task.title}, current status: ${task.status}`);

    // Update only the status field
    task.status = status;

    console.log("Saving task...");
    // Save the task
    await task.save();
    console.log(" Task saved successfully");

    // Populate for socket emission
    console.log("Populating references...");
    await task.populate("assignee", "name email _id");
    await task.populate("createdBy", "name email _id");

    // Emit socket event
    if (req.io) {
      console.log("Emitting socket event...");
      const taskData = task.toObject();

      // Notify task creator
      req.io.to(task.createdBy._id.toString()).emit("taskUpdated", taskData);
      console.log(` Emitted to creator: ${task.createdBy.email}`);

      // Notify assignee if different from creator
      if (task.assignee && task.assignee !== "all") {
        if (
          task.assignee._id &&
          task.assignee._id.toString() !== task.createdBy._id.toString()
        ) {
          req.io.to(task.assignee._id.toString()).emit("taskUpdated", taskData);
          console.log(` Emitted to assignee: ${task.assignee.email}`);
        }
      } else if (task.assignee === "all") {
        // Notify all users (broadcast)
        console.log(" Task is visible to all, broadcasting update...");
        const allUsers = await User.find({}, { _id: 1 });
        allUsers.forEach((user) => {
          if (user._id.toString() !== task.createdBy._id.toString()) {
            req.io.to(user._id.toString()).emit("taskUpdated", taskData);
          }
        });
        console.log(`Broadcast task update to ${allUsers.length} users`);
      }
    }

    console.log(`Status update complete: ${task._id} -> ${task.status}`);
    res.json({
      success: true,
      message: "Task status updated successfully",
      task,
    });
  } catch (error) {
    console.error("UPDATE STATUS ERROR ");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Task ID:", req.params.id);
    console.error("Status requested:", req.body.status);
    console.error("User ID:", req.user?._id);

    res.status(500).json({
      success: false,
      message: "Failed to update task status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      details:
        process.env.NODE_ENV === "development"
          ? {
              taskId: req.params.id,
              requestedStatus: req.body.status,
              errorMessage: error.message,
            }
          : undefined,
    });
  }
});

// Delete task
router.delete("/:id", async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user._id, // Only creator can delete
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to delete it",
      });
    }

    const taskId = task._id;
    const createdBy = task.createdBy;
    const assignee = task.assignee;

    await task.deleteOne();

    // Emit socket event to relevant users
    if (req.io) {
      // Notify creator
      req.io.to(createdBy.toString()).emit("taskDeleted", taskId);

      // Notify assignee if exists and different from creator
      if (assignee && assignee.toString() !== createdBy.toString()) {
        req.io.to(assignee.toString()).emit("taskDeleted", taskId);
      }
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});

// Add comment to task
router.post("/:id/comments", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ createdBy: req.user._id }, { assignee: req.user._id }],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found or you don't have permission to comment",
      });
    }

    task.comments.push({
      user: req.user._id,
      text: text.trim(),
    });

    await task.save();

    // Populate comment user
    await task.populate({
      path: "comments.user",
      select: "name email _id",
    });

    // Populate assignee and creator for socket
    await task.populate("assignee", "name email _id");
    await task.populate("createdBy", "name email _id");

    // Emit socket event to relevant users
    if (req.io) {
      const taskData = task.toObject();

      req.io.to(task.createdBy._id.toString()).emit("taskUpdated", taskData);

      if (
        task.assignee &&
        task.assignee._id.toString() !== task.createdBy._id.toString()
      ) {
        req.io.to(task.assignee._id.toString()).emit("taskUpdated", taskData);
      }
    }

    res.json({
      success: true,
      message: "Comment added successfully",
      comments: task.comments,
    });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
});

// Helper function to safely populate tasks
const safePopulateTasks = async (tasks, userId) => {
  return Promise.all(
    tasks.map(async (task) => {
      const taskObj = task.toObject();

      // Populate createdBy
      if (task.createdBy && typeof task.createdBy === "object") {
        taskObj.createdBy = task.createdBy;
      } else {
        // If not populated, populate it
        const populated = await Task.findById(task._id).populate(
          "createdBy",
          "name email _id"
        );
        taskObj.createdBy = populated.createdBy;
      }

      // Handle assignee
      if (task.assignee === "all") {
        taskObj.assignee = "all";
        taskObj.assigneeType = "all";
      } else if (task.assignee && task.assignee !== "all") {
        // Try to populate assignee if it's a valid ObjectId
        try {
          if (typeof task.assignee === "string") {
            // It's an ObjectId string, try to populate
            const populated = await Task.findById(task._id).populate(
              "assignee",
              "name email _id"
            );
            taskObj.assignee = populated.assignee;
          } else if (typeof task.assignee === "object" && task.assignee._id) {
            // Already populated
            taskObj.assignee = task.assignee;
          } else {
            taskObj.assignee = null;
          }
        } catch (error) {
          console.log(
            `Error populating assignee for ${task._id}:`,
            error.message
          );
          taskObj.assignee = null;
        }
      } else {
        taskObj.assignee = null;
      }

      return taskObj;
    })
  );
};

// Debug: Get all tasks in system
router.get("/debug/all-tasks", async (req, res) => {
  try {
    const allTasks = await Task.find({})
      .populate("assignee", "name email _id")
      .populate("createdBy", "name email _id")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalTasks: allTasks.length,
      tasks: allTasks,
      currentUser: {
        _id: req.user._id,
        email: req.user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug: Check specific user's visibility
router.get("/debug/user-tasks/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const userTasks = await Task.find({
      $or: [{ createdBy: userId }, { assignee: userId }],
    })
      .populate("assignee", "name email _id")
      .populate("createdBy", "name email _id");

    res.json({
      success: true,
      userId,
      totalTasks: userTasks.length,
      tasks: userTasks,
      breakdown: {
        createdByUser: userTasks.filter(
          (t) => t.createdBy._id.toString() === userId
        ).length,
        assignedToUser: userTasks.filter(
          (t) => t.assignee && t.assignee._id.toString() === userId
        ).length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Debug: Check tasks visible to all
router.get("/debug/all-visible-tasks", async (req, res) => {
  try {
    const allVisibleTasks = await Task.find({ assignee: "all" })
      .populate("createdBy", "name email _id")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: allVisibleTasks.length,
      tasks: allVisibleTasks,
      currentUser: {
        _id: req.user._id,
        email: req.user.email,
      },
      message: `Found ${allVisibleTasks.length} tasks visible to all users`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
