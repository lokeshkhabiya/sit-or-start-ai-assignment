import { Router } from "express";
import { authController } from "@/controllers/auth.controllers";
import { authMiddleware } from "@/middleware/auth.middleware";

const router: Router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.me);

export default router;
