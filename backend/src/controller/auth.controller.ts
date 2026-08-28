import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db";
import { SignupSchema, LoginSchema } from "../types/schema";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Handles user registration
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate the user input (email and password)
    const validated = SignupSchema.parse(req.body);
    
    // 2. Check if the user already exists in the database
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    });
    
    if (existingUser) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    // 3. Hash the password using bcrypt for security (never store plain text passwords!)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    // 4. Save the new user to the database
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

// Handles user login and session creation
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Validate input
    const validated = LoginSchema.parse(req.body);

    // 2. Find the user by their email
    const user = await prisma.user.findUnique({
      where: { email: validated.email }
    });

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // 3. Compare the provided password with the hashed password in the DB
    const isMatch = await bcrypt.compare(validated.password, user.password);
    
    if (!isMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // 4. Generate a JWT token containing the user's ID
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any
    });

    // 5. Send the token back to the user in a secure, HTTP-only cookie
    // This is safer than LocalStorage because JavaScript cannot access it
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 1 day in milliseconds
    });

    res.json({ message: "Logged in successfully" });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

// Logs the user out by clearing the cookie
export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
  });
  res.json({ message: "Logged out successfully" });
};

// Simple endpoint to check if the user is currently logged in
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.token;
    if (!token) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Fetch the user (excluding the password)
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
