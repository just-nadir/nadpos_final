
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PushSyncDto } from './dto/push-sync.dto';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(private prisma: PrismaService) { }

    async pushData(restaurantId: string, dto: PushSyncDto) {
        this.logger.log(`Received ${dto.items.length} sync items from restaurant ${restaurantId}`);

        // Process in transaction to ensure integrity
        return await this.prisma.$transaction(async (tx: any) => {
            const processedItems: string[] = [];

            for (const item of dto.items) {
                // Save to SyncLog for backup/history
                await tx.syncLog.create({
                    data: {
                        restaurantId: restaurantId,
                        dataType: item.dataType,
                        dataId: item.id,
                        action: item.action,
                        payload: JSON.stringify(item.payload),
                    }
                });

                // TODO: Here we can also update "Real" tables if we mirror them in Postgres
                // For now, we just log them as requested ("Source of Truth" is SyncLog for now until we define mirror tables)

                processedItems.push(item.id);
            }

            return { success: true, processedCount: processedItems.length };
        });
    }
}
