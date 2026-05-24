'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, MapIcon, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { NavaAstroSDK } from '../../lib/astrology-sdk';

export default function DashboardHome() {
  const [recentKundalis] = useState<any[]>([]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-medium tracking-tight mb-2">
          नमस्ते, <span className="text-[#F27D26]">स्वागत है</span>
        </h1>
        <p className="text-white/50">NavaAstro AI प्लेटफ़ॉर्म पर आपका स्वागत है।</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/kundali">
          <Card className="hover:border-[#F27D26]/30 transition-all cursor-pointer group">
            <CardHeader>
              <MapIcon className="w-5 h-5 text-[#F27D26]" />
              <h3 className="font-medium">नई कुंडली</h3>
            </CardHeader>
            <p className="text-sm text-white/50 mb-4">जन्म विवरण दर्ज करें और संपूर्ण कुंडली विश्लेषण प्राप्त करें</p>
            <Button variant="ghost" size="sm" className="group-hover:text-[#F27D26]">
              शुरू करें <ArrowRight className="w-3 h-3" />
            </Button>
          </Card>
        </Link>

        <Link href="/muhurta">
          <Card className="hover:border-[#F27D26]/30 transition-all cursor-pointer group">
            <CardHeader>
              <Clock className="w-5 h-5 text-[#F27D26]" />
              <h3 className="font-medium">मुहूर्त</h3>
            </CardHeader>
            <p className="text-sm text-white/50 mb-4">शुभ समय और तिथियाँ खोजें</p>
            <Button variant="ghost" size="sm" className="group-hover:text-[#F27D26]">
              खोजें <ArrowRight className="w-3 h-3" />
            </Button>
          </Card>
        </Link>

        <Link href="/match-making">
          <Card className="hover:border-[#F27D26]/30 transition-all cursor-pointer group">
            <CardHeader>
              <Sparkles className="w-5 h-5 text-[#F27D26]" />
              <h3 className="font-medium">कुंडली मिलान</h3>
            </CardHeader>
            <p className="text-sm text-white/50 mb-4">दो व्यक्तियों की कुंडली का मिलान करें</p>
            <Button variant="ghost" size="sm" className="group-hover:text-[#F27D26]">
              मिलान करें <ArrowRight className="w-3 h-3" />
            </Button>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <Sparkles className="w-5 h-5 text-[#F27D26]" />
          <h3 className="font-medium">हाल की गणनाएँ</h3>
        </CardHeader>
        {recentKundalis.length === 0 ? (
          <p className="text-sm text-white/30 text-center py-8">
            अभी तक कोई कुंडली नहीं बनाई गई। ऊपर से "नई कुंडली" पर क्लिक करें।
          </p>
        ) : (
          <div className="space-y-3">
            {recentKundalis.map((item: any) => (
              <div key={item.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-sm">{item.name || 'कुंडली'}</p>
                <p className="text-xs text-white/30">{item.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
