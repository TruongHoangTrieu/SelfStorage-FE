import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-2xl font-bold tracking-tighter text-slate-900">
              Self<span className="text-indigo-600">Storage</span>
            </Link>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex space-x-8">
            <Link href="/locations" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Locations</Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/support" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Support</Link>
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            <Link href="/login" className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Login
            </Link>
            <Link href="/locations" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-all shadow-sm hover:shadow-md">
              Book a Unit
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
