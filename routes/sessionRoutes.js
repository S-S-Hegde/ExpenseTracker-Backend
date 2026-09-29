import express from "express";
import { Store } from "../data/store.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET all sessions
router.get("/", authenticateToken, async (req, res) => {
  try {
    const sessions = await Store.getSessions();
    res.json(sessions);
  } catch (err) {
    console.error("Fetch sessions error:", err);
    res.status(500).json({ message: "Server error fetching sessions" });
  }
});

// POST save a session snapshot
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, date, itemCount, totalAmount, expensesSnapshot } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Session name is required" });
    }

    const session = await Store.addSession({
      name,
      date: date || new Date().toISOString().split("T")[0],
      itemCount: itemCount || 0,
      totalAmount: totalAmount || 0,
      expensesSnapshot: Array.isArray(expensesSnapshot) ? expensesSnapshot : [],
      userId: req.user ? req.user.id : null,
    });

    res.status(201).json(session);
  } catch (err) {
    console.error("Save session error:", err);
    res.status(500).json({ message: "Server error saving session" });
  }
});

// DELETE a session
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deleted = await Store.deleteSession(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Session not found" });
    }
    res.json({ message: "Session deleted", id: req.params.id });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ message: "Server error deleting session" });
  }
});

export default router;
