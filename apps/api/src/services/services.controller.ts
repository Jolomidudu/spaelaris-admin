import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { ServicesService } from './services.service';

class CreateServiceCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

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

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceNaira?: number;
}

@Controller('services')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ManageServices)
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

  @Post('categories')
  createCategory(@Body() body: CreateServiceCategoryDto) {
    return this.servicesService.createCategory(body);
  }

  @Post()
  create(@Body() body: CreateServiceDto) {
    return this.servicesService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    return this.servicesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
