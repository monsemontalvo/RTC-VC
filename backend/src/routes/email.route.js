import { Router } from "express";
import { sendEmail } from "../controllers/email.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// Esta ruta estará protegida, solo usuarios logueados pueden enviar emails
router.post("/email/send", protectRoute, sendEmail);

export default router;