
import React, { useState, useEffect } from 'react';
import { Lock, User, WifiOff } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { APP_INFO } from '../config/appConfig';
import { API_URL } from '../config/api';
import axios from 'axios';

const Login = () => {
    const { login } = useGlobal();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [machineId, setMachineId] = useState(null);

    useEffect(() => {
        const fetchMachineId = async () => {
            if (window.electron) {
                try {
                    const id = await window.electron.ipcRenderer.invoke('get-machine-id');
                    setMachineId(id);
                } catch (e) {
                    console.error("Machine ID error", e);
                }
            }
        };
        fetchMachineId();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (!machineId) throw new Error("Machine ID aniqlanmadi!");

            // 1. Online Login (Try first)
            const res = await axios.post(`${API_URL}/auth/login`, {
                username: phone, // Phone orqali kiriladi
                password: password,
                machineId: machineId
            });

            if (res.data.access_token) {
                const userData = res.data.user;
                login(userData, res.data.access_token);
                // Restoran ID ni mahalliy sozlamalarga yozish (litsenziya tekshiruvi va boshqa funksiyalar uchun)
                if (window.electron?.ipcRenderer && userData?.id) {
                    window.electron.ipcRenderer.invoke('get-settings').then((current) => {
                        return window.electron.ipcRenderer.invoke('save-settings', { ...current, restaurant_id: userData.id });
                    }).catch((e) => console.warn('Restaurant ID saqlash:', e));
                }
            }

        } catch (err) {
            console.error("Login Error:", err);
            // 2. Offline Login Logic (Agar internet bo'lmasa)
            // Hozircha faqat local storage check qilamiz, aslida offline token validatsiyasi bo'lishi kerak.
            // User avval bir marta kirgan bo'lishi kerak.

            setError(err.response?.data?.message || "Serverga ulanib bo'lmadi yoki parol xato!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Tizimga kirish</h1>
                    <p className="text-gray-500 text-sm">Restoran hisobiga kiring</p>
                    {machineId && <p className="text-xs text-gray-400 mt-2 font-mono">ID: {machineId}</p>}
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="+998"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parol</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="********"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !machineId}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Tekshirilmoqda...' : 'Kirish'}
                    </button>
                </form>

                <div className="text-center text-gray-400 text-xs font-medium">
                    <p>Powered by {APP_INFO.creator}</p>
                    <p>{APP_INFO.name} {APP_INFO.version}</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
