import { IsEnum, IsOptional, Length } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class EditUserDto {
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  @IsOptional()
  name?: string;

  @IsEnum(['admin', 'user'], { message: 'Role must be admin or user' })
  @IsOptional()
  role?: UserRole;
}
