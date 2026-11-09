import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { orderRouter } from "./routes/order.route.js";






dotenv.config();
const app = express();
app.use(express.json());


const port = process.env.PORT;

app.get("/", (req, res) => {
  res.json("hello from order service ");
});
app.use("/",orderRouter)

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`order server is running ${port}`);
  });
};

start().catch((error: unknown) => {
  console.error(
    "order service could not start.",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});