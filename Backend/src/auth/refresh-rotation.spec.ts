import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException } from '@nestjs/common';
import { Types } from 'mongoose';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { ConfigService } from '@/config/config.service';

// Refresh rotation under a race. A page load fires several requests at once;
// they all find the access token expired and each asks for a refresh carrying
// the same cookie. Strict rotation lets one win and calls the rest reuse, which
// signed people out for nothing more than opening the site — so a token stays
// usable briefly after the rotation that replaced it. These cover the window
// working, the chain still advancing exactly once, and reuse past the window
// being refused as before.

const REFRESH_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const DEVICE = { userAgent: 'jest', ip: '127.0.0.1' };

function hash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

describe('AuthService.refresh rotation grace', () => {
  let service: AuthService;
  let userModel: { findById: jest.Mock };
  let jwt: JwtService;
  let user: any;

  // A token the service will accept as its own: signed with the same secret and
  // carrying the refresh type its verify() checks for.
  //
  // The nonce is load-bearing. A JWT is a pure function of its payload, and iat
  // has one-second resolution — so two tokens signed for the same user in the
  // same second are byte-identical, and a test token would silently collide
  // with the one the service issues, making a rotation look like a no-op.
  function issue(userId: string) {
    return jwt.sign({
      sub: userId,
      email: 'a@b.test',
      role: 'user',
      type: 'refresh',
      jti: crypto.randomUUID(),
    });
  }

  beforeEach(async () => {
    jwt = new JwtService({ secret: REFRESH_SECRET, signOptions: { expiresIn: '7d' } });

    const userId = new Types.ObjectId();
    user = {
      _id: userId,
      email: 'a@b.test',
      role: 'user',
      sessions: [] as any[],
      save: jest.fn().mockResolvedValue(undefined),
    };

    userModel = { findById: jest.fn().mockResolvedValue(user) };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { jwtSecret: REFRESH_SECRET, jwtExpiration: '15m', jwtRefreshExpiration: '7d' },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  function seedSession(token: string) {
    user.sessions = [
      {
        _id: new Types.ObjectId(),
        tokenHash: hash(token),
        userAgent: DEVICE.userAgent,
        ip: DEVICE.ip,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        previousTokenHash: null,
        previousTokenExpiresAt: null,
      },
    ];
  }

  it('rotates the session on a normal refresh', async () => {
    const original = issue(user._id.toString());
    seedSession(original);

    const result = await service.refresh(original, DEVICE);

    expect(result.data.refreshToken).toBeTruthy();
    expect(result.data.refreshToken).not.toBe(original);
    expect(user.sessions).toHaveLength(1);
    expect(user.sessions[0].tokenHash).toBe(hash(result.data.refreshToken as string));
    // The consumed token is remembered, not forgotten, so the racing caller
    // below has something to match against.
    expect(user.sessions[0].previousTokenHash).toBe(hash(original));
  });

  it('answers a second request carrying the just-rotated token', async () => {
    const original = issue(user._id.toString());
    seedSession(original);

    const winner = await service.refresh(original, DEVICE);
    const loser = await service.refresh(original, DEVICE);

    expect(loser.data.accessToken).toBeTruthy();
    // No refresh token: the session already rotated to the winner's, and
    // reissuing here would hand the browser back the consumed one.
    expect(loser.data.refreshToken).toBeNull();
    expect(user.sessions).toHaveLength(1);
    expect(user.sessions[0].tokenHash).toBe(hash(winner.data.refreshToken as string));
  });

  it('issues a usable access token on the grace path', async () => {
    const original = issue(user._id.toString());
    seedSession(original);

    await service.refresh(original, DEVICE);
    const loser = await service.refresh(original, DEVICE);

    const payload = jwt.verify<{ sub: string; type: string }>(loser.data.accessToken);
    expect(payload.type).toBe('access');
    expect(payload.sub).toBe(user._id.toString());
  });

  it('refuses the old token once the window has passed', async () => {
    const original = issue(user._id.toString());
    seedSession(original);

    await service.refresh(original, DEVICE);
    user.sessions[0].previousTokenExpiresAt = new Date(Date.now() - 1000);

    await expect(service.refresh(original, DEVICE)).rejects.toThrow(UnauthorizedException);
  });

  it('refuses a token that was never issued to the session', async () => {
    seedSession(issue(user._id.toString()));

    await expect(service.refresh(issue(user._id.toString()), DEVICE)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
