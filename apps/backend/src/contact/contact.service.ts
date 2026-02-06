import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContactService {
    private readonly botToken: string | undefined;
    private readonly chatId: string | undefined;

    constructor(private config: ConfigService) {
        this.botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
        this.chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    }

    async sendToTelegram(name: string, phone: string): Promise<boolean> {
        if (!this.botToken || !this.chatId) {
            console.warn('ContactService: TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID .env da yo\'q. Xabar yuborilmadi.');
            return false;
        }
        const text = [
            '🆕 Landing so\'rovi',
            '',
            `👤 Ism: ${name}`,
            `📞 Telefon: ${phone}`,
        ].join('\n');
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const data = (await res.json()) as { ok?: boolean; description?: string };
            if (!data.ok) {
                console.warn('ContactService: Telegram API javobi xato:', data.description ?? data);
                return false;
            }
            return true;
        } catch (e) {
            clearTimeout(timeout);
            const err = e as Error & { cause?: { code?: string } };
            console.warn('ContactService: Telegram ga ulanish muvaffaqiyatsiz (tarmoq/firewall). Xabar saqlanmadi.', err.cause?.code ?? err.message);
            return false;
        }
    }
}
