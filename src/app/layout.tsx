import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SemiAnalysis AI Tokenomics Model',
  description: 'End-to-end AI value chain analysis: hardware installed base, token throughput, ROIC, and hardware demand forecasting',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
