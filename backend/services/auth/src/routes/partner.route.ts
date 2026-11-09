import express from "express";
import {
  getAllPublicPartner,
  getPartner,
  updatePartner,
} from "../controllers/partner.controller.js";

const partnerRouter = express.Router();
partnerRouter.get("/get", getPartner);
partnerRouter.patch("/update",updatePartner)
partnerRouter.get("/all",getAllPublicPartner)

export default partnerRouter;
