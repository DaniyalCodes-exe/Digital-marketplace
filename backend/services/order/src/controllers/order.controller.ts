import type { Request, Response } from "express";
import { razorpay } from "../config/razorpay.js";
import Order from "../models/order.model.js";
import { createHmac } from "crypto";
import mongoose from "mongoose";
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { ProductId, customerName, customerEmail } = req.body;
    if (
      !ProductId ||
      !customerName?.trim() ||
      !customerEmail?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Product, customer name, and customer email are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(ProductId)) {
      return res.status(400).json({ success: false, message: "Invalid product." });
    }

    const database = mongoose.connection.db;
    if (!database) {
      throw new Error("Database connection is unavailable.");
    }

    const product = await database.collection("products").findOne({
      _id: new mongoose.Types.ObjectId(ProductId),
      status: "published",
    });
    if (!product) {
      return res.status(404).json({ success: false, message: "Published product not found." });
    }

    const partner = await database.collection("users").findOne(
      { _id: product.partnerID },
      { projection: { email: 1 } },
    );
    if (!partner?.email) {
      return res.status(404).json({ success: false, message: "Product creator not found." });
    }

    const amount = Number(product.price);
    const links = Array.isArray(product.links)
      ? product.links
          .filter((link) => typeof link?.url === "string")
          .map((link) => ({
            tittle:
              typeof link.title === "string"
                ? link.title
                : typeof link.tittle === "string"
                  ? link.tittle
                  : "Download",
            url: link.url,
          }))
      : [];
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });
    const order = await Order.create({
      productId: product._id,
      partnerId: product.partnerID,
      productPrice: amount,
      customerName,
      customerEmail,
      partnerEmail: partner.email,
      productTittle: product.tittle,
      links,
      razorpayOrderId: razorpayOrder.id,
      paymentStatus: "pending",
      partnerAmount: amount * 0.95,
      adminAmount: amount * 0.05,
    });
    return res.status(201).json({
      success: true,
      message: "order created successfully",
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to create order",
    });
  }
};
export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "payment deatils missing",
      });
    }
    const generatedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET!,
    )
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,
    });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }
    if (order.paymentStatus === "success") {
      return res.status(200).json({ success: true, message: "Payment already verified.", order });
    }
    if (generatedSignature !== razorpay_signature) {
      order.paymentStatus = "failed";
      await order.save();
      return res.status(400).json({
        success: false,
        message: "payment verification failed",
      });
    }

    order.paymentStatus = "success";
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();
    const database = mongoose.connection.db;
    if (database) {
      await Promise.all([
        database.collection("products").updateOne(
          { _id: order.productId },
          { $inc: { totalSales: 1, totalRevenue: order.productPrice } },
        ),
        database.collection("users").updateOne(
          { _id: order.partnerId },
          { $inc: { totalSales: 1, totalRevenue: order.partnerAmount } },
        ),
      ]);
    }
    return res.status(200).json({
      success: true,
      message: "payent verified",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to create order",
    });
  }
};
