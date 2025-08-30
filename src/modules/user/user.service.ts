import { validateOrReject } from "class-validator";
import { AppDataSource } from "../../configs/data-source";
import { CreateUserDto } from "./dtos/create-user.dto.ts";
import { User } from "./entities/user.entity";
import { EditUserDto } from "./dtos/edit-user.dto.ts";
import { IsNull } from "typeorm";
import { LoggedUser } from "../../common/types/logged-user";
import { CognitoService } from "../../common/services/cognito.service";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private cognitoService: CognitoService;

  constructor(cognitoService: CognitoService) {
    this.cognitoService = cognitoService;
  }

  async findAll(): Promise<User[] | null> {
    return this.userRepository.find();
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { 
      email,
      deletedAt: IsNull()
    } });
  }

  async create(dto: CreateUserDto): Promise<User | null> {
    const userDto = Object.assign(new CreateUserDto(), dto);

    await validateOrReject(userDto);

    if(await this.findOneByEmail(dto.email)){
      throw new Error('Email já está em uso');
    }

    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      role: dto.role ?? 'user',
      isOnboarded: dto.isOnboarded ?? false,
    });

    return await this.userRepository.save(user);
  }

  async editAccount(dto: EditUserDto, loggedUser: LoggedUser): Promise<User | null> {
    const userDto = Object.assign(new EditUserDto(), dto);
    await validateOrReject(userDto);

    const user = await this.findOneByEmail(loggedUser.email);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    if(dto.role !== undefined) {
      if(loggedUser.role === "user") {
        throw new Error("Usuário comum não pode alterar o role");
      }

      await this.cognitoService.removeUserFromGroup(user.email, user.role);
      await this.cognitoService.addUserToGroup(user.email, dto.role);

      user.role = dto.role;
    }

    if(dto.name !== undefined) {
      user.name = dto.name;
      user.isOnboarded = true

      await this.cognitoService.updateUserName(user.email, dto.name);
    }

    const updatedUser = await this.userRepository.save(user);
    return updatedUser;
  }
  
}
