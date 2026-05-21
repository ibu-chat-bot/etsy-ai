'use client';

import { useState, useEffect } from 'react';

interface ExportButtonProps {
  canvasRef: any;
  token: string;
}

export function ExportButton({ canvasRef, token }: ExportButtonProps) {
  const [indiriliyor, setIndiriliyor] = useState(false);
  const [hakSayisi, setHakSayisi] = useState(3);

  // Sync initial download count limit from token on mount
  useEffect(() => {
    const fetchLimit = async () => {
      try {
        const res = await fetch(`/api/editor/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (res.ok && data.gecerli) {
          // Calculate remaining rights from total max 3
          const remaining = Math.max(0, 3 - (data.downloadCount || 0));
          setHakSayisi(remaining);
        }
      } catch (err) {
        console.error('Failed to sync download limit:', err);
      }
    };
    fetchLimit();
  }, [token]);

  const handleIndir = async () => {
    if (hakSayisi <= 0) {
      alert('İndirme hakkınız dolmuştur (En fazla 3 indirme hakkı vardır).');
      return;
    }

    setIndiriliyor(true);
    try {
      const dataURL = canvasRef.current?.exportPNG();
      if (!dataURL) {
        alert('Tasarım alınamadı. Lütfen tekrar deneyin.');
        return;
      }

      // Record download registry in API
      const res = await fetch('/api/editor/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'İndirme kaydedilemedi.');
        return;
      }

      // Download file as PNG
      const link = document.createElement('a');
      link.download = 'antigravity-design.png';
      link.href = dataURL;
      link.click();

      setHakSayisi((h) => Math.max(0, h - 1));
    } catch (err: any) {
      console.error(err);
      alert(`Hata oluştu: ${err.message}`);
    } finally {
      setIndiriliyor(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-xs text-gray-500 font-mono">
        {hakSayisi}/3 kalan indirme hakkı
      </span>
      <button
        onClick={handleIndir}
        disabled={indiriliyor || hakSayisi <= 0}
        className={`font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-xl transition-all select-none active:scale-[0.98] ${
          hakSayisi > 0
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] cursor-pointer'
            : 'bg-white/5 text-gray-500 border border-white/5 cursor-default active:scale-100'
        }`}
      >
        {indiriliyor ? '⏳ Hazırlanıyor...' : '⬇ PNG İndir (1080×1080)'}
      </button>
    </div>
  );
}
