import { Calendar, MapPin, Phone, Store, X, Loader2 } from 'lucide-react';
import type { CreateRestaurantPayload } from '../../types/api';

interface RestaurantFormProps {
  isOpen: boolean;
  editingId: string | null;
  formData: CreateRestaurantPayload;
  submitting: boolean;
  onChange: (data: CreateRestaurantPayload) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const RestaurantForm = ({
  isOpen,
  editingId,
  formData,
  submitting,
  onChange,
  onClose,
  onSubmit,
}: RestaurantFormProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] transition-all p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-gray-100">
        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {editingId ? 'Restoranni Tahrirlash' : 'Yangi Hamkor'}
            </h3>
            <p className="text-sm text-gray-500 mt-1 font-medium">Ma&apos;lumotlarni to&apos;ldiring</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8">
          <form onSubmit={onSubmit} className="space-y-6">
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
                    onChange={(e) => onChange({ ...formData, name: e.target.value })}
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
                      onChange={(e) => onChange({ ...formData, phone: e.target.value })}
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
                      onChange={(e) => onChange({ ...formData, password: e.target.value })}
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
                    onChange={(e) => onChange({ ...formData, address: e.target.value })}
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
                    onChange={(e) => onChange({ ...formData, expiryDate: e.target.value })}
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
                  <span>{editingId ? "O'zgarishlarni Saqlash" : 'Restoran Yaratish'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

