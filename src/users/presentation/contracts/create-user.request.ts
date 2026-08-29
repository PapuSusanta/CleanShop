import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsEmail()
  email: string;
}
