import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsOptional()
  name?: string;

  @IsEnum(Role)
  role!: Role;
}
