// src/app/error.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

export default function GlobalError() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-100 py-8">
      <Logo />
      <div className="bg-white rounded-3xl shadow-2xl border border-red-100 px-8 py-10 max-w-md w-full flex flex-col items-center mt-8 animate-fade-in relative">
        <div className="text-6xl mb-4 animate-bounce">
          <span role="img" aria-label="exploding head">💥</span>
        </div>
        <h1 className="text-5xl font-extrabold text-red-500 mb-2">500</h1>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Internal Server Error</h2>
        <p className="mb-2 text-slate-500 text-center text-base leading-relaxed">
          Oops! Something went wrong on our end.<br />Please try again later or return to the homepage.
        </p>
        <p className="mb-8 text-red-400 text-center text-sm italic">
          If this keeps happening, please contact the administrator or check back soon.
        </p>
        <Link href="/">
          <button className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-red-500 to-pink-400 text-white rounded-xl shadow hover:from-red-600 hover:to-pink-500 transition-all duration-200 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
            Go to Homepage
          </button>
        </Link>
      </div>
      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-slate-400 w-full">
        &copy; {new Date().getFullYear()} ICCT Smart Attendance System. All rights reserved.
      </footer>
      <style jsx global>{`
        body {
          background: repeating-linear-gradient(135deg, #f8fafc 0px, #f8fafc 40px, #fbe9e9 40px, #fbe9e9 80px);
        }
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s cubic-bezier(0.4,0,0.2,1) both;
        }
      `}</style>
    </div>
  );
}