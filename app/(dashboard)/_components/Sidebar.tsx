'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, User, MapIcon, Globe, Heart, Activity, FileJson, Key, CreditCard, HeartHandshake, Moon, LayoutGrid, Layers, Zap, CalendarDays } from 'lucide-react';

const communityNav = [
  { href: '/', label: 'होम', icon: Sparkles },
  { href: '/kundali', label: 'कुंडली', icon: MapIcon },
  { href: '/profile', label: 'प्रोफ़ाइल', icon: User },
];

const enterpriseNav = [
  { href: '/muhurta', label: 'मुहूर्त', icon: Globe },
  { href: '/sade-sati', label: 'साढ़ेसाती', icon: Moon },
  { href: '/divisional-charts', label: 'वर्गीय कुण्डलियाँ', icon: LayoutGrid },
  { href: '/ashtakavarga', label: 'अष्टकवर्ग', icon: Layers },
  { href: '/shadbala', label: 'षड्बल', icon: Zap },
  { href: '/varshaphal', label: 'वर्षफल', icon: CalendarDays },
  { href: '/transits', label: 'गोचर', icon: Activity },
  { href: '/reports', label: 'रिपोर्ट', icon: FileJson },
  { href: '/api-keys', label: 'API Keys', icon: Key },
  { href: '/billing', label: 'बिलिंग', icon: CreditCard },
  { href: '/match-making', label: 'कुंडली मिलान', icon: HeartHandshake },
];

export function Sidebar() {
  const pathname = usePathname();
  const edition = (typeof process !== 'undefined' && (process as any).env?.NEXT_PUBLIC_EDITION === 'enterprise') ? 'enterprise' : 'community';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 min-h-screen bg-black/40 border-r border-white/10 p-6 flex flex-col">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-[#F27D26] rounded-lg">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <span className="text-xs font-mono tracking-widest uppercase opacity-60">NavaAstro</span>
        </div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#F27D26]">
          {edition === 'enterprise' ? 'Enterprise Edition' : 'Community Edition'}
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        <div className="text-[10px] uppercase tracking-wider opacity-40 mb-2 font-mono">मुख्य</div>
        {communityNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              isActive(item.href)
                ? 'bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        ))}

        {edition === 'enterprise' && (
          <>
            <div className="text-[10px] uppercase tracking-wider opacity-40 mb-2 mt-6 font-mono">एंटरप्राइज़</div>
            {enterpriseNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  isActive(item.href)
                    ? 'bg-[#F27D26]/10 text-[#F27D26] border border-[#F27D26]/20'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="pt-4 border-t border-white/10 text-[10px] font-mono opacity-30">
        v4.2.0-stable · AGPL-3.0
      </div>
    </aside>
  );
}
