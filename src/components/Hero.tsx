import React from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      {/* Impeccable Design: Stark contrast, no muddy gradients, massive typography */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 z-10">
            {/* Strict, high-contrast kicker */}
            <div className="inline-flex items-center space-x-2 border-l-4 border-indigo-600 pl-4 mb-8">
              <span className="text-xs font-bold text-slate-900 tracking-[0.2em] uppercase">Secure & Accessible 24/7</span>
            </div>

            {/* Massive, tight-tracked headline */}
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-slate-950 leading-[0.9] mb-8">
              Store <br/>
              with <span className="text-indigo-600">Power.</span>
            </h1>

            {/* Confident subtext */}
            <p className="text-xl md:text-2xl text-slate-600 font-medium max-w-lg mb-12 leading-relaxed">
              Industrial-grade security. <br className="hidden sm:block" />
              Climate-controlled perfection. <br className="hidden sm:block" />
              Move in today.
            </p>

            {/* Decisive Actions */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="#facilities" className="group relative inline-flex items-center justify-center px-8 py-5 text-lg font-bold text-white bg-slate-950 overflow-hidden transition-all hover:scale-[1.02]">
                <div className="absolute inset-0 w-0 bg-indigo-600 transition-all duration-[250ms] ease-out group-hover:w-full -z-10"></div>
                <span className="relative z-10">Book a Unit</span>
                <ArrowRight className="w-5 h-5 ml-3 relative z-10 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link href="/pricing" className="text-lg font-bold text-slate-950 underline decoration-2 decoration-slate-300 hover:decoration-indigo-600 underline-offset-8 transition-colors">
                View Pricing
              </Link>
            </div>
          </div>

          {/* Abstract/Architectural visual representation instead of a generic stock photo */}
          <div className="lg:col-span-5 relative hidden md:block">
            <div className="aspect-[4/5] bg-slate-100 relative overflow-hidden group">
              {/* Simulated architectural render / facility shot */}
              <img 
                src="https://images.unsplash.com/photo-1558227691-41ea78d1f631?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Modern Storage Facility" 
                className="absolute inset-0 w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700 ease-out grayscale hover:grayscale-0"
              />
              {/* Brutalist overlay element */}
              <div className="absolute bottom-0 left-0 bg-white p-6 border-t-4 border-r-4 border-indigo-600">
                <p className="font-mono text-sm font-bold text-slate-950">FACILITY 01</p>
                <p className="text-xs text-slate-500 mt-1">CAPACITY: 85%</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
