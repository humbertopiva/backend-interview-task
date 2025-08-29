import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsBoolean, Length } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  name?: string;

  @IsEmail({}, { message: 'Invalid email' })
  email!: string;

  @IsEnum(['admin', 'user'], { message: 'Role must be admin or user' })
  @IsOptional()
  role?: UserRole;

  @IsBoolean({ message: 'isOnboarded must be a boolean value' })
  @IsOptional()
  isOnboarded?: boolean;
}
