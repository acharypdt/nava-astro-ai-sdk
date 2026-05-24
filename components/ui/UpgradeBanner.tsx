import React from 'react';
import { Sparkles } from 'lucide-react';

interface UpgradeBannerProps {
  feature: string;
}

export function UpgradeBanner({ feature }: UpgradeBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 bg-gradient-to-br from-[#F27D26]/20 to-transparent rounded-full mb-6">
        <Sparkles className="w-12 h-12 text-[#F27D26]" />
      </div>
      <h2 className="text-2xl font-medium mb-3">{feature}</h2>
      <p className="text-white/50 max-w-md mb-6">
        यह सुविधा एंटरप्राइज़ संस्करण में उपलब्ध है। कृपया अपग्रेड करें।
      </p>
      <p className="text-sm text-white/30">
        संपर्क: <a href="mailto:navasanganakah@gmail.com" className="text-[#F27D26] underline">navasanganakah@gmail.com</a>
      </p>
    </div>
  );
}
