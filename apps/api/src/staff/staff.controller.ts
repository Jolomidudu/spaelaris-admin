import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, Max, Min, MinLength, ValidateNested } from 'class-validator';
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

class StaffAvailabilityDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;
}

class UpdateStaffAvailabilityDto {
  @IsArray()
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => StaffAvailabilityDayDto)
  availability!: StaffAvailabilityDayDto[];
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

  @Patch(':id/availability')
  updateAvailability(@Param('id') id: string, @Body() body: UpdateStaffAvailabilityDto) {
    return this.staffService.updateAvailability(id, body.availability);
  }
}