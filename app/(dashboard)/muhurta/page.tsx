'use client';
import React from 'react';
import { UpgradeBanner } from '../../../components/ui/UpgradeBanner';
import { isEnterprise } from '../../../lib/edition';

export default function MuhurtaPage() {
  if (!isEnterprise()) return <UpgradeBanner feature="मुहूर्त खोजक" />;
  return <div>मुहूर्त (Enterprise)</div>;
}
