import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { HiOutlineCube, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';

/**
 * Login page — supports both login and first-time registration.
 * If no admin exists, shows a "Register" button; otherwise "Login".
 */
const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const { data } = await API.post(endpoint, { username, password });
            login(data.token, data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 p-4">
            <div className="w-full max-w-md animate-fade-in">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-xl shadow-primary-200 mb-4">
                        <HiOutlineCube className="text-white text-3xl" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                        Inventory Manager
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        {isRegister ? 'Create your admin account' : 'Sign in to your account'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="card shadow-xl shadow-gray-200/50">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {/* Error message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl animate-fade-in">
                                {error}
                            </div>
                        )}

                        {/* Username */}
                        <div>
                            <label className="label" htmlFor="username">Username</label>
                            <div className="relative">
                                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="username"
                                    type="text"
                                    className="input-field pl-10"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="label" htmlFor="password">Password</label>
                            <div className="relative">
                                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="password"
                                    type="password"
                                    className="input-field pl-10"
                                    placeholder="Enter password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={4}
                                />
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            className="btn-primary w-full py-3 text-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                    Please wait...
                                </span>
                            ) : (
                                isRegister ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Toggle between login and register */}
                    <div className="mt-5 text-center">
                        <button
                            className="text-sm text-primary-500 hover:text-primary-700 font-medium"
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
                        >
                            {isRegister ? 'Already have an account? Sign In' : 'First time? Create Admin Account'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
