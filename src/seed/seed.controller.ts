import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  async seedDatabase() {
    try {
      await this.seedService.seedDatabase();
      return {
        success: true,
        message: 'Database seeded successfully',
        data: {
          admin: 'admin@local.test',
          nurses: ['nurse1@local.test', 'nurse2@local.test'],
          patient: 'patient1@local.test',
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Seed failed or already seeded',
        error: error.message,
      };
    }
  }

  @Post('pending-nurses')
  @HttpCode(HttpStatus.OK)
  async seedPendingNurses() {
    try {
      await this.seedService.seedPendingNurses();
      return {
        success: true,
        message: 'Pending nurses created successfully',
        data: {
          pendingNurses: ['pending.nurse@test.com', 'john.pending@test.com'],
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create pending nurses',
        error: error.message,
      };
    }
  }
}
