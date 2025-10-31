import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(patientId: number, dto: CreateBookingDto) {
    try {
      const { nurseId, scheduledAt, durationMinutes } = dto;

      // Check if nurse exists and is approved
      const nurse = await this.prisma.user.findUnique({
        where: { id: nurseId },
        include: { nurseProfile: true },
      });

    if (!nurse || nurse.role !== 'NURSE') {
      throw new NotFoundException('Nurse not found');
    }

    if (!nurse.nurseProfile || !nurse.nurseProfile.approved) {
      throw new BadRequestException('Nurse is not approved');
    }

    // Robust: check time slot against nurse availability
    const availability = nurse.nurseProfile.availability || {};
    const dateObj = new Date(scheduledAt);
    if (isNaN(dateObj.getTime())) throw new BadRequestException('Invalid scheduledAt');
    // Calculate day label (Mon, Tue, ...) and hour integer
    const dayIdx = dateObj.getDay() - 1 < 0 ? 6 : dateObj.getDay() - 1; // (Monday=0, Sunday=6)
    const dayLabel = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][dayIdx];
    const hourVal = dateObj.getHours();
    const allowedHours = Array.isArray((availability as any)?.[dayLabel]) ? (availability as any)[dayLabel] : [];
    if (!allowedHours.includes(hourVal)) {
      throw new BadRequestException('Nurse is not available at the selected time');
    }

    const start = new Date(scheduledAt);
    const end = new Date(start.getTime() + durationMinutes * 60000);

    // Overlap check
    const overlap = await this.prisma.booking.findFirst({
      where: {
        nurseId,
        status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] },
        scheduledAt: { lt: end },
      },
    });

    if (overlap) {
      const overlapEnd = new Date(
        overlap.scheduledAt.getTime() + overlap.durationMinutes * 60000,
      );
      if (overlapEnd > start) {
        throw new BadRequestException('Nurse already booked for this time slot');
      }
    }

    return this.prisma.booking.create({
      data: {
        patientId,
        nurseId,
        scheduledAt: start,
        durationMinutes,
        status: 'PENDING_PAYMENT',
      },
    });
    } catch (error) {
      console.error('❌ Booking creation error:', error);
      throw error;
    }
  }

  async updateStatus(bookingId: number, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: dto.status },
    });
  }

  async cancel(bookingId: number, userId: number) {
    const booking = await this.prisma.booking.findUnique({ 
      where: { id: bookingId },
      include: {
        payment: true,
        nurse: {
          include: {
            nurseProfile: true
          }
        }
      }
    });
    if (!booking) throw new NotFoundException('Booking not found');

    // Check if user has permission to cancel (patient or nurse involved)
    if (booking.patientId !== userId && booking.nurseId !== userId) {
      throw new BadRequestException('You can only cancel your own bookings');
    }

    // If payment exists and is successful, process refund
    if (booking.payment && booking.payment.status === 'SUCCESS') {
      // Update payment to refunded
      await this.prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: booking.payment.amount
        }
      });

      // Reduce nurse earnings
      if (booking.nurse.nurseProfile) {
        await this.prisma.nurseProfile.update({
          where: { id: booking.nurse.nurseProfile.id },
          data: {
            totalEarnings: {
              decrement: booking.payment.amount
            }
          }
        });
      }
    }

    // Update booking status
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });
  }

  async findPatientBookings(patientId: number) {
    return this.prisma.booking.findMany({
      where: { patientId },
      include: { 
        nurse: { 
          include: { 
            nurseProfile: true 
          } 
        } 
      },
    });
  }

  async findNurseBookings(nurseId: number) {
    return this.prisma.booking.findMany({
      where: { nurseId },
      include: { patient: true },
    });
  }
}