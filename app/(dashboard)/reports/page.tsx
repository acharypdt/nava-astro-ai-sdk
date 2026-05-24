'use client';
import React from 'react';
import { UpgradeBanner } from '../../../components/ui/UpgradeBanner';
import { isEnterprise } from '../../../lib/edition';

export default function ReportsPage() {
  if (!isEnterprise()) return <UpgradeBanner feature="सहेजी गई रिपोर्ट" />;
  return <div>रिपोर्ट (Enterprise)</div>;
}
