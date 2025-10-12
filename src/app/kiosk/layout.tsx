import React from 'react';
import { Inter } from "next/font/google";
import { MQTTProvider } from '@/components/MQTTprovider';

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: 'Kiosk Mode',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MQTTProvider>
          <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            {children}
          </div>
        </MQTTProvider>
      </body>
    </html>
  );
}


