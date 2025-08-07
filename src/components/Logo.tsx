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
        className={`transition-opacity duration-200 hover:opacity-90 flex items-center ${variant === "compact" ? "w-16 px-4 justify-between" : "w-60 justify-center"}`}
        style={{ width: variant === "compact" ? 64 : 256 }}
      >
        <div
          className={`relative flex items-center justify-center min-w-[36px] min-h-[36px] rounded-full shadow-md border-2 border-white ${variant === "compact" ? "p-0.5" : "p-1.5"}`}
          style={{
            background:
              "linear-gradient(135deg, #0c2556 0%, #1976d2 100%)",
          }}
        >
          <School className="w-6 h-6 text-white drop-shadow-lg" />
          <div
            className="absolute top-0.5 right-0.5 flex items-center justify-center p-0.5 rounded-full border border-white"
            style={{
              background:
                "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            }}
          >
            <Radio className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
        {variant !== "compact" && (
          <div className="hidden lg:flex flex-col justify-center ml-2">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[26px] tracking-widest text-white drop-shadow-[0_2px_8px_rgba(30,64,175,0.5)] leading-none">
                ICCT
              </span>
              <span className="font-extrabold text-[26px] tracking-widest text-blue-600 drop-shadow-[0_2px_8px_rgba(30,144,255,0.4)] leading-none">
                RFID
              </span>
            </div>
            <div className="flex items-center gap-1 text-blue-500 font-semibold text-xs tracking-wider mt-1 opacity-80 drop-shadow-[0_1px_0_white,0_-1px_0_white,1px_0_0_white,-1px_0_0_white]">
              <span>Smart</span>
              <span>Attendance</span>
              <span>System</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}