import Express from "express";
import {
  getAdmin,
  getAdminDashboard,
  getAdminPartners,
  getAdminPayouts,
  markPartnerPayoutCompleted,
} from "../controllers/admin.controller.js";
import { requireAdmin } from "../middleware/adminAuth.js";
const adminRouter = Express.Router();

adminRouter.use(requireAdmin);
adminRouter.get("/", getAdmin);
adminRouter.get("/admin", getAdmin);
adminRouter.get("/dashboard", getAdminDashboard);
adminRouter.get("/partners", getAdminPartners);
adminRouter.get("/payouts", getAdminPayouts);
adminRouter.post("/payouts/:partnerId/complete", markPartnerPayoutCompleted);

export default adminRouter;
