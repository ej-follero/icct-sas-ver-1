"use client";

import dynamic from "next/dynamic";

// Dynamically import MQTTProvider to avoid SSR issues
const MQTTProvider = dynamic(
  () => import("@/components/MQTTprovider").then((mod) => ({ default: mod.MQTTProvider })),
  { 
    ssr: false,
    loading: () => null
  }
);

interface ClientMQTTProviderProps {
  children: React.ReactNode;
}

export function ClientMQTTProvider({ children }: ClientMQTTProviderProps) {
  return (
    <MQTTProvider>
      {children}
    </MQTTProvider>
  );
}
