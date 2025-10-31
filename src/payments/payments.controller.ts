import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GetUser } from '../common/decorators/get-user.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  async createPaymentIntent(@Body() body: { bookingId: number }) {
    return this.paymentsService.createPaymentIntent(body.bookingId);
  }

  @Post('webhook')
  async handleWebhook(@Req() req: any, @Res() res: any) {
    const signature = req.headers['mock-signature'] || 'mock-signature';
    const payload = req.body;

    try {
      const result = await this.paymentsService.handleWebhook(payload, signature);
      res.json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(400).json({ error: errorMessage });
    }
  }

  @Post('process-mock-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT)
  async processMockPayment(@Body() body: { clientSecret: string; paymentMethod: any }) {
    return this.paymentsService.processPayment(body.clientSecret, body.paymentMethod);
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  async refundPayment(@Body() body: { bookingId: number; reason?: string }, @GetUser() user: any) {
    // Allow both patients and nurses to request refunds
    // Additional authorization logic can be added here if needed
    return this.paymentsService.refundPayment(body.bookingId, body.reason);
  }
}
