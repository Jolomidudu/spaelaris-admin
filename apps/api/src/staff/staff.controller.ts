import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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
}

@Controller('staff')
@UseGuards(JwtAuthGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  list() {
    return this.staffService.list();
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.ManageUsers)
  create(@Body() body: CreateStaffDto) {
    return this.staffService.create(body);
  }
}