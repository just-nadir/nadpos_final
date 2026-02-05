import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Super Admin (User) — admin / admin123
    const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin' } });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await prisma.user.create({
            data: {
                email: 'admin',
                password: hashedPassword,
                name: 'Super Admin',
                role: 'SUPER_ADMIN',
            },
        });
        console.log('Super Admin yaratildi: login=admin, parol=admin123');
    } else {
        console.log('Super Admin allaqachon mavjud.');
    }

    // Create Dummy Restaurant only if none exist
    const restaurantCount = await prisma.restaurant.count();
    if (restaurantCount > 0) {
        console.log('Restoranlar mavjud. Restaurant seed o\'tkazilmadi.');
        return;
    }

    const hashedRestaurantPassword = await bcrypt.hash('test123', 10);
    const restaurant = await prisma.restaurant.create({
        data: {
            name: 'Test Restoran (Chilonzor)',
            phone: '998901234567',
            password: hashedRestaurantPassword,
            address: 'Chilonzor, Tashkent',
            machineId: 'TEST-MACHINE-ID-001',
            licenses: {
                create: {
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
                    status: 'ACTIVE',
                    price: 300000
                }
            }
        },
    });

    console.log(`Restoran yaratildi, id: ${restaurant.id}`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
