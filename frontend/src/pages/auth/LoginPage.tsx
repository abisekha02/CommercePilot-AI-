import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Shield, User, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/');
    } catch {
      setError('Invalid username or password credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'admin' | 'manager' | 'warehouse' | 'customer') => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin(role);
      navigate(role === 'customer' ? '/' : '/erp');
    } catch {
      setError('Failed to log in with demo account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-200 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to CommercePilot</h2>
          <p className="text-xs text-slate-500 mt-1">Full-stack RBAC & AI-Integrated Platform</p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Instant Demo Evaluator Access:
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('admin')}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold p-2 rounded-xl border border-purple-200 text-left transition cursor-pointer"
            >
              👑 Administrator
              <span className="block text-[10px] text-purple-500 font-normal">Full ERP Access</span>
            </button>
            <button
              onClick={() => handleQuickDemo('manager')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold p-2 rounded-xl border border-blue-200 text-left transition cursor-pointer"
            >
              🏬 Store Manager
              <span className="block text-[10px] text-blue-500 font-normal">Catalog & Orders</span>
            </button>
            <button
              onClick={() => handleQuickDemo('warehouse')}
              className="bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold p-2 rounded-xl border border-amber-200 text-left transition cursor-pointer"
            >
              📦 Warehouse Staff
              <span className="block text-[10px] text-amber-500 font-normal">Stock & POs</span>
            </button>
            <button
              onClick={() => handleQuickDemo('customer')}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold p-2 rounded-xl border border-emerald-200 text-left transition cursor-pointer"
            >
              🛍️ Customer
              <span className="block text-[10px] text-emerald-500 font-normal">Shopper Profile</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Username or Email</label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin, manager, or customer"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition cursor-pointer shadow-md text-xs"
          >
            {loading ? 'Authenticating...' : 'Sign In with Credentials'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-indigo-600 hover:underline">
            Register as Customer
          </Link>
        </div>

      </div>
    </div>
  );
};
