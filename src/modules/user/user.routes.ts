import Router from "koa-router";
import { UserController } from "./user.controller";
import { jwtAuthMiddleware } from "../../common/middlewares/auth.middleware";

const router = new Router();
const controller = new UserController();

router.get("/users", jwtAuthMiddleware(['admin']), controller.findAll);
router.get("/me", jwtAuthMiddleware(), controller.getSelf);
router.put("/edit-account", jwtAuthMiddleware(), controller.editAccount);

export default router;