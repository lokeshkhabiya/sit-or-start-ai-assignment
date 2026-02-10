import { Router } from "express";
import { eventController } from "@/controllers/event.controllers";
import { optionalAuthMiddleware } from "@/middleware/auth.middleware";

const router: Router = Router();

router.get("/", eventController.getAllEvents);
router.get("/:id", optionalAuthMiddleware, eventController.getEventById);

export default router;
