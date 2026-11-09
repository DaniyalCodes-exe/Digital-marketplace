import mongoose from "mongoose";
import type { Document } from "mongoose";

export interface Iorder extends Document {
  productId: mongoose.Types.ObjectId;
  partnerId: mongoose.Types.ObjectId;

  productTittle: string;
  productPrice: number;

  links: {
    tittle: string;
    url: string;
  }[];
  partnerEmail: string;
  //customer details
  customerName: string;
  customerEmail: string;
  //razorpay
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  paymentStatus: "pending" | "success" | "failed";
  //Revenue split
  partnerAmount: number;
  adminAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema<Iorder>(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
    },
    partnerId: {
      type: mongoose.Types.ObjectId,
      required: true,
      index: true,
    },

    productTittle: {
      type: String,
      required: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    partnerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    links: [
      {
        tittle: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,

          trim: true,
        },
      },
    ],
    customerName: {
      type: String,
      required: true,

      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
      index: true,
    },
    partnerAmount: {
      type: Number,
      default: 0,
    },
    adminAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);
const Order= mongoose.model("order",orderSchema)
export default Order
