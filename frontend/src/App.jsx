import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import InputPage from './components/Dashboard/InputPage';
import MySets from './components/Dashboard/MySets';
import StudyMode from './components/Dashboard/StudyMode';
import Navbar from './components/Common/Navbar';
import { API_URL } from '../config';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading FlashForge...</div>;
    }
    
    return user ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading FlashForge...</div>;
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
                        <InputPage />
                    </PrivateRoute>
                } />
                <Route path="/sets" element={
                    <PrivateRoute>
                        <MySets />
                    </PrivateRoute>
                } />
                <Route path="/study/:id" element={
                    <PrivateRoute>
                        <StudyMode />
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