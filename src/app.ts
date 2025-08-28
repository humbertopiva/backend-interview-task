import Koa from "koa";
import bodyParser from "koa-bodyparser";
import router from "./routes";

const app = new Koa();

// Middlewares globais
app.use(bodyParser());

// Rotas
app.use(router.routes()).use(router.allowedMethods());

export default app;