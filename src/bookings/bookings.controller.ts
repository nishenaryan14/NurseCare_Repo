import { Controller, Post, Patch, Get, Body, Param, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('bookings')
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  create(@GetUser('id') patientId: number, @GetUser() user: any, @Body() dto: CreateBookingDto) {
    console.log('Booking creation attempt:', { 
      patientId, 
      userRole: user.role, 
      dto,
      timestamp: new Date().toISOString()
    });
    return this.bookings.create(patientId, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.NURSE, Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookings.updateStatus(Number(id), dto);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @GetUser('id') userId: number) {
    return this.bookings.cancel(Number(id), userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  findMyBookings(@GetUser('id') patientId: number) {
    return this.bookings.findPatientBookings(patientId);
  }

  @Get('nurse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.NURSE)
  findNurseBookings(@GetUser('id') nurseId: number) {
    return this.bookings.findNurseBookings(nurseId);
  }

  // Debug endpoint to check auth
  @Get('debug-auth')
  @UseGuards(JwtAuthGuard)
  debugAuth(@GetUser() user: any) {
    return { 
      message: 'Auth working', 
      user: { id: user.id, email: user.email, role: user.role },
      timestamp: new Date().toISOString()
    };
  }
}