import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    plan: {
      type: String,
      default: "Founder Pro",
    },
    avatar: {
      type: String,
      default: "AV",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
