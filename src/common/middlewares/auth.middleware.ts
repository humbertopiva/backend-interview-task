import { Context, Next } from "koa";
import { JwtService } from "../services/jwt.service";

export function jwtAuthMiddleware(allowedRoles: string[] = []) {
  
  return async (ctx: Context, next: Next) => {
    try {
      const accessToken = JwtService.extractToken(ctx, "authorization");
      if (!accessToken) ctx.throw(401, "AccessToken não fornecido");
      const accessClaims = await JwtService.decodeAndVerify(accessToken, JwtService.mapAccessClaims);


      const idToken = JwtService.extractToken(ctx, "x-id-token");
      if (!idToken) ctx.throw(401, "IdToken não fornecido");
      const idClaims = await JwtService.decodeAndVerify(idToken, JwtService.mapIdClaims);

      const user = { ...accessClaims, ...idClaims };

      if (allowedRoles.length && !user.groups.some((role: string) => allowedRoles.includes(role))) {
        ctx.throw(403, "Acesso negado");
      }

      ctx.state.user = user;

      await next();
    } catch (err: any) {
      console.log(err);
      ctx.status = 401;
      ctx.body = { message: "Não autorizado", error: err.message };
    }
  };
}
