import { Router } from "express";
import { seedController } from "@/controllers/seed.controllers";

const router: Router = Router();

router.post("/", seedController.seedDatabase);

export default router;
