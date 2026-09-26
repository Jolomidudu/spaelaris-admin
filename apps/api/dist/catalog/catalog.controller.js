"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const catalog_service_1 = require("./catalog.service");
const public_booking_service_1 = require("./public-booking.service");
class CreatePublicBookingDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(7),
    (0, class_validator_1.MaxLength)(30),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "locationSlug", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(12),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePublicBookingDto.prototype, "serviceSlugs", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "therapistProfileId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "startsAt", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "endsAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreatePublicBookingDto.prototype, "notes", void 0);
let CatalogController = class CatalogController {
    constructor(catalogService, publicBookingService) {
        this.catalogService = catalogService;
        this.publicBookingService = publicBookingService;
    }
    locations() {
        return this.publicBookingService.locations();
    }
    catalog() {
        return this.catalogService.catalog();
    }
    therapists() {
        return this.catalogService.therapists();
    }
    availability(locationSlug, date, serviceSlugs) {
        return this.publicBookingService.availability(locationSlug, date, (serviceSlugs ?? '').split(',').map((slug) => slug.trim()).filter(Boolean));
    }
    createBooking(body) {
        return this.publicBookingService.createBooking(body);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, common_1.Get)('locations'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "locations", null);
__decorate([
    (0, common_1.Get)('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "catalog", null);
__decorate([
    (0, common_1.Get)('therapists'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "therapists", null);
__decorate([
    (0, common_1.Get)('booking/availability'),
    __param(0, (0, common_1.Query)('locationSlug')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('serviceSlugs')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "availability", null);
__decorate([
    (0, common_2.Post)('booking'),
    __param(0, (0, common_2.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePublicBookingDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createBooking", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService,
        public_booking_service_1.PublicBookingService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map