'use client';

interface ImagePanelProps {
  canvasRef: any;
}

export function ImagePanel({ canvasRef }: ImagePanelProps) {

  const gorselEkle = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Import fabric dynamically on the client side
      import('fabric').then(({ fabric }) => {
        const dataUrl = e.target?.result as string;
        fabric.Image.fromURL(dataUrl, (img) => {
          const canvas = canvasRef.current?.getCanvas();
          if (!canvas) return;

          // Scale down image appropriately to fit comfortably within the bounds
          img.scaleToWidth(250);
          img.set({
            left: 140,
            top: 140,
            cornerColor: '#00f5c4',
            cornerSize: 8,
            transparentCorners: false
          });

          canvas.add(img);
          canvas.setActiveObject(img);
          canvas.renderAll();
        });
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="space-y-2">
        <label className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono block">
          Logo / Görsel Yükle
        </label>
        
        <label className="flex flex-col items-center justify-center bg-black/60 hover:bg-white/5 border border-dashed border-white/10 hover:border-purple-500/30 rounded-2xl p-8 text-center cursor-pointer transition-all">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) gorselEkle(file);
            }}
          />
          <span className="text-3xl mb-3">🖼️</span>
          <span className="text-xs font-semibold text-gray-300">Görsel Seçin veya Sürükleyin</span>
          <span className="text-[10px] text-gray-500 mt-1">PNG, JPG, SVG supported</span>
        </label>
      </div>

      <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-3.5 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">💡</span>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">Tasarım İpucu</span>
        </div>
        <p className="text-[10px] text-gray-400 leading-normal">
          Logonuzu ekledikten sonra köşelerinden tutarak büyütebilir, döndürebilir veya dilediğiniz yere konumlandırabilirsiniz.
        </p>
      </div>
    </div>
  );
}
