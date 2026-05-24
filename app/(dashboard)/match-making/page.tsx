'use client';
import React from 'react';
import { UpgradeBanner } from '../../../components/ui/UpgradeBanner';
import { isEnterprise } from '../../../lib/edition';

export default function MatchMakingPage() {
  if (!isEnterprise()) return <UpgradeBanner feature="कुंडली मिलान" />;
  return <div>कुंडली मिलान (Enterprise)</div>;
}
