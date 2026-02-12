import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, BarChart3, Menu, X } from 'lucide-react';
import { logout, getCurrentUser } from '../services/auth.service';
import { ErrorBoundary } from '../components/ErrorBoundary';
import clsx from 'clsx';

export default function DashboardLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = getCurrentUser();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setSidebarOpen(false);
    };

    const navItems = [
        { path: '/dashboard', label: 'Asosiy', icon: LayoutDashboard },
        { path: '/dashboard/reports', label: 'Hisobotlar', icon: BarChart3 },
    ];

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 safe-area-inset-top">
                <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 touch-manipulation"
                    aria-label="Menyuni ochish"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
                    {user?.name || 'Restoran Admin'}
                </span>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="p-2 -mr-2 rounded-lg text-red-600 hover:bg-red-50 touch-manipulation"
                    aria-label="Chiqish"
                >
                    <LogOut className="h-5 w-5" />
                </button>
            </header>

            {/* Backdrop (mobile) */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/40 z-40"
                    onClick={closeSidebar}
                    aria-hidden
                />
            )}

            {/* Sidebar: drawer on mobile, static on desktop */}
            <aside
                className={clsx(
                    'w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0',
                    'lg:static lg:z-0',
                    'fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                <div className="p-6 border-b border-slate-100 flex items-center justify-between lg:block">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">
                            {user?.name || 'Restoran Admin'}
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">Boshqaruv paneli</p>
                    </div>
                    <button
                        type="button"
                        onClick={closeSidebar}
                        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 touch-manipulation"
                        aria-label="Menyuni yopish"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={closeSidebar}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium touch-manipulation',
                                location.pathname === item.path
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            )}
                        >
                            <item.icon className="h-5 w-5 shrink-0" />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium touch-manipulation"
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span>Chiqish</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto min-h-0 pt-14 lg:pt-0 p-4 sm:p-6 lg:p-8">
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </main>
        </div>
    );
}
