'use client';

import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';

interface CanvasProps {
  templateJSON: any;
}

export const Canvas = forwardRef<any, CanvasProps>(function Canvas(
  { templateJSON },
  ref
) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasElRef.current || !templateJSON) return;

    // Load Fabric.js dynamically on client side to bypass SSR issues
    import('fabric').then(({ fabric }) => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
      }

      // 1080x1080 design workspace fits 540x540 canvas on display scale
      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: 540,
        height: 540,
        backgroundColor: '#0d0d0d'
      });

      canvas.loadFromJSON(templateJSON.fabricJSON, () => {
        canvas.setZoom(0.5); // Downscale zoom to fit screen boundaries
        canvas.renderAll();
      });

      // Hook up selection listeners to trigger parent panels update
      canvas.on('selection:created', () => {
        canvas.renderAll();
      });
      canvas.on('selection:updated', () => {
        canvas.renderAll();
      });

      fabricRef.current = canvas;
    });

    return () => {
      fabricRef.current?.dispose();
    };
  }, [templateJSON]);

  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricRef.current,
    exportPNG: () => {
      const canvas = fabricRef.current;
      if (!canvas) return null;

      // Temporary zoom up scaling to fetch high-res 1080x1080 output
      canvas.setZoom(1);
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 1
      });
      canvas.setZoom(0.5); // Zoom back down for visual display consistency
      return dataURL;
    }
  }));

  return (
    <div className="relative border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/80 bg-[#0d0d0d]">
      <canvas ref={canvasElRef} />
    </div>
  );
});
