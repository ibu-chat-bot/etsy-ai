'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { Canvas } from '@/components/editor/Canvas';
import { TextPanel } from '@/components/editor/TextPanel';
import { ColorPanel } from '@/components/editor/ColorPanel';
import { ImagePanel } from '@/components/editor/ImagePanel';
import { ExportButton } from '@/components/editor/ExportButton';

interface EditorPageProps {
  params: Promise<{ token: string }>;
}

export default function EditorPage({ params }: EditorPageProps) {
  const { token } = use(params);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [templateJSON, setTemplateJSON] = useState<any>(null);
  const [aktifPanel, setAktifPanel] = useState<'text' | 'color' | 'image'>('text');
  const canvasRef = useRef<any>(null);

  useEffect(() => {
    const tokenDogrula = async () => {
      try {
        const res = await fetch(`/api/editor/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();

        if (!res.ok || !data.gecerli) {
          setHata(data.hata || 'Geçersiz veya süresi dolmuş bağlantı.');
          return;
        }

        // Fetch design template layout JSON details
        const templateRes = await fetch(`/api/editor/template?id=${data.templateId}`);
        if (!templateRes.ok) {
          throw new Error('Şablon yüklenemedi.');
        }
        const template = await templateRes.json();
        setTemplateJSON(template);
      } catch (err: any) {
        setHata(err.message || 'Bağlantı hatası.');
      } finally {
        setYukleniyor(false);
      }
    };

    tokenDogrula();
  }, [token]);

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
        <div className="text-gray-400 text-xs tracking-wider uppercase font-mono animate-pulse">
          Editör Yükleniyor...
        </div>
      </div>
    );
  }

  if (hata) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <span className="text-5xl block">🔒</span>
          <h1 className="text-xl font-bold text-white tracking-tight">{hata}</h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            Bu erişim bağlantısı tek kullanımlıktır, süresi dolmuş veya 3 defalık indirme limiti tamamlanmış olabilir.
          </p>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-[10px] text-gray-500 leading-normal">
            Destek almak veya yeni bir indirme hakkı talep etmek için lütfen mağazamız üzerinden sipariş numaranızla birlikte bizimle iletişime geçin.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans select-none antialiased">
      
      {/* Header bar */}
      <header className="bg-slate-900 border-b border-white/10 h-16 px-6 flex items-center justify-between shrink-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-lg">✦</span>
          <span className="text-sm font-black text-white tracking-widest uppercase font-mono">
            Antigravity <span className="text-purple-400">Editor</span>
          </span>
        </div>
        
        {/* Export component */}
        <ExportButton canvasRef={canvasRef} token={token} />
      </header>

      {/* Workspace container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left control panel */}
        <aside className="w-80 bg-slate-900 border-r border-white/10 flex flex-col shrink-0 z-40">
          
          {/* Tab selector */}
          <div className="flex border-b border-white/5">
            {[
              { id: 'text', label: 'Metin', icon: '⌨️' },
              { id: 'color', label: 'Renk', icon: '🎨' },
              { id: 'image', label: 'Görsel', icon: '🖼️' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setAktifPanel(p.id as any)}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
                  aktifPanel === p.id
                    ? 'bg-white/5 border-purple-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Active Panel panel view */}
          <div className="flex-1 overflow-y-auto p-6">
            {aktifPanel === 'text' && <TextPanel canvasRef={canvasRef} />}
            {aktifPanel === 'color' && <ColorPanel canvasRef={canvasRef} />}
            {aktifPanel === 'image' && <ImagePanel canvasRef={canvasRef} />}
          </div>

        </aside>

        {/* Canvas display frame */}
        <main className="flex-1 bg-slate-950 flex items-center justify-center p-8 overflow-auto">
          <div className="transform scale-95 md:scale-100 transition-transform">
            <Canvas ref={canvasRef} templateJSON={templateJSON} />
          </div>
        </main>

      </div>

    </div>
  );
}
