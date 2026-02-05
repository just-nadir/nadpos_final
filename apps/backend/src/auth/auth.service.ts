
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        // 1. Check User (Super Admin)
        const user = await this.prisma.user.findUnique({ where: { email: username } });
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }

        // 2. Check Restaurant
        const restaurant = await this.prisma.restaurant.findUnique({ where: { phone: username } });
        if (restaurant && (await bcrypt.compare(pass, restaurant.password))) {
            const { password, ...result } = restaurant;
            return { ...result, role: 'RESTAURANT' }; // Append role
        }

        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Machine ID Check for Restaurants
        if (user.role === 'RESTAURANT') {
            if (!loginDto.machineId) {
                throw new UnauthorizedException('Machine ID is required for restaurants');
            }

            // Fetch fresh restaurant data to check machineId
            const restaurant = await this.prisma.restaurant.findUnique({ where: { id: user.id } });

            if (!restaurant) {
                throw new UnauthorizedException('Restoran ma\'lumotlari topilmadi');
            }

            if (!restaurant.machineId) {
                // First time login: Bind Machine ID
                await this.prisma.restaurant.update({
                    where: { id: user.id },
                    data: { machineId: loginDto.machineId },
                });
            } else if (restaurant.machineId !== loginDto.machineId) {
                // Machine ID mismatch
                throw new UnauthorizedException('This license is bound to another device.');
            }

            // Litsenziya muddati tekshiruvi (UTC sana — checkLicense bilan bir xil)
            const license = await this.prisma.license.findFirst({
                where: { restaurantId: restaurant.id },
                orderBy: { endDate: 'desc' },
            });
            if (!license) {
                throw new UnauthorizedException('Litsenziya muddati tugagan');
            }
            const todayUtc = new Date();
            const todayStr = todayUtc.getUTCFullYear() + '-' + String(todayUtc.getUTCMonth() + 1).padStart(2, '0') + '-' + String(todayUtc.getUTCDate()).padStart(2, '0');
            const endDate = new Date(license.endDate);
            const endStr = endDate.getUTCFullYear() + '-' + String(endDate.getUTCMonth() + 1).padStart(2, '0') + '-' + String(endDate.getUTCDate()).padStart(2, '0');
            if (endStr < todayStr) {
                throw new UnauthorizedException('Litsenziya muddati tugagan');
            }
        }

        const payload = {
            username: user.email || user.phone,
            sub: user.id,
            role: user.role || 'RESTAURANT'
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: { ...user, machineId: loginDto.machineId || user.machineId },
        };
    }

    async hashPassword(password: string) {
        return bcrypt.hash(password, 10);
    }

    /** POS blok ekrani uchun: faqat litsenziya sanasi tekshiriladi (machineId login da tekshiriladi). techSupportPhone super-admin da sozlangan raqam. */
    async checkLicense(restaurantId: string, _machineId: string): Promise<{ valid: boolean; endDate?: string; techSupportPhone?: string | null }> {
        const techConfig = await this.prisma.config.findUnique({ where: { key: 'tech_support_phone' } });
        const techSupportPhone = techConfig?.value ?? null;

        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                licenses: {
                    orderBy: { endDate: 'desc' },
                    take: 1,
                },
            },
        });
        if (!restaurant) {
            return { valid: false, techSupportPhone };
        }
        const license = restaurant.licenses[0];
        if (!license) {
            return { valid: false, techSupportPhone };
        }
        // Sana bo'yicha: faqat UTC sana (YYYY-MM-DD) taqqoslanadi, vaqt zonalariga qaramay
        const todayUtc = new Date();
        const todayStr = todayUtc.getUTCFullYear() + '-' + String(todayUtc.getUTCMonth() + 1).padStart(2, '0') + '-' + String(todayUtc.getUTCDate()).padStart(2, '0');
        const endDate = new Date(license.endDate);
        const endStr = endDate.getUTCFullYear() + '-' + String(endDate.getUTCMonth() + 1).padStart(2, '0') + '-' + String(endDate.getUTCDate()).padStart(2, '0');
        if (endStr < todayStr) {
            return { valid: false, endDate: license.endDate.toISOString(), techSupportPhone };
        }
        return { valid: true, endDate: license.endDate.toISOString(), techSupportPhone };
    }
}
