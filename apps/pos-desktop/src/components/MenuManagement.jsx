import React, { useState, useEffect } from 'react';
import { Reorder } from 'framer-motion';
import { Plus, Trash2, Power, X, ChefHat, Edit2, Search, Package, MoreVertical } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { cn } from '../utils/cn';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useIpcListener } from '../hooks/useIpcListener';

const ProductModal = ({ isOpen, onClose, onSubmit, newProduct, setNewProduct, categories, kitchens }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-background w-[500px] rounded-2xl shadow-2xl p-6 relative border border-border">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-2"><X size={24} /></button>
        <h2 className="text-2xl font-bold text-foreground mb-6">{newProduct.id ? 'Taomni Tahrirlash' : 'Yangi Taom'}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Nomi</label>
            <input required type="text" value={newProduct.name || ''} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full p-3 bg-secondary/50 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium transition-all" placeholder="Masalan: Qozon Kabob" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Narxi</label>
            <input required type="number" value={newProduct.price || ''} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} className="w-full p-3 bg-secondary/50 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-bold transition-all" placeholder="0" />
          </div>
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Kategoriya</label>
            <select value={newProduct.category_id || ''} onChange={e => setNewProduct({ ...newProduct, category_id: e.target.value })} className="w-full p-3 bg-secondary/50 rounded-xl border border-transparent focus:border-primary outline-none text-foreground font-medium">
              <option value="">Tanlang</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>

          {/* OSHXONA TANLASH */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">Qayerda tayyorlanadi?</label>
            <div className="grid grid-cols-3 gap-2">
              {kitchens && kitchens.length > 0 ? kitchens.map((k) => (
                <button key={k.id} type="button" onClick={() => setNewProduct({ ...newProduct, destination: String(k.id) })}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all h-20
                    ${newProduct.destination === String(k.id) ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:bg-secondary/50'} `}>
                  <ChefHat size={20} />
                  <span className="text-xs font-bold capitalize truncate w-full text-center">{k.name}</span>
                </button>
              )) : <p className="text-xs text-muted-foreground col-span-3 text-center">Oshxonalar mavjud emas. Sozlamalardan qo'shing.</p>}
            </div>
          </div>

          {/* UNIT TYPE TANLASH */}
          <div>
            <label className="block text-sm font-bold text-muted-foreground mb-2">O'lchov birligi</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setNewProduct({ ...newProduct, unit_type: 'item' })}
                className={`flex-1 p-3 rounded-xl border font-bold transition-all ${newProduct.unit_type !== 'kg' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'} `}>
                Dona
              </button>
              <button type="button" onClick={() => setNewProduct({ ...newProduct, unit_type: 'kg' })}
                className={`flex-1 p-3 rounded-xl border font-bold transition-all ${newProduct.unit_type === 'kg' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'} `}>
                Kg
              </button>
            </div>
          </div>

          {/* TRACK STOCK (OMBOR) */}
          <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border">
            <input
              type="checkbox"
              id="track_stock"
              checked={newProduct.track_stock !== 0}
              onChange={e => setNewProduct({ ...newProduct, track_stock: e.target.checked ? 1 : 0 })}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
            <label htmlFor="track_stock" className="flex-1 cursor-pointer">
              <span className="block text-sm font-bold text-foreground">Ombor hisobi yuritilsinmi?</span>
              <span className="block text-xs text-muted-foreground">Agar o'chirilgan bo'lsa, qoldiq hisoblanmaydi (Xizmatlar uchun)</span>
            </label>
          </div>

          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:bg-primary/90 mt-6 text-lg">Saqlash</button>
        </form>
      </div>
    </div>
  );
};

const MenuManagement = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [kitchens, setKitchens] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category_id: '', destination: '1', unit_type: 'item', track_stock: 1 });

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Kategoriya tahrirlash uchun
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  // Delete Modal State (mahsulotlar uchun)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  // Delete Modal State (kategoriyalar uchun)
  const [confirmCategoryDelete, setConfirmCategoryDelete] = useState({ isOpen: false, id: null });

  // NEW: Reorder Handlers
  const handleReorderCategories = async (newOrder) => {
    setCategories(newOrder);
    if (window.electron && window.electron.ipcRenderer) {
      try {
        await window.electron.ipcRenderer.invoke('update-categories-order', newOrder);
      } catch (error) {
        console.error("Failed to save category order", error);
        loadData();
      }
    }
  };

  const handleReorderProducts = async (newFilteredProducts) => {
    // Barcha mahsulotlar ro'yxatidagi boshqa kategoriyaga tegishli mahsulotlarni ajratib olamiz
    const otherProducts = products.filter(p => p.category_id !== activeCategory);
    // Yangi tartibdagi joriy kategoriya mahsulotlarini qo'shamiz
    const updatedProducts = [...otherProducts, ...newFilteredProducts];

    setProducts(updatedProducts);

    if (window.electron && window.electron.ipcRenderer) {
      try {
        // Faqat shu kategoriyadagi mahsulotlar tartibini yangilash uchun yuboramiz
        await window.electron.ipcRenderer.invoke('update-products-order', newFilteredProducts);
      } catch (error) {
        console.error("Failed to save product order", error);
        loadData();
      }
    }
  };

  const loadData = async () => {
    if (!window.electron) return;
    try {
      const { ipcRenderer } = window.electron;
      const cats = await ipcRenderer.invoke('get-categories');
      const prods = await ipcRenderer.invoke('get-products');
      const kits = await ipcRenderer.invoke('get-kitchens');

      setCategories(cats || []);
      setProducts(prods || []);
      setKitchens(kits || []);

      if (!activeCategory && cats && cats.length > 0) setActiveCategory(cats[0].id);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  // Realtime: kategoriya/mahsulot qo'shilganda yoki o'zgartirilganda ro'yxat yangilansin
  useIpcListener('db-change', (event, data) => {
    if (data.type === 'products' || data.type === 'categories') loadData();
  });

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('add-category', newCategoryName);
      setNewCategoryName('');
      setIsAddingCategory(false);
      loadData();
    } catch (err) { console.error(err); }
  };

  const startEditCategory = (cat) => {
    setEditingCategoryId(cat.id);
    setEditCategoryName(cat.name);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editCategoryName.trim()) return;
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('update-category', { id: editingCategoryId, name: editCategoryName });
      setEditingCategoryId(null);
      setEditCategoryName('');
      loadData();
    } catch (err) { console.error(err); }
  };

  const confirmDeleteCategory = (id) => {
    setConfirmCategoryDelete({ isOpen: true, id });
  };

  const performDeleteCategory = async () => {
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('delete-category', confirmCategoryDelete.id);

      // Agar o'chirilayotgan kategoriya active bo'lsa, boshqa kategoriyaga o'tkazish
      if (activeCategory === confirmCategoryDelete.id) {
        const remaining = categories.filter(c => c.id !== confirmCategoryDelete.id);
        setActiveCategory(remaining.length > 0 ? remaining[0].id : null);
      }

      loadData();
    } catch (err) { console.error(err); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const { ipcRenderer } = window.electron;
      const productData = { ...newProduct, price: Number(newProduct.price), category_id: Number(newProduct.category_id) || activeCategory };

      if (newProduct.id) {
        // UPDATE
        await ipcRenderer.invoke('update-product', productData);
      } else {
        // CREATE
        await ipcRenderer.invoke('add-product', productData);
      }

      setIsModalOpen(false);
      // Reset qilish
      setNewProduct({ name: '', price: '', category_id: '', destination: '1', unit_type: 'item', track_stock: 1 });
      loadData();
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (id, status) => {
    const { ipcRenderer } = window.electron;
    await ipcRenderer.invoke('toggle-product-status', { id, status: status ? 0 : 1 });
    loadData();
  };

  const confirmDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const performDelete = async () => {
    try {
      const { ipcRenderer } = window.electron;
      await ipcRenderer.invoke('delete-product', confirmModal.id);
      loadData();
    } catch (err) { console.error(err); }
  };

  // Filter products by category and search query
  const filteredProducts = products.filter(p => {
    const catMatch = p.category_id === activeCategory;
    const searchMatch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="flex w-full h-full relative bg-background">
      {/* SIDEBAR (Kategoriyalar) */}
      <div className="w-80 bg-card border-r border-border flex flex-col h-full z-10 transition-all duration-300">
        <div className="p-6 border-b border-border flex justify-between items-center bg-card">
          <h2 className="text-xl font-bold text-foreground">Kategoriyalar</h2>
          <Button size="icon" variant="ghost" className="rounded-full w-12 h-12 hover:bg-secondary active:scale-95 transition-transform" onClick={() => setIsAddingCategory(true)}>
            <Plus className="text-primary" size={24} />
          </Button>
        </div>

        {isAddingCategory && (
          <form onSubmit={handleAddCategory} className="p-4 bg-secondary/10 border-b border-border animate-in slide-in-from-top duration-300">
            <input autoFocus type="text" placeholder="Nomi..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="w-full p-4 rounded-xl border border-border bg-background focus:border-primary outline-none mb-3 text-lg text-foreground shadow-sm" />
            <div className="flex gap-3">
              <Button type="button" variant="secondary" size="lg" onClick={() => setIsAddingCategory(false)} className="flex-1 h-12 text-muted-foreground font-bold">Bekor</Button>
              <Button type="submit" size="lg" className="flex-1 h-12 font-bold shadow-md shadow-primary/20">Qo'shish</Button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-4 bg-secondary/10 scrollbar-thin">
          <Reorder.Group axis="y" values={categories} onReorder={handleReorderCategories} className="space-y-3">
            {categories.map(cat => (
              <Reorder.Item key={cat.id} value={cat}>
                <div className="relative group">
                  {editingCategoryId === cat.id ? (
                    // Tahrirlash rejimi (o'zgarishsiz qoladi)
                    <form onSubmit={handleUpdateCategory} className="w-full bg-secondary/30 p-3 rounded-2xl border-2 border-primary animate-in zoom-in duration-200">
                      <input
                        autoFocus
                        type="text"
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-border bg-background mb-3 text-lg text-foreground font-medium outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Kategoriya nomi"
                      />
                      <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setEditingCategoryId(null)} className="flex-1 h-10 rounded-lg text-muted-foreground">Bekor</Button>
                        <Button type="submit" size="sm" className="flex-1 h-10 rounded-lg font-bold">Saqlash</Button>
                      </div>
                    </form>
                  ) : (
                    // Oddiy ko'rinish
                    <div
                      onClick={() => setActiveCategory(cat.id)}
                      className={cn(
                        "w-full px-5 py-4 rounded-2xl font-bold text-lg transition-all cursor-pointer flex items-center justify-between min-h-[64px] shadow-sm select-none active:scale-[0.98]",
                        activeCategory === cat.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1"
                          : "bg-background text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent hover:border-border"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1 overflow-hidden">
                        {/* Drag Handle */}
                        <div className="opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity mr-1 hidden lg:block">
                          <svg width="4" height="12" viewBox="0 0 6 14" fill="currentColor">
                            <path d="M2 2C2 2.55 1.55 3 1 3C0.45 3 0 2.55 0 2C0 1.45 0.45 1 1 1C1.55 1 2 1.45 2 2Z" />
                            <path d="M2 7C2 7.55 1.55 8 1 8C0.45 8 0 7.55 0 7C0 6.45 0.45 6 1 6C1.55 6 2 6.45 2 7Z" />
                            <path d="M2 12C2 12.55 1.55 13 1 13C0.45 13 0 12.55 0 12C0 11.45 0.45 11 1 11C1.55 11 2 11.45 2 12Z" />
                            <path d="M6 2C6 2.55 5.55 3 5 3C4.45 3 4 2.55 4 2C4 1.45 4.45 1 5 1C5.55 1 6 1.45 6 2Z" />
                            <path d="M6 7C6 7.55 5.55 8 5 8C4.45 8 4 7.55 4 7C4 6.45 4.45 6 5 6C5.55 6 6 6.45 6 7Z" />
                            <path d="M6 12C6 12.55 5.55 13 5 13C4.45 13 4 12.55 4 12C4 11.45 4.45 11 5 11C5.55 11 6 11.45 6 12Z" />
                          </svg>
                        </div>
                        <span className="truncate tracking-wide">{cat.name}</span>
                      </div>

                      {/* Tahrirlash va O'chirish tugmalari */}
                      <div className={cn("flex items-center gap-2 transition-all duration-300", activeCategory === cat.id ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0")}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditCategory(cat);
                          }}
                          className="p-2 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDeleteCategory(cat.id);
                          }}
                          className="p-2 rounded-xl hover:bg-red-500/80 active:bg-red-600 transition-colors text-white/90 hover:text-white"
                          title="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      </div>

      {/* CONTENT (Mahsulotlar - List View) */}
      <div className="flex-1 bg-background flex flex-col h-full overflow-hidden relative">
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-card shadow-sm z-20 sticky top-0">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">Menyu</h1>
            <p className="text-base text-muted-foreground mt-1 font-medium">
              {products.filter(p => p.category_id === activeCategory).length} ta mahsulot
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                type="text"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-secondary/30 border border-transparent focus:border-primary focus:bg-background rounded-2xl outline-none text-foreground transition-all text-lg shadow-inner"
              />
            </div>
            <Button onClick={() => {
              setNewProduct(prev => ({ ...prev, category_id: activeCategory || '' }));
              setIsModalOpen(true);
            }} size="lg" className="rounded-2xl shadow-xl shadow-primary/20 gap-3 h-14 px-8 text-lg font-bold hover:scale-105 transition-transform">
              <Plus size={24} /> Yangi Taom
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 pb-20 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
              <Package size={80} className="mb-6 stroke-1" />
              <p className="text-2xl font-medium">Mahsulotlar topilmadi</p>
            </div>
          ) : (
            <Reorder.Group axis="y" values={filteredProducts} onReorder={handleReorderProducts} className="divide-y divide-border">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-6 px-8 py-4 bg-muted/30 text-xs font-bold text-muted-foreground uppercase tracking-wider sticky top-0 backdrop-blur-md z-10 border-b border-border">
                <div className="col-span-3">Nomi</div>
                <div className="col-span-2">Narxi</div>
                <div className="col-span-2">Qoldiq</div>
                <div className="col-span-2">Oshxona</div>
                <div className="col-span-2">Holati</div>
                <div className="col-span-1 text-right">Amallar</div>
              </div>

              {filteredProducts.map(product => (
                <Reorder.Item key={product.id} value={product} as="div" className="relative">
                  <div className="grid grid-cols-12 gap-6 px-8 py-5 items-center hover:bg-secondary/20 transition-colors group min-h-[80px] bg-background">
                    {/* Name & Code */}
                    <div className="col-span-3 flex items-center gap-3">
                      {/* Drag Handle */}
                      <div className="opacity-0 group-hover:opacity-30 cursor-grab active:cursor-grabbing transition-opacity -ml-6 w-6 flex justify-center">
                        <MoreVertical size={16} />
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground font-bold text-xl shrink-0">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-lg text-foreground truncate", !product.is_active && "text-muted-foreground line-through decoration-2 decoration-destructive/50")}>{product.name}</h3>
                        {product.unit_type === 'kg' && <Badge variant="outline" className="mt-1 text-[10px] bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900 font-bold">KG</Badge>}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="col-span-2">
                      <div className="font-black text-primary text-xl tracking-tight">
                        {product.price.toLocaleString()} <span className="text-sm text-muted-foreground font-medium">so'm</span>
                      </div>
                    </div>

                    {/* Stock (Qoldiq) */}
                    <div className="col-span-2">
                      <div className={cn("font-bold text-lg flex items-center gap-1.5", product.stock <= 5 && product.track_stock !== 0 ? "text-destructive" : "text-foreground")}>
                        {product.track_stock === 0 ? (
                          <span className="text-muted-foreground font-normal">-</span>
                        ) : (
                          <>{product.stock || 0} <span className="text-sm text-muted-foreground font-medium">{product.unit_type === 'kg' ? 'kg' : 'dona'}</span></>
                        )}
                      </div>
                    </div>

                    {/* Kitchen */}
                    <div className="col-span-2">
                      <span className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg truncate block w-fit max-w-full border border-border/50">
                        {product.kitchen_name || '-'}
                      </span>
                    </div>

                    {/* Active Toggle */}
                    <div className="col-span-2">
                      <button
                        onClick={() => toggleStatus(product.id, product.is_active)}
                        className={cn(
                          "relative w-14 h-8 rounded-full transition-all duration-300 flex items-center px-1 shadow-inner",
                          product.is_active ? "bg-green-500" : "bg-gray-300 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 pointer-events-none",
                          product.is_active ? "translate-x-6" : "translate-x-0"
                        )} />
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:bg-primary/10 hover:text-primary w-12 h-12 rounded-xl transition-all active:scale-95"
                        onClick={() => {
                          setNewProduct({ ...product, category_id: product.category_id, destination: String(product.destination) });
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit2 size={22} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-12 h-12 rounded-xl transition-all active:scale-95"
                        onClick={() => confirmDelete(product.id)}
                      >
                        <Trash2 size={22} />
                      </Button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          )}
        </div>
      </div>
      {/* ... Modals ... */}

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleAddProduct} newProduct={newProduct} setNewProduct={setNewProduct} categories={categories} kitchens={kitchens} />

      {/* Mahsulot o'chirish tasdiqlash */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={performDelete}
        message="Taomni o'chirmoqchimisiz?"
      />

      {/* Kategoriya o'chirish tasdiqlash */}
      <ConfirmModal
        isOpen={confirmCategoryDelete.isOpen}
        onClose={() => setConfirmCategoryDelete({ ...confirmCategoryDelete, isOpen: false })}
        onConfirm={performDeleteCategory}
        message="Kategoriyani va unga tegishli barcha mahsulotlarni o'chirmoqchimisiz?"
      />
    </div>
  );
};

export default MenuManagement;