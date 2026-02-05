import React from 'react';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Play, Headset, Zap, Users } from 'lucide-react';


export function Hero({ onContactClick }) {
    return (
        <section className="relative pt-32 pb-20 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/10 rounded-full blur-[100px] -z-10" />

            <div className="container mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-sm">
                        <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                        <span className="text-sm text-gray-300 font-medium">NadPOS 2.0: Yangi imkoniyatlar</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                        Restoraningizni <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">aqlli boshqaring</span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                        Ofitsiantlar, oshxona va kassa o'rtasida uzluksiz aloqa.
                        Internet bo'lmasa ham ishlovchi zamonaviy bulutli tizim.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="w-full sm:w-auto gap-2" onClick={onContactClick}>
                            <Headset className="w-5 h-5" />
                            Bepul Konsultatsiya
                        </Button>
                        <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                            <Play className="w-5 h-5" />
                            Videoni Ko'rish
                        </Button>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span>Tezkor o'rnatish</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Headset className="w-4 h-4 text-primary" />
                            <span>24/7 Texnik xizmat</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-green-500" />
                            <span>Mutaxassislar ko'magi</span>
                        </div>
                    </div>
                </motion.div>


            </div>
        </section>
    );
}
