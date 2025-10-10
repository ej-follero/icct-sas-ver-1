import React from 'react';

export const metadata = {
  title: 'Kiosk Mode',
};

export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
          {children}
        </div>
      </body>
    </html>
  );
}


