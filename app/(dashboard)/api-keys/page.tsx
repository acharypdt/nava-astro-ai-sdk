'use client';
import React from 'react';
import { UpgradeBanner } from '../../../components/ui/UpgradeBanner';
import { isEnterprise } from '../../../lib/edition';

export default function ApiKeysPage() {
  if (!isEnterprise()) return <UpgradeBanner feature="API Key प्रबंधन" />;
  return <div>API Keys (Enterprise)</div>;
}
