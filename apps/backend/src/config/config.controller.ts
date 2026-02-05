import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
    constructor(private readonly configService: ConfigService) { }

    /** POS va boshqa klientlar uchun ochiq (tech support raqami) */
    @Get()
    async getPublic() {
        return this.configService.getPublicConfig();
    }

    /** Faqat super-admin token bilan yangilash */
    @Patch()
    @UseGuards(AuthGuard('jwt'))
    async update(@Body() body: { techSupportPhone?: string }) {
        if (body.techSupportPhone !== undefined) {
            await this.configService.setTechSupportPhone(String(body.techSupportPhone).trim());
        }
        return this.configService.getPublicConfig();
    }
}
