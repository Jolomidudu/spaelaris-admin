import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { AuthenticatedUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.status !== 'ACTIVE' || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const authenticatedUser: AuthenticatedUser = {
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

  async profile(userId: string) {
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

    if (!user) throw new UnauthorizedException('Signed-in user was not found');

    const { staffProfile, ...profile } = user;
    return {
      ...profile,
      bio: profile.bio ?? staffProfile?.bio ?? null,
      photoUrl: profile.photoUrl ?? staffProfile?.photoUrl ?? null,
    };
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    bio?: string | null;
    photoUrl?: string | null;
    country?: string | null;
    cityState?: string | null;
    postalCode?: string | null;
    taxId?: string | null;
    facebookUrl?: string | null;
    xUrl?: string | null;
    linkedinUrl?: string | null;
    instagramUrl?: string | null;
  }) {
    const firstName = data.firstName?.trim();
    const lastName = data.lastName?.trim();
    const email = data.email?.trim().toLowerCase();
    if (data.firstName !== undefined && !firstName) throw new BadRequestException('First name is required');
    if (data.lastName !== undefined && !lastName) throw new BadRequestException('Last name is required');
    if (data.email !== undefined && !email) throw new BadRequestException('Email address is required');

    if (email) {
      const existing = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (existing && existing.id !== userId) {
        throw new ConflictException('An account with this email address already exists');
      }
    }

    const nullable = (value?: string | null) => value === undefined ? undefined : value?.trim() || null;
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

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from the current password');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
    if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    });

    return { success: true };
  }
}