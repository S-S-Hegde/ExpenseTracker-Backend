import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import advisorRoutes from "./routes/advisorRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded receipts and documents statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "AuraLedger MERN Backend",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected/offline",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/advisor", advisorRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack || err.message);
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

// MongoDB Connection with Graceful Fallback
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/auraledger";

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 3000,
  })
  .then(() => {
    console.log(" MongoDB Connected Successfully to:", MONGO_URI);
  })
  .catch((err) => {
    console.warn("⚠️ MongoDB offline or unreachable:", err.message);
    console.warn(" Server is running in resilient mode.");
  });

// Start Express Server
app.listen(PORT, () => {
  console.log(` AuraLedger Express Backend running on http://localhost:${PORT}`);
});
