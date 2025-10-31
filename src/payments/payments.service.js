"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
// Mock Payment Gateway - Simulates real payment processing
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPaymentIntent(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { nurse: { include: { nurseProfile: true } } },
        });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        if (booking.status !== 'PENDING_PAYMENT')
            throw new common_1.BadRequestException('Booking is not pending payment');
        const nurse = booking.nurse;
        if (!nurse?.nurseProfile)
            throw new common_1.NotFoundException('Nurse or profile not found');
        // Calculate price (hourlyRate * (minutes / 60))
        const amount = Math.round((nurse.nurseProfile.hourlyRate * booking.durationMinutes / 60) * 100) / 100;
        if (isNaN(amount) || amount < 1)
            throw new common_1.BadRequestException('Payment calculation error');
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
    async handleWebhook(payload, signature) {
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
    async handlePaymentSuccess(paymentIntentId) {
        const payment = await this.prisma.payment.findFirst({
            where: { providerPaymentId: paymentIntentId },
            include: { booking: true },
        });
        if (payment) {
            await this.prisma.$transaction([
                this.prisma.payment.update({
                    where: { id: payment.id },
                    data: { status: 'SUCCESS' },
                }),
                this.prisma.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'CONFIRMED' },
                }),
            ]);
        }
    }
    async handlePaymentFailure(paymentIntentId) {
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
    // Mock payment processing - simulates successful payment
    async processPayment(clientSecret, paymentMethod) {
        // Extract payment intent ID from client secret
        const paymentIntentId = clientSecret.split('_secret_')[0];
        // Find the payment
        const payment = await this.prisma.payment.findFirst({
            where: { providerPaymentId: paymentIntentId },
            include: { booking: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
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
        }
        else {
            await this.handlePaymentFailure(paymentIntentId);
            throw new common_1.BadRequestException('Payment failed - insufficient funds or card declined');
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
