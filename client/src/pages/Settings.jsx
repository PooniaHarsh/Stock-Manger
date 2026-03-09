import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    HiOutlineUser, HiOutlineBell,
    HiOutlineShieldCheck, HiOutlineInformationCircle, HiOutlinePencil,
    HiOutlineCheck, HiX
} from 'react-icons/hi';

/**
 * Settings — Profile view/edit, notification prefs,
 * security, and app info.
 */
const Settings = () => {
    const { user } = useAuth();

    // Profile edit state
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileName, setProfileName] = useState(user?.username || 'Admin');
    const [profileEmail, setProfileEmail] = useState(user?.email || '');
    const [profilePhone, setProfilePhone] = useState(user?.phone || '');
    const [savedMessage, setSavedMessage] = useState('');

    // Notification preference state
    const [lowStockAlert, setLowStockAlert] = useState(true);
    const [dailySummary, setDailySummary] = useState(false);

    const handleSaveProfile = () => {
        const profileData = { username: profileName, email: profileEmail, phone: profilePhone };
        localStorage.setItem('profileData', JSON.stringify(profileData));
        setEditingProfile(false);
        setSavedMessage('Profile saved successfully!');
        setTimeout(() => setSavedMessage(''), 3000);
    };

    // Load saved profile on mount
    useState(() => {
        const saved = localStorage.getItem('profileData');
        if (saved) {
            const data = JSON.parse(saved);
            setProfileName(data.username || profileName);
            setProfileEmail(data.email || '');
            setProfilePhone(data.phone || '');
        }
    });

    return (
        <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
            <h2 className="page-title">Settings</h2>

            {savedMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-medium flex items-center gap-2 animate-fade-in">
                    <HiOutlineCheck className="text-lg" />
                    {savedMessage}
                </div>
            )}

            {/* ===== PROFILE SECTION ===== */}
            <div className="card">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-surface-800 flex items-center gap-2">
                        <HiOutlineUser className="text-primary-500" />
                        Profile
                    </h3>
                    <button
                        onClick={() => setEditingProfile(!editingProfile)}
                        className="text-sm font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1 transition"
                    >
                        {editingProfile ? <><HiX className="text-base" /> Cancel</> : <><HiOutlinePencil className="text-base" /> Edit</>}
                    </button>
                </div>

                <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-200 shrink-0">
                        <span className="text-white text-2xl font-bold uppercase">
                            {profileName.charAt(0)}
                        </span>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div>
                            <label className="label">Name</label>
                            {editingProfile ? (
                                <input type="text" className="input-field" value={profileName} onChange={e => setProfileName(e.target.value)} />
                            ) : (
                                <p className="text-sm font-semibold text-surface-800">{profileName}</p>
                            )}
                        </div>
                        <div>
                            <label className="label">Email</label>
                            {editingProfile ? (
                                <input type="email" className="input-field" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} placeholder="you@example.com" />
                            ) : (
                                <p className="text-sm text-gray-500">{profileEmail || 'Not set'}</p>
                            )}
                        </div>
                        <div>
                            <label className="label">Phone</label>
                            {editingProfile ? (
                                <input type="tel" className="input-field" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+91 98765 43210" />
                            ) : (
                                <p className="text-sm text-gray-500">{profilePhone || 'Not set'}</p>
                            )}
                        </div>

                        {editingProfile && (
                            <button onClick={handleSaveProfile} className="btn-primary text-sm flex items-center gap-2">
                                <HiOutlineCheck className="text-lg" />
                                Save Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== NOTIFICATIONS ===== */}
            <div className="card">
                <h3 className="text-lg font-bold text-surface-800 flex items-center gap-2 mb-5">
                    <HiOutlineBell className="text-amber-500" />
                    Notifications
                </h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-surface-800">Low Stock Alerts</p>
                            <p className="text-xs text-gray-500">Get notified when stock falls below 5 items</p>
                        </div>
                        <button
                            onClick={() => setLowStockAlert(!lowStockAlert)}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${lowStockAlert ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${lowStockAlert ? 'translate-x-7' : 'translate-x-0.5'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                        <div>
                            <p className="text-sm font-semibold text-surface-800">Daily Summary</p>
                            <p className="text-xs text-gray-500">Receive a daily sales summary overview</p>
                        </div>
                        <button
                            onClick={() => setDailySummary(!dailySummary)}
                            className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${dailySummary ? 'bg-emerald-500' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${dailySummary ? 'translate-x-7' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== SECURITY ===== */}
            <div className="card">
                <h3 className="text-lg font-bold text-surface-800 flex items-center gap-2 mb-5">
                    <HiOutlineShieldCheck className="text-emerald-500" />
                    Security
                </h3>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-surface-800">Password</p>
                            <p className="text-xs text-gray-500">Last changed: unknown</p>
                        </div>
                        <button className="text-sm font-medium text-primary-500 hover:text-primary-600 transition">
                            Change
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== APP INFO ===== */}
            <div className="card">
                <h3 className="text-lg font-bold text-surface-800 flex items-center gap-2 mb-5">
                    <HiOutlineInformationCircle className="text-blue-500" />
                    About
                </h3>

                {/* Business Card */}
                <div className="mb-5 rounded-xl overflow-hidden shadow-md border border-gray-100">
                    <img src="/business-card.jpg" alt="Punjab Trading Co. Business Card" className="w-full object-contain" />
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-500">App Name</span>
                        <span className="font-semibold text-surface-800">Punjab Trading Co. Inventory</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-500">Version</span>
                        <span className="font-semibold text-surface-800">1.0.0</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                        <span className="text-gray-500">Business</span>
                        <span className="font-semibold text-surface-800">Plywood & Laminates</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
