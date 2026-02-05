import React from 'react';
import { WifiOff, Smartphone, BarChart3, Cloud, Printer, Zap } from 'lucide-react';

const features = [
    {
        icon: <WifiOff className="w-6 h-6 text-primary" />,
        title: "Offline Rejim",
        description: "Internet yo'qolganda ham savdo to'xtamaydi. Ma'lumotlar lokal bazada saqlanadi va internet paydo bo'lganda sinxronlanadi."
    },
    {
        icon: <Smartphone className="w-6 h-6 text-secondary" />,
        title: "Mobil Ilova",
        description: "Ofitsiantlar uchun qulay mobil ilova. Buyurtmalarni stol oldidan turib to'g'ridan-to'g'ri oshxonaga yuboring."
    },
    {
        icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
        title: "Aniq Hisobotlar",
        description: "Sotuvlar, foyda, va ombor qoldiqlarini real vaqt rejimida kuzatib boring. Biznesingizni raqamlar bilan boshqaring."
    },
    {
        icon: <Cloud className="w-6 h-6 text-cyan-500" />,
        title: "Bulutli Tizim",
        description: "Dunyoning istalgan nuqtasidan turib restoraningizni boshqaring. Barcha ma'lumotlar xavfsiz bulutda saqlanadi."
    },
    {
        icon: <Printer className="w-6 h-6 text-purple-500" />,
        title: "Cheklar va Printerlar",
        description: "Termal printerlar bilan mukammal integratsiya. Oshxona va bar uchun alohida cheklar chiqaring."
    },
    {
        icon: <Zap className="w-6 h-6 text-yellow-500" />,
        title: "Tezkor Kassa",
        description: "Kassir uchun optimallashtirilgan interfeys. Buyurtmalarni soniyalar ichida yoping."
    }
];

import { motion } from 'framer-motion';

// ... inside component ...
export function Features() {
    return (
        <section id="features" className="py-24 bg-surface/30">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold text-white mb-6"
                    >
                        Barcha kerakli vositalar bitta tizimda
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-gray-400 text-lg"
                    >
                        NadPOS restoraningizning har bir jarayonini avtomatlashtirish uchun ishlab chiqilgan.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="p-8 rounded-2xl bg-surface border border-white/5 hover:border-primary/50 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
