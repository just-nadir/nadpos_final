import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Menu, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Navbar({ onContactClick }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            isScrolled ? "bg-background/80 backdrop-blur-md border-b border-white/10 py-4" : "bg-transparent py-6"
        )}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <a href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="text-xl font-bold text-white">N</span>
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        NadPOS
                    </span>
                </a>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Imkoniyatlar</a>
                    <a href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Afzalliklar</a>
                    <a href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Tariflar</a>
                </div>

                {/* CTA */}
                <div className="hidden md:flex items-center gap-4">
                    <Button variant="ghost" size="sm" className="hover:scale-105 hover:bg-white/10 transition-all duration-300" onClick={() => window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173/admin/'}>Kirish</Button>
                    <Button className="hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40" onClick={onContactClick}>Bog'lanish</Button>
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-white/5 p-4 flex flex-col gap-4 shadow-2xl">
                    <a href="#features" className="text-base font-medium text-gray-300 hover:text-white py-2" onClick={() => setIsMobileMenuOpen(false)}>Imkoniyatlar</a>
                    <a href="#how-it-works" className="text-base font-medium text-gray-300 hover:text-white py-2" onClick={() => setIsMobileMenuOpen(false)}>Afzalliklar</a>
                    <a href="#pricing" className="text-base font-medium text-gray-300 hover:text-white py-2" onClick={() => setIsMobileMenuOpen(false)}>Tariflar</a>
                    <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
                        <Button variant="ghost" className="w-full justify-start">Kirish</Button>
                        <Button className="w-full" onClick={onContactClick}>Bog'lanish</Button>
                    </div>
                </div>
            )}
        </nav>
    );
}
