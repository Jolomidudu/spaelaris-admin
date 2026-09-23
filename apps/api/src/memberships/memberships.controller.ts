import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { MembershipsService } from './memberships.service';

class CreateMembershipDto {
  @IsString()
  @MinLength(1)
  customerId!: string;

  @IsString()
  @MinLength(1)
  packageId!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;
}

@Controller('memberships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ManageMemberships)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  list() {
    return this.membershipsService.list();
  }

  @Post()
  create(@Body() body: CreateMembershipDto) {
    return this.membershipsService.create(body);
  }
}
