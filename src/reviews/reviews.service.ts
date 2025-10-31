import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: number, dto: CreateReviewDto) {
    const { nurseId, rating, comment } = dto;

    // Check if nurse exists
    const nurse = await this.prisma.nurseProfile.findUnique({
      where: { id: nurseId },
    });

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    // Check if patient has a completed booking with this nurse
    const completedBooking = await this.prisma.booking.findFirst({
      where: {
        patientId,
        nurseId: nurse.userId,
        status: 'COMPLETED',
      },
    });

    if (!completedBooking) {
      throw new BadRequestException('You can only review nurses you have completed bookings with');
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findFirst({
      where: {
        patientId,
        nurseId,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this nurse');
    }

    return this.prisma.review.create({
      data: {
        patientId,
        nurseId,
        rating,
        comment,
      },
      include: {
        patient: { select: { id: true, name: true, email: true } },
        nurse: { 
          include: { 
            user: { select: { id: true, name: true, email: true } } 
          } 
        },
      },
    });
  }

  async findByNurse(nurseId: number) {
    return this.prisma.review.findMany({
      where: { nurseId },
      include: {
        patient: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNurseAverageRating(nurseId: number) {
    const result = await this.prisma.review.aggregate({
      where: { nurseId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating || 0,
      totalReviews: result._count.rating,
    };
  }
}

