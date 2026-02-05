import React, { useState } from 'react';
import axios from 'axios';
import { Settings, Key, Store } from 'lucide-react';

const Onboarding = ({ onComplete }) => {
    const [id, setId] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // TODO: Move base URL to config
            const CLOUD_URL = 'https://halboldi.uz/api';

            // 1. Verify with Cloud Server
            await axios.get(`${CLOUD_URL}/restaurants/${id}/verify`, {
                headers: { 'x-access-key': accessKey }
            });

            // 2. Save locally
            await window.electron.ipcRenderer.invoke('save-settings', {
                restaurant_id: id,
                access_key: accessKey
            });

            onComplete();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Tasdiqlashda xatolik: ID yoki Kalit noto\'g\'ri!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Store className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Tizimni Sozlash</h2>
                    <p className="text-gray-500 mt-2">Dasturni ishga tushirish uchun Restoran ma'lumotlarini kiriting.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Restaurant ID
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Store className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                value={id}
                                onChange={(e) => setId(e.target.value)}
                                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                placeholder="UUID"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Access Key
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Key className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                className="block w-full pl-10 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                                placeholder="Key"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
                    >
                        {loading ? 'Tekshirilmoqda...' : 'Tasdiqlash va Kirish'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Onboarding;
