import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PushSyncDto } from './dto/push-sync.dto';

@Injectable()
export class SyncService {
    private readonly logger = new Logger(SyncService.name);

    constructor(private prisma: PrismaService) { }

    async pushData(restaurantId: string, dto: PushSyncDto) {
        this.logger.log(`Received ${dto.items.length} sync items from restaurant ${restaurantId}`);

        return await this.prisma.$transaction(async (tx: any) => {
            const processedItems: string[] = [];

            for (const item of dto.items) {
                await tx.syncLog.create({
                    data: {
                        restaurantId,
                        dataType: item.dataType,
                        dataId: item.id,
                        action: item.action,
                        payload: JSON.stringify(item.payload),
                    }
                });

                const p = item.payload as Record<string, unknown>;
                const action = String(item.action).toLowerCase();

                if (item.dataType === 'sales' && (action === 'create' || action === 'update')) {
                    const date = p.date ? new Date(p.date as string) : new Date();
                    await tx.sale.upsert({
                        where: { id: item.id },
                        create: {
                            id: item.id,
                            restaurantId,
                            check_number: typeof p.check_number === 'number' ? p.check_number : null,
                            date,
                            total_amount: Number(p.total_amount) ?? 0,
                            subtotal: p.subtotal != null ? Number(p.subtotal) : null,
                            discount: p.discount != null ? Number(p.discount) : null,
                            payment_method: p.payment_method != null ? String(p.payment_method) : null,
                            customer_id: p.customer_id != null ? String(p.customer_id) : null,
                            waiter_name: p.waiter_name != null ? String(p.waiter_name) : null,
                            guest_count: p.guest_count != null ? Number(p.guest_count) : null,
                            items_json: p.items_json != null ? (typeof p.items_json === 'string' ? p.items_json : JSON.stringify(p.items_json)) : null,
                            shift_id: p.shift_id != null ? String(p.shift_id) : null,
                            table_name: p.table_name != null ? String(p.table_name) : null,
                        },
                        update: {
                            check_number: typeof p.check_number === 'number' ? p.check_number : undefined,
                            date,
                            total_amount: Number(p.total_amount) ?? 0,
                            subtotal: p.subtotal != null ? Number(p.subtotal) : undefined,
                            discount: p.discount != null ? Number(p.discount) : undefined,
                            payment_method: p.payment_method != null ? String(p.payment_method) : undefined,
                            customer_id: p.customer_id != null ? String(p.customer_id) : undefined,
                            waiter_name: p.waiter_name != null ? String(p.waiter_name) : undefined,
                            guest_count: p.guest_count != null ? Number(p.guest_count) : undefined,
                            items_json: p.items_json != null ? (typeof p.items_json === 'string' ? p.items_json : JSON.stringify(p.items_json)) : undefined,
                            shift_id: p.shift_id != null ? String(p.shift_id) : undefined,
                            table_name: p.table_name != null ? String(p.table_name) : undefined,
                        },
                    });
                } else if (item.dataType === 'shifts' && (action === 'create' || action === 'update')) {
                    const start_time = p.start_time ? new Date(p.start_time as string) : new Date();
                    const end_time = p.end_time ? new Date(p.end_time as string) : null;
                    await tx.shift.upsert({
                        where: { id: item.id },
                        create: {
                            id: item.id,
                            restaurantId,
                            shift_number: p.shift_number != null ? Number(p.shift_number) : null,
                            cashier_id: p.cashier_id != null ? String(p.cashier_id) : null,
                            cashier_name: p.cashier_name != null ? String(p.cashier_name) : null,
                            start_time,
                            end_time,
                            total_cash: Number(p.total_cash) ?? 0,
                            total_card: Number(p.total_card) ?? 0,
                            total_transfer: Number(p.total_transfer) ?? 0,
                            total_debt: Number(p.total_debt) ?? 0,
                            total_sales: Number(p.total_sales) ?? 0,
                        },
                        update: {
                            shift_number: p.shift_number != null ? Number(p.shift_number) : undefined,
                            cashier_id: p.cashier_id != null ? String(p.cashier_id) : undefined,
                            cashier_name: p.cashier_name != null ? String(p.cashier_name) : undefined,
                            start_time,
                            end_time,
                            total_cash: Number(p.total_cash) ?? 0,
                            total_card: Number(p.total_card) ?? 0,
                            total_transfer: Number(p.total_transfer) ?? 0,
                            total_debt: Number(p.total_debt) ?? 0,
                            total_sales: Number(p.total_sales) ?? 0,
                        },
                    });
                } else if (item.dataType === 'cancelled_orders' && action === 'create') {
                    const date = p.date ? new Date(p.date as string) : new Date();
                    await tx.cancelledOrder.create({
                        data: {
                            id: item.id,
                            restaurantId,
                            table_id: p.table_id != null ? String(p.table_id) : null,
                            date,
                            total_amount: Number(p.total_amount) ?? 0,
                            waiter_name: p.waiter_name != null ? String(p.waiter_name) : null,
                            items_json: p.items_json != null ? (typeof p.items_json === 'string' ? p.items_json : JSON.stringify(p.items_json)) : null,
                            reason: p.reason != null ? String(p.reason) : null,
                        },
                    });
                }

                processedItems.push(item.id);
            }

            return { success: true, processedCount: processedItems.length };
        });
    }
}
