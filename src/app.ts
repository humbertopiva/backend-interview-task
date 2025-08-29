import Koa from "koa";
import bodyParser from "koa-bodyparser";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";


const app = new Koa();

// Middlewares globais
app.use(bodyParser());

// Rotas
app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(userRoutes.routes());
app.use(userRoutes.allowedMethods());

export default app;