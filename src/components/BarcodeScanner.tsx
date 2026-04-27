import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onResult: (decodedText: string) => void;
}

export default function BarcodeScanner({ onResult }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(onResult, (error) => {
      // Ignore scanning failures which happen frequently
    });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onResult]);

  return (
    <div className="relative">
      <div id="reader" className="overflow-hidden rounded-2xl border-4 border-slate-100"></div>
      <div className="mt-4 text-center">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ensure adequate lighting for better detection</p>
      </div>
    </div>
  );
}
