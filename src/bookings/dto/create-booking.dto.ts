import { IsInt, IsDateString, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  nurseId!: number;

  @IsDateString()
  scheduledAt!: string; // ISO date string

  @IsInt()
  @Min(1)
  durationMinutes!: number;
}