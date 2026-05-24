'use client';
import React from 'react';
import { UpgradeBanner } from '../../../components/ui/UpgradeBanner';
import { isEnterprise } from '../../../lib/edition';

export default function BillingPage() {
  if (!isEnterprise()) return <UpgradeBanner feature="बिलिंग और सब्सक्रिप्शन" />;
  return <div>बिलिंग (Enterprise)</div>;
}
