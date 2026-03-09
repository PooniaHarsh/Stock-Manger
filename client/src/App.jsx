import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import AddStock from './pages/AddStock';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

/**
 * AppRoutes — defines all application routes.
 * Protected routes are wrapped in Layout + ProtectedRoute.
 */
const AppRoutes = () => {
    const { isAuthenticated } = useAuth();

    return (
        <Routes>
            {/* Public Route */}
            <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
            />

            {/* Protected Routes — all wrapped in Layout */}
            <Route path="/" element={
                <ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>
            } />
            <Route path="/stock" element={
                <ProtectedRoute><Layout><Stock /></Layout></ProtectedRoute>
            } />
            <Route path="/stock/add" element={
                <ProtectedRoute><Layout><AddStock /></Layout></ProtectedRoute>
            } />
            <Route path="/stock/edit/:id" element={
                <ProtectedRoute><Layout><AddStock /></Layout></ProtectedRoute>
            } />
            <Route path="/sales" element={
                <ProtectedRoute><Layout><Sales /></Layout></ProtectedRoute>
            } />
            <Route path="/reports" element={
                <ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>
            } />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

/**
 * App — root component with AuthProvider and Router.
 */
const App = () => {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
};

export default App;
