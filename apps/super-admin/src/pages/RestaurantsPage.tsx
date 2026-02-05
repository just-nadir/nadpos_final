import { useEffect, useState } from 'react';
import { Plus, Search, MoreVertical, X, Edit, Trash2, MapPin, Phone, Calendar, Store, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createRestaurant, getRestaurants, deleteRestaurant, updateRestaurant } from '../services/api';
import type { Restaurant, CreateRestaurantPayload } from '../types/api';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { TableSkeleton } from '../components/ui/Skeleton';

// --- Sub-components (could be extracted) ---

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle },
        EXPIRED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: AlertCircle },
        DEFAULT: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: Store }
    };

    const { bg, text, border, icon: Icon } = config[status as keyof typeof config] || config.DEFAULT;

    return (
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}>
            <Icon className="h-3 w-3" />
            {status}
        </div>
    );
};

// --- Main Page Component ---

export default function RestaurantsPage() {
    const { showToast } = useToast();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Actions Dropdown State
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [restaurantToDelete, setRestaurantToDelete] = useState<{ id: string, name: string } | null>(null);

    // Form State
    const [formData, setFormData] = useState<CreateRestaurantPayload>({
        name: '',
        phone: '',
        password: '',
        address: '',
        expiryDate: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const fetchRestaurants = async () => {
        try {
            const data = await getRestaurants();
            setRestaurants(data);
        } catch (error) {
            console.error("Failed to fetch restaurants", error);
            showToast('Ma\'lumotlarni yuklashda xatolik', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    const handleOpenModal = (restaurant?: any) => {
        if (restaurant) {
            setEditingId(restaurant.id);
            // Format date to yyyy-MM-dd for input
            let formattedDate = '';
            if (restaurant.expiry) {
                const d = new Date(restaurant.expiry);
                formattedDate = d.toISOString().split('T')[0];
            }

            setFormData({
                name: restaurant.name,
                phone: restaurant.phone,
                password: '',
                address: restaurant.address,
                expiryDate: formattedDate
            });
        } else {
            setEditingId(null);
            // Default to 1 year from now for new
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            setFormData({
                name: '',
                phone: '',
                password: '',
                address: '',
                expiryDate: nextYear.toISOString().split('T')[0]
            });
        }
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await updateRestaurant(editingId, formData);
                showToast('Restoran muvaffaqiyatli yangilandi', 'success');
            } else {
                await createRestaurant(formData);
                showToast('Yangi restoran muvaffaqiyatli qo\'shildi', 'success');
            }
            setIsModalOpen(false);
            setFormData({ name: '', phone: '', password: '', address: '', expiryDate: '' });
            fetchRestaurants();
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || 'Xatolik yuz berdi! Telefon raqam band bo\'lishi mumkin.';
            showToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (id: string, name: string) => {
        setRestaurantToDelete({ id, name });
        setIsConfirmOpen(true);
        setOpenMenuId(null);
    };

    const handleDelete = async () => {
        if (!restaurantToDelete) return;
        setSubmitting(true);
        try {
            await deleteRestaurant(restaurantToDelete.id);
            showToast('Restoran muvaffaqiyatli o\'chirildi', 'success');
            fetchRestaurants();
        } catch (error) {
            showToast('O\'chirishda xatolik bo\'ldi', 'error');
        } finally {
            setSubmitting(false);
            setIsConfirmOpen(false);
            setRestaurantToDelete(null);
        }
    };

    const filteredRestaurants = restaurants.filter(res =>
        res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.phone.includes(searchTerm)
    );

    const formatDate = (dateString: string | null) => {
        if (!dateString) return <span className="text-gray-400 text-xs">Belgilanmagan</span>;
        const d = new Date(dateString);
        return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-gray-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Restoranlar</h2>
                    <p className="text-gray-500 font-medium">Barcha hamkor restoranlarni boshqarish tizimi</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="group relative flex items-center justify-center gap-3 bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-black transition-all duration-300 font-semibold shadow-xl shadow-gray-200 hover:shadow-2xl hover:shadow-gray-300 hover:-translate-y-1 active:translate-y-0 active:scale-95"
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Yangi Restoran</span>
                </button>
            </div>

            {/* Main Content Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-8 border-b border-gray-50">
                    <div className="relative max-w-lg w-full group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-black transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Qidirish (Nomi, Telefon)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-black/5 focus:bg-white transition-all font-medium"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest pl-10">Restoran</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Manzil</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Aloqa</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Litsenziya</th>
                                <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-10">Amallar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8">
                                        <TableSkeleton rows={5} cols={6} />
                                    </td>
                                </tr>
                            ) : filteredRestaurants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-24 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center">
                                                <Store className="h-10 w-10 text-gray-300" />
                                            </div>
                                            <div>
                                                <span className="text-xl font-bold text-gray-900 block mb-1">Restoranlar topilmadi</span>
                                                <p className="text-gray-400">Yangi restoran qo'shish uchun yuqoridagi tugmani bosing.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRestaurants.map((res) => (
                                    <tr key={res.id} className="group hover:bg-gray-50/50 transition-all duration-200">
                                        <td className="px-8 py-6 pl-10">
                                            <div className="flex items-center gap-5">
                                                <div className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300">
                                                    {res.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-base mb-0.5">{res.name}</div>
                                                    <div className="text-xs font-medium text-gray-400 font-mono tracking-wide">ID: {res.id.slice(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 text-gray-600">
                                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <span className="truncate max-w-[200px] font-medium" title={res.address}>{res.address || 'Kiritilmagan'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 text-gray-600 font-mono text-sm font-medium">
                                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                                    <Phone className="h-4 w-4" />
                                                </div>
                                                {res.phone}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusBadge status={res.status} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3 text-gray-600 text-sm font-medium">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {formatDate(res.expiry)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right relative pr-10">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === res.id ? null : res.id);
                                                }}
                                                className="p-3 ml-auto rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 active:scale-90"
                                            >
                                                <MoreVertical className="h-5 w-5" />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openMenuId === res.id && (
                                                <div className="absolute right-14 top-12 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200 p-2">
                                                    <button
                                                        onClick={() => handleOpenModal(res)}
                                                        className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors font-medium group/btn"
                                                    >
                                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-500 group-hover/btn:text-black group-hover/btn:bg-white transition-colors">
                                                            <Edit className="h-4 w-4" />
                                                        </div>
                                                        Tahrirlash
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(res.id, res.name)}
                                                        className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors font-medium group/btn mt-1"
                                                    >
                                                        <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover/btn:bg-white transition-colors">
                                                            <Trash2 className="h-4 w-4" />
                                                        </div>
                                                        O'chirish
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleDelete}
                title="Restoranni o'chirish"
                description={`Siz rostdan ham "${restaurantToDelete?.name}" restoranini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`}
                confirmText="Ha, o'chirish"
                isDestructive={true}
                loading={submitting}
            />

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] transition-all p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">
                                    {editingId ? 'Restoranni Tahrirlash' : 'Yangi Hamkor'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Ma'lumotlarni to'ldiring</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Restoran Nomi</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                                <Store className="h-5 w-5" />
                                            </div>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Masalan: Rayhon"
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all outline-none font-medium"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Telefon (Login)</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                                    <Phone className="h-5 w-5" />
                                                </div>
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="99890..."
                                                    className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all outline-none font-medium"
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                                {editingId ? 'Yangi Parol' : 'Parol'}
                                            </label>
                                            <div className="relative group">
                                                <input
                                                    required={!editingId}
                                                    type="password"
                                                    placeholder="••••••••"
                                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all outline-none font-medium"
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Manzil</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Masalan: Toshkent, Chilonzor"
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all outline-none font-medium"
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Litsenziya Muddati</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="date"
                                                required
                                                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black focus:bg-white transition-all outline-none font-medium"
                                                value={formData.expiryDate}
                                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 transform active:scale-[0.98] transition-all shadow-lg shadow-gray-200"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>Bajarilmoqda...</span>
                                            </>
                                        ) : (
                                            <span>{editingId ? 'O\'zgarishlarni Saqlash' : 'Restoran Yaratish'}</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
