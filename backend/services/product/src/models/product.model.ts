import type { Document } from "mongoose";
import mongoose from "mongoose";
import { title } from "node:process";
interface IproductLink {
  tittle: string;
  url: string;
}
export interface Iproduct extends Document {
  partnerID: mongoose.Types.ObjectId;

  tittle: string;
  slug: string;
  description: string;
  type:
    | "course"
    | "source-code"
    | "ebook"
    | "ui-kit"
    | "templete"
    | "ai-prompt"
    | "software"
    | "other";

  price: number;

  links: IproductLink[];
  status: "draft" | "published";

  totalSales: number;
  totalRevenue:number
  createdAt: Date;
  updateAt: Date;
}
const productSchema = new mongoose.Schema<Iproduct>(
  {
    partnerID: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tittle: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "course",
        "source-code",
        "ebook",
        "ui-kit",
        "templete",
        "ai-prompt",
        "software",
        "other",
      ],
      required:true,
      index:true
    },
    price:{
        type:Number,
        required:true,
        min:0
    },
    links:[
        {
            title:{
                type:String,
                required:true,
                trim:true
            },
            url:{
                type:String,
                required:true,
                trim:true
            }
        }
    ],
    status:{
        type:String,
        enum:[
            "draft",
            "published"
        ],
        default:"draft",
        index:true
    },
    totalSales:{
        type:Number,
        default:0
    },
    totalRevenue:{
        type:Number,
        default:0

    }
  },
  { timestamps: true },
);
const product= mongoose.model("product",productSchema)
export default product
