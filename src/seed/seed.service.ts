import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(private prisma: PrismaService) {}

  async seedDatabase() {
    // Create admin user
    const hashedAdmin = await bcrypt.hash('adminpass', 10);
    await this.prisma.user.upsert({
      where: { email: 'admin@local.test' },
      update: {},
      create: {
        email: 'admin@local.test',
        password: hashedAdmin,
        name: 'Admin',
        role: 'ADMIN',
      },
    });

    // Create nurse user 1
    const nursePass = await bcrypt.hash('nursepass', 10);
    const nurseUser = await this.prisma.user.upsert({
      where: { email: 'nurse1@local.test' },
      update: {},
      create: {
        email: 'nurse1@local.test',
        password: nursePass,
        name: 'Nurse One',
        role: 'NURSE',
      },
    });

    // Create nurse profile 1
    await this.prisma.nurseProfile.upsert({
      where: { userId: nurseUser.id },
      update: {},
      create: {
        userId: nurseUser.id,
        specialization: ['Elderly Care', 'Wound Care'],
        hourlyRate: 5000,
        location: 'Bangalore',
        latitude: 12.9716,
        longitude: 77.5946,
        approved: true,
        availability: {
          Mon: [9, 10, 11, 12, 13, 14, 15, 16],
          Tue: [9, 10, 11, 12, 13, 14, 15, 16],
          Wed: [9, 10, 11, 12, 13, 14, 15, 16],
          Thu: [9, 10, 11, 12, 13, 14, 15, 16],
          Fri: [9, 10, 11, 12, 13, 14, 15, 16],
          Sat: [],
          Sun: [],
        },
      },
    });

    // Create nurse user 2
    const nurse2Pass = await bcrypt.hash('nursepass', 10);
    const nurse2User = await this.prisma.user.upsert({
      where: { email: 'nurse2@local.test' },
      update: {},
      create: {
        email: 'nurse2@local.test',
        password: nurse2Pass,
        name: 'Nurse Two',
        role: 'NURSE',
      },
    });

    // Create nurse profile 2
    await this.prisma.nurseProfile.upsert({
      where: { userId: nurse2User.id },
      update: {},
      create: {
        userId: nurse2User.id,
        specialization: ['Pediatric Care', 'Post-Surgery Care'],
        hourlyRate: 6000,
        location: 'Mumbai',
        latitude: 19.076,
        longitude: 72.8777,
        approved: true,
        availability: {
          Mon: [8, 9, 10, 11, 12, 13, 14, 15],
          Tue: [8, 9, 10, 11, 12, 13, 14, 15],
          Wed: [8, 9, 10, 11, 12, 13, 14, 15],
          Thu: [8, 9, 10, 11, 12, 13, 14, 15],
          Fri: [8, 9, 10, 11, 12, 13, 14, 15],
          Sat: [10, 11, 12, 13],
          Sun: [],
        },
      },
    });

    // Create patient user
    const patientPass = await bcrypt.hash('patientpass', 10);
    await this.prisma.user.upsert({
      where: { email: 'patient1@local.test' },
      update: {},
      create: {
        email: 'patient1@local.test',
        password: patientPass,
        name: 'Patient One',
        role: 'PATIENT',
      },
    });

    return { success: true };
  }

  async seedPendingNurses() {
    // Create pending nurse 1
    const nursePass = await bcrypt.hash('nursepass', 10);
    const nurseUser = await this.prisma.user.create({
      data: {
        email: 'pending.nurse@test.com',
        password: nursePass,
        name: 'Sarah Johnson',
        role: 'NURSE',
      },
    });

    await this.prisma.nurseProfile.create({
      data: {
        userId: nurseUser.id,
        specialization: ['Pediatric Care', 'Emergency Care', 'ICU Care'],
        hourlyRate: 7500,
        location: 'Delhi',
        latitude: 28.7041,
        longitude: 77.1025,
        approved: false,
        availability: {
          Mon: [8, 9, 10, 11, 12, 13, 14, 15, 16],
          Tue: [8, 9, 10, 11, 12, 13, 14, 15, 16],
          Wed: [8, 9, 10, 11, 12, 13, 14, 15, 16],
          Thu: [8, 9, 10, 11, 12, 13, 14, 15, 16],
          Fri: [8, 9, 10, 11, 12, 13, 14, 15, 16],
          Sat: [9, 10, 11, 12],
          Sun: [],
        },
      },
    });

    // Create pending nurse 2
    const nurse2Pass = await bcrypt.hash('nursepass', 10);
    const nurse2User = await this.prisma.user.create({
      data: {
        email: 'john.pending@test.com',
        password: nurse2Pass,
        name: 'John Martinez',
        role: 'NURSE',
      },
    });

    await this.prisma.nurseProfile.create({
      data: {
        userId: nurse2User.id,
        specialization: ['Geriatric Care', 'Palliative Care'],
        hourlyRate: 6500,
        location: 'Mumbai',
        latitude: 19.076,
        longitude: 72.8777,
        approved: false,
        availability: {
          Mon: [9, 10, 11, 12, 13, 14, 15],
          Tue: [9, 10, 11, 12, 13, 14, 15],
          Wed: [9, 10, 11, 12, 13, 14, 15],
          Thu: [9, 10, 11, 12, 13, 14, 15],
          Fri: [9, 10, 11, 12, 13, 14, 15],
          Sat: [],
          Sun: [],
        },
      },
    });

    return { success: true };
  }
}
