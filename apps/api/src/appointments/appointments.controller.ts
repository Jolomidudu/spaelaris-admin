import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { IsDateString, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { AppointmentsService } from './appointments.service';

class CreateAppointmentDto {
  @IsString()
  @MinLength(7)
  customerPhone!: string;

  @IsString()
  @MinLength(1)
  serviceSlug!: string;

  @IsString()
  @MinLength(1)
  locationSlug!: string;

  @IsOptional()
  @IsEmail()
  therapistEmail?: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsIn(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status?: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('appointments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ManageAppointments)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  list() {
    return this.appointmentsService.list();
  }

  @Post()
  create(@Body() body: CreateAppointmentDto) {
    return this.appointmentsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateAppointmentDto) {
    return this.appointmentsService.update(id, body);
  }
}