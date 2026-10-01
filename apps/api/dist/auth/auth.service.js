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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../database/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        if (!(await bcrypt.compare(password, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Invalid email or password');
        }
        const authenticatedUser = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
        };
        return {
            accessToken: await this.jwtService.signAsync(authenticatedUser),
            user: authenticatedUser,
        };
    }
    async profile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                bio: true,
                photoUrl: true,
                country: true,
                cityState: true,
                postalCode: true,
                taxId: true,
                facebookUrl: true,
                xUrl: true,
                linkedinUrl: true,
                instagramUrl: true,
                role: true,
                staffProfile: { select: { bio: true, photoUrl: true } },
            },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Signed-in user was not found');
        const { staffProfile, ...profile } = user;
        return {
            ...profile,
            bio: profile.bio ?? staffProfile?.bio ?? null,
            photoUrl: profile.photoUrl ?? staffProfile?.photoUrl ?? null,
        };
    }
    async updateProfile(userId, data) {
        const firstName = data.firstName?.trim();
        const lastName = data.lastName?.trim();
        const email = data.email?.trim().toLowerCase();
        if (data.firstName !== undefined && !firstName)
            throw new common_1.BadRequestException('First name is required');
        if (data.lastName !== undefined && !lastName)
            throw new common_1.BadRequestException('Last name is required');
        if (data.email !== undefined && !email)
            throw new common_1.BadRequestException('Email address is required');
        if (email) {
            const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
            if (existing && existing.id !== userId) {
                throw new common_1.ConflictException('An account with this email address already exists');
            }
        }
        const nullable = (value) => value === undefined ? undefined : value?.trim() || null;
        await this.prisma.$transaction(async (transaction) => {
            await transaction.user.update({
                where: { id: userId },
                data: {
                    firstName,
                    lastName,
                    email,
                    phone: nullable(data.phone),
                    bio: nullable(data.bio),
                    photoUrl: nullable(data.photoUrl),
                    country: nullable(data.country),
                    cityState: nullable(data.cityState),
                    postalCode: nullable(data.postalCode),
                    taxId: nullable(data.taxId),
                    facebookUrl: nullable(data.facebookUrl),
                    xUrl: nullable(data.xUrl),
                    linkedinUrl: nullable(data.linkedinUrl),
                    instagramUrl: nullable(data.instagramUrl),
                },
            });
            await transaction.staffProfile.updateMany({
                where: { userId },
                data: {
                    bio: nullable(data.bio),
                    photoUrl: nullable(data.photoUrl),
                },
            });
        });
        return this.profile(userId);
    }
    async changePassword(userId, currentPassword, newPassword) {
        if (currentPassword === newPassword) {
            throw new common_1.BadRequestException('New password must be different from the current password');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
        if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
            throw new common_1.UnauthorizedException('Current password is incorrect');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: await bcrypt.hash(newPassword, 12) },
        });
        return { success: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map