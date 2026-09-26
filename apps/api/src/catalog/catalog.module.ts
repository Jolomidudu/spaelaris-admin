import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { PublicBookingService } from './public-booking.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, PublicBookingService],
})
export class CatalogModule {}
