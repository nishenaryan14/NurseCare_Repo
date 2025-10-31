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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewsService = class ReviewsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(patientId, dto) {
        const { nurseId, rating, comment } = dto;
        // Check if nurse exists
        const nurse = await this.prisma.nurseProfile.findUnique({
            where: { id: nurseId },
        });
        if (!nurse) {
            throw new common_1.NotFoundException('Nurse not found');
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
            throw new common_1.BadRequestException('You can only review nurses you have completed bookings with');
        }
        // Check if review already exists
        const existingReview = await this.prisma.review.findFirst({
            where: {
                patientId,
                nurseId,
            },
        });
        if (existingReview) {
            throw new common_1.BadRequestException('You have already reviewed this nurse');
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
    async findByNurse(nurseId) {
        return this.prisma.review.findMany({
            where: { nurseId },
            include: {
                patient: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getNurseAverageRating(nurseId) {
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
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewsService);
