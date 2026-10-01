import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthenticatedRequest } from './auth.types';

class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @IsString()
  bio?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(68_000)
  photoUrl?: string | null;

  @IsOptional()
  @IsString()
  country?: string | null;

  @IsOptional()
  @IsString()
  cityState?: string | null;

  @IsOptional()
  @IsString()
  postalCode?: string | null;

  @IsOptional()
  @IsString()
  taxId?: string | null;

  @IsOptional()
  @IsString()
  facebookUrl?: string | null;

  @IsOptional()
  @IsString()
  xUrl?: string | null;

  @IsOptional()
  @IsString()
  linkedinUrl?: string | null;

  @IsOptional()
  @IsString()
  instagramUrl?: string | null;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.profile(request.user!.id);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() request: AuthenticatedRequest, @Body() body: UpdateProfileDto) {
    return this.authService.updateProfile(request.user!.id, body);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  changePassword(@Req() request: AuthenticatedRequest, @Body() body: ChangePasswordDto) {
    return this.authService.changePassword(request.user!.id, body.currentPassword, body.newPassword);
  }
}