import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
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

  @IsOptional()
  @IsString()
  @MaxLength(68_000)
  photoUrl?: string;
}

class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  locationSlug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(68_000)
  photoUrl?: string | null;
}

@Controller('rooms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.ManageRooms)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  list() {
    return this.roomsService.list();
  }

  @Post()
  create(@Body() body: CreateRoomDto) {
    return this.roomsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateRoomDto) {
    return this.roomsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }
}
