import { Context, Next } from "koa";
import { JwtService } from "../services/jwt.service";
import { UserService } from "../../modules/user/user.service";
import { CognitoService } from "../services/cognito.service";

const cognitoService = new CognitoService();
const userService = new UserService(cognitoService);

export function jwtAuthMiddleware(allowedRoles: string[] = []) {
  
  return async (ctx: Context, next: Next) => {
    try {
      const accessToken = JwtService.extractToken(ctx, "authorization");
      if (!accessToken) ctx.throw(401, "AccessToken not provided");
      const accessClaims = await JwtService.decodeAndVerify(accessToken, JwtService.mapAccessClaims);

      const idToken = JwtService.extractToken(ctx, "x-id-token");
      if (!idToken) ctx.throw(401, "IdToken not provided");
      const idClaims = await JwtService.decodeAndVerify(idToken, JwtService.mapIdClaims);

      const user = { ...accessClaims, ...idClaims };

      const findedUser = await userService.findOneByEmail(user.email);

      if(!findedUser) {
        ctx.throw(401, "User not found");
      }
      
      user.role = findedUser.role;
      user.isOnboarded = findedUser.isOnboarded;
      user.id = findedUser.id;
      user.name = findedUser.name;
 
      if (allowedRoles.length && allowedRoles.includes(user.role) === false) {
        ctx.throw(403, "Access denied");
      }

      ctx.state.user = user;

      await next();
    } catch (err: any) {
      console.log(err);
      ctx.status = 401;
      ctx.body = { message: "Unauthorized", error: err.message };
    }
  };
}
