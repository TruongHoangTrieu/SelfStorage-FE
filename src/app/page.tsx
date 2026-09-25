import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDFCFB] font-sans selection:bg-[#7E22CE] selection:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative z-10 overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-300/30 rounded-full blur-[120px] -z-10 pointer-events-none"></div>

        <div className="animate-slide-up-fade">
          
          <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black tracking-tighter text-[#1e1b4b] leading-[0.9] mb-8">
            Storage,<br/> made simple.
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-600 font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
            The easiest way to book, manage, and access your storage unit. 
            No paperwork, no hidden fees, just secure space on demand.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link 
              href="/locations" 
              className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-[#7E22CE] hover:bg-[#6B21A8] hover:scale-105 transition-all shadow-[0_0_40px_rgba(126,34,206,0.3)] rounded-full"
            >
              Start Storing
            </Link>
            <Link 
              href="/pricing" 
              className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-[#1e1b4b] bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all rounded-full"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Logo Farm / Social Proof */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-slide-up-fade delay-100">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Trusted by brands</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simulated Logos using text for structural mockup */}
            <div className="text-2xl font-black tracking-tighter font-serif">Acme Corp</div>
            <div className="text-2xl font-black tracking-widest">GLOBAL</div>
            <div className="text-2xl font-black italic">Nexus</div>
            <div className="text-2xl font-black tracking-tight">Stark Industries</div>
            <div className="text-2xl font-black uppercase">Wayne Ent</div>
          </div>
        </div>
      </section>

      {/* Bento Box Feature Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-20 animate-slide-up-fade delay-200">
          <h2 className="text-5xl font-black text-[#1e1b4b] tracking-tight mb-6">Everything you need, nothing you don't.</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">A complete platform designed to make storing your physical goods as easy as storing your digital files.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[400px]">
          
          {/* Feature 1: Large Span */}
          <div className="md:col-span-2 bg-[#1e1b4b] rounded-[2rem] p-10 relative overflow-hidden group animate-slide-up-fade delay-300">
            <div className="absolute inset-0 z-0">
               <img src="/smart_access.jpg" alt="Smart Access" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" />
               <div className="absolute inset-0 bg-gradient-to-r from-[#1e1b4b] to-transparent"></div>
            </div>
            <div className="relative z-10 text-white max-w-md h-full flex flex-col justify-end">
              <h3 className="text-3xl font-black mb-4">Smart Access</h3>
              <p className="text-slate-200 text-lg font-medium">Unlock your unit directly from your phone. No more lost keys or forgotten combinations.</p>
            </div>
          </div>

          {/* Feature 2: Small Square (Valet Storage) */}
          <div className="bg-purple-900 rounded-[2rem] p-10 relative overflow-hidden group animate-slide-up-fade delay-400">
            <div className="absolute inset-0 z-0">
               <img src="/climate_control.jpg" alt="Valet Storage" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] to-transparent"></div>
            </div>
            <div className="relative z-10 text-white h-full flex flex-col justify-end">
              <h3 className="text-2xl font-black mb-4">Valet Storage</h3>
              <p className="text-slate-200 font-medium">We come to you. Pack, pickup, and store without lifting a finger.</p>
            </div>
          </div>

          {/* Feature 3: Small Square */}
          <div className="bg-slate-900 rounded-[2rem] p-10 relative overflow-hidden group animate-slide-up-fade delay-100">
            <div className="absolute inset-0 z-0">
               <img src="/security_camera.jpg" alt="Security" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b] to-transparent"></div>
            </div>
            <div className="relative z-10 text-white h-full flex flex-col justify-end">
              <h3 className="text-2xl font-black mb-4">24/7 Security</h3>
              <p className="text-slate-200 font-medium">AI-powered surveillance and on-site guards round the clock.</p>
            </div>
          </div>

          {/* Feature 4: Large Span */}
          <div className="md:col-span-2 bg-[#1e1b4b] rounded-[2rem] p-10 relative overflow-hidden group animate-slide-up-fade delay-200">
            <div className="absolute inset-0 z-0">
               <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80" alt="Transparent Pricing" className="w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-700" />
               <div className="absolute inset-0 bg-gradient-to-l from-[#1e1b4b] to-transparent"></div>
            </div>
            <div className="relative z-10 text-white max-w-md ml-auto h-full flex flex-col justify-end text-right">
              <h3 className="text-3xl font-black mb-4">Transparent Pricing</h3>
              <p className="text-slate-200 text-lg font-medium">What you see is what you pay. We eliminated setup fees, admin fees, and arbitrary price hikes.</p>
            </div>
          </div>

        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up-fade">
            <h2 className="text-4xl sm:text-5xl font-black text-[#1e1b4b] tracking-tight mb-4">How it works</h2>
            <p className="text-lg text-slate-600 font-medium">Three simple steps to secure your belongings.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative">
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-slate-200 -z-10"></div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-slide-up-fade delay-100">
              <div className="w-16 h-16 bg-[#7E22CE] text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg shadow-purple-500/30">1</div>
              <h3 className="text-xl font-black text-[#1e1b4b] mb-3">Book Online</h3>
              <p className="text-slate-600 font-medium">Choose your location and unit size. Complete your reservation in under 2 minutes.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-slide-up-fade delay-200">
              <div className="w-16 h-16 bg-[#7E22CE] text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg shadow-purple-500/30">2</div>
              <h3 className="text-xl font-black text-[#1e1b4b] mb-3">Get Digital Key</h3>
              <p className="text-slate-600 font-medium">Download our app to receive your secure Bluetooth access key instantly.</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 animate-slide-up-fade delay-300">
              <div className="w-16 h-16 bg-[#7E22CE] text-white rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-lg shadow-purple-500/30">3</div>
              <h3 className="text-xl font-black text-[#1e1b4b] mb-3">Move In</h3>
              <p className="text-slate-600 font-medium">Access your unit 24/7. Your phone is your key, your dashboard is your manager.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-[#1e1b4b] tracking-tight mb-4">Loved by tenants</h2>
            <p className="text-lg text-slate-600 font-medium">Don't just take our word for it.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 relative">
              <div className="text-[#7E22CE] text-6xl font-serif absolute top-4 left-6 opacity-20">"</div>
              <p className="text-xl text-slate-700 font-medium relative z-10 mb-8 italic">
                "The app access is a game-changer. I completely forgot my code once, but it didn't matter because my phone just unlocked the door as I walked up. Incredible."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-[#7E22CE] font-black text-lg">AJ</div>
                <div>
                  <p className="font-bold text-[#1e1b4b]">Alex Johnson</p>
                  <p className="text-sm text-slate-500 font-medium">Tenant since 2024</p>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 relative">
              <div className="text-[#7E22CE] text-6xl font-serif absolute top-4 left-6 opacity-20">"</div>
              <p className="text-xl text-slate-700 font-medium relative z-10 mb-8 italic">
                "I needed temporary storage while moving. The pricing was completely transparent, no weird admin fees, and cancelling was a one-tap process in the dashboard."
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center text-[#7E22CE] font-black text-lg">SW</div>
                <div>
                  <p className="font-bold text-[#1e1b4b]">Sarah Williams</p>
                  <p className="text-sm text-slate-500 font-medium">Tenant since 2025</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Bottom CTA */}
      <section className="py-32 bg-[#1e1b4b] text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl sm:text-7xl font-black text-white tracking-tighter mb-10">Ready to make space?</h2>
          <Link 
            href="/locations" 
            className="inline-block px-10 py-5 text-xl font-bold text-[#1e1b4b] bg-white hover:bg-slate-100 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)] rounded-full"
          >
            Find a Location
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 text-center text-slate-500 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold tracking-tight">© 2026 SelfStorage. Built impeccably.</p>
        </div>
      </footer>
    </main>
  );
}
