import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import proxy from "express-http-proxy";
dotenv.config();
import cors from "cors";
import { isAuth } from "./middleware/isAuth.js";
import { getCurrentUser } from "./controller/user.controller.js";
import { proxyWithHeaders } from "./config/proxyWithHeaders.js";
const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const port = process.env.PORT;

app.get("/", (req, res) => {
  res.json("hello from DigiAI gateway");
});
app.get("/api/me", isAuth, getCurrentUser);
app.use(
  "/api/admin",
  proxy(process.env.AUTH_SERVICE_URL as string, {
    proxyReqPathResolver: (req) => `/admin${req.url}`,
  }),
);
app.use(
  "/api/partner",
  proxy(process.env.AUTH_SERVICE_URL as string, {
    proxyReqPathResolver: (req) => `/partner${req.url}`,
  }),
);
app.use("/api/auth", proxy(process.env.AUTH_SERVICE_URL as string));
app.use("/api/product",isAuth,proxyWithHeaders(process.env.PRODUCT_SERVICE_URL as string));
app.use(
  "/api/public-product",
  proxy(process.env.PRODUCT_SERVICE_URL as string, {
    proxyReqPathResolver: (req) => `/public${req.url}`,
  }),
);
app.use("/api/order", proxy(process.env.ORDER_SERVICE_URL as string));

app.listen(port, () => {
  console.log(`gateway server is running ${port}`);
});
