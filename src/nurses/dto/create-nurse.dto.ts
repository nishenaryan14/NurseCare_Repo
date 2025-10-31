import { IsString, IsInt, IsArray, IsOptional, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateNurseDto {
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)   // 👈 ensures array elements are strings
  specialization!: string[];

  @Type(() => Number)   // 👈 ensures "800" → 800
  @IsInt()
  @Min(0)
  hourlyRate!: number;

  @IsString()
  location!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  availability?: Record<string, string[]>;
}