import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, "db.json");

// Helper to read local JSON db
function readLocalDB() {
  try {
    if (!fs.existsSync(dbFile)) {
      const initial = { users: [], expenses: [], sessions: [] };
      fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(dbFile, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], expenses: [], sessions: [] };
  }
}

// Helper to write local JSON db
function writeLocalDB(data) {
  try {
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write to local db file:", e);
  }
}

export const Store = {
  isMongoConnected() {
    return mongoose.connection.readyState === 1;
  },

  // EXPENSES
  async getExpenses(filter = {}) {
    if (this.isMongoConnected()) {
      return await Expense.find(filter).sort({ date: -1 });
    }
    const db = readLocalDB();
    let list = db.expenses || [];
    if (filter.category && filter.category !== "All") {
      list = list.filter((e) => e.category === filter.category);
    }
    if (filter.type && filter.type !== "All") {
      if (filter.type === "Recurring") {
        list = list.filter((e) => e.isRecurring);
      } else {
        list = list.filter((e) => e.type === filter.type);
      }
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.merchant.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.paymentMethod.toLowerCase().includes(q)
      );
    }
    return list;
  },

  async addExpense(expenseData) {
    if (this.isMongoConnected()) {
      const doc = new Expense(expenseData);
      return await doc.save();
    }
    const db = readLocalDB();
    const item = {
      _id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      merchant: expenseData.merchant,
      category: expenseData.category || "General Expense",
      amount: parseFloat(expenseData.amount) || 0,
      subtotal: parseFloat(expenseData.subtotal) || parseFloat(expenseData.amount) || 0,
      tax: parseFloat(expenseData.tax) || 0,
      date: expenseData.date || new Date().toISOString().split("T")[0],
      paymentMethod: expenseData.paymentMethod || "UPI Transfer",
      isRecurring: Boolean(expenseData.isRecurring),
      type: expenseData.type || "Discretionary",
      notes: expenseData.notes || "",
      lineItems: expenseData.lineItems || [],
      receiptUrl: expenseData.receiptUrl || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.expenses.unshift(item);
    writeLocalDB(db);
    return item;
  },

  async updateExpense(id, updateData) {
    if (this.isMongoConnected()) {
      return await Expense.findByIdAndUpdate(id, updateData, { new: true });
    }
    const db = readLocalDB();
    const idx = db.expenses.findIndex((e) => e._id === id || e.id === id);
    if (idx === -1) return null;
    db.expenses[idx] = { ...db.expenses[idx], ...updateData, updatedAt: new Date().toISOString() };
    writeLocalDB(db);
    return db.expenses[idx];
  },

  async deleteExpense(id) {
    if (this.isMongoConnected()) {
      return await Expense.findByIdAndDelete(id);
    }
    const db = readLocalDB();
    const exists = db.expenses.some((e) => e._id === id || e.id === id);
    db.expenses = db.expenses.filter((e) => e._id !== id && e.id !== id);
    writeLocalDB(db);
    return exists ? { _id: id } : null;
  },

  async bulkDeleteExpenses(ids) {
    if (this.isMongoConnected()) {
      return await Expense.deleteMany({ _id: { $in: ids } });
    }
    const db = readLocalDB();
    db.expenses = db.expenses.filter((e) => !ids.includes(e._id) && !ids.includes(e.id));
    writeLocalDB(db);
    return { deletedCount: ids.length };
  },

  // SESSIONS
  async getSessions() {
    if (this.isMongoConnected()) {
      return await Session.find().sort({ createdAt: -1 });
    }
    const db = readLocalDB();
    return db.sessions || [];
  },

  async addSession(sessionData) {
    if (this.isMongoConnected()) {
      const doc = new Session(sessionData);
      return await doc.save();
    }
    const db = readLocalDB();
    const item = {
      _id: `sess-${Date.now()}`,
      name: sessionData.name,
      date: sessionData.date || new Date().toISOString().split("T")[0],
      itemCount: sessionData.itemCount || 0,
      totalAmount: sessionData.totalAmount || 0,
      expensesSnapshot: sessionData.expensesSnapshot || [],
      createdAt: new Date().toISOString(),
    };
    db.sessions.unshift(item);
    writeLocalDB(db);
    return item;
  },

  async deleteSession(id) {
    if (this.isMongoConnected()) {
      return await Session.findByIdAndDelete(id);
    }
    const db = readLocalDB();
    db.sessions = db.sessions.filter((s) => s._id !== id && s.id !== id);
    writeLocalDB(db);
    return { _id: id };
  },

  // USERS
  async findUserByEmail(email) {
    if (this.isMongoConnected()) {
      return await User.findOne({ email });
    }
    const db = readLocalDB();
    return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  async addUser(userData) {
    if (this.isMongoConnected()) {
      const doc = new User(userData);
      return await doc.save();
    }
    const db = readLocalDB();
    const item = {
      _id: `usr-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      currency: userData.currency || "INR",
      plan: userData.plan || "Founder Pro",
      avatar: userData.avatar || "AV",
      createdAt: new Date().toISOString(),
    };
    db.users.push(item);
    writeLocalDB(db);
    return item;
  },

  async findUserById(id) {
    if (this.isMongoConnected()) {
      return await User.findById(id).select("-password");
    }
    const db = readLocalDB();
    const u = db.users.find((user) => user._id === id);
    if (!u) return null;
    const { password, ...safeUser } = u;
    return safeUser;
  },
};
