import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ListUsersRequest {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
