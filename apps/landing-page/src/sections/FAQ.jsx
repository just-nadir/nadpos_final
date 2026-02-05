import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        question: "Tizim oflayn rejimda ishlaydimi?",
        answer: "Ha, albatta. NadPOS internet yo'q paytda ham to'liq ishlaydi. Internet paydo bo'lganda ma'lumotlar avtomatik sinxronlanadi."
    },
    {
        question: "Qanday uskunalardan foydalanishim mumkin?",
        answer: "Siz istalgan Windows kompyuteri, noutbuk yoki sensorli monoblokdan foydalanishigiz mumkin. Ofitsiantlar uchun har qanday Android telefon mos keladi."
    },
    {
        question: "O'rnatish qiyinmi?",
        answer: "Yo'q, mutaxassislarimiz tashrif buyurib yoki masofadan turib 1 soat ichida tizimni to'liq o'rnatib berishadi."
    },
    {
        question: "To'lov qanday amalga oshiriladi?",
        answer: "Siz oylik to'lov asosida yoki yillik chegirma bilan to'lashingiz mumkin. Boshlanishiga 14 kun bepul sinov muddati mavjud."
    },
    {
        question: "Mening ma'lumotlarim xavfsizligi ta'minlanganmi?",
        answer: "Ha, barcha ma'lumotlar shifrlangan xolda eng zamonaviy serverlarda saqlanadi. Har kuni avtomatik zaxira nusxalari olinadi."
    }
];

export function FAQ() {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <section className="py-24 bg-surface/30">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4">
                        <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ko'p so'raladigan savollar</h2>
                    <p className="text-gray-400 text-lg">
                        Tizim haqida barcha savollaringizga javoblar
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`rounded-2xl border transition-colors ${openIndex === index ? 'bg-surface border-primary/50' : 'bg-background border-white/5 hover:border-white/10'}`}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left"
                            >
                                <span className={`text-lg font-medium ${openIndex === index ? 'text-white' : 'text-gray-300'}`}>
                                    {faq.question}
                                </span>
                                {openIndex === index ? (
                                    <ChevronUp className="w-5 h-5 text-primary" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-gray-500" />
                                )}
                            </button>
                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/5 mt-2">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
