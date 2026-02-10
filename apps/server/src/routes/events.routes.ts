import { Router } from "express";
import { eventController } from "@/controllers/event.controllers";
import {
	authMiddleware,
	optionalAuthMiddleware,
} from "@/middleware/auth.middleware";

const router: Router = Router();

router.get("/", eventController.getAllEvents);
router.get("/:id", optionalAuthMiddleware, eventController.getEventById);
router.post("/:id/reserve", authMiddleware, eventController.reserveSeat);
router.delete("/:id/reserve", authMiddleware, eventController.cancelReservation);

export default router;
