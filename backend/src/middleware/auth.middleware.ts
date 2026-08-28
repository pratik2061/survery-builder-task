import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";



export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  
  const token = req.cookies.token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized - Please log in first" });
    return;
  }

  try {
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    
    (req as any).user = decoded;
    
    
    next();
  } catch (error) {
    
    res.status(401).json({ error: "Unauthorized - Invalid or expired token" });
  }
};
