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
exports.NursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ALLOWED_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALLOWED_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20
// Helper to normalize availability
function normalizeAvailability(input) {
    const result = {};
    for (const day of ALLOWED_DAYS) {
        const arr = Array.isArray(input?.[day])
            ? input[day].filter((h) => ALLOWED_HOURS.includes(h) && Number.isInteger(h))
            : [];
        result[day] = arr;
    }
    return result;
}
let NursesService = class NursesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    // Create profile (only once per nurse)
    async create(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.role !== 'NURSE') {
            throw new common_1.ForbiddenException('Only users with role NURSE can create a profile');
        }
        const existing = await this.prisma.nurseProfile.findUnique({ where: { userId } });
        if (existing) {
            throw new common_1.ForbiddenException('Profile already exists for this nurse');
        }
        return this.prisma.nurseProfile.create({
            data: { userId, ...dto },
        });
    }
    // Read own profile
    async findByUserId(userId) {
        const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return profile;
    }
    // Update profile
    async update(userId, dto) {
        console.log('Incoming DTO:', dto);
        const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return this.prisma.nurseProfile.update({
            where: { userId },
            data: dto,
        });
    }
    // Delete profile
    async remove(userId) {
        const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return this.prisma.nurseProfile.delete({ where: { userId } });
    }
    // Admin approval
    async approveNurse(profileId) {
        return this.prisma.nurseProfile.update({
            where: { id: profileId },
            data: { approved: true },
        });
    }
    // Admin reject nurse profile (delete by id)
    async rejectNurse(profileId) {
        const profile = await this.prisma.nurseProfile.findUnique({ where: { id: profileId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return this.prisma.nurseProfile.delete({ where: { id: profileId } });
    }
    // Get all approved nurses (for patients)
    async getApprovedNurses(filters) {
        const { specialization, location, maxRate } = filters || {};
        return this.prisma.nurseProfile.findMany({
            where: {
                approved: true,
                ...(location && { location: { contains: location, mode: 'insensitive' } }),
                ...(maxRate && { hourlyRate: { lte: maxRate } }),
                ...(specialization && {
                    specialization: {
                        has: specialization, // Prisma supports array fields with `has`
                    },
                }),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                reviews: true,
            },
        });
    }
    // Get all pending nurse profiles (for admin)
    async getPendingProfiles() {
        return this.prisma.nurseProfile.findMany({
            where: { approved: false },
            include: { user: true }, // include user details for admin context
        });
    }
    // Update availability JSON
    async updateAvailability(userId, availability) {
        // Validate and normalize
        if (typeof availability !== 'object' || Array.isArray(availability)) {
            throw new Error('Availability must be an object');
        }
        for (const day of Object.keys(availability)) {
            if (!ALLOWED_DAYS.includes(day))
                throw new Error('Invalid day: ' + day);
            const hours = availability[day];
            if (!Array.isArray(hours))
                throw new Error(`Hours for ${day} must be an array`);
            if (!hours.every((h) => Number.isInteger(h) && ALLOWED_HOURS.includes(h)))
                throw new Error(`Invalid hour(s) in ${day}`);
        }
        const normalized = normalizeAvailability(availability);
        const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        return this.prisma.nurseProfile.update({
            where: { userId },
            data: { availability: normalized },
        });
    }
    // Public fetch, always fill week/days/hours
    async findAvailabilityById(profileId) {
        const profile = await this.prisma.nurseProfile.findUnique({ where: { id: profileId } });
        if (!profile)
            throw new common_1.NotFoundException('Profile not found');
        const avail = normalizeAvailability(profile.availability);
        return { id: profile.id, availability: avail };
    }
};
exports.NursesService = NursesService;
exports.NursesService = NursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NursesService);
