'use client';
import React from 'react';
import { UpgradeBanner } from '../../../components/ui/UpgradeBanner';
import { isEnterprise } from '../../../lib/edition';

export default function TransitsPage() {
  if (!isEnterprise()) return <UpgradeBanner feature="गोचर विश्लेषण" />;
  return <div>गोचर (Enterprise)</div>;
}
