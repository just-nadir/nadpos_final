
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private prisma: PrismaService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_SECRET || 'super_secret_key',
        });
    }

    async validate(payload: any) {
        if (payload.role === 'RESTAURANT') {
            const restaurant = await this.prisma.restaurant.findUnique({
                where: { id: payload.sub },
            });
            if (!restaurant) throw new UnauthorizedException();
            return { ...restaurant, role: 'RESTAURANT' };
        }
        // Super Admin logic (assuming user table)
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}
