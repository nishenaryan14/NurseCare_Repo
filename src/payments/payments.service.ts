import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Mock Payment Gateway - Simulates real payment processing
@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createPaymentIntent(bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        nurse: { 
          include: { 
            nurseProfile: true 
          } 
        } 
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== 'PENDING_PAYMENT') throw new BadRequestException('Booking is not pending payment');

    const nurseUser = booking.nurse;
    const nurseProfile = nurseUser?.nurseProfile;
    if (!nurseProfile) throw new NotFoundException('Nurse profile not found');

    // Calculate price (hourlyRate * (minutes / 60))
    const amount = Math.round((nurseProfile.hourlyRate * booking.durationMinutes / 60) * 100) / 100;
    if (isNaN(amount) || amount < 1) throw new BadRequestException('Payment calculation error');

    // Generate mock payment intent ID
    const mockPaymentIntentId = `mock_pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockClientSecret = `${mockPaymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`;

    // Store payment in DB
    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: amount,
        currency: 'INR',
        provider: 'mock_gateway',
        providerPaymentId: mockPaymentIntentId,
        status: 'PENDING',
      },
    });

    return { 
      clientSecret: mockClientSecret,
      amount: amount,
      currency: 'INR',
      mockPayment: true // Flag to indicate this is a mock payment
    };
  }

  async handleWebhook(payload: any, signature: string) {
    // Mock webhook handler - simulates payment gateway webhooks
    console.log('Mock webhook received:', payload);
    
    // In a real implementation, you'd verify the signature
    // For mock, we'll just process the event
    
    const { eventType, paymentIntentId } = payload;
    
    switch (eventType) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(paymentIntentId);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(paymentIntentId);
        break;
      default:
        console.log('Unhandled mock webhook event:', eventType);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntentId },
      include: { 
        booking: { 
          include: { 
            nurse: { 
              include: { 
                nurseProfile: true 
              } 
            } 
          } 
        } 
      },
    });

    if (payment) {
      // Update payment status
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS' },
      });

      // Update booking status
      await this.prisma.booking.update({
        where: { id: payment.booking.id },
        data: { status: 'CONFIRMED' },
      });

      // Add earnings to nurse profile
      const nurseProfile = payment.booking.nurse.nurseProfile;
      if (nurseProfile) {
        await this.prisma.nurseProfile.update({
          where: { id: nurseProfile.id },
          data: {
            totalEarnings: {
              increment: payment.amount
            }
          }
        });
        console.log(`Added ₹${payment.amount} to nurse ${nurseProfile.id} earnings`);
      }
    }
  }

  private async handlePaymentFailure(paymentIntentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntentId },
    });

    if (payment) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }
  }

  // Refund payment and adjust nurse earnings
  async refundPayment(bookingId: number, reason: string = 'Booking cancelled') {
    const payment = await this.prisma.payment.findFirst({
      where: { 
        bookingId: bookingId,
        status: 'SUCCESS' 
      },
      include: { 
        booking: { 
          include: { 
            nurse: { 
              include: { 
                nurseProfile: true 
              } 
            } 
          } 
        } 
      },
    });

    if (!payment) {
      throw new NotFoundException('No successful payment found for this booking');
    }

    if (payment.status === 'REFUNDED') {
      throw new BadRequestException('Payment already refunded');
    }

    // Update payment to refunded status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: payment.amount
      },
    });

    // Reduce nurse earnings
    const nurseProfile = payment.booking.nurse.nurseProfile;
    if (nurseProfile) {
      await this.prisma.nurseProfile.update({
        where: { id: nurseProfile.id },
        data: {
          totalEarnings: {
            decrement: payment.amount
          }
        }
      });
      console.log(`Refunded ₹${payment.amount} - reduced nurse ${nurseProfile.id} earnings`);
    }

    // Update booking status
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    return {
      success: true,
      refundAmount: payment.amount,
      message: `Refund of ₹${payment.amount} processed successfully`,
      reason
    };
  }

  // Mock payment processing - simulates successful payment
  async processPayment(clientSecret: string, paymentMethod: any) {
    // Extract payment intent ID from client secret
    const paymentIntentId = clientSecret.split('_secret_')[0];
    
    // Find the payment
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId: paymentIntentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      await this.handlePaymentSuccess(paymentIntentId);
      return { 
        success: true, 
        message: 'Payment processed successfully',
        paymentIntentId 
      };
    } else {
      await this.handlePaymentFailure(paymentIntentId);
      throw new BadRequestException('Payment failed - insufficient funds or card declined');
    }
  }
}
