"use client";

import { useRef, useState } from "react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toPng } from "html-to-image";

export default function LogoExportPage() {
  const ref = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadNode = async (node: HTMLDivElement, size: 256 | 512 | 1024, baseWidth: number) => {
    if (!node) return;
    try {
      setDownloading(true);
      // Temporarily scale the container for higher fidelity export
      const scale = size / baseWidth; // base width depends on variant
      const previousTransform = node.style.transform;
      const previousTransformOrigin = node.style.transformOrigin;
      node.style.transform = `scale(${scale})`;
      node.style.transformOrigin = "top left";

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        width: Math.round(node.clientWidth * scale),
        height: Math.round(node.clientHeight * scale),
      });

      // Restore
      node.style.transform = previousTransform;
      node.style.transformOrigin = previousTransformOrigin;

      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `icct-rfid-logo-${size}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const downloadFull = (size: 256 | 512 | 1024) => {
    if (!ref.current) return;
    return downloadNode(ref.current, size, 256);
  };

  const downloadIcon = (size: 256 | 512 | 1024) => {
    if (!iconRef.current) return;
    // compact variant base width is 64px in Logo.tsx
    return downloadNode(iconRef.current, size, 64);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Logo Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div
                className="rounded-2xl p-4 border bg-gradient-to-r from-[#e6f0ff] to-white flex items-center justify-center"
                style={{ minHeight: 120 }}
              >
                <div ref={ref} className="scale-[1]">
                  {/* Render the exact Navbar logo */}
                  <Logo variant="default" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled={downloading} onClick={() => downloadFull(256)} className="rounded">
                  Download 256px
                </Button>
                <Button disabled={downloading} onClick={() => downloadFull(512)} className="rounded">
                  Download 512px
                </Button>
                <Button disabled={downloading} onClick={() => downloadFull(1024)} className="rounded">
                  Download 1024px
                </Button>
              </div>
              
              {/* Icon only export */}
              <div
                className="rounded-2xl p-4 border bg-gradient-to-r from-[#e6f0ff] to-white flex items-center justify-center"
                style={{ minHeight: 120 }}
              >
                <div ref={iconRef} className="scale-[1]">
                  {/* Render compact variant (icon only) */}
                  <Logo variant="compact" />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button disabled={downloading} onClick={() => downloadIcon(256)} className="rounded">
                  Download Icon 256px
                </Button>
                <Button disabled={downloading} onClick={() => downloadIcon(512)} className="rounded">
                  Download Icon 512px
                </Button>
                <Button disabled={downloading} onClick={() => downloadIcon(1024)} className="rounded">
                  Download Icon 1024px
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Tip: The PNGs are rasterized from the live component to match the Navbar style exactly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


