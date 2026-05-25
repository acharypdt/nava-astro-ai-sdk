'use client';
import React, { useState, useCallback, useRef } from 'react';
import { CalculationParams, geocodeLocation, getCurrentPosition } from '@nava-astro/core';
import { Button } from './Button';

interface AstroFormProps {
  onSubmit: (params: CalculationParams) => void;
  loading?: boolean;
  defaultValues?: Partial<CalculationParams>;
}

const inputClass = 'w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-sm focus:ring-1 focus:ring-[#F27D26] outline-none text-white';
const labelClass = 'text-[10px] uppercase tracking-wider opacity-50 block mb-1';

export function AstroForm({ onSubmit, loading, defaultValues }: AstroFormProps) {
  const now = new Date();
  const [form, setForm] = useState({
    year: defaultValues?.year || now.getFullYear(),
    month: defaultValues?.month || now.getMonth() + 1,
    day: defaultValues?.day || now.getDate(),
    hour: defaultValues?.hour || 12,
    minute: defaultValues?.minute || 0,
    lat: defaultValues?.lat || 28.6139,
    lng: defaultValues?.lng || 77.209,
    timezone: defaultValues?.timezone || 5.5,
    gender: defaultValues?.gender || 'Male',
    birthLocation: defaultValues?.birthLocation || '',
    report_type: defaultValues?.report_type || 'General',
  });

  const geoTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleGeo = useCallback(async () => {
    if (form.birthLocation.length < 3) return;
    if (geoTimeout.current) clearTimeout(geoTimeout.current);
    geoTimeout.current = setTimeout(async () => {
      const result = await geocodeLocation(form.birthLocation);
      if (result) {
        setForm(prev => ({ ...prev, lat: result.lat, lng: result.lng }));
      }
    }, 600);
  }, [form.birthLocation]);

  React.useEffect(() => { handleGeo(); }, [form.birthLocation]);

  const handleMyLocation = async () => {
    const pos = await getCurrentPosition();
    if (pos) setForm(prev => ({ ...prev, lat: pos.lat, lng: pos.lng }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>लिंग (Gender)</label>
          <select className={inputClass} value={form.gender} onChange={e => update('gender', e.target.value)}>
            <option value="Male">पुरुष</option>
            <option value="Female">स्त्री</option>
            <option value="Other">अन्य</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>रिपोर्ट प्रकार</label>
          <select className={inputClass} value={form.report_type} onChange={e => update('report_type', e.target.value)}>
            <option value="General">सामान्य</option>
            <option value="Career">करियर</option>
            <option value="Marriage">विवाह</option>
            <option value="Finance">धन</option>
            <option value="Health">स्वास्थ्य</option>
            <option value="Education">शिक्षा</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>जन्म स्थान</label>
        <div className="flex gap-2">
          <input
            className={`${inputClass} flex-1`}
            placeholder="जैसे: New Delhi, India"
            value={form.birthLocation}
            onChange={e => update('birthLocation', e.target.value)}
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleMyLocation} title="मेरा स्थान">
            📍
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>वर्ष (Year)</label>
          <input type="number" className={inputClass} value={form.year} onChange={e => update('year', parseInt(e.target.value))} />
        </div>
        <div>
          <label className={labelClass}>माह (Month)</label>
          <input type="number" className={inputClass} min={1} max={12} value={form.month} onChange={e => update('month', parseInt(e.target.value))} />
        </div>
        <div>
          <label className={labelClass}>दिन (Day)</label>
          <input type="number" className={inputClass} min={1} max={31} value={form.day} onChange={e => update('day', parseInt(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>घंटा (Hour)</label>
          <input type="number" className={inputClass} min={0} max={23} value={form.hour} onChange={e => update('hour', parseInt(e.target.value))} />
        </div>
        <div>
          <label className={labelClass}>मिनट (Minute)</label>
          <input type="number" className={inputClass} min={0} max={59} value={form.minute} onChange={e => update('minute', parseInt(e.target.value))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>अक्षांश (Latitude)</label>
          <input type="number" step="any" className={inputClass} value={form.lat} onChange={e => update('lat', parseFloat(e.target.value))} />
        </div>
        <div>
          <label className={labelClass}>देशांतर (Longitude)</label>
          <input type="number" step="any" className={inputClass} value={form.lng} onChange={e => update('lng', parseFloat(e.target.value))} />
        </div>
      </div>

      <div>
        <label className={labelClass}>समय क्षेत्र (Timezone)</label>
        <input type="number" step="0.5" className={inputClass} value={form.timezone} onChange={e => update('timezone', parseFloat(e.target.value))} />
      </div>

      <Button type="submit" loading={loading} className="w-full">
        🔮 कुण्डली देखें
      </Button>
    </form>
  );
}
