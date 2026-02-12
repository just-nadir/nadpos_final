
import React, { useState } from 'react';
import { login } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { Lock, Phone } from 'lucide-react';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(phone, password);
            navigate('/dashboard');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { message?: string } }; code?: string };
            if (e?.code === 'ERR_NETWORK' || !e?.response) {
                setError('Serverga ulanib bo\'lmadi. Iltimos, backend (NestJS) ni ishga tushiring: terminalda "cd apps/backend" keyin "npm run start:dev" bajariling. Backend port 3000 da ishlashi kerak.');
            } else {
                setError(e.response?.data?.message || 'Kirishda xatolik yuz berdi!');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4 py-6 safe-area-inset-top safe-area-inset-bottom">
            <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-xl shadow-lg border border-slate-200">
                <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-800 mb-2">Restoran Admin</h2>
                <p className="text-center text-slate-500 mb-6 sm:mb-8 text-sm sm:text-base">Hisobotlarni ko&apos;rish uchun kiring</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon raqam</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            <input
                                type="tel"
                                inputMode="numeric"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-base touch-manipulation"
                                placeholder="+998"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 sm:py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all text-base touch-manipulation"
                                placeholder="********"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 sm:py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-70 touch-manipulation"
                    >
                        {loading ? 'Tekshirilmoqda...' : 'Kirish'}
                    </button>
                </form>
            </div>
        </div>
    );
}
