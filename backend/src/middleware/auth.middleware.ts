import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

// Middleware to protect admin routes
// This function sits between the route and the controller
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  // 1. Get the token from the cookies
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized - Please log in first" });
    return;
  }

  try {
    // 2. Verify the token signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 3. Attach the user's decoded ID to the request object so controllers can access it if needed
    (req as any).user = decoded;
    
    // 4. Move on to the actual route handler
    next();
  } catch (error) {
    // If token is invalid or expired
    res.status(401).json({ error: "Unauthorized - Invalid or expired token" });
  }
};
