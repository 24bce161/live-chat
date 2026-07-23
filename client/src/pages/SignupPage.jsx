import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length > 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(score, 4);
  };

  const strength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];
  const strengthWidths = ['w-0', 'w-1/4', 'w-2/4', 'w-3/4', 'w-full'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      // Handled in auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-up">
        <div className="flex-center mb-6 flex-col">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-start)] to-[var(--accent-end)] flex-center text-white mb-4 shadow-[var(--shadow-glow)]">
            <MessageCircle size={28} />
          </div>
          <h2 className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-start)] to-[var(--accent-end)]">
            Create an Account
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 ml-1">Username</label>
            <input 
              type="text" 
              required
              className="input" 
              placeholder="johndoe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 ml-1">Email</label>
            <input 
              type="email" 
              required
              className="input" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {password && (
              <div className="mt-2 h-1 w-full bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${strengthColors[strength]} ${strengthWidths[strength]} transition-all duration-300`}
                ></div>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={isSubmitting || !name || !email || !password || strength < 1}
            className="btn btn-primary w-full mt-6 py-3"
          >
            {isSubmitting ? <LoadingSpinner size={20} /> : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Already have an account? <Link to="/login" className="text-[var(--accent-solid)] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
