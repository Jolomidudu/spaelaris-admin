import { Controller, Get } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('public')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('catalog')
  catalog() {
    return this.catalogService.catalog();
  }

  @Get('therapists')
  therapists() {
    return this.catalogService.therapists();
  }
}
