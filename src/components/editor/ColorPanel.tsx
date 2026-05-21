'use client';

import { useState, useEffect } from 'react';

const HAZIR_RENKLER = [
  '#0D0D0D', '#FFFFFF', '#00f5c4', '#FF2D78',
  '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#D4AF37', '#1C1C1C', '#FAF9F6', '#C4623A',
  '#2E7D32', '#1565C0', '#AD1457', '#EF6C00'
];

interface ColorPanelProps {
  canvasRef: any;
}

export function ColorPanel({ canvasRef }: ColorPanelProps) {
  const [seciliObje, setSeciliObje] = useState<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const onSelection = (e: any) => {
      const obj = e.selected?.[0] || canvas.getActiveObject();
      setSeciliObje(obj || null);
    };

    const onCleared = () => {
      setSeciliObje(null);
    };

    canvas.on('selection:created', onSelection);
    canvas.on('selection:updated', onSelection);
    canvas.on('selection:cleared', onCleared);

    return () => {
      canvas.off('selection:created', onSelection);
      canvas.off('selection:updated', onSelection);
      canvas.off('selection:cleared', onCleared);
    };
  }, [canvasRef]);

  const renkUygula = (renk: string, alan: 'fill' | 'stroke') => {
    const canvas = canvasRef.current?.getCanvas();
    if (seciliObje && canvas) {
      seciliObje.set(alan, renk);
      canvas.renderAll();
    }
  };

  if (!seciliObje) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
        <span className="text-2xl mb-2">🎨</span>
        <p className="text-xs">Renk değiştirmek için tasarımda bir element seçin.</p>
      </div>
    );
  }

  // Check if stroke or fill matches
  const hasStroke = seciliObje.type === 'rect' || seciliObje.type === 'circle' || seciliObje.type === 'path';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Fill Color */}
      <div className="space-y-3">
        <label className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono block">
          Dolgu / Metin Rengi
        </label>
        
        <div className="grid grid-cols-4 gap-2.5">
          {HAZIR_RENKLER.map((renk) => (
            <button
              key={renk}
              onClick={() => renkUygula(renk, 'fill')}
              style={{ backgroundColor: renk }}
              className="w-full aspect-square rounded-xl border border-white/10 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
              title={renk}
            />
          ))}
        </div>

        <div className="pt-2">
          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Özel Renk Seç</label>
          <input
            type="color"
            onChange={(e) => renkUygula(e.target.value, 'fill')}
            className="w-full h-11 bg-black/60 border border-white/10 rounded-xl px-2 py-1 cursor-pointer focus:outline-none"
          />
        </div>
      </div>

      {/* Stroke Color */}
      {hasStroke && (
        <div className="space-y-3 border-t border-white/5 pt-5">
          <label className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono block">
            Çerçeve / Çizgi Rengi (Stroke)
          </label>
          
          <div className="grid grid-cols-4 gap-2.5">
            {HAZIR_RENKLER.map((renk) => (
              <button
                key={renk}
                onClick={() => renkUygula(renk, 'stroke')}
                style={{ backgroundColor: renk }}
                className="w-full aspect-square rounded-xl border border-white/10 hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer"
                title={renk}
              />
            ))}
          </div>

          <div className="pt-2">
            <label className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Özel Çerçeve Rengi Seç</label>
            <input
              type="color"
              onChange={(e) => renkUygula(e.target.value, 'stroke')}
              className="w-full h-11 bg-black/60 border border-white/10 rounded-xl px-2 py-1 cursor-pointer focus:outline-none"
            />
          </div>
        </div>
      )}

    </div>
  );
}
