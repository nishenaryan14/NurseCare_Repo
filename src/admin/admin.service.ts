import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard Analytics
  async getDashboardStats() {
    const [
      totalUsers,
      totalNurses,
      totalPatients,
      totalBookings,
      pendingBookings,
      completedBookings,
      totalPayments,
      activeConversations,
      totalMessages,
      totalFiles,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'NURSE' } }),
      this.prisma.user.count({ where: { role: 'PATIENT' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'PENDING' } }),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.file.count(),
    ]);

    // Get recent activity
    const recentBookings = await this.prisma.booking.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { name: true, email: true } },
        nurse: { select: { name: true } },
      },
    });

    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    // Get growth stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await this.prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    const newBookingsLast30Days = await this.prisma.booking.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    return {
      overview: {
        totalUsers,
        totalNurses,
        totalPatients,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue: totalPayments._sum.amount || 0,
        activeConversations,
        totalMessages,
        totalFiles,
      },
      growth: {
        newUsersLast30Days,
        newBookingsLast30Days,
        userGrowthRate: totalUsers > 0 ? ((newUsersLast30Days / totalUsers) * 100).toFixed(2) : 0,
        bookingGrowthRate: totalBookings > 0 ? ((newBookingsLast30Days / totalBookings) * 100).toFixed(2) : 0,
      },
      recentActivity: {
        recentBookings,
        recentUsers,
      },
    };
  }

  // Chart Data
  async getChartData(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate = new Date();
    let groupBy: 'day' | 'week' | 'month' = 'day';

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        groupBy = 'day';
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        groupBy = 'day';
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = 'month';
        break;
    }

    // Bookings over time
    const bookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, status: true, payment: { select: { amount: true } } },
    });

    // Users over time
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, role: true },
    });

    // Group data by period
    const bookingsByDate = this.groupByDate(bookings, groupBy);
    const usersByDate = this.groupByDate(users, groupBy);
    const revenueByDate: any[] = []; // Simplified for now

    return {
      bookings: bookingsByDate,
      users: usersByDate,
      revenue: revenueByDate,
    };
  }

  private groupByDate(data: any[], groupBy: 'day' | 'week' | 'month') {
    const grouped: { [key: string]: number } = {};

    data.forEach((item) => {
      const date = new Date(item.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        // week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  private groupRevenueByDate(bookings: any[], groupBy: 'day' | 'week' | 'month') {
    const grouped: { [key: string]: number } = {};

    bookings.forEach((booking) => {
      if (booking.status === 'COMPLETED') {
        const date = new Date(booking.createdAt);
        let key: string;

        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        }

        grouped[key] = (grouped[key] || 0) + (booking.totalPrice || 0);
      }
    });

    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }

  // User Management
  async getAllUsers(page: number = 1, limit: number = 20, role?: string, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          nurseProfile: {
            select: {
              specialization: true,
              location: true,
              approved: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        nurseProfile: true,
        patientBookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        nurseBookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserRole(userId: number, role: any) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });
  }

  async deleteUser(userId: number) {
    // Check if user has active bookings
    const activeBookings = await this.prisma.booking.count({
      where: {
        OR: [{ patientId: userId }, { nurseId: userId }],
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBookings > 0) {
      throw new ForbiddenException('Cannot delete user with active bookings');
    }

    // Delete related records first to avoid foreign key constraint violations
    // Use a transaction to ensure all deletes succeed or none do
    return this.prisma.$transaction(async (prisma) => {
      // Find nurse profile first (before deleting)
      const nurseProfile = await prisma.nurseProfile.findFirst({
        where: { userId },
      });

      // Delete reviews for this nurse (if they are a nurse)
      if (nurseProfile) {
        await prisma.review.deleteMany({
          where: { nurseId: nurseProfile.id },
        });
      }

      // Delete reviews by this user
      await prisma.review.deleteMany({
        where: { patientId: userId },
      });

      // Delete nurse profile if exists
      await prisma.nurseProfile.deleteMany({
        where: { userId },
      });

      // Delete messages sent by this user
      await prisma.message.deleteMany({
        where: { senderId: userId },
      });

      // Delete files uploaded by this user
      await prisma.file.deleteMany({
        where: { uploadedById: userId },
      });

      // Delete conversation participants
      await prisma.conversationParticipant.deleteMany({
        where: { userId },
      });

      // Delete payments for completed bookings first (to avoid foreign key constraint)
      const completedBookings = await prisma.booking.findMany({
        where: {
          OR: [{ patientId: userId }, { nurseId: userId }],
          status: 'COMPLETED',
        },
        select: { id: true },
      });

      if (completedBookings.length > 0) {
        await prisma.payment.deleteMany({
          where: {
            bookingId: { in: completedBookings.map((b) => b.id) },
          },
        });
      }

      // Delete completed bookings (historical data)
      await prisma.booking.deleteMany({
        where: {
          OR: [{ patientId: userId }, { nurseId: userId }],
          status: 'COMPLETED',
        },
      });

      // Finally delete the user
      return prisma.user.delete({
        where: { id: userId },
      });
    });
  }

  // Booking Management
  async getAllBookings(page: number = 1, limit: number = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: { select: { id: true, name: true, email: true } },
          nurse: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBookingStatus(bookingId: number, status: string) {
    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  // System Health
  async getSystemHealth() {
    const dbStatus = await this.checkDatabaseConnection();
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'operational',
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  private async checkDatabaseConnection(): Promise<string> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'connected';
    } catch (error) {
      return 'disconnected';
    }
  }

  // Revenue Analytics
  async getRevenueAnalytics() {
    const totalPayments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
    });

    const monthlyRevenue = await this.getMonthlyRevenue();

    return {
      totalRevenue: totalPayments._sum.amount || 0,
      monthlyRevenue,
      topNurses: [],
    };
  }

  private async getMonthlyRevenue() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    return result._sum.amount || 0;
  }

  // Removed for simplicity - can be added later with proper schema
}
