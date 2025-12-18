const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const router = express.Router();

// Validation middleware
const validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const validateLogin = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// Register user
router.post("/register", validateRegister, async (req, res) => {
  console.log(" Registration attempt");

  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(" Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    console.log(` Checking if user exists: ${normalizedEmail}`);

    // Check if user exists
    let existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      console.log(`User already exists: ${normalizedEmail}`);
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    console.log(" User doesn't exist, hashing password...");

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log(" Password hashed, creating user...");

    // Create user with hashed password
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      isOnline: false,
      lastSeen: new Date(),
    });

    await user.save();
    console.log(`User created: ${user.email}, ID: ${user._id}`);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "development_secret_123",
      { expiresIn: "7d" }
    );

    // Prepare response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error.message);
    console.error("Full error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Login user
router.post("/login", validateLogin, async (req, res) => {
  console.log(" Login attempt");

  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Login validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    console.log(` Looking for user: ${normalizedEmail}`);

    // Find user
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log(`User not found: ${normalizedEmail}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(` User found: ${user.email}`);

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(` Password incorrect for: ${user.email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(` Password correct for: ${user.email}`);

    // Update user status (NO pre-save hook to cause issues)
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "development_secret_123",
      { expiresIn: "7d" }
    );

    // Prepare response without password
    const userResponse = user.toObject();
    delete userResponse.password;

    console.log(` Login successful for: ${user.email}`);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error(" LOGIN ERROR:", error.message);
    console.error("Full error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  console.log(" Get current user request");

  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      console.log(" No token provided");
      return res.status(401).json({
        success: false,
        message: "No authentication token",
      });
    }

    console.log(" Verifying token...");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "development_secret_123"
    );

    console.log(` Token valid for user ID: ${decoded.userId}`);

    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      console.log(` User not found for ID: ${decoded.userId}`);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(` User found: ${user.email}`);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(" GET /me ERROR:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// Health check
router.get("/health", (req, res) => {
  console.log("🩺 Auth health check");
  res.json({
    success: true,
    message: "Auth service is healthy",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
