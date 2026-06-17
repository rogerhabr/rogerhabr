'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ParamsProvider } from '@/contexts/ParamsContext';

const Overview               = dynamic(() => import('@/components/sections/Overview'),                { ssr: false });
const HardwareInstalledBase  = dynamic(() => import('@/components/sections/HardwareInstalledBase'),   { ssr: false });
const TokenThroughput        = dynamic(() => import('@/components/sections/TokenThroughput'),         { ssr: false });
const ComputeSupplyDemand    = dynamic(() => import('@/components/sections/ComputeSupplyDemand'),     { ssr: false });
const SaasDisruption         = dynamic(() => import('@/components/sections/SaasDisruption'),          { ssr: false });
const AddressableMarket      = dynamic(() => import('@/components/sections/AddressableMarket'),       { ssr: false });
const TokenPricingTrends     = dynamic(() => import('@/components/sections/TokenPricingTrends'),      { ssr: false });
const FoundationLabFinancials= dynamic(() => import('@/components/sections/FoundationLabFinancials'), { ssr: false });
const ROICCalculator         = dynamic(() => import('@/components/sections/ROICCalculator'),           { ssr: false });
const HardwareDemandForecast = dynamic(() => import('@/components/sections/HardwareDemandForecast'),  { ssr: false });
const RevenueProfit          = dynamic(() => import('@/components/sections/RevenueProfit'),            { ssr: false });
const ScenarioBar            = dynamic(() => import('@/components/ScenarioBar'),                       { ssr: false });

const SECTIONS = [
  { id: 'overview',            label: 'Overview',                icon: '🏠', group: 'Dashboard' },
  { id: 'hardware-base',       label: 'Hardware Installed Base', icon: '🖥️', group: 'Supply' },
  { id: 'token-throughput',    label: 'Token Throughput',        icon: '⚡', group: 'Supply' },
  { id: 'supply-demand',       label: 'Compute Supply & Demand', icon: '⚖️', group: 'Supply' },
  { id: 'saas-disruption',     label: 'SAAS Disruption',         icon: '🔄', group: 'Demand' },
  { id: 'addressable-market',  label: 'Addressable Market',      icon: '🌐', group: 'Demand' },
  { id: 'token-pricing',       label: 'Token Pricing Trends',    icon: '📉', group: 'Demand' },
  { id: 'lab-financials',      label: 'Lab Financials',          icon: '🏦', group: 'Demand' },
  { id: 'roic-calculator',     label: 'ROIC Calculator',         icon: '🧮', group: 'Economics' },
  { id: 'hardware-demand',     label: 'Hardware Demand Forecast',icon: '📦', group: 'Economics' },
  { id: 'revenue-profit',      label: 'Revenue & Profit',        icon: '💰', group: 'Economics' },
];

function SectionContent({ id }: { id: string }) {
  switch (id) {
    case 'overview':           return <Overview />;
    case 'hardware-base':      return <HardwareInstalledBase />;
    case 'token-throughput':   return <TokenThroughput />;
    case 'supply-demand':      return <ComputeSupplyDemand />;
    case 'saas-disruption':    return <SaasDisruption />;
    case 'addressable-market': return <AddressableMarket />;
    case 'token-pricing':      return <TokenPricingTrends />;
    case 'lab-financials':     return <FoundationLabFinancials />;
    case 'roic-calculator':    return <ROICCalculator />;
    case 'hardware-demand':    return <HardwareDemandForecast />;
    case 'revenue-profit':     return <RevenueProfit />;
    default:                   return null;
  }
}

export default function Home() {
  const [active, setActive] = useState('overview');

  return (
    <ParamsProvider>
      <div className="flex min-h-screen bg-sa-bg">
        <Sidebar sections={SECTIONS} active={active} onSelect={setActive} />
        <div className="flex-1 ml-64">
          <Header activeSection={active} sections={SECTIONS} />
          <ScenarioBar />
          <main className="pt-24 min-h-screen">
            <div className="p-6 max-w-7xl">
              <SectionContent key={active} id={active} />
            </div>
          </main>
        </div>
      </div>
    </ParamsProvider>
  );
}
