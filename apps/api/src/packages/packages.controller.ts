import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { PackagesService } from './packages.service';

class CreatePackageDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  priceNaira!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  validityDays?: number;

  @IsArray()
  @IsString({ each: true })
  serviceSlugs!: string[];
}

@Controller('packages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ManagePackages)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  list() {
    return this.packagesService.list();
  }

  @Post()
  create(@Body() body: CreatePackageDto) {
    return this.packagesService.create(body);
  }
}
