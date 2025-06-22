// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import AdminPanel from './components/AdminPanel';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="pb-12">
              <Routes>
                <Route path="/" element={<PostList />} />
                <Route path="/post/:id" element={<PostDetail />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />
                {/* Catch-all route for 404 pages */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            
            <footer className="bg-white border-t border-gray-200">
              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center">
                  <p className="text-gray-600">
                    © 2025 Qalam. Built and Managed by Junaid Ali.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
