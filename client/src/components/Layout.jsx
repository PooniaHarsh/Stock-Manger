import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineViewGrid, HiOutlineCube,
    HiOutlineCash, HiOutlineChartBar, HiOutlineCog, HiOutlineLogout,
    HiOutlineMenu, HiOutlineX
} from 'react-icons/hi';

/**
 * Navigation items configuration.
 */
const navItems = [
    { path: '/', label: 'Dashboard', icon: HiOutlineViewGrid },
    { path: '/stock', label: 'Stock', icon: HiOutlineCube },
    { path: '/sales', label: 'Sales', icon: HiOutlineCash },
    { path: '/reports', label: 'Reports', icon: HiOutlineChartBar },
    { path: '/settings', label: 'Settings', icon: HiOutlineCog },
];

/**
 * Layout — wraps all authenticated pages with a sidebar and top navbar.
 * Responsive: sidebar collapses to a hamburger menu on mobile.
 */
const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const location = useLocation();

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* ===== Mobile Overlay ===== */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ===== Sidebar ===== */}
            <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-100
        transform transition-transform duration-300 ease-out flex flex-col
        ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none
      `}>
                {/* Logo / Brand */}
                <div className="h-16 flex items-center px-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="Punjab Trading Co." className="w-10 h-10 rounded-lg object-contain" />
                        <span className="text-sm font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent leading-tight">
                            Punjab Trading Co.<br /><span className="text-xs font-semibold text-gray-700">(PARVEEN KUMAR)</span><br /><span className="text-[10px] font-semibold text-gray-500">Plywood & Laminates</span>
                        </span>
                    </div>
                    {/* Close button (mobile) */}
                    <button
                        className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-gray-100"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <HiOutlineX className="text-xl text-gray-500" />
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="p-4 flex flex-col gap-1.5 flex-1 overflow-y-auto">
                    {navItems.map(({ path, label, icon: Icon }) => {
                        const isActive = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={() => setSidebarOpen(false)}
                                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200'
                                        : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
                                    }
                `}
                            >
                                <Icon className="text-lg flex-shrink-0" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User / Logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold uppercase">
                                {user?.username?.charAt(0) || 'A'}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-700">{user?.username || 'Admin'}</p>
                            <p className="text-xs text-gray-400">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium
                       text-red-500 hover:bg-red-50 transition-all duration-200"
                    >
                        <HiOutlineLogout className="text-lg" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* ===== Main Content ===== */}
            <div className="flex-1 flex flex-col h-screen lg:ml-64 overflow-hidden">
                {/* Top Navbar */}
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-4 md:px-6 sticky top-0 z-30">
                    <button
                        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 mr-3"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <HiOutlineMenu className="text-xl text-gray-600" />
                    </button>
                    <h1 className="text-lg font-semibold text-surface-800">
                        {navItems.find(item => item.path === location.pathname)?.label || 'Inventory Manager'}
                    </h1>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
