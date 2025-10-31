import { IsString } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsString()
  status!: string;
}