import Router from "koa-router";
import { AuthController } from "./auth.controller";

const router = new Router();
const controller = new AuthController();

router.post("/auth", controller.login);

export default router;