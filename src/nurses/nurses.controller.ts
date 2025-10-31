// src/nurses/nurses.controller.ts
import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Query
} from '@nestjs/common';
import { NursesService } from './nurses.service';
import { CreateNurseDto } from './dto/create-nurse.dto';
import { UpdateNurseDto } from './dto/update-nurse.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('nurses')
export class NursesController {
  constructor(private nurses: NursesService) {}

  // Nurse creates profile
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateNurseDto) {
    return this.nurses.create(req.user.userId, dto);
  }

  // Nurse fetches own profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@Req() req: any) {
    return this.nurses.findByUserId(req.user.userId);
  }

  // Test endpoint to check earnings
  @UseGuards(JwtAuthGuard)
  @Get('earnings-debug')
  async getEarningsDebug(@Req() req: any) {
    const profile = await this.nurses.findByUserId(req.user.userId);
    return {
      nurseId: profile.id,
      totalEarnings: profile.totalEarnings,
      hourlyRate: profile.hourlyRate,
      message: 'Debug info for earnings'
    };
  }

  // Nurse updates profile
  @UseGuards(JwtAuthGuard)
  @Patch()
  update(@Req() req: any, @Body() dto: UpdateNurseDto) {
    console.log('Raw body:', req.body);
    console.log('DTO after validation:', dto);
    return this.nurses.update(req.user.userId, dto);
  }


  // Nurse deletes profile
  @UseGuards(JwtAuthGuard)
  @Delete()
  remove(@Req() req: any) {
    return this.nurses.remove(req.user.userId);
  }

  // Patients fetch approved nurses with optional filters (specialization,location,hourlyRate)
  @Get('approved')
  getApproved(
    @Query('specialization') specialization?: string,
    @Query('location') location?: string,
    @Query('maxRate') maxRate?: string,
  ) {
    return this.nurses.getApprovedNurses({
      specialization,
      location,
      maxRate: maxRate ? Number(maxRate) : undefined,
    });
  }

  // Admin fetches all pending nurse profiles
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('pending')
  getPending() {
    return this.nurses.getPendingProfiles();
  }

  // Public fetch nurse availability by profile id
  @Get('availability/:id')
  getAvailability(@Param('id') id: string) {
    return this.nurses.findAvailabilityById(Number(id));
  }

  // Nurse updates availability
  @UseGuards(JwtAuthGuard)
  @Patch('availability')
  updateAvailability(@Req() req: any, @Body('availability') availability: any) {
    return this.nurses.updateAvailability(req.user.userId, availability);
  }

  // Admin approves nurse
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.nurses.approveNurse(Number(id));
  }

  // Admin rejects nurse profile
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id/reject')
  reject(@Param('id') id: string) {
    return this.nurses.rejectNurse(Number(id));
  }

}