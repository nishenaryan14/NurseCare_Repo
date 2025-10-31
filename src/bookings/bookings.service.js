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
exports.BookingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookingsService = class BookingsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(patientId, dto) {
        try {
            const { nurseId, scheduledAt, durationMinutes } = dto;
            // Check if nurse exists and is approved
            const nurse = await this.prisma.user.findUnique({
                where: { id: nurseId },
                include: { nurseProfile: true },
            });
            if (!nurse || nurse.role !== 'NURSE') {
                throw new common_1.NotFoundException('Nurse not found');
            }
            if (!nurse.nurseProfile || !nurse.nurseProfile.approved) {
                throw new common_1.BadRequestException('Nurse is not approved');
            }
            // Robust: check time slot against nurse availability
            const availability = nurse.nurseProfile.availability || {};
            const dateObj = new Date(scheduledAt);
            if (isNaN(dateObj.getTime()))
                throw new common_1.BadRequestException('Invalid scheduledAt');
            // Calculate day label (Mon, Tue, ...) and hour integer
            const dayIdx = dateObj.getDay() - 1 < 0 ? 6 : dateObj.getDay() - 1; // (Monday=0, Sunday=6)
            const dayLabel = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIdx];
            const hourVal = dateObj.getHours();
            const allowedHours = Array.isArray(availability?.[dayLabel]) ? availability[dayLabel] : [];
            if (!allowedHours.includes(hourVal)) {
                throw new common_1.BadRequestException('Nurse is not available at the selected time');
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
                const overlapEnd = new Date(overlap.scheduledAt.getTime() + overlap.durationMinutes * 60000);
                if (overlapEnd > start) {
                    throw new common_1.BadRequestException('Nurse already booked for this time slot');
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
        }
        catch (error) {
            console.error('❌ Booking creation error:', error);
            throw error;
        }
    }
    async updateStatus(bookingId, dto) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: dto.status },
        });
    }
    async cancel(bookingId, userId) {
        const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking)
            throw new common_1.NotFoundException('Booking not found');
        // Optional: enforce only patient or nurse can cancel their own booking
        return this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' },
        });
    }
    async findPatientBookings(patientId) {
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
    async findNurseBookings(nurseId) {
        return this.prisma.booking.findMany({
            where: { nurseId },
            include: { patient: true },
        });
    }
};
exports.BookingsService = BookingsService;
exports.BookingsService = BookingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookingsService);
