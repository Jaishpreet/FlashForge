import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import HabitsPage from './components/Dashboard/HabitsPage';
import Analytics from './components/Dashboard/Analytics';
import Goals from './components/Dashboard/Goals';
import Settings from './components/Dashboard/Settings';  // ✅ ADD THIS IMPORT
import Navbar from './components/Common/Navbar';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading HabitFlow...</div>;
    }
    
    return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading HabitFlow...</div>;
    }
    
    return user ? <Navigate to="/" /> : children;
};

function AppContent() {
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/login" element={
                    <PublicRoute>
                        <Login />
                    </PublicRoute>
                } />
                <Route path="/signup" element={
                    <PublicRoute>
                        <Signup />
                    </PublicRoute>
                } />
                <Route path="/" element={
                    <PrivateRoute>
                        <HabitsPage />
                    </PrivateRoute>
                } />
                <Route path="/analytics" element={
                    <PrivateRoute>
                        <Analytics />
                    </PrivateRoute>
                } />
                <Route path="/goals" element={
                    <PrivateRoute>
                        <Goals />
                    </PrivateRoute>
                } />
                {/* ✅ ADD THIS SETTINGS ROUTE - Put it after Goals */}
                <Route path="/settings" element={
                    <PrivateRoute>
                        <Settings />
                    </PrivateRoute>
                } />
            </Routes>
            <Toaster position="top-right" />
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;