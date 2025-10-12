import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClientMQTTProvider } from "@/components/ClientMQTTProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ICCT Smart Attendance System",
  description: "A smart attendance system for ICCT Colleges",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientMQTTProvider>
          {children}
        </ClientMQTTProvider>
        <Toaster 
          position="top-right"
          richColors
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}