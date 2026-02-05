import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

const UpdateNotification = () => {
    const [status, setStatus] = useState('idle'); // idle, downloading, ready, error
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Check if electron api is available
        if (!window.api) return;

        // Listen for update available
        window.api.onUpdateAvailable(() => {
            setStatus('downloading');
        });

        // Listen for download progress
        window.api.onUpdateProgress((prog) => {
            setProgress(Math.round(prog));
        });

        // Listen for update downloaded
        window.api.onUpdateDownloaded(() => {
            setStatus('ready');
        });

    }, []);

    const handleRestart = () => {
        if (window.api) {
            window.api.triggerRestart();
        }
    };

    if (status === 'idle') return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-xl shadow-2xl border border-gray-100 z-[9999] w-80 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">
                    {status === 'downloading' ? 'Yuklanmoqda...' : 'Yangilanish tayyor'}
                </h3>
                <button onClick={() => setStatus('idle')} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>

            {status === 'downloading' && (
                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Yangi versiya yuklanmoqda</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {status === 'ready' && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Yangi versiya muvaffaqiyatli yuklandi. O'rnatish uchun dasturni qayta ishga tushiring.
                    </p>
                    <button
                        onClick={handleRestart}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    >
                        <RefreshCw size={16} />
                        Yangi versiya mavjud. O'rnatish uchun bosing
                    </button>
                </div>
            )}
        </div>
    );
};

export default UpdateNotification;
