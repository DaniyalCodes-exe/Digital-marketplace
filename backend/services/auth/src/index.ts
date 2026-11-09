import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./configs/db.js";
import authRouter from "./routes/auth.route.js";
import adminRouter from "./routes/admin.route.js";
import partnerRouter from "./routes/partner.route.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cookieParser());

const port = process.env.PORT;

app.get("/", (req, res) => {
  res.json("hello from auth service ");
});
app.use("/", authRouter);
app.use("/admin", adminRouter);
app.use("/partner", partnerRouter);

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Auth server is running ${port}`);
  });
};

start().catch((error: unknown) => {
  console.error(
    "Auth service could not start.",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
