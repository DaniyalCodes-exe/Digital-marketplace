import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { app } from "../configs/firebase.js";
import { getAuth } from "firebase-admin/auth";
import user from "../model/user.model.js";
import redis from "../../../../shared/redis/redis.js";

export const login = async (req: Request, res: Response) => {
  try {
    const token: unknown = req.body?.token;
    if (typeof token !== "string" || token.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "A Firebase ID token is required." });
    }

    let decoded;
    try {
      decoded = await getAuth(app).verifyIdToken(token);
    } catch {
      return res
        .status(401)
        .json({
          success: false,
          message: "The Firebase ID token is invalid or expired.",
        });
    }

    if (!decoded.email) {
      return res
        .status(400)
        .json({
          success: false,
          message: "A verified email address is required.",
        });
    }

    let userDoc = await user.findOne({ firebaseuid: decoded.uid });
    let created = false;

    if (!userDoc) {
      try {
        userDoc = await user.create({
          name: decoded.name || decoded.email.split("@")[0],
          email: decoded.email,
          firebaseuid: decoded.uid,
          profilePicture: decoded.picture || null,
        });
        created = true;
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === 11000
        ) {
          return res.status(409).json({
            success: false,
            message:
              "An account with this email already exists. Please contact support.",
          });
        }
        throw error;
      }
    }

    const sessionId = randomUUID();

    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        userId: userDoc._id,
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role,
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",

      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      sessionCreated: true,
      userDoc: {
        _id: userDoc._id,
        firebaseuid: userDoc.firebaseuid,
        name: userDoc.name,
        email: userDoc.email,
        profilePicture: userDoc.profilePicture ?? null,
        role: userDoc.role,
        partnerProfile: userDoc.partnerProfile,
        totalSales: userDoc.totalSales,
        totalRevenue: userDoc.totalRevenue,
        isActive: userDoc.isActive,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Authentication request failed.",
      error instanceof Error ? error.message : "Unknown error",
    );
    return res
      .status(500)
      .json({
        success: false,
        message: "Authentication service failed. Please try again.",
      });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }
    res.clearCookie("session", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    return res
      .status(200)
      .json({ success: true, message: "logout successfully" });
  } catch (error) {
    console.error(
      "Logout request failed.",
      error instanceof Error ? error.message : "Unknown error",
    );
    return res
      .status(500)
      .json({ success: false, message: "Logout failed. Please try again." });
  }
};
