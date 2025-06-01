"use client";

import Link from "next/link";
import { School, Radio } from "lucide-react";

interface LogoProps {
  variant?: "default" | "compact";
}

export default function Logo({ variant = "default" }: LogoProps) {
  return (
    <Link href="/dashboard" className="no-underline">
      <div
        className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-90"
      >
        <div
          className="relative flex items-center justify-center min-w-[48px] min-h-[48px] p-2 rounded-full shadow-md border-2 border-white"
          style={{
            background:
              "linear-gradient(135deg, #0c2556 0%, #1976d2 100%)",
          }}
        >
          <School className="w-8 h-8 text-white drop-shadow-lg" />
          <div
            className="absolute top-1 right-1 flex items-center justify-center p-0.5 rounded-full border border-white"
            style={{
              background:
                "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            }}
          >
            <Radio className="w-3 h-3 text-white" />
          </div>
        </div>
        <div
          className={
            variant === "compact"
              ? "block"
              : "hidden lg:flex flex-col justify-center"
          }
        >
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[26px] tracking-widest text-white drop-shadow-[0_2px_8px_rgba(30,64,175,0.5)] leading-none">
              ICCT
            </span>
            <span className="font-extrabold text-[26px] tracking-widest text-blue-400 drop-shadow-[0_2px_8px_rgba(30,144,255,0.4)] leading-none">
              RFID
            </span>
          </div>
          <div className="flex items-center gap-1 text-blue-200 font-semibold text-xs tracking-wider mt-1 opacity-80">
            <span>Smart</span>
            <span>Attendance</span>
            <span>System</span>
          </div>
        </div>
      </div>
    </Link>
  );
}