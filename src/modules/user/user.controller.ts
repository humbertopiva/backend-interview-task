import { Context } from "koa";
import { UserService } from "./user.service";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  findAll = async (ctx: Context) => {
    ctx.body = await this.userService.findAll();
  };
}
