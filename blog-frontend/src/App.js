// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import PostList from './components/PostList';
import PostDetail from './components/PostDetail';
import AdminPanel from './components/AdminPanel';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
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
            </Routes>
          </main>
          
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="text-center">
                <p className="text-gray-600">
                  © 2025 My Blog. Built with React and Node.js.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
