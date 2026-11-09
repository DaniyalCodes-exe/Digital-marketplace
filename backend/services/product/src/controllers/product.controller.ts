import redis from "../../../../shared/redis/redis.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import product from "../models/product.model.js";

const publicProductFields =
  "tittle slug description type price status totalSales totalRevenue createdAt";

export const getPublicProducts = async (_req: Request, res: Response) => {
  try {
    const products = await product
      .find({ status: "published" })
      .select(publicProductFields)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, products });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Could not load published products.",
    });
  }
};

export const getPublicProductsByPartner = async (req: Request, res: Response) => {
  try {
    const partnerId = req.params.partnerId;
    if (typeof partnerId !== "string" || !mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid creator.",
      });
    }

    const products = await product
      .find({
        partnerID: new mongoose.Types.ObjectId(partnerId),
        status: "published",
      })
      .select(publicProductFields)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, products });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Could not load this creator's products.",
    });
  }
};

export const getPublicProductBySlug = async (req: Request, res: Response) => {
  try {
    const rawSlug = req.params.slug;
    const slug = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";
    if (!slug) {
      return res.status(400).json({ success: false, message: "Product slug is required." });
    }

    const productDetail = await product
      .findOne({ slug, status: "published" })
      .select(publicProductFields)
      .lean();

    if (!productDetail) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    return res.status(200).json({ success: true, product: productDetail });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Could not load this product.",
    });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const partnerId = req.headers["x-user-id"] as string;
    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }
    const { tittle, slug, description, type, price, links, status } = req.body;
    if (!slug || !slug.trim()) {
      return res.status(400).json({
        success: false,
        message: "product slug is required",
      });
    }
    const clearSlug = slug.trim().toLowerCase();
    const existingProduct = await product.findOne({
      slug: clearSlug,
    });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        field: "slug",
        message:
          "this product slug is already taken. please choose another slug.",
      });
    }
    const Product = await product.create({
      partnerID: partnerId,
      tittle: tittle?.trim(),
      slug: clearSlug,
      description: description?.trim(),
      type,
      price,
      links,
      status: status || "draft",
    });
    await redis.del(`product:${partnerId}`);

    return res.status(201).json({
      success: true,
      message: "product created successfully",
      Product,
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        field: "slug",
        message: "This product slug is already taken.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Create product failed",
    });
  }
};

export const getAllPartnerProduct = async (req: Request, res: Response) => {
  try {
    const partnerId = req.headers["x-user-id"] as string;
    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }
    //redis find
    const cachedPoducts = await redis.get(`product:${partnerId}`);
    if (cachedPoducts) {
      const parsedProducts: unknown = JSON.parse(cachedPoducts);
      if (Array.isArray(parsedProducts)) {
        const productCount = await product.countDocuments({
          partnerID: partnerId,
        });
        if (parsedProducts.length === productCount) {
          return res.status(200).json({
            success: true,
            source: "redis",
            products: parsedProducts,
          });
        }
      }
    }
    //mogo db
    const products = await product
      .find({
        partnerID: partnerId,
      })
      .sort({ createdAt: -1 });

    await redis.set(
      `product:${partnerId}`,
      JSON.stringify(products),
      "EX",
      60 * 10,
    );
    return res.status(200).json({
      success: true,
      source: "mongodb",
      products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "failed to get partner products",
    });
  }
};
export const updatePartner = async (req: Request, res: Response) => {
  try {
    const partnerId = req.headers["x-user-id"] as string;
    if (!partnerId) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const productId = req.params.id ?? req.body.id;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "product id is required",
      });
    }

    const existingProduct = await product.findOne({
      _id: productId,
      partnerID: partnerId,
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const { tittle, description, type, price, status, links } = req.body;
    existingProduct.tittle = tittle ?? existingProduct.tittle;
    existingProduct.description = description ?? existingProduct.description;
    existingProduct.type = type ?? existingProduct.type;
    existingProduct.price = price ?? existingProduct.price;
    existingProduct.status = status ?? existingProduct.status;
    existingProduct.links = links ?? existingProduct.links;

    await existingProduct.save();
    await redis.del(`product:${partnerId}`);

    return res.status(200).json({
      success: true,
      message: "product updated",
      product: existingProduct,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "failed to update product",
    });
  }
};

export const deleteproduct = async (req: Request, res: Response) => {
  try {
    const partnerId = req.headers["x-user-id"] as string;
    if (!partnerId) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }

    const productId = req.params.id ?? req.body.id;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "product id is required",
      });
    }

    const deletedProduct = await product.findOneAndDelete({
      _id: productId,
      partnerID: partnerId,
    });

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await redis.del(`product:${partnerId}`);

    return res.status(200).json({
      success: true,
      message: "product deleted",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "failed to delete product",
    });
  }
};
