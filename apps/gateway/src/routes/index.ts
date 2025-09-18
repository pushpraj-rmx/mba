import { Router } from "express";
import templatesRouter from "./templates";
import chatRouter from "./chat";
// import whatsappRouter from "./whatsapp";

const router = Router();

router.use("/templates", templatesRouter);
router.use("/chat", chatRouter);
// router.use(whatsappRouter);

export default router;
