import { validateOrReject } from "class-validator";
import { AppDataSource } from "../../configs/data-source";
import { CreateUserDto } from "./entities/create-user.dto.ts";
import { User } from "./entities/user.entity";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async findAll() {
    return this.userRepository.find();
  }

  async findOneByEmail(email: string){
    return this.userRepository.findOne({ where: { email } });
  }

  async create(dto: CreateUserDto) {
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
  
}
