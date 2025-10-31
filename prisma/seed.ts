import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedAdmin = await bcrypt.hash('adminpass', 10);
  await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {},
    create: { 
      email: 'admin@local.test', 
      password: hashedAdmin, 
      name: 'Admin', 
      role: 'ADMIN' 
    },
  });

  // Create nurse user
  const nursePass = await bcrypt.hash('nursepass', 10);
  const nurseUser = await prisma.user.upsert({
    where: { email: 'nurse1@local.test' },
    update: {},
    create: { 
      email: 'nurse1@local.test', 
      password: nursePass, 
      name: 'Nurse One', 
      role: 'NURSE' 
    },
  });

  // Create nurse profile
  await prisma.nurseProfile.upsert({
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

  // Create another nurse
  const nurse2Pass = await bcrypt.hash('nursepass', 10);
  const nurse2User = await prisma.user.upsert({
    where: { email: 'nurse2@local.test' },
    update: {},
    create: { 
      email: 'nurse2@local.test', 
      password: nurse2Pass, 
      name: 'Nurse Two', 
      role: 'NURSE' 
    },
  });

  await prisma.nurseProfile.upsert({
    where: { userId: nurse2User.id },
    update: {},
    create: {
      userId: nurse2User.id,
      specialization: ['Pediatric Care', 'Post-Surgery Care'],
      hourlyRate: 6000,
      location: 'Mumbai',
      latitude: 19.0760,
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
  const patientUser = await prisma.user.upsert({
    where: { email: 'patient1@local.test' },
    update: {},
    create: { 
      email: 'patient1@local.test', 
      password: patientPass, 
      name: 'Patient One', 
      role: 'PATIENT' 
    },
  });

  console.log('Seed finished successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
