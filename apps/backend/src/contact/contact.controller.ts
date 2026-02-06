import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';

@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) {}

    @Post()
    @HttpCode(HttpStatus.OK)
    async submit(@Body() dto: ContactDto) {
        const sent = await this.contactService.sendToTelegram(dto.name, dto.phone);
        return { ok: sent, message: sent ? 'Qabul qilindi' : 'Xabar yuborilmadi' };
    }
}
