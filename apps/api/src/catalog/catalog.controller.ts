import { Controller, Get, Query } from '@nestjs/common';
import { Body, Post } from '@nestjs/common';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CatalogService } from './catalog.service';
import { PublicBookingService } from './public-booking.service';

class CreatePublicBookingDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MinLength(1)
  locationSlug!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsString({ each: true })
  serviceSlugs!: string[];

  @IsString()
  @MinLength(1)
  therapistProfileId!: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

@Controller('public')
export class CatalogController {
  constructor(
    private readonly catalogService: CatalogService,
    private readonly publicBookingService: PublicBookingService,
  ) {}

  @Get('locations')
  locations() {
    return this.publicBookingService.locations();
  }

  @Get('catalog')
  catalog() {
    return this.catalogService.catalog();
  }

  @Get('therapists')
  therapists() {
    return this.catalogService.therapists();
  }

  @Get('booking/availability')
  availability(
    @Query('locationSlug') locationSlug: string,
    @Query('date') date: string,
    @Query('serviceSlugs') serviceSlugs: string,
  ) {
    return this.publicBookingService.availability(
      locationSlug,
      date,
      (serviceSlugs ?? '').split(',').map((slug) => slug.trim()).filter(Boolean),
    );
  }

  @Post('booking')
  createBooking(@Body() body: CreatePublicBookingDto) {
    return this.publicBookingService.createBooking(body);
  }
}
