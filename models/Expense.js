import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  price: { type: Number, required: true },
});

const expenseSchema = new mongoose.Schema(
  {
    merchant: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: "General Expense",
    },
    amount: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    date: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      default: "UPI Transfer",
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["Essential", "Discretionary"],
      default: "Discretionary",
    },
    notes: {
      type: String,
      default: "",
    },
    lineItems: [lineItemSchema],
    receiptUrl: {
      type: String,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
