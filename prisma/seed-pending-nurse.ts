import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create a pending nurse user
  const nursePass = await bcrypt.hash('nursepass', 10);
  const nurseUser = await prisma.user.create({
    data: { 
      email: 'pending.nurse@test.com', 
      password: nursePass, 
      name: 'Sarah Johnson', 
      role: 'NURSE' 
    },
  });

  // Create pending nurse profile (not approved)
  await prisma.nurseProfile.create({
    data: {
      userId: nurseUser.id,
      specialization: ['Pediatric Care', 'Emergency Care', 'ICU Care'],
      hourlyRate: 7500,
      location: 'Delhi',
      latitude: 28.7041,
      longitude: 77.1025,
      approved: false, // This is the key - not approved yet
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

  // Create another pending nurse
  const nurse2Pass = await bcrypt.hash('nursepass', 10);
  const nurse2User = await prisma.user.create({
    data: { 
      email: 'john.pending@test.com', 
      password: nurse2Pass, 
      name: 'John Martinez', 
      role: 'NURSE' 
    },
  });

  await prisma.nurseProfile.create({
    data: {
      userId: nurse2User.id,
      specialization: ['Geriatric Care', 'Palliative Care'],
      hourlyRate: 6500,
      location: 'Mumbai',
      latitude: 19.0760,
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

  console.log('✅ Pending nurses created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
