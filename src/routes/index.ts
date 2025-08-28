import Router from "koa-router";

const router = new Router();

router.get("/", async (ctx) => {
  ctx.body = { message: "API rodando com Koa + TS 🚀" };
});

router.get("/users", async (ctx) => {
  ctx.body = [{ id: 1, name: "Humberto" }];
});

export default router;