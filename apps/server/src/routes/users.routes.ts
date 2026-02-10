import { Router } from "express";
import { userController } from "@/controllers/user.controllers";
import { authMiddleware } from "@/middleware/auth.middleware";

const router: Router = Router();

router.get("/", userController.getAllUsers);
router.get("/:id/reservations", authMiddleware, userController.getUserReservations);

export default router;
