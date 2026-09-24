import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { StaffService } from './staff.service';

class CreateStaffDto {
  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(1)
  locationSlug!: string;

  @IsString({ each: true })
  @IsIn(['deep-tissue-massage', 'glow-facial', 'aromatherapy'], { each: true })
  serviceSlugs!: string[];

  @IsOptional()
  @IsIn([UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.THERAPIST])
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MinLength(8)
  initialPassword?: string;
}

class UpdateStaffAccessDto {
  @IsIn([UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.THERAPIST])
  role!: UserRole;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('staff')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ManageUsers)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  list() {
    return this.staffService.list();
  }

  @Post()
  create(@Body() body: CreateStaffDto) {
    return this.staffService.create(body);
  }

  @Patch(':id/access')
  updateAccess(@Param('id') id: string, @Body() body: UpdateStaffAccessDto) {
    return this.staffService.updateAccess(id, body);
  }
}