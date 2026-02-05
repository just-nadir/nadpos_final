import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Search, ShoppingCart, Package, Check, Users, Plus, Minus, ChefHat
} from 'lucide-react';
import { getCategories, getProducts, getTableItems, addBulkItems, updateTableGuests } from '../services/api';
import { getUser } from '../utils/storage';
import { useSocket } from '../hooks/useSocket';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ProductCard } from '../components/features/ProductCard';
import { CartBottomSheet } from '../components/features/CartBottomSheet';
import { CategoryTabs } from '../components/features/CategoryTabs';
import { NumpadModal } from '../components/ui/NumpadModal';

export default function OrderPage() {
    const { tableId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const table = location.state?.table;
    const hallName = location.state?.hallName || '';

    const [user, setUser] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [existingItems, setExistingItems] = useState([]);
    const [showGuestsModal, setShowGuestsModal] = useState(false);
    const [guestsCount, setGuestsCount] = useState(table?.guests || 0);
    const [success, setSuccess] = useState(false);
    const [showExistingOrders, setShowExistingOrders] = useState(false);
    const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'detailed'

    // Numpad State
    const [numpadModal, setNumpadModal] = useState({ isOpen: false, product: null });

    const groupedItems = useMemo(() => {
        const map = new Map();
        existingItems.forEach(item => {
            // Robust key generation: Prefer product_id, fallback to name. Force string and trim.
            const rawKey = item.product_id || item.product_name || item.name;
            const key = String(rawKey).trim();

            if (!map.has(key)) {
                map.set(key, {
                    ...item,
                    uniqueKey: key,
                    totalQty: 0,
                    totalSum: 0
                });
            }
            const entry = map.get(key);
            const qty = Number(item.quantity || item.qty || 1);
            const price = Number(item.price || 0);

            entry.totalQty += qty;
            entry.totalSum += (Number(item.total_price) || (price * qty));
        });
        return Array.from(map.values());
    }, [existingItems]);

    const itemsToRender = viewMode === 'grouped' ? groupedItems : existingItems;

    // Socket
    useSocket(useCallback((data) => {
        if (data.type === 'table-items' && data.id === tableId) {
            loadTableItems();
        }
    }, [tableId]));

    // ... (rest of the file until Modal)

    {/* Existing Orders Modal */ }
    <Modal
        isOpen={showExistingOrders}
        title="Faol buyurtmalar"
        onClose={() => setShowExistingOrders(false)}
    >
        <div className="flex justify-end mb-2">
            <button
                onClick={() => setViewMode(prev => prev === 'grouped' ? 'detailed' : 'grouped')}
                className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 active:scale-95 transition-all"
            >
                {viewMode === 'grouped' ? 'Alohida ko\'rish' : 'Birlashtirib ko\'rish'}
            </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {itemsToRender.length > 0 ? (
                itemsToRender.map((item, index) => (
                    <div key={item.id || index} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div>
                            <p className="text-white font-medium">{item.product_name || item.name}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <span>{parseInt(item.price).toLocaleString()} so'm</span>
                                {viewMode === 'detailed' && item.created_at && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(item.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-white font-bold text-sm bg-slate-700 px-2 py-1 rounded-lg">
                                {viewMode === 'grouped' ? item.totalQty : (item.quantity || item.qty)}x
                            </span>
                            <span className="text-indigo-400 font-bold">
                                {(viewMode === 'grouped' ? item.totalSum : (parseInt(item.total_price) || (parseInt(item.price) * (item.quantity || item.qty)))).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-slate-500 text-center py-4">Hozircha buyurtmalar yo'q</p>
            )}

            <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                <span className="text-slate-400 font-medium">Jami summa:</span>
                <span className="text-xl font-bold text-white">
                    {existingItems.reduce((sum, item) => sum + (parseInt(item.total_price) || (parseInt(item.price) * (item.quantity || item.qty))), 0).toLocaleString()} <span className="text-sm text-slate-500">so'm</span>
                </span>
            </div>
        </div>
    </Modal>


    useEffect(() => {
        const storedUser = getUser();
        if (!storedUser) {
            navigate('/login', { replace: true });
            return;
        }
        setUser(storedUser);
        loadData();
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [cats, prods] = await Promise.all([
                getCategories(),
                getProducts(),
            ]);
            setCategories(cats || []);
            setProducts(prods || []);
            await loadTableItems();
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTableItems = async () => {
        try {
            const items = await getTableItems(tableId);
            setExistingItems(items || []);
        } catch (error) {
            console.error('Load table items error:', error);
            // Xatolikni foydalanuvchiga ko'rsatish
            alert(`Xatolik: Serverga ulanib bo'lmadi.\nManzil: ${window.location.hostname}:3001\nXato: ${error.message}`);
        }
    };

    const filteredProducts = useMemo(() => {
        let filtered = products;
        if (activeCategory !== 'all') filtered = filtered.filter(p => p.category_id === activeCategory);
        if (search.trim()) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
        return filtered;
    }, [products, activeCategory, search]);

    const handleProductSelect = useCallback((product) => {
        if (product.unit_type === 'kg') {
            setNumpadModal({ isOpen: true, product });
        } else {
            addToCart(product, 1);
        }
    }, []);

    const handleNumpadConfirm = useCallback((qty) => {
        if (numpadModal.product && qty > 0) {
            addToCart(numpadModal.product, qty);
        }
        setNumpadModal({ isOpen: false, product: null });
    }, [numpadModal.product]);

    const addToCart = useCallback((product, quantity = 1) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + quantity } : item);
            }
            return [...prev, {
                id: product.id,
                productId: product.id,
                name: product.name,
                price: product.price,
                unit_type: product.unit_type,
                qty: quantity,
                destination: product.destination
            }];
        });
    }, []);

    const updateCartQty = useCallback((productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = item.qty + delta;
                return newQty > 0 ? { ...item, qty: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.qty), 0), [cart]);
    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart]);

    const handleSendOrder = async () => {
        if (cart.length === 0 || !user) return;
        setSending(true);
        try {
            await addBulkItems(tableId, cart, user.id);
            setSuccess(true);
            setShowCart(false);
            setTimeout(() => {
                setCart([]);
                setSuccess(false);
                navigate('/tables', { replace: true });
            }, 1000); // 1.5s dan 1s ga tushirildi, tezroq bo'lishi uchun
        } catch (error) {
            console.error('Send order error:', error);
            alert('Xatolik: ' + (error.message || 'Buyurtma yuborilmadi'));
        } finally {
            setSending(false);
        }
    };



    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">Menyu yuklanmoqda...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-[#020617]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 safe-top">
                <div className="flex items-center gap-3 mb-4">
                    <Button variant="secondary" size="sm" onClick={() => navigate('/tables')} className="!p-2.5 !rounded-xl bg-slate-900 border-slate-800">
                        <ArrowLeft size={20} className="text-slate-400" />
                    </Button>
                    <div className="flex-1">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{hallName}</p>
                        <h1 className="text-xl font-bold text-white leading-none mt-0.5">{table?.name || 'Stol'}</h1>
                    </div>
                    {existingItems.length > 0 && (
                        <button
                            onClick={() => setShowExistingOrders(true)}
                            className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 active:scale-95 transition-transform"
                        >
                            <ChefHat size={16} className="text-indigo-400" />
                            <span className="text-sm font-bold text-indigo-400">{existingItems.length}</span>
                        </button>
                    )}
                </div>

                <div className="mb-3">
                    <Input
                        icon={Search}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Mahsulotlarni qidirish..."
                        className="!bg-slate-900 !border-slate-800 focus:!border-indigo-500/50 !h-12 !rounded-xl"
                    />
                </div>

                <CategoryTabs
                    categories={categories}
                    activeCategory={activeCategory}
                    onSelect={setActiveCategory}
                />
            </header>

            {/* Products Grid */}
            <main className="flex-1 p-4 pb-28 safe-bottom">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                        {filteredProducts.map((product) => {
                            const inCart = cart.find(item => item.id === product.id);
                            return (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    qty={inCart?.qty || 0}
                                    onAdd={() => handleProductSelect(product)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                        <Package size={56} className="mb-4 opacity-20" />
                        <p className="font-semibold text-lg opacity-50">Mahsulot topilmadi</p>
                    </div>
                )}
            </main>

            {/* Cart FAB */}
            <AnimatePresence>
                {cart.length > 0 && (
                    <motion.div
                        initial={{ y: 200 }}
                        animate={{ y: 0 }}
                        exit={{ y: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-40 p-4 safe-bottom bg-gradient-to-t from-[#020617] via-[#020617] to-transparent"
                    >
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCart(true)}
                            className="w-full h-16 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/25 flex items-center justify-between px-6 border border-white/10"
                        >
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <ShoppingCart size={24} className="text-white" />
                                    <span className="absolute -top-2 -right-2 min-w-[20px] h-5 rounded-full bg-white text-indigo-600 text-xs font-bold flex items-center justify-center px-1">
                                        {cartCount}
                                    </span>
                                </div>
                                <span className="font-bold text-white text-lg">Savatcha</span>
                            </div>
                            <span className="font-mono font-bold text-white text-xl">
                                {cartTotal.toLocaleString()}
                            </span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <CartBottomSheet
                isOpen={showCart}
                onClose={() => setShowCart(false)}
                cart={cart}
                onUpdateQty={updateCartQty}
                onClear={clearCart}
                onSend={handleSendOrder}
                sending={sending}
                total={cartTotal}
            />



            {/* Existing Orders Modal */}
            <Modal
                isOpen={showExistingOrders}
                title={
                    <div className="flex items-center gap-2">
                        <span>Faol buyurtmalar</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">V3</span>
                    </div>
                }
                onClose={() => setShowExistingOrders(false)}
            >
                <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                    {existingItems.length > 0 ? (
                        existingItems.map((item, index) => (
                            <div key={item.id || index} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                                <div>
                                    <p className="text-white font-medium">{item.product_name || item.name}</p>
                                    <p className="text-sm text-slate-400">{parseInt(item.price).toLocaleString()} so'm</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-white font-bold text-sm bg-slate-700 px-2 py-1 rounded-lg">
                                        {item.quantity || item.qty}x
                                    </span>
                                    <span className="text-indigo-400 font-bold">
                                        {(parseInt(item.total_price) || (parseInt(item.price) * (item.quantity || item.qty))).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-4">Hozircha buyurtmalar yo'q</p>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-700 flex justify-between items-center">
                        <span className="text-slate-400 font-medium">Jami summa:</span>
                        <span className="text-xl font-bold text-white">
                            {existingItems.reduce((sum, item) => sum + (parseInt(item.total_price) || (parseInt(item.price) * (item.quantity || item.qty))), 0).toLocaleString()} <span className="text-sm text-slate-500">so'm</span>
                        </span>
                    </div>
                </div>
            </Modal>

            {/* Numpad Modal for KG items */}
            <NumpadModal
                isOpen={numpadModal.isOpen}
                onClose={() => setNumpadModal({ isOpen: false, product: null })}
                onConfirm={handleNumpadConfirm}
                title={numpadModal.product?.name}
                initialValue=""
                suffix={numpadModal.product?.unit_type || 'kg'}
            />

            {/* Success Overlay */}
            <AnimatePresence>
                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/30"
                        >
                            <Check size={48} strokeWidth={3} className="text-emerald-500" />
                        </motion.div>
                        <h2 className="text-3xl font-bold text-white text-center">Yuborildi!</h2>
                        <p className="text-slate-400 mt-2 text-lg text-center font-medium">Buyurtma oshxonaga jo'natildi</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
