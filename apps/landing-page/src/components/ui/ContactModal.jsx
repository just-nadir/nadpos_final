import React, { useState } from 'react';
import { X, Phone, Send, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';

export function ContactModal({ isOpen, onClose }) {
    const [formState, setFormState] = useState('idle'); // idle, submitting, success

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormState('submitting');

        try {
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('name'),
                phone: formData.get('phone')
            };

            // Production: same origin (nadpos.uz). Dev: VITE_API_URL yoki localhost
            const apiUrl = import.meta.env.VITE_API_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');
            const base = apiUrl ? `${apiUrl.replace(/\/$/, '')}` : '';
            const response = await fetch(`${base}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json().catch(() => ({}));
            if (response.ok && result.ok) {
                setFormState('success');
            } else if (response.ok && !result.ok) {
                alert("So'rov qabul qilindi, lekin xabar yuborilmadi. Iltimos keyinroq qayta urinib ko'ring yoki Telegram/telefon orqali bog'laning.");
                setFormState('idle');
            } else {
                alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
                setFormState('idle');
            }
        } catch (error) {
            console.error('Error:', error);
            alert("So'rov yuborib bo'lmadi. Internet aloqangizni tekshiring yoki keyinroq qayta urinib ko'ring.");
            setFormState('idle');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Biz bilan bog'laning</h2>
                    <p className="text-gray-400 mb-8">Savollaringiz bormi? Mutaxassislarimiz yordam berishga tayyor.</p>

                    {/* Direct Contact Options */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <a
                            href="https://t.me/nadir13"
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-background border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Send className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-blue-400">Telegram</span>
                        </a>

                        <a
                            href="https://wa.me/998942332112"
                            target="_blank"
                            rel="noreferrer"
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-background border border-white/5 hover:border-green-500/50 hover:bg-green-500/10 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="text-sm font-medium text-gray-300 group-hover:text-green-400">WhatsApp</span>
                        </a>

                        <button
                            onClick={(e) => {
                                navigator.clipboard.writeText('+998942332112');
                                const btn = e.currentTarget;
                                const textSpan = btn.querySelector('.phone-text');
                                if (textSpan) {
                                    textSpan.innerText = 'Nusxalandi!';
                                    btn.classList.add('border-purple-500', 'bg-purple-500/10');
                                    setTimeout(() => {
                                        textSpan.innerText = '+998 94 233 21 12';
                                        btn.classList.remove('border-purple-500', 'bg-purple-500/10');
                                        window.location.href = 'tel:+998942332112';
                                    }, 1000);
                                }
                            }}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-background border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group cursor-pointer w-full"
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Phone className="w-5 h-5 text-purple-500" />
                            </div>
                            <span className="phone-text text-xs font-medium text-gray-300 group-hover:text-purple-400 whitespace-nowrap">+998 94 233 21 12</span>
                        </button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-surface text-gray-500">Yoki so'rov qoldiring</span>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="mt-8">
                        {formState === 'success' ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in slide-in-from-bottom-4">
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">So'rovingiz qabul qilindi!</h3>
                                <p className="text-gray-400">Tez orada operatorlarimiz siz bilan bog'lanishadi.</p>
                                <Button className="mt-6" variant="outline" onClick={onClose}>Yopish</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Ismingiz</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        placeholder="Ism Familiya"
                                        className="w-full px-4 py-3 rounded-lg bg-background border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Telefon raqamingiz</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        placeholder="+998 90 123 45 67"
                                        className="w-full px-4 py-3 rounded-lg bg-background border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-primary hover:bg-primary-dark" disabled={formState === 'submitting'}>
                                    {formState === 'submitting' ? 'Yuborilmoqda...' : 'Yuborish'}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
