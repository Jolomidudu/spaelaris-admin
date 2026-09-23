import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { PaymentsService } from './payments.service';

class CreatePaymentDto {
  @IsString()
  @MinLength(1)
  appointmentId!: string;

  @IsString()
  @MinLength(1)
  reference!: string;

  @IsInt()
  @Min(1)
  amountKobo!: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}

class UpdatePaymentDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;
}

class InitializePaymentDto extends CreatePaymentDto {
  @IsEmail()
  email!: string;
}

@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ManagePayments)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  list() {
    return this.paymentsService.list();
  }

  @Post()
  create(@Body() body: CreatePaymentDto) {
    return this.paymentsService.create(body);
  }

  @Post('initialize')
  initialize(@Body() body: InitializePaymentDto) {
    return this.paymentsService.initialize(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdatePaymentDto) {
    return this.paymentsService.update(id, body.status);
  }
}