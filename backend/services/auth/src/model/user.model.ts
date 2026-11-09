import mongoose, { Document } from "mongoose";

interface Ipartnerprofile {
  slug: string | null;
  bio: string;
  website: string;
  socialLink: IsocialLinks;
}
interface IsocialLinks {
  youtube: string;
  instagram: string;
  linkedin: string;
  github: string;
}

interface IPaymentDetails {
  method: "upi" | "bank";
  upiId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
}

export interface Iuser extends Document {
  firebaseuid: string;
  name: string;
  email: string;
  profilePicture: string | null;
  role: "partner" | "admin";
  partnerProfile: Ipartnerprofile;

  paymentDetails: IPaymentDetails;

  totalSales: number;
  totalRevenue: number;
  paidOutRevenue: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const socialLinksSchema = new mongoose.Schema<IsocialLinks>(
  {
    youtube: { type: String, default: "" },
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
  },
  { _id: false },
);

const partnerProfileSchema = new mongoose.Schema<Ipartnerprofile>(
  {
    slug: { type: String, unique:true,sparse:true, default: null },
    bio: { type: String, default: "" },
    website: { type: String, default: "" },
    socialLink: { type: socialLinksSchema, default: () => ({}) },
  },
  { _id: false },
);

const paymentDetailsSchema = new mongoose.Schema<IPaymentDetails>(
  {
    method: { type: String, enum: ["upi", "bank"], default: "upi" },
    upiId: { type: String, default: "" },
    accountHolderName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema<Iuser>(
  {
    firebaseuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      lowercase: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["partner", "admin"],
      default: "partner",
      index: true,
    },
    partnerProfile: { type: partnerProfileSchema, default: () => ({}) },
    paymentDetails: { type: paymentDetailsSchema, default: () => ({}) },
    totalRevenue:{
        type:Number,
        default:0,
        min:0
    },
    paidOutRevenue:{
        type:Number,
        default:0,
        min:0
    },
     totalSales:{
        type:Number,
        default:0,
        min:0
    },
    isActive:{
         type:Boolean,
         default:true
    }

    
  }, { timestamps: true });

  const user: mongoose.Model<Iuser> = mongoose.model<Iuser>("User", userSchema);

  export default user 
