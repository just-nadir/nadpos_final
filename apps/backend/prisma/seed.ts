import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Check if any restaurant exists
    const count = await prisma.restaurant.count();
    if (count > 0) {
        console.log('Database already has data. Skipping seed.');
        return;
    }

    // Create Dummy Restaurant
    const restaurant = await prisma.restaurant.create({
        data: {
            name: 'Test Restoran (Chilonzor)',
            phone: '998901234567',
            password: 'hashed_password_here', // Real app needs hashing
            address: 'Chilonzor, Tashkent',
            machineId: 'TEST-MACHINE-ID-001',
            licenses: {
                create: {
                    startDate: new Date(),
                    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // +1 year
                    status: 'ACTIVE',
                    price: 300000
                }
            }
        },
    });

    console.log(`Created restaurant with id: ${restaurant.id}`);
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
