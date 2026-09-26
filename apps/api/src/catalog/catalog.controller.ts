import { Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PublicBookingService } from './public-booking.service';

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
}
