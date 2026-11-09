import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import redis from "../../../../shared/redis/redis.js";
import User from "../model/user.model.js";

declare global {
  namespace Express {
    interface Request {
      adminUser?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.cookies?.session;
    if (!sessionId) {
      return res.status(401).json({ success: false, message: "Please sign in." });
    }

    const session = await redis.get(`session:${sessionId}`);
    if (!session) {
      return res.status(401).json({ success: false, message: "Your session has expired." });
    }

    const sessionData: unknown = JSON.parse(session);
    if (
      typeof sessionData !== "object" ||
      sessionData === null ||
      !("userId" in sessionData) ||
      typeof sessionData.userId !== "string" ||
      !mongoose.Types.ObjectId.isValid(sessionData.userId)
    ) {
      return res.status(401).json({ success: false, message: "Your session is invalid." });
    }

    const admin = await User.findOne({
      _id: sessionData.userId,
      role: "admin",
      isActive: true,
    })
      .select("name email")
      .lean();
    if (!admin) {
      return res.status(403).json({ success: false, message: "Admin access is required." });
    }

    req.adminUser = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
    };
    return next();
  } catch {
    return res.status(500).json({ success: false, message: "Could not verify admin access." });
  }
}
