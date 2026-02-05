import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';



const plans = [
    {
        name: "Demo",
        price: { monthly: "Bepul", yearly: "Bepul" },
        period: { monthly: "14 kun", yearly: "14 kun" },
        description: "Tizim imkoniyatlarini tanishish uchun ideal.",
        features: ["1 ta Kassa", "Cheksiz ofitsiantlar", "Ombor hisobi", "Lokal tarmoq"],
        cta: "Bog'lanish",
        popular: false
    },
    {
        name: "Standard",
        price: { monthly: "300,000", yearly: "250,000", yearlyOriginal: "300,000" },
        period: { monthly: "oyiga", yearly: "oyiga" },
        yearlyTotal: "Yillik to'lov: 3,000,000 so'm",
        description: "Kichik va o'rta restoranlar uchun to'liq yechim.",
        features: ["Barcha Demo imkoniyatlari", "Bulutli arxiv", "Mobil ilova", "24/7 Support"],
        cta: "Bog'lanish",
        popular: true,
        yearlyBonus: "17% Tejang!"
    },
    {
        name: "Premium",
        price: { monthly: "500,000", yearly: "5,000,000", yearlyOriginal: "6,000,000" },
        period: { monthly: "oyiga", yearly: "yiliga" },
        monthlyEquivalent: "417,000 so'm / oyiga",
        description: "Yirik tarmoqlar va franchayzalar uchun.",
        features: ["Barcha Standard imkoniyatlari", "Alohida Server (VPS)", "Brending (White Label)", "API Integratsiyasi", "Shaxsiy menejer"],
        cta: "Bog'lanish",
        popular: false,
        yearlyBonus: "17% Tejang!"
    }
];

export function Pricing({ onContactClick }) {
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'

    return (
        <section id="pricing" className="py-24">
            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold text-white mb-6"
                    >
                        Oddiy va hamyonbop narxlar
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-gray-400 text-lg mb-8"
                    >
                        Yashirin to'lovlar yo'q. Istalgan vaqtda bekor qilishingiz mumkin.
                    </motion.p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4">
                        <span className={`text-sm font-medium transition-colors ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Oylik</span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-14 h-8 rounded-full bg-surface border border-white/10 relative transition-colors hover:border-primary/50"
                        >
                            <div className={`absolute top-1 w-6 h-6 rounded-full bg-primary transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-7'}`} />
                        </button>
                        <span className={`text-sm font-medium transition-colors ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
                            Yillik <span className="text-primary text-xs ml-1 bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">17% arzonroq</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`relative p-8 rounded-2xl border flex flex-col ${plan.popular ? 'bg-surface border-primary shadow-2xl shadow-primary/20 scale-105 z-10' : 'bg-background border-white/10 hover:border-white/20'}`}
                        >
                            {plan.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Eng ommabop
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                                <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

                                {/* Yearly view specifics */}
                                {billingCycle === 'yearly' && plan.price.yearlyOriginal && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-gray-500 line-through Decoration-rose-500 decoration-2">{plan.price.yearlyOriginal}</span>
                                        <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">{plan.yearlyBonus}</span>
                                    </div>
                                )}

                                <div className="flex items-end gap-1 mb-1">
                                    <span key={billingCycle} className="text-4xl font-bold text-white animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {plan.price[billingCycle]}
                                    </span>
                                    <span className="text-gray-500 mb-1">
                                        {plan.period[billingCycle] ? `so'm / ${plan.period[billingCycle]}` : ''}
                                    </span>
                                </div>

                                {/* Yearly Monthly Equivalent */}
                                {billingCycle === 'yearly' && plan.monthlyEquivalent && (
                                    <p className="text-sm text-primary font-medium bg-primary/10 inline-block px-3 py-1 rounded-lg">
                                        {plan.monthlyEquivalent}
                                    </p>
                                )}

                                {/* Yearly Total Disclaimer */}
                                {billingCycle === 'yearly' && plan.yearlyTotal && (
                                    <p className="text-xs text-gray-400 font-medium mt-1">
                                        {plan.yearlyTotal}
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-gray-300 text-sm">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Button variant={plan.popular ? "default" : "outline"} className="w-full" onClick={onContactClick}>
                                {plan.cta}
                            </Button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
