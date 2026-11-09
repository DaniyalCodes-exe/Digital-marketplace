import mongoose from "mongoose";
import type { Request, Response } from "express";
import User from "../model/user.model.js";
import PartnerPayout from "../model/partnerPayout.model.js";

function getDatabase() {
  const database = mongoose.connection.db;
  if (!database) {
    throw new Error("Database connection is unavailable.");
  }
  return database;
}

export const getAdmin = (req: Request, res: Response) => {
  return res.status(200).json({ success: true, admin: req.adminUser });
};

export const getAdminDashboard = async (_req: Request, res: Response) => {
  try {
    const database = getDatabase();
    const [orderTotals, totalPartners, totalProducts] = await Promise.all([
      database.collection("orders").aggregate([
        { $match: { paymentStatus: "success" } },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$productPrice" },
            adminEarnings: { $sum: "$adminAmount" },
            paidOrders: { $sum: 1 },
          },
        },
      ]).toArray(),
      User.countDocuments({ role: "partner" }),
      database.collection("products").countDocuments(),
    ]);

    const totals = orderTotals[0] ?? {};
    return res.status(200).json({
      success: true,
      admin: _req.adminUser,
      stats: {
        totalSales: Number(totals.totalSales ?? 0),
        adminEarnings: Number(totals.adminEarnings ?? 0),
        totalPartners,
        totalProducts,
        paidOrders: Number(totals.paidOrders ?? 0),
      },
    });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load admin dashboard." });
  }
};

export const getAdminPartners = async (_req: Request, res: Response) => {
  try {
    const database = getDatabase();
    const partners = await User.find({ role: "partner" })
      .select("name email isActive totalSales totalRevenue paidOutRevenue paymentDetails")
      .sort({ totalRevenue: -1 })
      .lean();
    const productCounts = await database
      .collection("products")
      .aggregate([{ $group: { _id: "$partnerID", count: { $sum: 1 } } }])
      .toArray();
    const productsByPartner = new Map(
      productCounts.map((item) => [item._id.toString(), Number(item.count)]),
    );

    return res.status(200).json({
      success: true,
      partners: partners.map((partner) => ({
        _id: partner._id.toString(),
        name: partner.name,
        email: partner.email,
        isActive: partner.isActive,
        totalSales: partner.totalSales,
        totalRevenue: partner.totalRevenue,
        products: productsByPartner.get(partner._id.toString()) ?? 0,
        paidOutRevenue: partner.paidOutRevenue ?? 0,
        payableAmount: Math.max(0, partner.totalRevenue - (partner.paidOutRevenue ?? 0)),
        paymentDetails: partner.paymentDetails,
      })),
    });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load partners." });
  }
};

export const getAdminPayouts = async (_req: Request, res: Response) => {
  try {
    const payouts = await PartnerPayout.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.status(200).json({ success: true, payouts });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load payout history." });
  }
};

export const markPartnerPayoutCompleted = async (req: Request, res: Response) => {
  let partnerId: string;
  try {
    const rawPartnerId = req.params.partnerId;
    if (typeof rawPartnerId !== "string" || !mongoose.Types.ObjectId.isValid(rawPartnerId)) {
      return res.status(400).json({ success: false, message: "Invalid partner." });
    }
    partnerId = rawPartnerId;

    const partner = await User.findOne({
      _id: partnerId,
      role: "partner",
      isActive: true,
    });
    if (!partner) {
      return res.status(404).json({ success: false, message: "Active partner not found." });
    }

    const paymentDetails = partner.paymentDetails;
    const method = paymentDetails?.method ?? "upi";
    if (
      (method === "upi" && !paymentDetails?.upiId?.trim()) ||
      (method === "bank" &&
        (!paymentDetails?.accountHolderName?.trim() ||
          !paymentDetails?.accountNumber?.trim() ||
          !paymentDetails?.ifscCode?.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "The partner has not completed their payout details.",
      });
    }

    const amount = Math.round(
      Math.max(0, partner.totalRevenue - (partner.paidOutRevenue ?? 0)) * 100,
    ) / 100;
    if (amount <= 0) {
      return res.status(409).json({ success: false, message: "There is no payable balance." });
    }

    const updatedPartner = await User.findOneAndUpdate(
      {
        _id: partner._id,
        role: "partner",
        isActive: true,
        $expr: {
          $gte: [
            { $subtract: ["$totalRevenue", { $ifNull: ["$paidOutRevenue", 0] }] },
            amount,
          ],
        },
      },
      { $inc: { paidOutRevenue: amount } },
      { new: true },
    );
    if (!updatedPartner) {
      return res.status(409).json({
        success: false,
        message: "The payable balance changed. Refresh and try again.",
      });
    }

    try {
      const payout = await PartnerPayout.create({
        partnerId: updatedPartner._id,
        partnerName: updatedPartner.name,
        partnerEmail: updatedPartner.email,
        amount,
        paymentMethod: method,
        upiId: paymentDetails.upiId ?? "",
        accountHolderName: paymentDetails.accountHolderName ?? "",
        accountNumber: paymentDetails.accountNumber ?? "",
        ifscCode: paymentDetails.ifscCode ?? "",
        adminId: new mongoose.Types.ObjectId(req.adminUser?.id),
        status: "completed",
      });
      return res.status(201).json({
        success: true,
        message: "Payout recorded as completed.",
        payout,
      });
    } catch (error) {
      await User.updateOne({ _id: updatedPartner._id }, { $inc: { paidOutRevenue: -amount } });
      throw error;
    }
  } catch {
    return res.status(500).json({ success: false, message: "Could not record this payout." });
  }
};
