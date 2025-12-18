// backend/routes/team.js (new file)
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");

// Apply auth middleware to all routes
router.use(authMiddleware);

// Send invite
router.post("/invite", async (req, res) => {
  try {
    const { email, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    console.log(` Sending invite to ${email} with role ${role}`);

    res.json({
      success: true,
      message: "Invitation sent successfully",
      data: {
        email,
        role,
        inviteId: `inv_${Date.now()}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  } catch (error) {
    console.error("Invite error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send invitation",
    });
  }
});

// Get pending invites
router.get("/invites", async (req, res) => {
  try {
    // In a real app, fetch from Invite model
    // For now, return mock data
    const mockInvites = [
      {
        id: "inv_1",
        email: "invite1@example.com",
        role: "user",
        sentBy: req.user._id,
        sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: "pending",
      },
    ];

    res.json({
      success: true,
      invites: mockInvites,
    });
  } catch (error) {
    console.error("Get invites error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invites",
    });
  }
});

module.exports = router;
