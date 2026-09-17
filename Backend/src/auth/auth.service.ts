import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ConfigService } from '../config/config.service';
import { EmailService } from './services/email.service';
import { OtpUtils } from './utils/otp.utils';
import { EmailUtils } from './utils/email.utils';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GoogleProfile } from './interfaces/google-profile.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { DeviceInfo } from './interfaces/device-info.interface';
import { parseDurationToMs } from '@/common/utils/duration.util';

import { EventEmitter2 } from '@nestjs/event-emitter';

// How long a refresh token stays usable after the rotation that replaced it.
// Long enough to cover the requests one page load fires together — including a
// cold start on a sleeping free instance, where the first reply takes a moment —
// and short enough that a stolen token is worth almost nothing on its own.
const REFRESH_ROTATION_GRACE_MS = 30 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = OtpUtils.generateOtp(6);
    const hashedOtp = await OtpUtils.hashOtp(otp);
    const otpExpiresAt = OtpUtils.getOtpExpiryTime(10);

    const user = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerificationOtp: hashedOtp,
      otpExpiresAt,
      isEmailVerified: false,
    });

    await user.save();

    this.eventEmitter.emit('user.registered', { email, firstName, otp });

    return {
      success: true,
      message: 'Registration successful. Check your email for OTP.',
      data: {
        email,
        message: 'Verification code sent. Valid for 10 minutes.',
      },
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    if (!user.emailVerificationOtp) {
      throw new BadRequestException('No OTP found. Please register again.');
    }

    if (OtpUtils.isOtpExpired(user.otpExpiresAt)) {
      user.emailVerificationOtp = null;
      user.otpExpiresAt = null;
      await user.save();
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    const isOtpValid = await OtpUtils.verifyOtp(otp, user.emailVerificationOtp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP. Please try again.');
    }

    user.isEmailVerified = true;
    user.emailVerificationOtp = null;
    user.otpExpiresAt = null;
    await user.save();

    this.eventEmitter.emit('user.verified', { email, firstName: user.firstName });

    return {
      success: true,
      message: 'Email verified successfully',
      data: {
        email,
        isEmailVerified: true,
      },
    };
  }

  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Refresh tokens are hashed with sha256, not bcrypt — bcrypt silently
  // truncates its input at 72 bytes, and these JWTs run well past that
  // (~250 chars, with only the tail — iat/exp/signature — varying between
  // issuances). bcrypt.compare() against a truncated hash would therefore
  // treat *any* refresh token ever issued to a user as a match for any
  // other, defeating rotation-based reuse detection entirely. sha256 has
  // no truncation and the token is already high-entropy, so no slow
  // password-style hash is needed here anyway.
  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Finds which of a user's sessions (if any) a presented refresh token
  // belongs to. Bounded by how many devices one person is signed in on —
  // nothing like the all-users scan resetPassword used to do.
  private findSessionIndex(user: UserDocument, refreshToken: string): number {
    const candidateHash = Buffer.from(this.hashRefreshToken(refreshToken));
    return user.sessions.findIndex((session) => {
      const storedHash = Buffer.from(session.tokenHash);
      return storedHash.length === candidateHash.length && crypto.timingSafeEqual(storedHash, candidateHash);
    });
  }

  // The same, for the token a session held immediately before its last
  // rotation — valid only inside the grace window refresh() writes.
  private findGraceSessionIndex(user: UserDocument, refreshToken: string): number {
    const candidateHash = Buffer.from(this.hashRefreshToken(refreshToken));
    const now = new Date();
    return user.sessions.findIndex((session) => {
      if (!session.previousTokenHash || !session.previousTokenExpiresAt) return false;
      if (session.previousTokenExpiresAt <= now) return false;
      const storedHash = Buffer.from(session.previousTokenHash);
      return storedHash.length === candidateHash.length && crypto.timingSafeEqual(storedHash, candidateHash);
    });
  }

  private buildPayload(user: UserDocument): JwtPayload {
    return {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }

  private generateAccessToken(user: UserDocument): string {
    return this.jwtService.sign(
      { ...this.buildPayload(user), type: 'access' },
      { expiresIn: this.configService.jwtExpiration },
    );
  }

  private async generateTokens(user: UserDocument, deviceInfo: DeviceInfo, rotatedFromHash?: string) {
    const payload = this.buildPayload(user);
    const accessToken = this.generateAccessToken(user);

    // Signed (not opaque random) so refresh() can identify the user straight from
    // the cookie without a separate userId param — still hashed at rest below,
    // same as before, so a leaked DB row alone can't be replayed as a refresh token.
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: this.configService.jwtRefreshExpiration },
    );
    const hashedRefreshToken = this.hashRefreshToken(refreshToken);
    const now = new Date();

    // Drop anything already expired before adding this one — keeps the array
    // from growing forever across devices that never explicitly log out.
    user.sessions = user.sessions.filter((session) => session.expiresAt > now);
    user.sessions.push({
      _id: new Types.ObjectId(),
      tokenHash: hashedRefreshToken,
      userAgent: deviceInfo.userAgent,
      ip: deviceInfo.ip,
      createdAt: now,
      expiresAt: new Date(now.getTime() + parseDurationToMs(this.configService.jwtRefreshExpiration)),
      previousTokenHash: rotatedFromHash ?? null,
      previousTokenExpiresAt: rotatedFromHash ? new Date(now.getTime() + REFRESH_ROTATION_GRACE_MS) : null,
    });
    await user.save();

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto, deviceInfo: DeviceInfo) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    if (user.lockedUntil && new Date() < user.lockedUntil) {
      throw new UnauthorizedException('Account is locked. Try again later.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      user.lastLoginAttempt = new Date();

      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        throw new UnauthorizedException('Too many failed attempts. Account locked for 15 minutes.');
      }

      await user.save();
      throw new UnauthorizedException('Invalid email or password');
    }

    user.loginAttempts = 0;
    user.lastLoginAttempt = new Date();
    user.lockedUntil = null;

    const { accessToken, refreshToken } = await this.generateTokens(user, deviceInfo);

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    };
  }

  async refresh(refreshToken: string, deviceInfo: DeviceInfo) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Access denied');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Access denied');
    }

    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    const sessionIndex = this.findSessionIndex(user, refreshToken);
    if (sessionIndex === -1) {
      // Not the session's current token. It may still be the one rotated out
      // moments ago: a page load fires several requests at once, they all find
      // the access token expired, and each asks for a refresh carrying the same
      // cookie. Only the first can win a strict rotation, and treating the rest
      // as reuse signed people out for doing nothing but opening the site.
      //
      // Inside the grace window such a caller gets an access token and nothing
      // else: the session keeps the refresh token it just rotated to, so the
      // chain still advances exactly once and a replay seconds later buys an
      // attacker one short-lived access token rather than a session of their
      // own. Past the window it is reuse again, and still refused.
      const graceIndex = this.findGraceSessionIndex(user, refreshToken);
      if (graceIndex === -1) {
        throw new UnauthorizedException('Access denied');
      }

      return {
        success: true,
        message: 'Tokens refreshed',
        data: { accessToken: this.generateAccessToken(user), refreshToken: null },
      };
    }

    // Rotation: this device's old refresh token is consumed here and
    // generateTokens() below issues it a fresh one — every other device's
    // session is untouched.
    const rotatedFromHash = this.hashRefreshToken(refreshToken);
    user.sessions.splice(sessionIndex, 1);

    const tokens = await this.generateTokens(user, deviceInfo, rotatedFromHash);
    return {
      success: true,
      message: 'Tokens refreshed',
      data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken as string | null },
    }
  }

  async logout(userId: string, refreshToken: string | undefined) {
    const user = await this.userModel.findById(userId);
    if (user && refreshToken) {
      // Only end *this* device's session — signing out on the phone
      // shouldn't sign out the desktop too.
      const sessionIndex = this.findSessionIndex(user, refreshToken);
      if (sessionIndex !== -1) {
        user.sessions.splice(sessionIndex, 1);
        await user.save();
      }
    }

    return {
      success: true,
      message: 'Logout successful',
      data: null,
    };
  }

  async googleLogin(profile: GoogleProfile, deviceInfo: DeviceInfo) {
    const { googleId, email, displayName } = profile;
    const [firstName, ...lastNameParts] = displayName.split(' ');
    const lastName = lastNameParts.join(' ');

    // Repeat sign-in: this Google account has already been linked to a user
    // here before, so there's nothing left to verify.
    let user = await this.userModel.findOne({ googleId });

    if (!user) {
      user = await this.userModel.findOne({ email });

      if (!user) {
        user = new this.userModel({
          email,
          firstName: firstName || 'User',
          lastName: lastName || '',
          password: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
          isEmailVerified: true,
          googleId,
          authProvider: 'google',
          role: 'user',
        });
      } else {
        // A local account already owns this email but was never linked to
        // this Google account. Google itself just proved the signed-in
        // person controls the mailbox — that's real proof of ownership.
        // But if the local account was still unverified, its password may
        // have been set by someone else entirely (e.g. an attacker
        // pre-registering the victim's email to plant a password they
        // control). Verified-Google-owner now takes over the account, and
        // that stale, unproven password is invalidated rather than trusted.
        if (!user.isEmailVerified) {
          user.password = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);
        }
        user.googleId = googleId;
        user.authProvider = 'google';
        user.isEmailVerified = true;
      }
    }

    const { accessToken, refreshToken } = await this.generateTokens(user, deviceInfo);

    return {
      success: true,
      message: 'Google login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    };
  }

  // Whitelisted, not blacklisted: only what the client actually needs, so a
  // new internal field added to the schema later doesn't automatically leak
  // (loginAttempts, lockedUntil, otpExpiresAt etc. were previously exposed
  // this way).
  async validateUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isEmailVerified: user.isEmailVerified,
      role: user.role,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    await user.save();

    return {
      success: true,
      message: 'Profile updated',
      data: await this.validateUser(userId),
    };
  }

  // Invalidates every session (this device included) on success — the same
  // "assume the old password may be compromised" posture as a reset, so a
  // stolen refresh token can't outlive the password that was just changed.
  // The client re-authenticates with the new password afterward.
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.authProvider === 'google') {
      throw new BadRequestException('This account signs in with Google and has no separate password to change');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.sessions = [];
    await user.save();

    return {
      success: true,
      message: 'Password changed — please sign in again',
      data: null,
    };
  }

  async resendOtp(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const otp = OtpUtils.generateOtp(6);
    const hashedOtp = await OtpUtils.hashOtp(otp);
    const otpExpiresAt = OtpUtils.getOtpExpiryTime(10);

    user.emailVerificationOtp = hashedOtp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    this.eventEmitter.emit('user.resend-otp', { email, firstName: user.firstName, otp });

    return {
      success: true,
      message: 'New OTP sent to your email',
      data: {
        email,
      },
    };
  }
  
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.userModel.findOne({ email });
    
    if (!user) {
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      };
    }
    
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = this.hashResetToken(resetToken);

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();
    
    this.eventEmitter.emit('user.forgot-password', { email, firstName: user.firstName, resetToken });
    
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.',
    };
  }
  
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword } = resetPasswordDto;

    const targetUser = await this.userModel.findOne({
      resetPasswordToken: this.hashResetToken(token),
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!targetUser) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    targetUser.password = await bcrypt.hash(newPassword, 10);
    targetUser.resetPasswordToken = null;
    targetUser.resetPasswordExpiresAt = null;
    targetUser.lockedUntil = null;
    targetUser.loginAttempts = 0;
    
    await targetUser.save();
    
    return {
      success: true,
      message: 'Password has been reset successfully',
    }
  }
}
