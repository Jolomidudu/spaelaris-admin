import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permission } from '../auth/permissions';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { RoomsService } from './rooms.service';

class CreateRoomDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  locationSlug!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  list() {
    return this.roomsService.list();
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.ManageRooms)
  create(@Body() body: CreateRoomDto) {
    return this.roomsService.create(body);
  }
}
