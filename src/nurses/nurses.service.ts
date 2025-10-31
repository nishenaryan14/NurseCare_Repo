import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNurseDto } from './dto/create-nurse.dto';
import { UpdateNurseDto } from './dto/update-nurse.dto';

const ALLOWED_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ALLOWED_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8-20

// Helper to normalize availability
function normalizeAvailability(input: any) {
  const result: Record<string, number[]> = {};
  for (const day of ALLOWED_DAYS) {
    const arr = Array.isArray(input?.[day])
      ? input[day].filter((h: any) => ALLOWED_HOURS.includes(h) && Number.isInteger(h))
      : [];
    result[day] = arr;
  }
  return result;
}

@Injectable()
export class NursesService {
  constructor(private prisma: PrismaService) {}

  // Create profile (only once per nurse)
  async create(userId: number, dto: CreateNurseDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'NURSE') {
      throw new ForbiddenException('Only users with role NURSE can create a profile');
    }

    const existing = await this.prisma.nurseProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ForbiddenException('Profile already exists for this nurse');
    }

    return this.prisma.nurseProfile.create({
      data: { userId, ...dto },
    });
  }

  // Read own profile
  async findByUserId(userId: number) {
    const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    console.log('Nurse profile returned:', { 
      id: profile.id, 
      totalEarnings: profile.totalEarnings,
      hourlyRate: profile.hourlyRate 
    }); // Debug log
    return profile;
  }

  // Update profile
  async update(userId: number, dto: UpdateNurseDto) {
    console.log('Incoming DTO:', dto);
    const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.nurseProfile.update({
      where: { userId },
      data: dto,
    });
  }

  // Delete profile
  async remove(userId: number) {
    const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');

    return this.prisma.nurseProfile.delete({ where: { userId } });
  }

  // Admin approval
  async approveNurse(profileId: number) {
    return this.prisma.nurseProfile.update({
      where: { id: profileId },
      data: { approved: true },
    });
  }

  // Admin reject nurse profile (delete by id)
  async rejectNurse(profileId: number) {
    const profile = await this.prisma.nurseProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.nurseProfile.delete({ where: { id: profileId } });
  }

  // Get all approved nurses (for patients)

async getApprovedNurses(filters?: {
  specialization?: string;
  location?: string;
  maxRate?: number;
}) {
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
  async updateAvailability(userId: number, availability: any) {
    // Validate and normalize
    if (typeof availability !== 'object' || Array.isArray(availability)) {
      throw new Error('Availability must be an object');
    }
    for (const day of Object.keys(availability)) {
      if (!ALLOWED_DAYS.includes(day)) throw new Error('Invalid day: ' + day);
      const hours = availability[day];
      if (!Array.isArray(hours)) throw new Error(`Hours for ${day} must be an array`);
      if (!hours.every((h: any) => Number.isInteger(h) && ALLOWED_HOURS.includes(h))) throw new Error(`Invalid hour(s) in ${day}`);
    }
    const normalized = normalizeAvailability(availability);
    const profile = await this.prisma.nurseProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found');
    return this.prisma.nurseProfile.update({
      where: { userId },
      data: { availability: normalized },
    });
  }

  // Public fetch, always fill week/days/hours
  async findAvailabilityById(profileId: number) {
    const profile = await this.prisma.nurseProfile.findUnique({ where: { id: profileId } });
    if (!profile) throw new NotFoundException('Profile not found');
    const avail = normalizeAvailability(profile.availability);
    return { id: profile.id, availability: avail };
  }
}