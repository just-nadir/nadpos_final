import React, { useState, useEffect } from 'react';
import { Search, Plus, Package, ArrowRight, Trash2, CheckCircle, Clock, X, Save, AlertCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import ConfirmModal from './ConfirmModal';
import { useIpcListener } from '../hooks/useIpcListener';

// --- MODAL: Yangi Kirim (Touch Optimized) ---
const CreateSupplyModal = ({ isOpen, onClose, onCreate }) => {
    const [supplier, setSupplier] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [note, setNote] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreate({ supplier, date, note });
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
            <div className="bg-card w-[600px] rounded-3xl shadow-2xl p-8 relative border border-border">
                <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 right-6 h-12 w-12 rounded-full"><X size={24} /></Button>
                <h2 className="text-3xl font-bold text-foreground mb-8">Yangi Kirim Hujjati</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-base font-bold text-muted-foreground mb-2">Yetkazib Beruvchi</label>
                        <Input required className="h-14 text-lg" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Taminotchi nomi" autoFocus />
                    </div>
                    <div>
                        <label className="block text-base font-bold text-muted-foreground mb-2">Sana</label>
                        <Input required type="date" className="h-14 text-lg block w-full" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-base font-bold text-muted-foreground mb-2">Izoh</label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            className="w-full p-4 bg-background rounded-xl border border-input outline-none focus:ring-2 focus:ring-primary text-foreground text-lg resize-none min-h-[120px]"
                            placeholder="Qo'shimcha ma'lumot..."
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 text-xl font-bold rounded-xl mt-4" size="lg">Hujjat Yaratish</Button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENT: Supply Editor (Touch Optimized) ---
const SupplyEditor = ({ supplyId, onClose, refreshHelper }) => {
    const [supply, setSupply] = useState(null);
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedProduct, setSelectedProduct] = useState('');
    const [qty, setQty] = useState('');
    const [price, setPrice] = useState('');
    const [searchProd, setSearchProd] = useState('');
    const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });

    const loadDetails = async () => {
        setLoading(true);
        try {
            const { ipcRenderer } = window.electron;
            const data = await ipcRenderer.invoke('get-supply-details', supplyId);
            const prods = await ipcRenderer.invoke('get-products');
            setSupply(data);
            setItems(data.items || []);
            setProducts(prods || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadDetails(); }, [supplyId]);

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('add-supply-item', {
                supplyId,
                productId: selectedProduct,
                quantity: Number(qty),
                price: Number(price)
            });
            setQty('');
            setPrice('');
            setSelectedProduct('');
            setSearchProd('');
            const searchInput = document.getElementById('product-search-input');
            if (searchInput) searchInput.focus();
            loadDetails();
            refreshHelper();
        } catch (err) { console.error(err); }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('remove-supply-item', itemId);
            loadDetails();
            refreshHelper();
        } catch (err) { console.error(err); }
    };

    const handleCompleteClick = () => {
        setConfirmState({
            isOpen: true,
            message: "Diqqat! Hujjat tasdiqlangandan so'ng mahsulotlar omborga tushadi. Davom etasizmi?",
            onConfirm: performComplete
        });
    };

    const performComplete = async () => {
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('complete-supply', supplyId);
            onClose();
            refreshHelper();
        } catch (err) { console.error(err); }
    };

    if (loading) return <div className="p-20 text-center text-xl text-muted-foreground animate-pulse">Yuklanmoqda...</div>;
    if (!supply) return <div className="p-20 text-center text-xl text-destructive">Hujjat topilmadi</div>;

    const filteredProds = products.filter(p => p.name.toLowerCase().includes(searchProd.toLowerCase()) && p.track_stock !== 0);
    const isDraft = supply.status === 'draft';

    return (
        <div className="absolute inset-0 bg-background z-20 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Editor Header */}
            <div className="bg-card px-8 py-6 border-b border-border flex justify-between items-center shadow-lg z-30">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-14 w-14 rounded-full bg-secondary/50 hover:bg-secondary"><ArrowRight className="rotate-180" size={28} /></Button>
                    <div>
                        <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                            {isDraft ? <Clock className="text-yellow-500" size={28} /> : <CheckCircle className="text-green-500" size={28} />}
                            {supply.supplier_name}
                        </h2>
                        <p className="text-lg text-muted-foreground mt-1 font-medium">{format(new Date(supply.date), 'dd.MM.yyyy')} • {supply.note}</p>
                    </div>
                </div>
                <div className="flex items-center gap-8">
                    <div className="text-right">
                        <p className="text-sm uppercase font-bold text-muted-foreground tracking-wider mb-1">Jami Summa</p>
                        <p className="text-4xl font-black text-primary tabular-nums tracking-tight">{supply.total_amount?.toLocaleString() || 0} so'm</p>
                    </div>
                    {isDraft && (
                        <Button onClick={handleCompleteClick} className="gap-3 h-14 px-8 text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                            <Save size={24} /> Tasdiqlash
                        </Button>
                    )}
                </div>
            </div>

            {/* Editor Content */}
            <div className="flex-1 flex overflow-hidden p-8 gap-8 bg-secondary/10">
                {/* Items List */}
                <div className="flex-1 bg-card rounded-3xl shadow-sm border border-border flex flex-col overflow-hidden">
                    <div className="overflow-y-auto flex-1 p-0">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-secondary/40 sticky top-0 backdrop-blur-md z-10 border-b border-border">
                                <tr>
                                    <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Mahsulot</th>
                                    <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Miqdor</th>
                                    <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Narx</th>
                                    <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Jami</th>
                                    {isDraft && <th className="px-8 py-6 w-20"></th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="px-8 py-6 font-bold text-xl text-foreground">{idx + 1}. {item.product_name}</td>
                                        <td className="px-8 py-6 text-xl text-foreground/80 font-medium">{item.quantity} {item.unit_type}</td>
                                        <td className="px-8 py-6 text-xl text-foreground/80 font-medium tabular-nums">{item.price?.toLocaleString()}</td>
                                        <td className="px-8 py-6 text-xl font-black text-primary tabular-nums">{item.total?.toLocaleString()}</td>
                                        {isDraft && (
                                            <td className="px-8 py-6 text-right">
                                                <Button size="icon" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-12 w-12 rounded-xl border border-transparent hover:border-destructive/20 transition-all"><Trash2 size={24} /></Button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                                {items.length === 0 && (
                                    <tr><td colSpan="5" className="p-24 text-center text-xl text-muted-foreground">Hujjat bo'sh</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Item Form */}
                {isDraft && (
                    <Card className="w-[450px] shadow-sm border-border h-fit rounded-3xl overflow-hidden bg-card">
                        <CardHeader className="pb-4 bg-secondary/30 border-b border-border">
                            <CardTitle className="text-2xl font-bold">Mahsulot Qo'shish</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-6 p-6">
                            <div className="relative z-50">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
                                <Input
                                    id="product-search-input"
                                    placeholder="Nomi bo'yicha qidirish..."
                                    value={searchProd}
                                    onChange={e => { setSearchProd(e.target.value); setSelectedProduct(''); }}
                                    className="pl-12 h-16 text-xl font-medium rounded-xl shadow-sm border-border focus:border-primary bg-background"
                                    autoComplete="off"
                                />
                                {searchProd && !selectedProduct && (
                                    <div className="absolute top-full left-0 right-0 bg-popover shadow-2xl rounded-xl mt-2 border border-border max-h-[400px] overflow-auto z-[60]">
                                        {filteredProds.map(p => (
                                            <div
                                                key={p.id}
                                                onClick={() => { setSelectedProduct(p.id); setSearchProd(p.name); }}
                                                className="p-4 hover:bg-primary/10 cursor-pointer border-b border-border last:border-0 flex justify-between items-center group transition-colors"
                                            >
                                                <div className="font-bold text-foreground text-lg">{p.name}</div>
                                                <div className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{p.price.toLocaleString()} so'm</div>
                                            </div>
                                        ))}
                                        {filteredProds.length === 0 && <div className="p-6 text-center text-muted-foreground">Topilmadi</div>}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleAddItem} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wide">Miqdor</label>
                                    <Input required type="number" step="0.001" value={qty} onChange={e => setQty(e.target.value)} placeholder="0" className="h-16 text-2xl font-bold text-center rounded-xl bg-background" />
                                </div>


                                <Button disabled={!selectedProduct} type="submit" className="w-full h-16 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" size="lg">
                                    Qo'shish
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
                onConfirm={confirmState.onConfirm}
                message={confirmState.message}
                confirmText="Tasdiqlash"
                cancelText="Bekor qilish"
                isDanger={false}
            />
        </div>
    );
};

// --- MAIN PAGE ---
const InventoryManagement = () => {
    const [activeTab, setActiveTab] = useState('supplies'); // supplies | stocks
    const [supplies, setSupplies] = useState([]);
    const [products, setProducts] = useState([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSupplyId, setEditingSupplyId] = useState(null);
    const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', onConfirm: null });

    const loadData = async () => {
        if (!window.electron) return;
        try {
            const { ipcRenderer } = window.electron;
            if (activeTab === 'supplies') {
                const data = await ipcRenderer.invoke('get-supplies', 'all');
                setSupplies(data || []);
            } else {
                const prods = await ipcRenderer.invoke('get-products');
                setProducts(prods || []);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => { loadData(); }, [activeTab]);

    // Realtime: mahsulotlar o'zgarganda (Menyu boshqaruvidan) ro'yxat yangilansin
    useIpcListener('db-change', (event, data) => {
        if (data.type === 'products') loadData();
    });

    const handleCreateSupply = async (data) => {
        try {
            const { ipcRenderer } = window.electron;
            const res = await ipcRenderer.invoke('create-supply', data);
            setIsCreateOpen(false);
            setEditingSupplyId(res.id);
            loadData();
        } catch (err) { console.error(err); }
    };

    const handleDeleteDraftClick = (id, e) => {
        e.stopPropagation();
        setConfirmState({
            isOpen: true,
            message: "Hujjatni o'chirmoqchimisiz?",
            onConfirm: () => performDeleteDraft(id)
        });
    }

    const performDeleteDraft = async (id) => {
        try {
            const { ipcRenderer } = window.electron;
            await ipcRenderer.invoke('delete-supply', id);
            loadData();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="flex flex-col h-full w-full bg-background relative">
            {/* Top Bar */}
            <div className="bg-card px-8 py-6 border-b border-border flex justify-between items-center shadow-md z-10">
                <h1 className="text-4xl font-black text-foreground flex items-center gap-4 tracking-tight">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary"><Package size={32} /></div>
                    Ombor Boshqaruvi
                </h1>
                <div className="flex bg-secondary p-1.5 rounded-2xl border border-border/50">
                    <button onClick={() => setActiveTab('supplies')} className={cn("px-8 py-4 rounded-xl font-bold text-lg transition-all", activeTab === 'supplies' ? 'bg-background text-primary shadow-lg ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50')}>
                        Kirim Hujjatlar
                    </button>
                    <button onClick={() => setActiveTab('stocks')} className={cn("px-8 py-4 rounded-xl font-bold text-lg transition-all", activeTab === 'stocks' ? 'bg-background text-primary shadow-lg ring-1 ring-black/5 dark:ring-white/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50')}>
                        Joriy Qoldiqlar
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col bg-secondary/5">
                {activeTab === 'supplies' && (
                    <>
                        <div className="flex justify-between mb-8 items-center">
                            <div className="relative w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
                                <Input type="text" placeholder="Hujjatlarni qidirish..." className="pl-14 h-14 text-xl rounded-2xl bg-card border-border shadow-sm focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <Button onClick={() => setIsCreateOpen(true)} className="gap-3 h-14 px-8 text-lg font-bold shadow-lg hover:shadow-primary/25 rounded-2xl transition-all hover:scale-105 active:scale-95">
                                <Plus size={24} strokeWidth={3} /> Yangi Hujjat
                            </Button>
                        </div>

                        <div className="bg-card rounded-3xl shadow-sm border border-border flex-1 overflow-hidden flex flex-col">
                            <div className="overflow-y-auto flex-1 p-0">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-secondary/30 sticky top-0 z-10 backdrop-blur-md border-b border-border">
                                        <tr>
                                            <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Sana</th>
                                            <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Yetkazib Beruvchi</th>
                                            <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Status</th>
                                            <th className="px-8 py-6 text-right font-bold text-muted-foreground text-sm uppercase tracking-wider">Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {supplies.map(s => (
                                            <tr key={s.id} onClick={() => setEditingSupplyId(s.id)} className="hover:bg-secondary/40 cursor-pointer transition-colors group">
                                                <td className="px-8 py-6 text-foreground font-bold text-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                            <Calendar size={20} />
                                                        </div>
                                                        {format(new Date(s.date), 'dd.MM.yyyy')}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold text-xl text-foreground">{s.supplier_name}</td>
                                                <td className="px-8 py-6">
                                                    {s.status === 'draft'
                                                        ? <Badge variant="secondary" className="gap-2 px-4 py-1.5 text-sm font-bold bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50"><Clock size={16} /> Qoralama</Badge>
                                                        : <Badge variant="secondary" className="gap-2 px-4 py-1.5 text-sm font-bold bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-900/50"><CheckCircle size={16} /> Tasdiqlangan</Badge>
                                                    }
                                                </td>

                                                <td className="px-8 py-6 text-right">
                                                    {s.status === 'draft' && (
                                                        <Button size="icon" variant="ghost" onClick={(e) => handleDeleteDraftClick(s.id, e)} className="h-12 w-12 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                                                            <Trash2 size={24} />
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {supplies.length === 0 && <tr><td colSpan="5" className="p-32 text-center text-xl text-muted-foreground">Hozircha hech qanday hujjat yo'q</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'stocks' && (
                    <div className="bg-card rounded-3xl shadow-sm border border-border flex-1 overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-orange-200/50 bg-orange-50 dark:bg-orange-900/10 flex items-center justify-center gap-3">
                            <AlertCircle className="text-orange-600 dark:text-orange-400" size={24} />
                            <p className="text-base font-medium text-orange-800 dark:text-orange-300">Bu yerda joriy qoldiqlar ko'rsatiladi. O'zgartirish uchun "Kirim Hujjatlar" orqali yangi kirim qiling.</p>
                        </div>
                        <div className="overflow-y-auto flex-1 p-0">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-secondary/30 sticky top-0 z-10 backdrop-blur-md border-b border-border">
                                    <tr>
                                        <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Mahsulot Nomi</th>
                                        <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Kategoriya</th>
                                        <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Joriy Qoldiq</th>
                                        <th className="px-8 py-6 font-bold text-muted-foreground text-sm uppercase tracking-wider">Sotuv Narxi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {products.filter(p => p.track_stock !== 0).map(p => (
                                        <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                                            <td className="px-8 py-6 font-bold text-xl text-foreground">{p.name}</td>
                                            <td className="px-8 py-6 text-lg text-muted-foreground font-medium">{p.category_name || '-'}</td>
                                            <td className="px-8 py-6">
                                                <Badge variant={p.stock <= 5 ? "destructive" : "outline"} className={cn(
                                                    "font-bold text-lg px-4 py-1.5 rounded-lg",
                                                    p.stock > 5 ? "bg-secondary text-foreground" : "bg-destructive/10 text-destructive border-destructive/20"
                                                )}>
                                                    {p.stock} {p.unit_type === 'item' ? '' : p.unit_type}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 text-xl font-bold text-foreground tabular-nums">{p.price.toLocaleString()} so'm</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <CreateSupplyModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onCreate={handleCreateSupply} />
            {editingSupplyId && <SupplyEditor supplyId={editingSupplyId} onClose={() => { setEditingSupplyId(null); loadData(); }} refreshHelper={loadData} />}

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
                onConfirm={confirmState.onConfirm}
                message={confirmState.message}
            />
        </div>
    );
};

export default InventoryManagement;
