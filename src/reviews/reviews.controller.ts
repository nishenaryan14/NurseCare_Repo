import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  async create(@GetUser('id') patientId: number, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(patientId, dto);
  }

  @Get('nurse/:nurseId')
  async findByNurse(@Param('nurseId') nurseId: string) {
    return this.reviewsService.findByNurse(+nurseId);
  }

  @Get('nurse/:nurseId/rating')
  async getNurseRating(@Param('nurseId') nurseId: string) {
    return this.reviewsService.getNurseAverageRating(+nurseId);
  }
}

