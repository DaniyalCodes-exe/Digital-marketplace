import mongoose, { type Document } from "mongoose";

export interface IpartnerPayout extends Document {
  partnerId: mongoose.Types.ObjectId;
  partnerName: string;
  partnerEmail: string;
  amount: number;
  paymentMethod: "upi" | "bank";
  upiId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  adminId: mongoose.Types.ObjectId;
  status: "completed";
  createdAt: Date;
}

const partnerPayoutSchema = new mongoose.Schema<IpartnerPayout>(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    partnerName: { type: String, required: true, trim: true },
    partnerEmail: { type: String, required: true, trim: true, lowercase: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: ["upi", "bank"], required: true },
    upiId: { type: String, default: "" },
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: { type: String, enum: ["completed"], default: "completed" },
  },
  { timestamps: true },
);

export default mongoose.model<IpartnerPayout>("PartnerPayout", partnerPayoutSchema);
