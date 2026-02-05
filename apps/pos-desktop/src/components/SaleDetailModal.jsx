import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Printer } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';
import { useGlobal } from '../context/GlobalContext';

const SaleDetailModal = ({ isOpen, onClose, sale, checkNumber }) => {
    const { showToast } = useGlobal();

    if (!sale) return null;

    let items = [];
    let paymentDetails = [];
    try {
        if (Array.isArray(sale.items)) {
            items = sale.items;
        } else if (typeof sale.items === 'string') {
            items = JSON.parse(sale.items);
            if (!Array.isArray(items)) {
                if (items && Array.isArray(items.items)) {
                    if (Array.isArray(items.paymentDetails)) {
                        paymentDetails = items.paymentDetails;
                    }
                    items = items.items;
                } else {
                    items = [];
                }
            }
        } else if (typeof sale.items === 'object' && sale.items !== null) {
            if (Array.isArray(sale.items.items)) {
                items = sale.items.items;
                if (Array.isArray(sale.items.paymentDetails)) {
                    paymentDetails = sale.items.paymentDetails;
                }
            } else {
                items = [];
            }
        }
    } catch (e) {
        console.error("Error parsing sale items:", e);
        items = [];
    }
    const total = sale.amount || sale.total_amount || 0;

    const handleReprint = async () => {
        if (!window.electron) return;
        try {
            showToast('success', "Chek chop etilmoqda...");
            await window.electron.ipcRenderer.invoke('reprint-receipt', sale);
        } catch (error) {
            console.error("Reprint error:", error);
            showToast('error', "Chop etishda xatolik");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>Xarid Tafsilotlari #{checkNumber || '---'}</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        {sale.date && formatDateTime(sale.date)}
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50 border-border">
                                <TableHead className="text-muted-foreground w-[50%]">Mahsulot</TableHead>
                                <TableHead className="text-right text-muted-foreground">Narx</TableHead>
                                <TableHead className="text-center text-muted-foreground">Soni</TableHead>
                                <TableHead className="text-right text-muted-foreground">Jami</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 border-border">
                                    <TableCell className="font-medium">{item.product_name || item.name}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-center">{item.quantity} {item.unit || ''}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(item.price * item.quantity)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        Ma'lumot topilmadi
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-between items-end mt-6 pt-4 border-t border-border">
                    <Button variant="outline" onClick={handleReprint} className="gap-2">
                        <Printer size={16} /> Chop etish
                    </Button>

                    <div className="flex flex-col items-end gap-1">
                        <span className="text-muted-foreground text-sm">Umumiy summa</span>
                        <span className="text-2xl font-bold text-primary">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>

                {paymentDetails.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="font-bold text-sm text-muted-foreground mb-2">To'lovlar Tarixi</h4>
                        <div className="space-y-1">
                            {paymentDetails.map((pd, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="capitalize text-muted-foreground">
                                        {pd.method === 'cash' ? 'Naqd' :
                                            pd.method === 'card' ? 'Karta' :
                                                pd.method === 'click' ? 'Click' :
                                                    pd.method === 'transfer' ? 'P/P' :
                                                        pd.method === 'debt' ? 'Nasiya' : pd.method}
                                    </span>
                                    <span className="font-medium text-foreground">{formatCurrency(pd.amount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default SaleDetailModal;
