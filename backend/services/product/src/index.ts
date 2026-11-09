import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import productRouter from "./routes/product.route.js";





dotenv.config();
const app = express();
app.use(express.json());


const port = process.env.PORT;

app.get("/", (req, res) => {
  res.json("hello from product service ");
});

app.use("/",productRouter)

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`product server is running ${port}`);
  });
};

start().catch((error: unknown) => {
  console.error(
    "product service could not start.",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
});
