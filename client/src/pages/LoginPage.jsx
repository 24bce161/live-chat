import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      // Error handled by AuthContext via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-up">
        <div className="flex-center mb-8 flex-col">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)] flex-center text-white mb-4 shadow-lg shadow-indigo-500/30">
            <MessageCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)]">
            Welcome back
          </h2>
          <p className="text-secondary text-sm mt-2">Sign in to continue to LiveChat</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 ml-1">Username</label>
            <input 
              type="text" 
              required
              className="input" 
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 ml-1">Password</label>
            <input 
              type="password" 
              required
              className="input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || !username || !password}
            className="btn btn-primary w-full mt-6 py-3"
          >
            {isSubmitting ? <LoadingSpinner size={20} /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Don't have an account? <Link to="/signup" className="text-[var(--accent-solid)] font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
