import { type Request, type Response } from "express";
import redis from "../../../../shared/redis/redis.js";
import User from "../model/user.model.js";
export const getPartner = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.session;
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }
    const session = await redis.get(`session:${sessionId}`);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "session expired",
      });
    }
    const sessionData = JSON.parse(session);
    const userId = sessionData.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "session invalid",
      });
    }

    //redis search
    const cachedPartner = await redis.get(`partner:${userId}`);

    if (cachedPartner) {
      const partner = JSON.parse(cachedPartner);
      return res.status(200).json({
        success: true,
        data: "mongoDb",
        partner,
      });
    }

    //mongo search
    const partner = await User.findById(userId);
    if (!partner) {
      return res.status(401).json({
        success: false,
        message: "partner not found",
      });
    }

    await redis.set(
      `partner:${userId}`,
      JSON.stringify(partner),
      "EX",
      7 * 24 * 60 * 60,
    );
    return res.status(200).json({
      success: true,
      data: "mongoDb",
      partner,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to fetch partner profile",
    });
  }
};

export const getAllPublicPartner = async (_req: Request, res: Response) => {
  try {
    const cachedPartners = await redis.get("public:partners");
    if (cachedPartners) {
      return res.status(200).json({
        success: true,
        partners: JSON.parse(cachedPartners),
      });
    }

    const partners = await User.find({
      role: "partner",
      isActive: true,
      "partnerProfile.slug": { $ne: null },
    })
      .select("name profilePicture partnerProfile totalSales totalRevenue")
      .sort({ totalRevenue: -1 })
      .lean();

    await redis.set("public:partners", JSON.stringify(partners), "EX", 60 * 10);

    return res.status(200).json({
      success: true,
      partners,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch public partners.",
    });
  }
};

export const updatePartner = async (req: Request, res: Response) => {
  try {
    const sessionId = req.cookies?.session;
    if (!sessionId) {
      return res.status(401).json({
        sucess: false,
        message: "unauthorized",
      });
    }
    const session = await redis.get(`session:${sessionId}`);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "session expired",
      });
    }
    const sessionData = JSON.parse(session);
    const userId = sessionData.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "session invalid",
      });
    }
    //find user
    const partner = await User.findById(userId);
    if (!partner) {
      return res.status(401).json({
        success: false,
        message: "partner not found",
      });
    }

    const { name, newpartnerProfile, newpaymentDetails } = req.body;
    if (name !== undefined) {
      partner.name = name.trim();
    }
    if (newpartnerProfile) {
      const currentProfile = partner.partnerProfile;
      const currentSlug = partner?.partnerProfile.slug?.trim() || "";
      const newSlug = newpartnerProfile.slug.toLowerCase();
      if (currentSlug) {
        //user already has a slug
        //slug cannot changed

        if (newSlug && newSlug !== currentSlug) {
          return res.status(409).json({
            success: false,
            field: "slug",
            message: "profile slug cannot be changed once created",
          });
        }
      } else {
        if (!newSlug) {
          return res.status(400).json({
            success: false,
            field: "slug",
            message: "profile slug is required ",
          });
        }
        // check unique slug
        const existingPartner = await User.findOne({
          "partnerProfile.slug": newSlug,
          _id: {
            $ne: partner._id,
          },
        });
        if (existingPartner) {
          return res.status(409).json({
            success: false,
            field: "slug",
            message: "profile slug is already taken. ",
          });
        }
      }
      const currentsocialLink = currentProfile.socialLink;
      //create complete profile object
      partner.partnerProfile = {
        slug: currentSlug || newSlug || "",
        bio: newpartnerProfile?.bio?.trim() ?? currentProfile.bio ?? "",
        website:
          newpartnerProfile.website?.trim() ?? currentProfile.website ?? "",
        socialLink: {
          youtube:
            newpartnerProfile.socialLink?.youtube.trim() ??
            currentsocialLink?.youtube ??
            "",
          instagram:
            newpartnerProfile.socialLink?.instagram.trim() ??
            currentsocialLink?.instagram ??
            "",
          linkedin:
            newpartnerProfile.socialLink?.linkedin.trim() ??
            currentsocialLink?.linkedin ??
            "",
          github:
            newpartnerProfile.socialLink?.github.trim() ??
            currentsocialLink?.github ??
            "",
        },
      };
    }

    if (newpaymentDetails) {
      const currentPayment = partner.paymentDetails;
      partner.paymentDetails = {
        method: newpaymentDetails.method ?? currentPayment.method ?? "upi",
        upiId: newpaymentDetails.upiId ?? currentPayment.upiId ?? "",
        accountHolderName:
          newpaymentDetails.accountHolderName ??
          currentPayment.accountHolderName ??
          "",
        accountNumber:
          newpaymentDetails.accountNumber ?? currentPayment.accountNumber ?? "",
        ifscCode: newpaymentDetails.ifscCode ?? currentPayment.ifscCode ?? "",
      };
    }

    await partner.save();

    const updatedSession = {
      userId: partner._id,
      name: partner.name,
      email: partner.email,
      role: partner.role,
    };
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify(updatedSession),
      "EX",
      7 * 24 * 60 * 60,
    );

    const updatedPartner = partner.toObject();
    await redis.set(
      `partner:${partner._id}`,
      JSON.stringify(updatedPartner),
      "EX",
      7 * 24 * 60 * 60,
    );
    await redis.del("public:partners");
    return res.status(200).json({
      success: true,
      message: "partner profile updated sucessfully",
      partner: updatedPartner,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        field: "slug",
        message: "this profile slug is already taken.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "failed to update partner profile",
    });
  }
};
