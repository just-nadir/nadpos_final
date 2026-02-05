import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const KEY_TECH_SUPPORT_PHONE = 'tech_support_phone';

@Injectable()
export class ConfigService {
    constructor(private prisma: PrismaService) { }

    async getTechSupportPhone(): Promise<string | null> {
        const row = await this.prisma.config.findUnique({
            where: { key: KEY_TECH_SUPPORT_PHONE },
        });
        return row?.value ?? null;
    }

    async setTechSupportPhone(phone: string): Promise<void> {
        await this.prisma.config.upsert({
            where: { key: KEY_TECH_SUPPORT_PHONE },
            create: { key: KEY_TECH_SUPPORT_PHONE, value: phone },
            update: { value: phone },
        });
    }

    async getPublicConfig(): Promise<{ techSupportPhone: string | null }> {
        const techSupportPhone = await this.getTechSupportPhone();
        return { techSupportPhone };
    }
}
