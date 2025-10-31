// import { PartialType } from '@nestjs/mapped-types';
// import { CreateNurseDto } from './create-nurse.dto';

// export class UpdateNurseDto extends PartialType(CreateNurseDto) {}
// src/nurses/dto/update-nurse.dto.ts
import { IsString, IsInt, IsArray, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateNurseDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  specialization?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @Type(() => Number)
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  longitude?: number;

  @IsOptional()
  availability?: Record<string, string[]>;
}