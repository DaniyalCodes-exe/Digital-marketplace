import express from"express"
import { createOrder, verifyPayment } from "../controllers/order.controller.js"
export const orderRouter = express.Router()
orderRouter.post("/create",createOrder)
orderRouter.post("/verify",verifyPayment)

