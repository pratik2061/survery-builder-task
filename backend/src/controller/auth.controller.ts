import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db";
import { SignupSchema, LoginSchema } from "../types/schema";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";


export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const validated = SignupSchema.parse(req.body);
    
    
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    });
    
    if (existingUser) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword
      }
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
};


export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const validated = LoginSchema.parse(req.body);

    
    const user = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    
    const isMatch = await bcrypt.compare(validated.password, user.password);
    
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any
    });

    
    
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 24 * 60 * 60 * 1000 
    });

    res.json({ message: "Logged in successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
};


export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
  });
  res.json({ message: "Logged out successfully" });
};


export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, createdAt: true }
    });

    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: "Not authenticated" });
  }
};
