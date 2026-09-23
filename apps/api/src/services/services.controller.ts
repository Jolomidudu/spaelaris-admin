import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ServicesService } from './services.service';

class CreateServiceDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  categoryId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  durationMinutes!: number;

  @IsNumber()
  @Min(0)
  priceNaira!: number;
}

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  list() {
    return this.servicesService.list();
  }

  @Get('categories')
  categories() {
    return this.servicesService.categories();
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.ManageServices)
  create(@Body() body: CreateServiceDto) {
    return this.servicesService.create(body);
  }
}
