const { db, notify } = require('../database.cjs');
const log = require('electron-log');
// const telegramController = require('./telegramController.cjs');
const crypto = require('crypto');

module.exports = {
    // Smenani ochish
    openShift: (cashierName, startCash) => {
        try {
            // Avval ochiq smena borligini tekshirish
            const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open'").get();
            if (activeShift) {
                throw new Error("Smena allaqachon ochiq!");
            }

            const startTime = new Date().toISOString();
            const id = crypto.randomUUID();

            // Smena tartib raqamini aniqlash
            const lastShift = db.prepare("SELECT MAX(shift_number) as maxNum FROM shifts").get();
            const nextShiftNum = (lastShift && lastShift.maxNum) ? lastShift.maxNum + 1 : 1;

            const stmt = db.prepare("INSERT INTO shifts (id, start_time, start_cash, status, cashier_name, shift_number) VALUES (?, ?, ?, 'open', ?, ?)");
            const info = stmt.run(id, startTime, startCash || 0, cashierName, nextShiftNum);

            log.info(`Smena ochildi: ID ${id}, №${nextShiftNum}, Kassir: ${cashierName}`);
            notify('shift-status', 'open');
            return { success: true, shiftId: id };
        } catch (err) {
            log.error("openShift xatosi:", err);
            throw err;
        }
    },

    // Smenani yopish (Z-Report)
    closeShift: async ({ endCash, endCard }) => {
        try {
            log.info("Closing shift... Params:", { endCash, endCard });

            const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open'").get();
            if (!activeShift) {
                log.warn("Close Shift: No active shift found");
                throw new Error("Ochiq smena topilmadi!");
            }

            // Faol stollar borligini tekshirish
            const activeTables = db.prepare("SELECT COUNT(*) as count FROM tables WHERE status != 'free'").get();
            if (activeTables.count > 0) {
                log.warn("Close Shift: Active tables exist");
                throw new Error("Diqqat! Barcha stollar yopilmagan. Smenani yopishdan oldin iltimos, faol stollarni hisob-kitob qiling.");
            }

            const endTime = new Date().toISOString();
            const shiftId = activeShift.id;

            // Smena davomidagi barcha savdolarni olish
            const sales = db.prepare("SELECT * FROM sales WHERE shift_id = ?").all(shiftId);

            let totalSales = 0;
            let totalCash = 0;
            let totalCard = 0;
            let totalTransfer = 0;

            sales.forEach(sale => {
                totalSales += sale.total_amount;

                if (sale.payment_method === 'split') {
                    try {
                        const parsed = JSON.parse(sale.items_json || '{}');
                        const details = parsed.paymentDetails || [];
                        details.forEach(d => {
                            const amount = d.amount || 0;
                            if (d.method === 'cash') totalCash += amount;
                            else if (d.method === 'card') totalCard += amount;
                            else if (d.method === 'click' || d.method === 'transfer') totalTransfer += amount;
                        });
                    } catch (e) {
                    }
                } else if (sale.payment_method === 'cash') {
                    totalCash += sale.total_amount;
                } else if (sale.payment_method === 'card') {
                    totalCard += sale.total_amount;
                } else if (sale.payment_method === 'transfer' || sale.payment_method === 'click') {
                    totalTransfer += sale.total_amount;
                }
            });

            // TAFOVUTLARNI HISOBLASH
            const expectedCash = (activeShift.start_cash || 0) + totalCash;
            const diffCash = (endCash || 0) - expectedCash;
            const expectedCard = totalCard;
            const diffCard = (endCard || 0) - expectedCard;

            log.info("Shift Calc:", { totalSales, totalCash, totalCard, expectedCash, diffCash });

            // Smenani yopish - Update DB (Direct execution, no transaction for now to be safe)
            db.prepare(`
                UPDATE shifts 
                SET end_time = ?, 
                    end_cash = ?, 
                    declared_cash = ?, 
                    declared_card = ?, 
                    difference_cash = ?, 
                    difference_card = ?,
                    status = 'closed', 
                    total_sales = ?, total_cash = ?, total_card = ?, total_transfer = ?
                WHERE id = ?
            `).run(
                endTime,
                endCash || 0,
                endCash || 0,
                endCard || 0,
                diffCash,
                diffCard,
                totalSales, totalCash, totalCard, totalTransfer, shiftId
            );

            log.info(`Smena yopildi (DB Updated): ID ${shiftId}`);

            // Notify UI IMMEDIATELY before printer
            notify('shift-status', 'closed');

            // Printerga chiqarish (Z-Report) - Fire and Forget
            // DO NOT AWAIT PRINTER TO AVOID BLOCKING UI RESPONSE
            setTimeout(async () => {
                try {
                    log.info("Printing Z-Report...");
                    const printerService = require('../services/printerService.cjs');

                    // 1. Print Financial Z-Report
                    await printerService.printZReport({
                        shiftId: shiftId,
                        shiftNumber: activeShift.shift_number, // YANGI: Tartib raqami
                        startTime: activeShift.start_time,
                        endTime: endTime,
                        cashierName: activeShift.cashier_name,
                        systemCash: totalCash,
                        startCash: activeShift.start_cash || 0,
                        expectedCash: expectedCash,
                        actualCash: endCash || 0,
                        diffCash: diffCash,
                        systemCard: totalCard,
                        actualCard: endCard || 0,
                        diffCard: diffCard,
                        systemTransfer: totalTransfer,
                        totalSales: totalSales
                    });
                    log.info("Z-Report Printed Successfully");

                    // 2. Print Product Sales Report (YANGI)
                    const shiftProducts = db.prepare(`
                        SELECT 
                            si.product_name as name, 
                            SUM(si.quantity) as qty, 
                            SUM(si.total_price) as revenue
                        FROM sale_items si
                        JOIN sales s ON s.id = si.sale_id
                        WHERE s.shift_id = ?
                        GROUP BY si.product_name
                        HAVING qty > 0
                        ORDER BY revenue DESC
                    `).all(shiftId);

                    if (shiftProducts && shiftProducts.length > 0) {
                        log.info(`Printing Shift Products Report... (${shiftProducts.length} items)`);

                        // Shift object for header info
                        const shiftData = {
                            cashier_name: activeShift.cashier_name,
                            start_time: activeShift.start_time,
                            end_time: endTime
                        };

                        await printerService.printShiftProducts(shiftData, shiftProducts);
                        log.info("Shift Products Report Printed Successfully");
                    } else {
                        log.info("No products sold in this shift, skipping product report.");
                    }

                } catch (printErr) {
                    log.error("Printer Report Error (Ignored):", printErr.message);
                }
            }, 100);

            return { success: true };
        } catch (err) {
            log.error("closeShift xatosi:", err);
            throw err;
        }
    },

    // Smena holatini olish
    getShiftStatus: () => {
        const activeShift = db.prepare("SELECT * FROM shifts WHERE status = 'open'").get();
        return activeShift || null;
    },

    // Smena tarixini olish
    getShifts: (startDate, endDate) => {
        try {
            if (!startDate || !endDate) {
                return db.prepare('SELECT * FROM shifts ORDER BY start_time DESC LIMIT 50').all();
            }

            const query = `
                SELECT * FROM shifts 
                WHERE start_time >= ? AND start_time <= ?
                ORDER BY start_time DESC
            `;
            const shifts = db.prepare(query).all(startDate, endDate);

            // Recalculate totals for each shift to ensure accuracy
            return shifts.map(shift => {
                const sales = db.prepare("SELECT * FROM sales WHERE shift_id = ?").all(shift.id);
                let totalCash = 0;
                let totalCard = 0;
                let totalTransfer = 0;
                let totalDebt = 0;
                let totalSales = 0; // Recalculate total sales too just in case

                sales.forEach(sale => {
                    totalSales += sale.total_amount;

                    if (sale.payment_method === 'split') {
                        try {
                            const parsed = JSON.parse(sale.items_json || '{}');
                            const details = parsed.paymentDetails || [];
                            details.forEach(d => {
                                const amount = d.amount || 0;
                                if (d.method === 'cash') totalCash += amount;
                                else if (d.method === 'card') totalCard += amount;
                                else if (d.method === 'click' || d.method === 'transfer') totalTransfer += amount;
                                else if (d.method === 'debt') totalDebt += amount;
                            });
                        } catch (e) { }
                    } else if (sale.payment_method === 'cash') {
                        totalCash += sale.total_amount;
                    } else if (sale.payment_method === 'card') {
                        totalCard += sale.total_amount;
                    } else if (sale.payment_method === 'debt') {
                        totalDebt += sale.total_amount;
                    } else if (sale.payment_method === 'transfer' || sale.payment_method === 'click') {
                        totalTransfer += sale.total_amount;
                    }
                });

                return {
                    ...shift,
                    total_sales: totalSales,
                    total_cash: totalCash,
                    total_card: totalCard,
                    total_transfer: totalTransfer,
                    total_debt: totalDebt
                };
            });
        } catch (err) {
            log.error("getShifts xatosi:", err);
            throw err;
        }
    }
};
