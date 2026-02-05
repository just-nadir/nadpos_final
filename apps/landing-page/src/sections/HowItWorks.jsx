import React from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const steps = [
    {
        number: "01",
        title: "Biz bilan bog'laning",
        description: "Telefon qiling yoki so'rov qoldiring. Biz sizning restoran ehtiyojlaringizni o'rganib chiqamiz."
    },
    {
        number: "02",
        title: "Tezkor O'rnatish",
        description: "Mutaxassislarimiz tizimni to'liq sozlab, menyularingizni kiritib berishadi."
    },
    {
        number: "03",
        title: "Sotuvni Boshlang",
        description: "Xodimlaringizga tizimdan foydalanish o'rgatiladi va siz darhol savdoni boshlashingiz mumkin."
    }
];

import { motion } from 'framer-motion';

// ... inside component ...
export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    {/* Left Content */}
                    <div className="flex-1">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="text-3xl md:text-5xl font-bold text-white mb-6"
                        >
                            Ishni boshlash juda oson
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-gray-400 text-lg mb-8"
                        >
                            Murakkab o'rnatish jarayonlarisiz, sanoqli daqiqalar ichida tizimni ishga tushiring.
                        </motion.p>

                        <div className="space-y-8">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                                    className="flex gap-6 group"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-surface border border-white/10 flex items-center justify-center font-bold text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        {step.number}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                                        <p className="text-gray-400">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right Image/Visual */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="flex-1 relative"
                    >
                        <div className="relative z-10 rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-sm p-8 shadow-2xl">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Ro'yxatdan o'tildi</p>
                                        <p className="text-xs text-gray-500">10:42 AM</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Menyu yuklandi</p>
                                        <p className="text-xs text-gray-500">10:45 AM</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-background/50 border border-white/5">
                                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Birinchi buyurtma</p>
                                        <p className="text-xs text-gray-500">11:00 AM</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative elements behind */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary/30 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/30 rounded-full blur-2xl" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
