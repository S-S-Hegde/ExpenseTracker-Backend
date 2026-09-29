import express from "express";
import { Store } from "../data/store.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET all expenses
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { category, type, search, sortBy, sortOrder } = req.query;
    const expenses = await Store.getExpenses({ category, type, search, sortBy, sortOrder });
    res.json(expenses);
  } catch (err) {
    console.error("Fetch expenses error:", err);
    res.status(500).json({ message: "Server error fetching expenses" });
  }
});

// POST create expense
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      merchant,
      category,
      amount,
      subtotal,
      tax,
      date,
      paymentMethod,
      isRecurring,
      type,
      notes,
      lineItems,
      receiptUrl,
    } = req.body;

    if (!merchant || amount === undefined || !date) {
      return res.status(400).json({ message: "Merchant, amount, and date are required" });
    }

    const saved = await Store.addExpense({
      merchant,
      category: category || "General Expense",
      amount: parseFloat(amount),
      subtotal: subtotal !== undefined ? parseFloat(subtotal) : parseFloat(amount),
      tax: tax !== undefined ? parseFloat(tax) : 0,
      date,
      paymentMethod: paymentMethod || "UPI Transfer",
      isRecurring: Boolean(isRecurring),
      type: type || "Discretionary",
      notes: notes || "",
      lineItems: Array.isArray(lineItems) ? lineItems : [],
      receiptUrl: receiptUrl || "",
      userId: req.user ? req.user.id : null,
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error("Create expense error:", err);
    res.status(500).json({ message: "Server error saving expense" });
  }
});

// PUT update expense
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const updated = await Store.updateExpense(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(updated);
  } catch (err) {
    console.error("Update expense error:", err);
    res.status(500).json({ message: "Server error updating expense" });
  }
});

// DELETE single expense
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const deleted = await Store.deleteExpense(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted successfully", id: req.params.id });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ message: "Server error deleting expense" });
  }
});

// POST bulk delete expenses
router.post("/bulk-delete", authenticateToken, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Array of expense IDs required" });
    }

    await Store.bulkDeleteExpenses(ids);
    res.json({ message: `Successfully deleted ${ids.length} expenses` });
  } catch (err) {
    console.error("Bulk delete error:", err);
    res.status(500).json({ message: "Server error during bulk delete" });
  }
});

export default router;
