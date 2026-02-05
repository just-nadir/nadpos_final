import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

/** Auth bilan mos: 9 xonali 9 bilan boshlansa 998 qo‘shiladi */
function normalizePhone(phone: string): string {
    const digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 9 && digits.startsWith('9')) {
        return '998' + digits;
    }
    return digits || String(phone).trim();
}

@Injectable()
export class RestaurantService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        const restaurants = await this.prisma.restaurant.findMany({
            include: {
                licenses: {
                    orderBy: { endDate: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return restaurants.map(res => {
            const currentLicense = res.licenses[0];
            let status = 'No License';
            let expiry: Date | null = null;

            if (currentLicense) {
                expiry = currentLicense.endDate;
                const endDateOnly = new Date(expiry);
                endDateOnly.setHours(0, 0, 0, 0);
                status = endDateOnly < now ? 'EXPIRED' : (currentLicense.status || 'ACTIVE');
            }

            return {
                id: res.id,
                name: res.name,
                address: res.address || 'Noma\'lum',
                phone: res.phone,
                status,
                expiry
            };
        });
    }

    async create(data: any) {
        const phone = normalizePhone(data.phone);
        const existing = await this.prisma.restaurant.findUnique({
            where: { phone },
        });

        if (existing) {
            throw new ConflictException('Bu telefon raqam allaqachon mavjud');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const endDate = data.expiryDate ? new Date(data.expiryDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

        return this.prisma.restaurant.create({
            data: {
                name: data.name,
                phone,
                password: hashedPassword,
                address: data.address,
                licenses: {
                    create: {
                        startDate: new Date(),
                        endDate: endDate,
                        status: 'ACTIVE', // You might want to dynamically set this based on date, but ACTIVE is fine for now
                        price: 300000
                    }
                }
            }
        });
    }

    async update(id: string, data: any) {
        const current = await this.prisma.restaurant.findUnique({ where: { id }, select: { phone: true } });
        if (data.phone != null) {
            const phone = normalizePhone(data.phone);
            if (current && phone !== current.phone) {
                const existing = await this.prisma.restaurant.findFirst({
                    where: { phone, NOT: { id } },
                });
                if (existing) {
                    throw new ConflictException('Bu telefon raqam boshqa restoranda mavjud');
                }
            }
        }

        let updateData: any = { ...data };
        if (data.password && String(data.password).trim()) {
            updateData.password = await bcrypt.hash(data.password, 10);
        } else {
            delete updateData.password;
        }
        if (updateData.phone != null) {
            updateData.phone = normalizePhone(updateData.phone);
        }

        // Extract expiryDate to handle separately
        const { expiryDate, ...restaurantData } = updateData;

        // Update Restaurant Fields
        await this.prisma.restaurant.update({
            where: { id: id },
            data: restaurantData
        });

        // Update License if expiryDate is provided
        if (expiryDate) {
            // Find the latest license
            const latestLicense = await this.prisma.license.findFirst({
                where: { restaurantId: id },
                orderBy: { endDate: 'desc' }
            });

            if (latestLicense) {
                await this.prisma.license.update({
                    where: { id: latestLicense.id },
                    data: {
                        endDate: new Date(expiryDate),
                        status: 'ACTIVE', // Muddat uzaytirilganda litsenziyani qayta aktiv qilish
                    }
                });
            } else {
                // If no license exists, create one
                await this.prisma.license.create({
                    data: {
                        restaurantId: id,
                        startDate: new Date(),
                        endDate: new Date(expiryDate),
                        status: 'ACTIVE',
                        price: 0
                    }
                });
            }
        }

        return this.prisma.restaurant.findUnique({ where: { id } });
    }

    async remove(id: string) {
        // Delete related data first if not cascading
        await this.prisma.license.deleteMany({
            where: { restaurantId: id }
        });

        // Also delete SyncLogs, Stats if any...
        // For now, just License and Restaurant
        return this.prisma.restaurant.delete({
            where: { id: id }
        });
    }
}
