import React from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
    {
        name: "Sardor Baxodirovich",
        role: "Boshqaruvchi",
        restaurant: "Ugalok Kafe",
        content: "NadPOS bizning ishimizni 2 barobar tezlashtirdi. Ofitsiantlar buyurtmani telefondan olishi juda qulay. Hisobotlar esa har doim qo'l ostimda.",
        rating: 5
    },
    {
        name: "Ramil Valiyev",
        role: "Administrator",
        restaurant: "8-Mo'jiza restorani",
        content: "Kichik qahvaxona uchun ideal yechim. Internet o'chib qolganda ham ishlashi biz uchun juda muhim edi. Texnik yordam xizmati a'lo darajada.",
        rating: 5
    },
    {
        name: "Afzalbek",
        role: "Tadbirkor",
        restaurant: "Vodiy Taomlari kafesi",
        content: "Tarmoqli restoranlar uchun eng yaxshi tanlov. Barcha filiallarni bitta joydan boshqaraman. Narx va sifat mutanosibligi zo'r.",
        rating: 5
    }
];

export function Testimonials() {
    return (
        <section className="py-24 relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 -z-10" />

            <div className="container mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Mijozlarimiz fikri</h2>
                    <p className="text-gray-400 text-lg">
                        Yuzlab restoranlar NadPOS ni tanladi. Siz ham ular safida bo'ling.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((item, index) => (
                        <div key={index} className="bg-surface/50 backdrop-blur border border-white/5 p-8 rounded-2xl relative hover:-translate-y-2 transition-transform duration-300">
                            <Quote className="absolute top-8 right-8 w-8 h-8 text-primary/20" />

                            <div className="flex gap-1 mb-6">
                                {[...Array(item.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                                ))}
                            </div>

                            <p className="text-gray-300 mb-8 leading-relaxed">
                                "{item.content}"
                            </p>

                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                                    {item.name[0]}
                                </div>
                                <div>
                                    <h4 className="text-white font-bold">{item.name}</h4>
                                    <p className="text-sm text-gray-500">{item.role}, {item.restaurant}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
