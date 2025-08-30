import { Context } from "koa";
import { UserService } from "./user.service";
import { EditUserDto } from "./dtos/edit-user.dto.ts";
import { LoggedUser } from "../../common/types/logged-user";
import { CognitoService } from "../../common/services/cognito.service";

export class UserController {
  private userService: UserService;
  private cognitoService: CognitoService;


  constructor() {
    this.cognitoService = new CognitoService();
    this.userService = new UserService(this.cognitoService);
  }

  findAll = async (ctx: Context) => {
    ctx.body = await this.userService.findAll();
  };

  editAccount = async (ctx: Context) => {
    const body = ctx.request.body as EditUserDto;
    const loggedUser = ctx.state.user as LoggedUser;
  
    ctx.body = await this.userService.editAccount(body, loggedUser);
  };
}
