import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, ShoppingBag, Minus, Plus, Trash2, Send, ChefHat } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { cn } from '../utils/cn';
import { useGlobal } from '../context/GlobalContext';
import { useIpcListener } from '../hooks/useIpcListener';

const MenuModal = ({ isOpen, onClose, tableId, tableName }) => {
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { user } = useGlobal();

    // Cart State
    const [cart, setCart] = useState([]);

    // Weight Modal State
    const [weightModal, setWeightModal] = useState({ isOpen: false, product: null });
    const [weightInput, setWeightInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadMenu();
            setCart([]); // Reset cart on open
            setSearchQuery('');
            setActiveCategory('all');
        }
    }, [isOpen]);

    // Realtime: menyu ochiq bo'lganda mahsulot/kategoriya o'zgarsa yangilansin
    useIpcListener('db-change', (event, data) => {
        if (isOpen && (data.type === 'products' || data.type === 'categories')) loadMenu();
    });

    const loadMenu = async () => {
        try {
            setLoading(true);
            if (window.electron) {
                const [cats, prods] = await Promise.all([
                    window.electron.ipcRenderer.invoke('get-categories'),
                    window.electron.ipcRenderer.invoke('get-products')
                ]);
                console.log("Loaded Categories:", cats);
                console.log("Loaded Products:", prods);
                setCategories(cats || []);
                setProducts(prods || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = useMemo(() => {
        // 1. Filter by Name/Code
        let result = products;

        if (searchQuery.trim()) {
            const lower = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(lower) ||
                (p.code && p.code.toLowerCase().includes(lower))
            );
        }

        // 2. Filter by Category
        if (activeCategory !== 'all') {
            // Loose equality to handle potential string/number mismatch
            result = result.filter(p => p.category_id == activeCategory);
        }

        console.log("Filtered Products:", result.length);
        console.log("Active Category:", activeCategory);

        return result.filter(p => p.is_active === 1);
    }, [products, activeCategory, searchQuery]);

    const addToCart = (product, qtyOverride = null) => {
        // Checking for weighted product
        if (!qtyOverride && product.unit_type === 'kg') {
            setWeightModal({ isOpen: true, product });
            setWeightInput('');
            return;
        }

        const quantity = qtyOverride || 1;

        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                // If weight item, typically we just add more weight or update? 
                // Simple logic: just add the quantity.
                return prev.map(item =>
                    item.id === product.id ? { ...item, qty: parseFloat((item.qty + quantity).toFixed(3)) } : item
                );
            } else {
                return [...prev, { ...product, qty: quantity }];
            }
        });
    };

    const handleWeightConfirm = () => {
        const weight = parseFloat(weightInput);
        if (weight > 0 && weightModal.product) {
            addToCart(weightModal.product, weight);
            setWeightModal({ isOpen: false, product: null });
        }
    };

    // Helper for NumPad
    const handleNumPad = (value) => {
        if (value === 'C') {
            setWeightInput('');
        } else if (value === '.') {
            if (!weightInput.includes('.')) setWeightInput(prev => prev + '.');
        } else if (value === 'back') {
            setWeightInput(prev => prev.slice(0, -1));
        } else {
            setWeightInput(prev => prev + value);
        }
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQty = (productId, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.id === productId) {
                    const newQty = item.qty + delta;
                    if (newQty <= 0) return null; // Remove if 0
                    return { ...item, qty: newQty };
                }
                return item;
            }).filter(Boolean);
        });
    };

    const handleSendOrder = async () => {
        if (cart.length === 0 || !window.electron) return;
        try {
            const itemsToSend = cart.map(item => ({
                id: item.id,
                productId: item.id,
                name: item.name,
                price: Number(item.price),
                qty: Number(item.qty),
                destination: item.destination
            }));

            // Send bulk items
            await window.electron.ipcRenderer.invoke('add-bulk-items', {
                tableId,
                items: itemsToSend,
                waiterId: user?.id || null // Agar user bo'lsa ID, yo'qsa null
            });

            onClose(); // Close modal after success
        } catch (err) {
            console.error("Order send error:", err);
        }
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
            <div className="bg-background w-[95vw] h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                {/* HEADER */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-card shrink-0">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <ChefHat className="text-primary" />
                        <span>Menyu</span>
                        <span className="text-muted-foreground text-lg font-normal">| {tableName}</span>
                    </h2>

                    <div className="flex items-center gap-4 flex-1 max-w-xl mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Qidirish (Nomi yoki Kodi)..."
                                className="pl-10 h-12 text-lg bg-secondary/50 border-transparent focus:bg-background"
                                autoFocus
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-12 w-12 hover:bg-destructive/10 hover:text-destructive">
                        <X size={28} />
                    </Button>
                </div>

                {/* BODY */}
                <div className="flex flex-1 overflow-hidden">
                    {/* 1. CATEGORIES (Left) */}
                    <div className="w-64 bg-secondary/30 border-r border-border overflow-y-auto p-2 flex flex-col gap-2 shrink-0">
                        <Button
                            variant={activeCategory === 'all' ? 'default' : 'ghost'}
                            onClick={() => setActiveCategory('all')}
                            className={cn(
                                "justify-start h-12 text-lg font-medium",
                                activeCategory === 'all' ? "bg-primary text-primary-foreground" : "hover:bg-background"
                            )}
                        >
                            Barchasi
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={activeCategory === cat.id ? 'default' : 'ghost'}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "justify-start h-12 text-lg font-normal truncate",
                                    activeCategory === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-background"
                                )}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>

                    {/* 2. PRODUCTS (Middle) - LIST VIEW */}
                    <div className="flex-1 overflow-y-auto p-4 bg-background border-r border-border">
                        {loading ? <div className="text-center text-muted-foreground mt-20">Yuklanmoqda...</div> : (
                            <div className="space-y-2">
                                {filteredProducts.map(product => {
                                    const inCart = cart.find(c => c.id === product.id);
                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border border-border cursor-pointer transition-all hover:bg-secondary/50 active:scale-[0.99]",
                                                inCart ? "border-primary/50 bg-primary/5" : "bg-card"
                                            )}
                                        >
                                            <div className="flex-1">
                                                <h3 className="font-bold text-lg text-foreground">{product.name}</h3>

                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-bold text-lg text-primary">{product.price.toLocaleString()}</span>
                                                <Button size="icon" variant="ghost" className="rounded-full h-8 w-8 bg-primary/10 text-primary hover:bg-primary hover:text-white">
                                                    <Plus size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <div className="text-center text-muted-foreground mt-20 text-lg">
                                        Mahsulotlar topilmadi
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 3. CART (Right) */}
                    <div className="w-96 bg-card flex flex-col border-l border-border shadow-xl shrink-0">
                        <div className="p-4 border-b border-border bg-muted/20">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <ShoppingBag size={20} />
                                Buyurtma
                                <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">{cart.length}</span>
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {cart.length === 0 ? (
                                <div className="text-center text-muted-foreground mt-20 opacity-50 flex flex-col items-center">
                                    <ShoppingBag size={64} className="mb-4 stroke-1" />
                                    <p className="text-xl font-medium">Savat bo'sh</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="bg-background border border-border p-4 rounded-2xl shadow-sm flex flex-col gap-3 animate-in slide-in-from-right-5 duration-200">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className="font-bold text-base line-clamp-2 leading-tight">{item.name}</h4>
                                            <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1"><Trash2 size={20} /></button>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="mb-1">
                                                <span className="text-sm text-muted-foreground">Jami:</span>
                                                <p className="font-bold text-lg text-primary">{(item.price * item.qty).toLocaleString()}</p>
                                            </div>

                                            <div className="flex items-center gap-1 bg-secondary rounded-xl p-1.5 shadow-inner">
                                                <button onClick={() => updateQty(item.id, -1)} className="w-10 h-10 flex items-center justify-center bg-background hover:bg-white rounded-lg shadow-sm transition-all text-foreground active:scale-95 border border-border"><Minus size={18} /></button>
                                                <span className="font-bold text-lg min-w-[3rem] text-center font-mono">
                                                    {item.unit_type === 'kg' ? item.qty.toFixed(3) : item.qty}
                                                </span>
                                                <button onClick={() => updateQty(item.id, 1)} className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-all active:scale-95"><Plus size={18} /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* CART FOOTER */}
                        <div className="p-4 border-t border-border bg-background space-y-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-muted-foreground">Jami:</span>
                                <span className="font-bold text-2xl text-primary">{cartTotal.toLocaleString()}</span>
                            </div>
                            <Button
                                size="lg"
                                className="w-full text-lg h-12 gap-2 shadow-lg shadow-primary/20"
                                onClick={handleSendOrder}
                                disabled={cart.length === 0}
                            >
                                <Send size={20} /> Buyurtma Berish
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {/* WEIGHT MODAL */}
            {weightModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] animate-in fade-in zoom-in duration-200">
                    <div className="bg-card w-[350px] rounded-2xl shadow-2xl p-6 border border-border">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold">{weightModal.product?.name}</h3>
                            <p className="text-muted-foreground">Vazn kiriting (kg)</p>
                        </div>

                        <div className="bg-secondary/50 p-4 rounded-xl mb-4 text-center">
                            <span className="text-3xl font-mono font-bold">{weightInput || '0'}</span> <span className="text-muted-foreground">kg</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map(btn => (
                                <Button
                                    key={btn}
                                    variant="outline"
                                    className="h-12 text-lg font-bold"
                                    onClick={() => handleNumPad(btn)}
                                >
                                    {btn}
                                </Button>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setWeightModal({ isOpen: false, product: null })}>Bekor qilish</Button>
                            <Button className="flex-1" onClick={handleWeightConfirm}>Tasdiqlash</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

export default MenuModal;
