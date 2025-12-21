const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["todo", "inprogress", "done"],
    default: "todo",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  assignee: {
    type: mongoose.Schema.Types.Mixed,
  },
  assigneeType: {
    type: String,
    enum: ["private", "user", "all"],
    default: "private",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deadline: {
    type: Date,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      text: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// OPTION A: Use async function (NO next parameter)
taskSchema.pre("save", async function () {
  this.updatedAt = Date.now();
  // Don't call next() in async functions
});

// OPTION B: Remove ALL middleware and update manually in routes
// NO MIDDLEWARE AT ALL

const Task = mongoose.model("Task", taskSchema);
console.log(" Task model loaded - SIMPLE VERSION");

module.exports = Task;
