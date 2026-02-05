const { BrowserWindow } = require('electron');
const { db } = require('../database.cjs');
const log = require('electron-log');
const QRCode = require('qrcode');

// Date Formatter (Uzbekistan Format: DD.MM.YYYY HH:mm)
function formatDateTime(date = new Date()) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function formatTime(date = new Date()) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Sozlamalarni olish
function getSettings() {
    try {
        const rows = db.prepare('SELECT * FROM settings').all();
        return rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
    } catch (e) {
        console.error("Sozlamalarni olishda xato:", e);
        return {};
    }
}

// Yordamchi: HTML shablon yaratish
function createHtmlTemplate(bodyContent) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { margin: 0; size: 80mm auto; }
            body {
                font-family: Arial, Helvetica, sans-serif;
                width: 72mm;
                margin: 0;
                padding: 0;
                font-size: 13px;
                color: #000000;
                line-height: 1.1; /* Reduced from 1.4 */
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            /* Chiziqlar */
            .line { border-bottom: 1.5px solid #000000; margin: 2px 0; } /* Reduced from 8px */
            .double-line { border-bottom: 2px solid #000000; margin: 2px 0; } /* Changed to single thick line */
            
            .flex { display: flex; justify-content: space-between; }
            .mb-1 { margin-bottom: 2px; } /* Reduced from 5px */
            
            /* Sarlavha */
            .header-title { font-size: 18px; margin-bottom: 2px; font-weight: bold; } /* Reduced from 5px */
            .header-info { font-size: 12px; margin-bottom: 0px; } /* Reduced from 2px */
            
            /* Jadval */
            table { width: 100%; border-collapse: collapse; margin: 2px 0; border: 1px solid #000; } /* Reduced margin from 5px */
            td { vertical-align: middle; padding: 2px; border: 1px solid #000; word-wrap: break-word; } /* Reduced padding from 4px */
            .col-name { text-align: left; width: 46%; } /* Increased from 35% */
            .col-qty { text-align: center; width: 10%; } /* Reduced from 12% */
            .col-unit-price { text-align: right; width: 22%; font-size: 12px; } /* Reduced from 25% */
            .col-total { text-align: right; width: 22%; font-size: 12px; } /* Reduced from 28% */
            
            /* Jami hisob */
            .total-row { font-size: 16px; font-weight: bold; margin-top: 2px; } /* Reduced from 5px */
            .footer-msg { font-size: 12px; margin-top: 5px; font-weight: bold; } /* Reduced from 10px */
        </style>
    </head>
    <body>
        ${bodyContent}
    </body>
    </html>
    `;
}

// Asosiy chop etish funksiyasi (Yashirin oyna orqali)
async function printHtml(htmlContent, printerName) {
    const workerWindow = new BrowserWindow({
        show: false,
        width: 400,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    try {
        const htmlBase64 = Buffer.from(htmlContent).toString('base64');
        await workerWindow.loadURL(`data:text/html;base64,${htmlBase64}`);
        await new Promise(resolve => setTimeout(resolve, 500));

        const options = {
            silent: true,
            printBackground: true,
            deviceName: printerName
        };

        if (!printerName || printerName.trim() === '') {
            console.warn("⚠️ Printer nomi ko'rsatilmagan yoki bo'sh, default printer ishlatiladi.");
            delete options.deviceName;
        } else {
            console.log(`🖨 Chop etilmoqda (HTML): ${printerName}`);
        }

        await new Promise((resolve, reject) => {
            workerWindow.webContents.print(options, (success, errorType) => {
                if (!success) {
                    reject(new Error(errorType));
                } else {
                    resolve();
                }
            });
        });
        console.log("✅ Muvaffaqiyatli chop etildi!");

    } catch (error) {
        console.error("❌ Chop etishda xatolik:", error);
        throw error;
    } finally {
        workerWindow.close();
    }
}

module.exports = {
    // 1. Kassa Cheki (To'lov amalga oshirilgandan keyin)
    printOrderReceipt: async (orderData) => {
        const settings = getSettings();
        const printerName = settings.printerReceiptIP;

        const restaurantName = settings.restaurantName || "RESTORAN";
        const address = settings.address || "";
        const phone = settings.phone || "";
        const footerText = settings.receiptFooter || "Xaridingiz uchun rahmat!";
        const adText = settings.ad_text || "";
        const checkNum = orderData.checkNumber || 0;
        const waiterName = orderData.waiterName || "Kassir";

        const itemsHtml = orderData.items.map(item => `
            <tr>
                <td class="col-name">${item.product_name}</td>
                <td class="col-qty">${item.quantity}</td>
                <td class="col-unit-price">${(item.price).toLocaleString()}</td>
                <td class="col-total">${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join('');

        const paymentMap = { 'cash': 'Naqd', 'card': 'Karta', 'click': 'Click/Payme', 'debt': 'Nasiya', 'split': 'Bo\'lingan To\'lov' };
        let paymentMethodText = paymentMap[orderData.paymentMethod] || orderData.paymentMethod || 'Naqd';

        if (orderData.paymentMethod === 'split' && orderData.paymentDetails) {
            paymentMethodText = orderData.paymentDetails.map(p => paymentMap[p.method] || p.method).join(', ');
        }

        // QR Code generation
        let qrCodeHtml = '';
        if (settings.qr_link) {
            try {
                let qrUrl = settings.qr_link.trim();
                if (!qrUrl.startsWith('http://') && !qrUrl.startsWith('https://')) {
                    qrUrl = `https://${qrUrl}`;
                }
                const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                    margin: 1,
                    width: 120,
                    color: { dark: '#000000', light: '#ffffff' }
                });
                qrCodeHtml = `<img src="${qrDataUrl}" style="width: 100%; max-width: 80px; height: auto; border: 1px solid #eee;" />`;
            } catch (qrErr) {
                log.error("QR kod yaratishda xato:", qrErr);
            }
        }

        const content = `
            <div class="text-center">
                <div class="header-title uppercase">${restaurantName}</div>
                ${address ? `<div class="header-info">${address}</div>` : ''}
                ${phone ? `<div class="header-info">Tel: ${phone}</div>` : ''}
                ${orderData.isReprint ? '<div class="header-title" style="margin-top: 5px; font-size: 16px;">*** NUSXA ***</div>' : ''}
            </div>
            
            <div class="double-line"></div>
            
            <div class="flex">
                <div class="text-left">Chek: <span class="bold"># ${checkNum}</span></div>
                <div class="text-right">${formatDateTime()}</div>
            </div>
            <div class="flex" style="margin-top: 2px;">
                <div class="text-left">Stol: <span class="bold uppercase">${orderData.tableName || '-'}</span></div>
                <div class="text-right">Ofitsiant: <span class="bold uppercase">${waiterName}</span></div>
            </div>

            <table>
                <tr>
                    <td class="col-name bold">Nomi</td>
                    <td class="col-qty bold">Soni</td>
                    <td class="col-unit-price bold">Narxi</td>
                    <td class="col-total bold">Summa</td>
                </tr>
                ${itemsHtml}
            </table>

            <div class="flex">
                <span>Jami:</span>
                <span>${(orderData.subtotal || 0).toLocaleString()}</span>
            </div>
            
            <div class="flex">
                <span>Xizmat haqi ${settings.serviceChargeValue || 0}%:</span>
                <span>${(orderData.service || 0).toLocaleString()}</span>
            </div>

            ${orderData.discount > 0 ? `
            <div class="flex">
                <span>Chegirma:</span>
                <span>-${orderData.discount.toLocaleString()}</span>
            </div>` : ''}

            <div class="double-line"></div>

            <div class="text-right" style="margin-top: 5px; margin-bottom: 10px;">
                 <span class="total-row" style="font-size: 18px;">JAMI: ${orderData.total.toLocaleString()}</span>
            </div>

            ${adText ? `<div class="text-center bold" style="margin-bottom: 5px; font-size: 14px;">${adText}</div>` : ''}

            <div class="text-center footer-msg" style="margin-bottom: 10px;">
                ${footerText}
            </div>

            <div class="text-center">
                ${qrCodeHtml}
            </div>
        `;

        const fullHtml = createHtmlTemplate(content);
        await printHtml(fullHtml, printerName);
    },

    // 2. YANGI: HISOB (Pre-check) - Mijozga ko'rsatiladigan chek
    printBill: async (billData) => {
        const settings = getSettings();
        const printerName = settings.printerReceiptIP;

        const restaurantName = settings.restaurantName || "RESTORAN";
        const address = settings.address || "";
        const phone = settings.phone || "";
        const adText = settings.ad_text || "";
        const checkNum = billData.checkNumber || 0;
        const waiterName = billData.waiterName || "Ofitsiant";

        const itemsHtml = billData.items.map(item => `
            <tr>
                <td class="col-name">${item.product_name}</td>
                <td class="col-qty">${item.quantity}</td>
                <td class="col-unit-price">${(item.price).toLocaleString()}</td>
                <td class="col-total">${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
        `).join('');

        // QR Code generation for Bill
        let qrCodeHtml = '';
        if (settings.qr_link) {
            try {
                let qrUrl = settings.qr_link.trim();
                if (!qrUrl.startsWith('http://') && !qrUrl.startsWith('https://')) {
                    qrUrl = `https://${qrUrl}`;
                }
                const qrDataUrl = await QRCode.toDataURL(qrUrl, {
                    margin: 1,
                    width: 120,
                    color: { dark: '#000000', light: '#ffffff' }
                });
                qrCodeHtml = `<img src="${qrDataUrl}" style="width: 100%; max-width: 80px; height: auto; border: 1px solid #eee;" />`;
            } catch (qrErr) {
                log.error("QR kod yaratishda xato:", qrErr);
            }
        }

        const content = `
            <div class="text-center">
                <div class="header-title uppercase">${restaurantName}</div>
                ${address ? `<div class="header-info">${address}</div>` : ''}
                ${phone ? `<div class="header-info">Tel: ${phone}</div>` : ''}
            </div>
            
            <div class="double-line"></div>
            
            <div class="text-center" style="margin: 10px 0;">
                <div class="bold uppercase" style="font-size: 20px; letter-spacing: 2px;">HISOB</div>
                <div style="font-size: 13px; font-weight: bold;">(Pre-check)</div>
            </div>
            
            <div class="line"></div>
            
            <div class="flex">
                <div class="text-left">Chek: <span class="bold"># ${checkNum}</span></div>
                <div class="text-right">${formatDateTime()}</div>
            </div>
            <div class="flex" style="margin-top: 2px;">
                <div class="text-left">Stol: <span class="bold">${billData.tableName}</span></div>
                <div class="text-right">Ofitsiant: <span class="bold uppercase">${waiterName}</span></div>
            </div>

            <table>
                <tr>
                    <td class="col-name bold">Nomi</td>
                    <td class="col-qty bold">Soni</td>
                    <td class="col-unit-price bold">Narxi</td>
                    <td class="col-total bold">Summa</td>
                </tr>
                ${itemsHtml}
            </table>

            <div class="flex">
                <span>Jami:</span>
                <span>${(billData.subtotal || 0).toLocaleString()}</span>
            </div>
            
            <div class="flex">
                <span>Xizmat haqi ${settings.serviceChargeValue || 0}%:</span>
                <span>${(billData.service || 0).toLocaleString()}</span>
            </div>

            <div class="double-line"></div>

            <div class="text-right" style="margin-top: 5px; margin-bottom: 10px;">
                <span class="total-row" style="font-size: 18px;">JAMI: ${billData.total.toLocaleString()}</span>
            </div>

            ${adText ? `<div class="text-center bold" style="margin-bottom: 5px; font-size: 14px;">${adText}</div>` : ''}

            <div class="text-center footer-msg" style="margin-bottom: 10px;">
                <div>Yoqimli ishtaxa!</div>
                <div style="font-size: 11px; margin-top: 2px;">(To'lov qilinmadi)</div>
            </div>

            <div class="text-center">
                ${qrCodeHtml}
            </div>
        `;

        const fullHtml = createHtmlTemplate(content);
        await printHtml(fullHtml, printerName);
    },

    // 3. MUSTAHKAMLANGAN: Oshxona Cheki (Runner) - Fallback mexanizmi bilan
    printKitchenTicket: async (items, tableName, checkNumber, waiterName) => {
        try {
            const kitchens = db.prepare('SELECT * FROM kitchens').all();

            if (!kitchens || kitchens.length === 0) {
                log.error("❌ Oshxonalar bazada topilmadi! Printer ishlamaydi.");
                return;
            }

            // Default fallback oshxonani aniqlash (birinchi printer_ip bo'lgan oshxona)
            const defaultKitchen = kitchens.find(k => k.printer_ip) || kitchens[0];

            const groupedItems = {};
            items.forEach(item => {
                const dest = item.destination || 'default';
                if (!groupedItems[dest]) groupedItems[dest] = [];
                groupedItems[dest].push(item);
            });

            // Har bir oshxona uchun chop etish
            for (const [kitchenId, kitchenItems] of Object.entries(groupedItems)) {
                const kitchen = kitchens.find(k => String(k.id) === String(kitchenId));

                // FALLBACK LOGIKA: Agar oshxona topilmasa yoki printer yo'q bo'lsa
                let targetKitchen = kitchen;
                let fallbackUsed = false;

                if (!kitchen) {
                    log.warn(`⚠️ Oshxona topilmadi (ID: ${kitchenId}), default oshxonaga yuborilmoqda`);
                    targetKitchen = defaultKitchen;
                    fallbackUsed = true;
                } else if (!kitchen.printer_ip) {
                    log.warn(`⚠️ Printer IP mavjud emas (${kitchen.name}), default printerga yuborilmoqda`);
                    targetKitchen = defaultKitchen;
                    fallbackUsed = true;
                }

                // Agar hali ham printer topilmasa, skip qilamiz
                if (!targetKitchen || !targetKitchen.printer_ip) {
                    log.error(`❌ JIDDIY: Hech qanday ishlaydigan printer topilmadi! Taomlar: ${kitchenItems.map(i => i.name).join(', ')}`);
                    continue;
                }

                const kitchenName = fallbackUsed
                    ? `${targetKitchen.name} (FALLBACK)`
                    : targetKitchen.name;

                log.info(`👨‍🍳 Oshxonaga yuborilmoqda: ${kitchenName} - ${kitchenItems.length} ta taom`);

                const itemsHtml = kitchenItems.map(item => `
                    <tr>
                        <td class="text-left bold" style="font-size: 16px; padding: 5px 0;">${item.name || item.product_name}</td>
                        <td class="text-right bold" style="font-size: 18px;">x${item.qty || item.quantity}</td>
                    </tr>
                `).join('');

                const warningBanner = fallbackUsed ? `
                    <div style="background: #ffcc00; color: #000; text-align: center; padding: 5px; margin-bottom: 5px; font-weight: bold;">
                        ⚠️ DEFAULT PRINTER
                    </div>
                ` : '';

                const content = `
                    ${warningBanner}
                    <div class="text-center">
                        <div class="header-title" style="background: #000; color: #fff; padding: 5px; display: block;">${kitchenName.toUpperCase()}</div>
                    </div>
                    
                    <div class="mb-1"></div>

                    <div class="flex bold" style="font-size: 14px;">
                        <span>Chek:</span>
                        <span style="font-size: 18px;"># ${checkNumber || '?'}</span>
                    </div>
                    <div class="flex bold" style="font-size: 14px;">
                        <span>Stol:</span>
                        <span style="font-size: 18px;">${tableName}</span>
                    </div>
                    <div class="flex" style="border-bottom: 1.5px solid #000; padding-bottom: 5px; margin-bottom: 5px;">
                        <span style="font-weight: bold;">Ofitsiant:</span>
                        <span class="uppercase bold" style="font-size: 16px;">${waiterName || "-"}</span>
                    </div>
                    <div class="flex">
                        <span>Vaqt:</span>
                        <span>${formatTime()}</span>
                    </div>

                    <div class="line"></div>

                    <table>
                        ${itemsHtml}
                    </table>

                    <div class="line"></div>
                `;

                const fullHtml = createHtmlTemplate(content);

                try {
                    await printHtml(fullHtml, targetKitchen.printer_ip);
                    log.info(`✅ ${kitchenName}ga muvaffaqiyatli yuborildi`);
                } catch (printErr) {
                    log.error(`❌ ${kitchenName} printerida xato:`, printErr);

                    // Agar fallback ham ishlamasa, oxirgi urinish - default printerga
                    if (!fallbackUsed && defaultKitchen && defaultKitchen.printer_ip !== targetKitchen.printer_ip) {
                        log.warn(`🔄 Oxirgi urinish: Default printerga (${defaultKitchen.name})`);
                        try {
                            await printHtml(fullHtml, defaultKitchen.printer_ip);
                            log.info(`✅ Default printerda muvaffaqiyatli!`);
                        } catch (lastErr) {
                            log.error(`❌ Default printer ham ishlamadi:`, lastErr);
                        }
                    }
                }
            }
        } catch (err) {
            log.error("❌ printKitchenTicket umumiy xatosi:", err);
            throw err;
        }
    },

    // 4. Z-Report (Smena yopilganda) - YANGI
    printZReport: async (shiftReport) => {
        const settings = getSettings();
        const printerName = settings.printerReceiptIP;
        const restaurantName = settings.restaurantName || "RESTORAN";

        const content = `
            <div class="text-center">
                <div class="header-title uppercase">${restaurantName}</div>
                <div class="header-info">Z-REPORT (SMENA YOPISH)</div>
            </div>
            
            <div class="double-line"></div>
            
            <div class="flex">
                <span>Smena:</span>
                <span class="bold"># ${shiftReport.shiftNumber || shiftReport.shiftId}</span>
            </div>
             <div class="flex">
                <span>Kassir:</span>
                <span class="bold">${shiftReport.cashierName}</span>
            </div>
            <div class="flex">
                <span>Boshlandi:</span>
                <span>${formatDateTime(shiftReport.startTime)}</span>
            </div>
            <div class="flex">
                <span>Tugadi:</span>
                <span>${formatDateTime(shiftReport.endTime)}</span>
            </div>

            <div class="line"></div>
            <div class="text-center bold uppercase">MOLIYAVIY HISOBOT</div>
            <div class="line"></div>

            <div class="bold mb-1">NAQD PUL (CASH):</div>
            <div class="flex">
                <span>Tizim bo'yicha:</span>
                <span>${shiftReport.systemCash?.toLocaleString()}</span>
            </div>
             <div class="flex">
                <span>Kassa Boshida:</span>
                <span>${shiftReport.startCash?.toLocaleString()}</span>
            </div>
            <div class="flex" style="border-top: 1.5px solid #000;">
                <span>Kutilayotgan:</span>
                <span>${shiftReport.expectedCash?.toLocaleString()}</span>
            </div>
             <div class="flex bold" style="margin-top: 2px;">
                <span>HAQIQIY:</span>
                <span>${shiftReport.actualCash?.toLocaleString()}</span>
            </div>
            <div class="flex bold">
                <span>FARQ:</span>
                <span style="color: ${shiftReport.diffCash < 0 ? 'red' : 'black'}">
                    ${shiftReport.diffCash > 0 ? '+' : ''}${shiftReport.diffCash?.toLocaleString()}
                </span>
            </div>

            <div class="line"></div>

            <div class="bold mb-1">TERMINAL (CARD):</div>
            <div class="flex">
                <span>Tizim bo'yicha:</span>
                <span>${shiftReport.systemCard?.toLocaleString()}</span>
            </div>
             <div class="flex bold">
                <span>HAQIQIY:</span>
                <span>${shiftReport.actualCard?.toLocaleString()}</span>
            </div>
            <div class="flex bold">
                <span>FARQ:</span>
                 <span style="color: ${shiftReport.diffCard < 0 ? 'red' : 'black'}">
                    ${shiftReport.diffCard > 0 ? '+' : ''}${shiftReport.diffCard?.toLocaleString()}
                </span>
            </div>

            <div class="line"></div>

             <div class="flex">
                <span>O'tkazma:</span>
                <span>${shiftReport.systemTransfer?.toLocaleString()}</span>
            </div>

            <div class="double-line"></div>

            <div class="flex total-row">
                <span>JAMI SAVDO:</span>
                <span>${shiftReport.totalSales?.toLocaleString()} so'm</span>
            </div>

            <div class="text-center footer-msg">
                ${formatDateTime()}
            </div>
        `;

        const fullHtml = createHtmlTemplate(content);
        await printHtml(fullHtml, printerName);
    },

    // 6. Smena Mahsulotlari (YANGI)
    printShiftProducts: async (shift, products) => {
        const settings = getSettings();
        const printerName = settings.printerReceiptIP;
        const restaurantName = settings.restaurantName || "RESTORAN";

        // Filter products with 0 quantity if any (optional but good practice)
        const validProducts = products.filter(p => p.qty > 0);

        const itemsHtml = validProducts.map((item) => `
            <tr>
                <td class="col-name">${item.name}</td>
                <td class="col-qty">${item.qty}</td>
                <td class="col-total">${item.revenue.toLocaleString()}</td>
            </tr>
        `).join('');

        const totalQty = validProducts.reduce((sum, p) => sum + p.qty, 0);
        const totalRevenue = validProducts.reduce((sum, p) => sum + p.revenue, 0);

        const content = `
            <div class="text-center">
                <div class="header-title uppercase">${restaurantName}</div>
                <div class="header-info">SMENA MAHSULOTLARI</div>
            </div>
            
            <div class="double-line"></div>
            
             <div class="flex">
                <span>Kassir:</span>
                <span class="bold">${shift.cashier_name}</span>
            </div>
            <div class="flex">
                <span>Boshlandi:</span>
                <span>${formatDateTime(shift.start_time)}</span>
            </div>
            <div class="flex">
                <span>Tugadi:</span>
                <span>${shift.end_time ? formatDateTime(shift.end_time) : 'Ochiq'}</span>
            </div>

            <div class="line"></div>

            <table>
                <tr>
                    <td class="col-name bold">Nomi</td>
                    <td class="col-qty bold">Soni</td>
                    <td class="col-total bold">Summa</td>
                </tr>
                ${itemsHtml}
            </table>

            <div class="line"></div>

            <div class="flex bold">
                <span>JAMI SONI:</span>
                <span>${totalQty}</span>
            </div>
            <div class="flex total-row">
                <span>JAMI SUMMA:</span>
                <span>${totalRevenue.toLocaleString()}</span>
            </div>

            <div class="text-center footer-msg">
                ${formatDateTime()}
            </div>
        `;

        const fullHtml = createHtmlTemplate(content);
        await printHtml(fullHtml, printerName);
    },

    // 5. System Printers (Settings uchun)
    getPrinters: async () => {
        const win = new BrowserWindow({ show: false, width: 100, height: 100 });
        try {
            const printers = await win.webContents.getPrintersAsync();
            return printers;
        } catch (e) {
            console.error("Printerlarni olishda xato:", e);
            return [];
        } finally {
            win.destroy();
        }
    }
};