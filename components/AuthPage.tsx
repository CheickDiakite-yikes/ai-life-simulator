import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ChevronDown } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  source: string | null;
  createdAt: string;
}

type AuthMode = 'login' | 'signup';

const SOURCE_OPTIONS = [
  "Search Engine (Google, Bing, etc.)",
  "Social Media (Twitter, Facebook, etc.)",
  "Friend or Family Recommendation",
  "Reddit",
  "YouTube",
  "App Store / Play Store",
  "Blog or Article",
  "Other"
];

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [fullName, setFullName] = useState('');
  const [source, setSource] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login' 
        ? { email, password }
        : { email, password, passwordConfirmation, fullName, source: source || null };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onAuthSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setPassword('');
    setPasswordConfirmation('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif tracking-[0.3em] text-amber-500 mb-2">AETHERIA</h1>
          <p className="text-slate-400 text-sm tracking-wide">LIFE SIMULATOR</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-semibold text-white mb-6 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-slate-300 text-sm mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 text-sm mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a password (min 8 chars)' : 'Enter your password'}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-10 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                  minLength={mode === 'signup' ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-slate-300 text-sm mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 pl-10 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm mb-2">How did you find us?</label>
                  <div className="relative">
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full bg-slate-900/50 border border-slate-600 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                    >
                      <option value="">Select an option (optional)</option>
                      {SOURCE_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <span className="animate-pulse">Please wait...</span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-slate-400 hover:text-amber-500 transition-colors text-sm"
            >
              {mode === 'login' 
                ? "Don't have an account? Sign up" 
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
