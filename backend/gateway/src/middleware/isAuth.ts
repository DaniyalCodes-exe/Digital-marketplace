import { type NextFunction, type Request, type Response } from "express";
import redis from "../../../shared/redis/redis.js";
interface IuserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
}
declare global {
  namespace Express {
    interface Request {
      user: IuserSession;
    }
  }
}
export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const sessionId = req.cookies?.session;
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }
    const session = await redis.get(`session:${sessionId}`);
    if (!session) {
      return res.status(401).json({
        success: false,
        message: "session expired",
      });
    }
    req.user = JSON.parse(session) as IuserSession;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "isAuth error" });
  }
};
