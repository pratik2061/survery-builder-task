import { Router } from "express";
import { signup, login, logout, getMe } from "../controller/auth.controller";

const router = Router();

// Public auth routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getMe);

export default router;
