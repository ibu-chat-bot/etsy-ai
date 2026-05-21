import React from 'react';

interface CanvaRehberiProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CanvaRehberi({ isOpen, onClose }: CanvaRehberiProps) {
  if (!isOpen) return null;

  const steps = [
    {
      no: 1,
      title: 'Paylaş Butonuna Tıkla',
      description: "Canva editörünün sağ üst köşesindeki mor renkli 'Paylaş' (Share) butonuna basın.",
      icon: '🔗'
    },
    {
      no: 2,
      title: 'Şablon Linkini Bul',
      description: "Açılan menüde 'Şablon olarak kullan bağlantısı' (Template Link) seçeneğine tıklayın. Menüde görünmüyorsa 'Daha Fazla' (More) seçeneği altındadır.",
      icon: '📋'
    },
    {
      no: 3,
      title: 'Bağlantıyı Kopyalayın',
      description: "Açılan pencerede 'Kopyala' (Copy) butonuna basın. Şablon kopyalama linki panonuza kaydedilecektir.",
      icon: '✅'
    },
    {
      no: 4,
      title: 'Sisteme Yapıştırın',
      description: 'Etsy AI arayüzüne geri dönün, kopyaladığınız linki kutuya yapıştırıp Kaydet butonuna basın.',
      icon: '💾'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
      <div className="relative bg-slate-950/95 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl shadow-purple-500/5 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center transition-all"
        >
          ✕
        </button>

        {/* Header */}
        <div className="space-y-1.5 text-center sm:text-left">
          <span className="text-[10px] font-extrabold text-purple-400 tracking-widest uppercase font-mono block">
            Adım Adım Kılavuz
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            🎨 Canva Şablon Linki Nasıl Alınır?
          </h2>
          <p className="text-xs text-gray-400">
            Oluşturulan tasarımı şablon olarak müşterilerinize sunmak için Canva üzerinden şablon kopyalama bağlantısını almanız gerekir:
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 pt-2">
          {steps.map((step) => (
            <div key={step.no} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-lg shadow-inner">
                {step.icon}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-semibold text-white">
                  {step.no}. {step.title}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Note Alertbox */}
        <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs">💡</span>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">
              Önemli Canva Notu
            </span>
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">
            Canva şablon bağlantısı (Template Link) oluşturma özelliği **Canva Pro** veya **Canva for Teams** hesabı gerektirmektedir. Ücretsiz hesaplarda bu seçenek görünmeyebilir.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.99] transition-all"
        >
          Anladım, Linki Almaya Hazırım 🚀
        </button>
      </div>
    </div>
  );
}
