import { Context } from "koa";
import { AuthDto } from "./dto/auth.dto";
import { AuthService } from "./auth.service";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (ctx: Context) => {
    const body = ctx.request.body as AuthDto;

    try {
      const data = await this.authService.authenticate(body);
      ctx.body = {
        message: "Successfully authenticated!",
        data,
      };
    } catch (error: any) {
      console.error("Authentication error:", error);
      ctx.status = 400;
      ctx.body = { error: error.message || error };
    }
  };
}
