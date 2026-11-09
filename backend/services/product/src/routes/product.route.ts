import  express  from "express";
import {
  createProduct,
  deleteproduct,
  getAllPartnerProduct,
  getPublicProductBySlug,
  getPublicProducts,
  getPublicProductsByPartner,
  updatePartner,
} from "../controllers/product.controller.js";
const productRouter=express.Router()
productRouter.get("/public/all", getPublicProducts);
productRouter.get("/public/partner/:partnerId", getPublicProductsByPartner);
productRouter.get("/public/:slug", getPublicProductBySlug);
productRouter.post("/create",createProduct)
productRouter.get("/all",getAllPartnerProduct)
productRouter.patch("/update",updatePartner)
productRouter.delete("/delete/:id", deleteproduct);
export default productRouter
