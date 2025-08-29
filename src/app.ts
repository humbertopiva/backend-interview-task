import Koa from "koa";
import bodyParser from "koa-bodyparser";
import authRoutes from "./modules/auth/auth.routes";

const app = new Koa();

// Middlewares globais
app.use(bodyParser());

// Rotas
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());

export default app;