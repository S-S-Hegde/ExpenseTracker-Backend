import express from "express";
import { Store } from "../data/store.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET dynamic AI Financial Advisor metrics calculated from live database
router.get("/metrics", authenticateToken, async (req, res) => {
  try {
    const expenses = await Store.getExpenses();

    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown
    const categoryTotals = expenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});

    // Recurring subscriptions
    const recurringExpenses = expenses.filter(
      (e) => e.isRecurring || e.category === "Subscriptions"
    );
    const recurringTotal = recurringExpenses.reduce((sum, e) => sum + e.amount, 0);
    const annualRecurringDrain = recurringTotal * 12;

    // 50/30/20 Rule: Needs vs Wants
    const needsSpend = expenses
      .filter(
        (e) =>
          ["Groceries", "Utilities", "Healthcare"].includes(e.category) ||
          e.type === "Essential"
      )
      .reduce((sum, e) => sum + e.amount, 0);

    const wantsSpend = expenses
      .filter(
        (e) =>
          ["Dining", "Subscriptions", "Shopping", "Travel & Transport"].includes(
            e.category
          ) && e.type !== "Essential"
      )
      .reduce((sum, e) => sum + e.amount, 0);

    // Health Score
    const discretionaryRatio = totalSpend > 0 ? wantsSpend / totalSpend : 0.3;
    let healthScore = Math.round(100 - discretionaryRatio * 50);
    if (recurringTotal > 5000) healthScore -= 10;
    if (healthScore > 100) healthScore = 100;
    if (healthScore < 40) healthScore = 45;

    res.json({
      totalSpend,
      expenseCount: expenses.length,
      categoryTotals,
      recurringExpenses,
      recurringTotal,
      annualRecurringDrain,
      needsSpend,
      wantsSpend,
      healthScore: expenses.length === 0 ? 100 : healthScore,
    });
  } catch (err) {
    console.error("Advisor metrics error:", err);
    res.status(500).json({ message: "Server error computing metrics" });
  }
});

export default router;
