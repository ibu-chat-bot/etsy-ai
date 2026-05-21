'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Database, LogOut, Settings, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const [isSupabase, setIsSupabase] = useState(false);
  const [loading, setLoading] = useState(true);

  // Authenticate Session & Load Statuses
  useEffect(() => {
    const session = localStorage.getItem('etsy_studio_session');
    if (!session) {
      router.push('/');
      return;
    }

    async function loadStatus() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setHasOpenAI(data.hasOpenAIKey);
          setIsSupabase(data.isSupabase);
        }
      } catch (err) {
        console.error('Failed to load settings status in header', err);
      } finally {
        setLoading(false);
      }
    }

    loadStatus();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('etsy_studio_session');
    localStorage.removeItem('etsy_studio_user');
    router.push('/');
  };

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Settings', href: '/settings' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 py-4 px-6 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Logo and Connections */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-white text-base">
              ETSY <span className="text-gradient-primary">CANVA AI</span>
            </span>
          </Link>

          {/* Vertical Separator */}
          <div className="hidden md:block h-5 w-[1px] bg-white/10" />

          {/* Connection Status Indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Database indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              isSupabase 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
            }`}>
              <Database className="w-3 h-3" />
              <span>{isSupabase ? 'Supabase DB' : 'Local File DB'}</span>
            </div>

            {/* OpenAI indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              hasOpenAI 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {hasOpenAI ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>OpenAI Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  <span>OpenAI Missing</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs and Actions */}
        <div className="flex items-center justify-between md:justify-end gap-6">
          <nav className="flex items-center gap-1 md:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-white/5 text-white font-bold' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {/* New Product Trigger Button */}
            <Link
              href="/projects/new"
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98]"
            >
              + New Product
            </Link>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Logout session"
              className="p-2 text-gray-400 hover:text-red-400 rounded-xl hover:bg-white/5 transition-all active:scale-[0.95]"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
