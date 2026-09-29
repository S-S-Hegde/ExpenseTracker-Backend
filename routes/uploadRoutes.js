import express from "express";
import { upload } from "../middleware/upload.js";

const router = express.Router();

// Upload receipt image or PDF
router.post("/", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: "File uploaded successfully",
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "File upload failed: " + err.message });
  }
});

export default router;
