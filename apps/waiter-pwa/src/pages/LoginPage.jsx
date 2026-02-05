import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Delete, Loader2, CheckCircle2 } from 'lucide-react';
import { login } from '../services/api';
import { saveUser } from '../utils/storage';

const NumpadButton = ({ children, onClick, disabled, variant = 'default' }) => {
    const baseStyles = "flex items-center justify-center h-[72px] rounded-[24px] text-3xl font-bold transition-all duration-150 select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none outline-none";
    const variants = {
        default: "bg-slate-800/80 border border-slate-700/50 text-white hover:bg-slate-800",
        primary: "bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white hover:bg-indigo-500",
        ghost: "text-slate-500 hover:text-white hover:bg-white/5"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variants[variant]}`}
        >
            {children}
        </button>
    );
};

export default function LoginPage() {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [success, setSuccess] = useState(false);

    const handlePinInput = useCallback((digit) => {
        if (pin.length < 6) {
            const newPin = pin + digit;
            setPin(newPin);
            setError('');

            if (newPin.length === 4 || newPin.length === 6) {
                handleLogin(newPin);
            }
        }
    }, [pin]);

    const handleDelete = useCallback(() => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    }, []);

    const handleLogin = async (pinCode) => {
        setLoading(true);
        setError('');

        try {
            const user = await login(pinCode);
            saveUser(user);
            setSuccess(true);
            setTimeout(() => {
                navigate('/tables', { replace: true });
            }, 800);
        } catch (err) {
            setError(err.message || "Noto'g'ri PIN kod");
            setPin('');
            setShake(true);
            setTimeout(() => setShake(false), 500);
            setLoading(false);
        }
    };

    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-[#020617]">

            {/* Subtle Textured Background */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

            {/* Minimalist Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Content */}
            <div className="w-full max-w-xs relative z-10 flex flex-col items-center">

                {/* Logo Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-center mb-12"
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-500/10">
                        <User size={36} strokeWidth={2} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-2">NadPOS</h1>
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></span>
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Tizimga kirish</span>
                    </div>
                </motion.div>

                {/* PIN Display */}
                <motion.div
                    className={`mb-12 w-full ${shake ? 'animate-shake' : ''}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex gap-6 justify-center mb-6 h-4">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                animate={{
                                    scale: pin.length > i ? 1 : 1,
                                    backgroundColor: pin.length > i ? '#6366f1' : '#1e293b',
                                }}
                                className="w-3 h-3 rounded-full transition-colors duration-200"
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="text-center text-red-400 text-sm font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Numpad */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="grid grid-cols-3 gap-4 w-full"
                >
                    {digits.map((digit, index) => {
                        if (digit === '') return <div key={index} />;

                        if (digit === 'del') {
                            return (
                                <NumpadButton
                                    key={index}
                                    variant="ghost"
                                    onClick={handleDelete}
                                    disabled={loading || pin.length === 0}
                                >
                                    <Delete size={28} strokeWidth={1.5} />
                                </NumpadButton>
                            );
                        }

                        return (
                            <NumpadButton
                                key={index}
                                onClick={() => handlePinInput(digit)}
                                disabled={loading}
                            >
                                {digit}
                            </NumpadButton>
                        );
                    })}
                </motion.div>
            </div>

            {/* Loading/Success Overlay */}
            <AnimatePresence>
                {(loading || success) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center"
                        >
                            {success ? (
                                <>
                                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 text-emerald-500">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <p className="text-white text-lg font-semibold">Xush kelibsiz!</p>
                                </>
                            ) : (
                                <>
                                    <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
                                    <p className="text-slate-400 font-medium">Tekshirilmoqda...</p>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Version Info */}
            <div className="absolute bottom-6 text-slate-700 text-xs font-bold tracking-widest opacity-50">
                V2.0.0
            </div>
        </div>
    );
}
