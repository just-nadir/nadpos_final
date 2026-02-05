import React from 'react';

export function Footer({ onContactClick }) {
    const scrollToSection = (id) => (e) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="bg-surface border-t border-white/5 pt-16 pb-8">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-1">
                        <span className="text-2xl font-bold text-white mb-4 block">NadPOS</span>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Restoran va kafelar uchun zamonaviy avtomatlashtirish tizimi. Biznesingizni yangi bosqichga olib chiqing.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Mahsulot</h4>
                        <ul className="space-y-2">
                            <li><a href="#features" onClick={scrollToSection('features')} className="text-gray-400 hover:text-white text-sm transition-colors">Imkoniyatlar</a></li>
                            <li><a href="#how-it-works" onClick={scrollToSection('how-it-works')} className="text-gray-400 hover:text-white text-sm transition-colors">Qanday ishlaydi</a></li>
                            <li><a href="#pricing" onClick={scrollToSection('pricing')} className="text-gray-400 hover:text-white text-sm transition-colors">Tariflar</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Kompaniya</h4>
                        <ul className="space-y-2">
                            <li><button onClick={onContactClick} className="text-gray-400 hover:text-white text-sm transition-colors text-left">Bog'lanish</button></li>
                            <li><button onClick={onContactClick} className="text-gray-400 hover:text-white text-sm transition-colors text-left">Hamkorlik</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Yordam</h4>
                        <ul className="space-y-2">
                            <li><a href="#faq" onClick={scrollToSection('faq')} className="text-gray-400 hover:text-white text-sm transition-colors">FAQ</a></li>
                            <li><button onClick={onContactClick} className="text-gray-400 hover:text-white text-sm transition-colors text-left">Qo'llab-quvvatlash</button></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm">© 2026 NadPOS. Barcha huquqlar himoyalangan.</p>
                    <div className="flex items-center gap-6">
                        <a href="https://instagram.com/nadpos.uz" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary text-sm transition-colors">Instagram</a>
                        <a href="https://t.me/nadir13" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary text-sm transition-colors">Telegram</a>
                        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary text-sm transition-colors">Facebook</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
