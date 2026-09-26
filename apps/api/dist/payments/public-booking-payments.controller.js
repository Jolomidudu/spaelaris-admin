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
exports.PublicBookingPaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
let PublicBookingPaymentsController = class PublicBookingPaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    initialize(appointmentId) {
        return this.paymentsService.initializeAppointmentPayment(appointmentId);
    }
    verify(reference) {
        return this.paymentsService.verifyAppointmentPayment(reference);
    }
};
exports.PublicBookingPaymentsController = PublicBookingPaymentsController;
__decorate([
    (0, common_1.Post)(':appointmentId/payment'),
    __param(0, (0, common_1.Param)('appointmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicBookingPaymentsController.prototype, "initialize", null);
__decorate([
    (0, common_1.Get)('payment/:reference'),
    __param(0, (0, common_1.Param)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicBookingPaymentsController.prototype, "verify", null);
exports.PublicBookingPaymentsController = PublicBookingPaymentsController = __decorate([
    (0, common_1.Controller)('public/booking'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PublicBookingPaymentsController);
//# sourceMappingURL=public-booking-payments.controller.js.map