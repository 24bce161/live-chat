import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Same rules as the server (server/src/middleware/validate.js)
const USERNAME_PATTERN = '[A-Za-z0-9_.]{3,30}';
const MIN_PASSWORD_LENGTH = 6;

// 0 = too short, 1 = weak ... 4 = strong. Only a hint — any password of 6+ characters is accepted.
const getPasswordStrength = (pass) => {
  if (pass.length < MIN_PASSWORD_LENGTH) return 0;
  let score = 1;
  if (pass.length >= 10) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
  return score;
};

const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'];
const strengthWidths = ['w-1/12', 'w-1/4', 'w-2/4', 'w-3/4', 'w-full'];

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signup(name.trim(), email, password);
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
            <label htmlFor="signup-username" className="block text-sm font-medium mb-1 ml-1">Username</label>
            <input
              id="signup-username"
              type="text"
              required
              pattern={USERNAME_PATTERN}
              title="3–30 characters: letters, numbers, _ or ."
              autoComplete="username"
              className="input"
              placeholder="johndoe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="text-xs text-muted mt-1 ml-1">3–30 letters, numbers, _ or . (no spaces). You'll use it to log in.</p>
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium mb-1 ml-1">Email</label>
            <input
              id="signup-email"
              type="email"
              required
              autoComplete="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium mb-1 ml-1">Password</label>
            <input
              id="signup-password"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password ? (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                  <div className={`h-full ${strengthColors[strength]} ${strengthWidths[strength]} transition-all duration-300`}></div>
                </div>
                <span className="text-xs text-secondary w-16 text-right">{strengthLabels[strength]}</span>
              </div>
            ) : (
              <p className="text-xs text-muted mt-1 ml-1">At least {MIN_PASSWORD_LENGTH} characters.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !name || !email || password.length < MIN_PASSWORD_LENGTH}
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
