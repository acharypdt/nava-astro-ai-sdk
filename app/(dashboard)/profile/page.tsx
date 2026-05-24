'use client';
import React, { useState } from 'react';
import { User, Mail, Calendar, Save } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: '', email: '', birthData: ''
  });

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-3xl font-medium tracking-tight mb-2">प्रोफ़ाइल</h1>

      <Card>
        <CardHeader>
          <User className="w-5 h-5 text-[#F27D26]" />
          <h3 className="font-medium">व्यक्तिगत जानकारी</h3>
        </CardHeader>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-wider opacity-50 block mb-1">नाम</label>
            <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})}
              placeholder="आपका नाम" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider opacity-50 block mb-1">ईमेल</label>
            <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})}
              placeholder="email@example.com" className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 focus:ring-1 focus:ring-[#F27D26] outline-none" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider opacity-50 block mb-1">डिफ़ॉल्ट जन्म डेटा (JSON)</label>
            <textarea value={profile.birthData} onChange={e => setProfile({...profile, birthData: e.target.value})}
              rows={4} placeholder='{"year": 1990, "month": 5, "day": 15, ...}'
              className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 font-mono text-xs focus:ring-1 focus:ring-[#F27D26] outline-none" />
          </div>
          <Button><Save className="w-4 h-4" /> सहेजें</Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <Calendar className="w-5 h-5 text-[#F27D26]" />
          <h3 className="font-medium">हाल की गतिविधि</h3>
        </CardHeader>
        <p className="text-sm text-white/30 text-center py-6">कोई गतिविधि नहीं।</p>
      </Card>
    </div>
  );
}
