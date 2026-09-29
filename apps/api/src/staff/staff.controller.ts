import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEmail, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
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

  @IsOptional()
  @IsString()
  displayTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(68000)
  photoUrl?: string;

  @IsString()
  @MinLength(1)
  locationSlug!: string;

  @IsArray()
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsString({ each: true })
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

class UpdateStaffServicesDto {
  @IsArray()
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsString({ each: true })
  serviceSlugs!: string[];
}

class UpdateStaffPhotoDto {
  @IsString()
  @MaxLength(68000)
  photoUrl!: string;
}

class UpdateStaffProfileDto {
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
  phone?: string | null;

  @IsString()
  locationSlug!: string;

  @IsIn([UserRole.MANAGER, UserRole.RECEPTIONIST, UserRole.THERAPIST])
  role!: UserRole;

  @IsString()
  @MinLength(1)
  displayTitle!: string;
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

  @Patch(':id/services')
  updateServices(@Param('id') id: string, @Body() body: UpdateStaffServicesDto) {
    return this.staffService.updateServices(id, body.serviceSlugs);
  }

  @Patch(':id/photo')
  updatePhoto(@Param('id') id: string, @Body() body: UpdateStaffPhotoDto) {
    return this.staffService.updatePhoto(id, body.photoUrl);
  }

  @Patch(':id/profile')
  updateProfile(@Param('id') id: string, @Body() body: UpdateStaffProfileDto) {
    return this.staffService.updateProfile(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.staffService.remove(id);
  }
}