import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { IsEmail, IsEnum, IsBoolean, Length, IsOptional } from 'class-validator';

export type UserRole = 'admin' | 'user';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Length(2, 100, { message: 'Name must be between 2 and 100 characters' })
  @IsOptional()
  name?: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  @IsEmail({}, { message: 'Invalid email' })
  email!: string;

  @Column({ type: 'enum', enum: ['admin', 'user'], default: 'user' })
  @IsEnum(['admin', 'user'], { message: 'Role must be admin or user' })
  role!: UserRole;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isOnboarded!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;
}