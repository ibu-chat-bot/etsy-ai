'use client';

import { useState, useEffect } from 'react';

interface TextPanelProps {
  canvasRef: any;
}

export function TextPanel({ canvasRef }: TextPanelProps) {
  const [seciliObje, setSeciliObje] = useState<any>(null);
  const [metin, setMetin] = useState('');
  const [fontSize, setFontSize] = useState(40);

  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas();
    if (!canvas) return;

    const onSelection = (e: any) => {
      const obj = e.selected?.[0] || canvas.getActiveObject();
      if (obj && (obj.type === 'text' || obj.type === 'i-text' || obj.type === 'textbox')) {
        setSeciliObje(obj);
        setMetin(obj.text || '');
        setFontSize(obj.fontSize || 40);
      } else {
        setSeciliObje(null);
      }
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

  const metinGuncelle = (yeniMetin: string) => {
    setMetin(yeniMetin);
    const canvas = canvasRef.current?.getCanvas();
    if (seciliObje && canvas) {
      seciliObje.set('text', yeniMetin);
      canvas.renderAll();
    }
  };

  const fontSizeGuncelle = (size: number) => {
    setFontSize(size);
    const canvas = canvasRef.current?.getCanvas();
    if (seciliObje && canvas) {
      seciliObje.set('fontSize', size);
      canvas.renderAll();
    }
  };

  if (!seciliObje) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
        <span className="text-2xl mb-2">⌨️</span>
        <p className="text-xs">Düzenlemek için şablondaki bir metin katmanına tıklayın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="space-y-1.5">
        <label className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono block">
          Metin İçeriği
        </label>
        <textarea
          value={metin}
          onChange={(e) => metinGuncelle(e.target.value)}
          className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors min-h-[90px] resize-y"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono">
            Yazı Boyutu
          </label>
          <span className="text-xs font-mono font-bold text-white">{fontSize}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={140}
          value={fontSize}
          onChange={(e) => fontSizeGuncelle(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
      </div>
    </div>
  );
}
