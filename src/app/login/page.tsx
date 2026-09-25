"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

  try {
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/dashboard';

      if (isLogin) {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        router.push(redirectUrl);
      } else {
        const res = await api.post('/auth/register', formData);
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('user', JSON.stringify(res.user));
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Column: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-12 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            BACK TO HOME
          </Link>
          <h1 className="text-4xl font-black text-[#1e1b4b] tracking-tight mb-2">
            {isLogin ? 'Welcome back.' : 'Create an account.'}
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {isLogin ? 'Log in to manage your storage units, pay bills, and get support.' : 'Sign up to secure your storage space today.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-[#1e1b4b] uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                name="fullName"
                required={!isLogin}
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:border-[#1e1b4b] focus:bg-white outline-none font-medium transition-all" 
                placeholder="John Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-[#1e1b4b] uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:border-[#1e1b4b] focus:bg-white outline-none font-medium transition-all" 
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-[#1e1b4b] uppercase tracking-wider">Password</label>
              {isLogin && <Link href="#" className="text-sm font-bold text-[#7E22CE] hover:text-[#1e1b4b] transition-colors">Forgot password?</Link>}
            </div>
            <input 
              type="password" 
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] focus:border-[#1e1b4b] focus:bg-white outline-none font-medium transition-all" 
              placeholder="••••••••"
            />
          </div>
          
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-8 py-4 bg-[#1e1b4b] text-white font-bold text-lg hover:bg-[#7E22CE] transition-colors rounded-full shadow-md disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-100 max-w-md">
          <p className="text-slate-500 font-medium">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="font-bold text-[#7E22CE] hover:text-[#1e1b4b] transition-colors"
            >
              {isLogin ? 'Sign up today.' : 'Sign in instead.'}
            </button>
          </p>
        </div>

      </div>

      {/* Right Column: Hero Image (Hidden on Mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#1e1b4b] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/storage-images/MS_Style20guide_8m3.webp" 
            alt="Storage Unit" 
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] via-[#1e1b4b]/50 to-transparent"></div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-16 z-10 text-white">
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex text-amber-400">
              {'★★★★★'.split('').map((star, i) => <span key={i} className="text-2xl">{star}</span>)}
            </div>
          </div>
          <blockquote className="text-3xl font-bold leading-snug mb-6 text-slate-100">
            "The app made everything effortless. I booked my unit, paid my deposit, and unlocked the facility gate right from my phone on moving day."
          </blockquote>
          <p className="font-bold tracking-widest uppercase text-[#7E22CE]">Sarah Jenkins, Customer since 2024</p>
        </div>
      </div>
    </div>
  );
}
