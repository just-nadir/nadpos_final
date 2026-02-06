import {
  AlertCircle,
  Calendar,
  Edit,
  MapPin,
  MoreVertical,
  Phone,
  Store,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Restaurant } from '../../types/api';
import { TableSkeleton } from '../ui/Skeleton';

interface RestaurantTableProps {
  restaurants: Restaurant[];
  loading: boolean;
  onEdit: (restaurant: Restaurant) => void;
  onDeleteRequest: (id: string, name: string) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    ACTIVE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: CheckCircle },
    EXPIRED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100', icon: AlertCircle },
    DEFAULT: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: Store },
  };

  const { bg, text, border, icon: Icon } = config[status as keyof typeof config] || config.DEFAULT;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${bg} ${text} ${border}`}
    >
      <Icon className="h-3 w-3" />
      {status}
    </div>
  );
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return <span className="text-gray-400 text-xs">Belgilanmagan</span>;
  const d = new Date(dateString);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1)
    .padStart(2, '0')}.${d.getFullYear()}`;
};

export const RestaurantTable = ({
  restaurants,
  loading,
  onEdit,
  onDeleteRequest,
}: RestaurantTableProps) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="overflow-x-auto min-h-[400px]">
      <table className="w-full text-left whitespace-nowrap">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest pl-10">
              Restoran
            </th>
            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Manzil</th>
            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Aloqa</th>
            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
              Litsenziya
            </th>
            <th className="px-8 py-6 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-10">
              Amallar
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 bg-white">
          {loading ? (
            <tr>
              <td colSpan={6} className="p-8">
                <TableSkeleton rows={5} cols={6} />
              </td>
            </tr>
          ) : restaurants.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-8 py-24 text-center text-gray-500">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center">
                    <Store className="h-10 w-10 text-gray-300" />
                  </div>
                  <div>
                    <span className="text-xl font-bold text-gray-900 block mb-1">Restoranlar topilmadi</span>
                    <p className="text-gray-400">
                      Yangi restoran qo&apos;shish uchun yuqoridagi tugmani bosing.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            restaurants.map((res) => (
              <tr key={res.id} className="group hover:bg-gray-50/50 transition-all duration-200">
                <td className="px-8 py-6 pl-10">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300">
                      {res.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-base mb-0.5">{res.name}</div>
                      <div className="text-xs font-medium text-gray-400 font-mono tracking-wide">
                        ID: {res.id.slice(0, 8)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="truncate max-w-[200px] font-medium" title={res.address || undefined}>
                      {res.address || 'Kiritilmagan'}
                    </span>
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

                  {openMenuId === res.id && (
                    <div className="absolute right-14 top-12 w-56 bg-white rounded-2xl shadow-xl shadow-gray-200 border border-gray-100 z-50 overflow-hidden transform origin-top-right animate-in fade-in zoom-in-95 duration-200 p-2">
                      <button
                        onClick={() => onEdit(res)}
                        className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-3 transition-colors font-medium group/btn"
                      >
                        <div className="p-2 bg-gray-50 rounded-lg text-gray-500 group-hover/btn:text-black group-hover/btn:bg-white transition-colors">
                          <Edit className="h-4 w-4" />
                        </div>
                        Tahrirlash
                      </button>
                      <button
                        onClick={() => onDeleteRequest(res.id, res.name)}
                        className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-3 transition-colors font-medium group/btn mt-1"
                      >
                        <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover/btn:bg-white transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </div>
                        O&apos;chirish
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
  );
};

