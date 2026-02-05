import { useEffect, useState } from 'react';
import { Phone, Save, Loader2 } from 'lucide-react';
import { getConfig, updateConfig } from '../services/api';
import type { AppConfig } from '../services/api';

export default function SettingsPage() {
    const [config, setConfig] = useState<AppConfig>({ techSupportPhone: null });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await getConfig();
                setConfig(data);
            } catch (err) {
                console.error(err);
                setMessage({ type: 'error', text: 'Sozlamalarni yuklashda xatolik' });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await updateConfig({ techSupportPhone: config.techSupportPhone || '' });
            setMessage({ type: 'success', text: 'Saqlandi' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Saqlashda xatolik' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sozlamalar</h2>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-gray-500" />
                    Texnik qo‘llab-quvvatlash raqami
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    Bu raqam POS da litsenziya tugaganda ko‘rinadi. Restoran xodimlari shu raqam orqali siz bilan bog‘lanadi.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Telefon raqam</label>
                        <input
                            type="text"
                            value={config.techSupportPhone ?? ''}
                            onChange={(e) => setConfig({ ...config, techSupportPhone: e.target.value || null })}
                            placeholder="+998 90 123 45 67"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/10 focus:border-black outline-none transition-all"
                        />
                    </div>

                    {message && (
                        <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {message.text}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-70 transition-colors"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Saqlash
                    </button>
                </form>
            </div>
        </div>
    );
}
