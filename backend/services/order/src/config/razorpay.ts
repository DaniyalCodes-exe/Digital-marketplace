import Razorpay from "razorpay";
import dotenv from "dotenv"
dotenv.config()
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Razorpay keys are missing from the environment");
}

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});