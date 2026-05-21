# 🎨 Antigravity Template Editor
### Kendi Mini Editörün — Canva'ya Gerek Yok

> Müşteri Etsy'den satın alır → link alır → tarayıcıda düzenler → PNG indirir.
> Hiçbir üçüncü tarafa bağımlı değilsin.

---

## Sistem Mimarisi

```
[Etsy Satışı]
Müşteri satın alır
      ↓
Otomatik e-posta → Tek kullanımlık editör linki
      ↓
antigravity.com/editor/[token]
      ↓
[Tarayıcı Editörü]
Metin düzenle → Renk değiştir → Logo yükle
      ↓
PNG/JPG indir (1080x1080)
      ↓
İstediği platformda kullanır
```

---

## Tech Stack

| Katman | Teknoloji | Neden |
|--------|-----------|-------|
| Framework | Next.js 14 | Mevcut sistemle uyumlu |
| Editör motoru | Fabric.js | Canvas tabanlı, güçlü |
| Şablon depolama | JSON dosyaları | Basit, hızlı |
| Token sistemi | UUID + Redis/DB | Tek kullanımlık link |
| PNG export | Fabric.js toDataURL | Tarayıcıda render |
| E-posta | Resend veya Nodemailer | Link gönderimi |

---

## Proje Klasör Yapısı

```
antigravity/
├── app/
│   ├── editor/
│   │   └── [token]/
│   │       └── page.tsx          ← Editör sayfası
│   └── api/
│       ├── editor/
│       │   ├── validate/route.ts  ← Token doğrula
│       │   └── export/route.ts    ← PNG export
│       └── purchase/
│           └── route.ts           ← Satış sonrası link üret
├── components/
│   └── editor/
│       ├── Canvas.tsx             ← Fabric.js canvas
│       ├── TextPanel.tsx          ← Metin düzenleme paneli
│       ├── ColorPanel.tsx         ← Renk değiştirme paneli
│       ├── ImagePanel.tsx         ← Logo/görsel yükleme
│       └── ExportButton.tsx       ← PNG indirme
├── lib/
│   ├── templates/                 ← Şablon JSON dosyaları
│   │   ├── beauty-promo.json
│   │   ├── real-estate-card.json
│   │   └── food-post.json
│   └── tokens.ts                  ← Token oluştur/doğrula
└── public/
    └── templates/                 ← Şablon önizleme görselleri
```

---

## ADIM 1 — Şablon JSON Sistemi

Her şablon bir JSON dosyası. Fabric.js bu JSON'u okuyup canvas'a çizer.

**Dosya:** `lib/templates/beauty-promo.json`

```json
{
  "id": "beauty-promo-01",
  "name": "Beauty Promo Post",
  "category": "beauty",
  "width": 1080,
  "height": 1080,
  "thumbnail": "/templates/beauty-promo-01.png",
  "editableFields": ["headline", "subtext", "cta", "brandColor", "logo"],
  "fabricJSON": {
    "version": "5.3.0",
    "objects": [
      {
        "type": "rect",
        "left": 0,
        "top": 0,
        "width": 1080,
        "height": 1080,
        "fill": "#0D0D0D",
        "selectable": false,
        "id": "background"
      },
      {
        "type": "rect",
        "left": 40,
        "top": 40,
        "width": 1000,
        "height": 1000,
        "fill": "transparent",
        "stroke": "#00f5c4",
        "strokeWidth": 2,
        "selectable": false,
        "id": "border-accent"
      },
      {
        "type": "text",
        "left": 540,
        "top": 320,
        "text": "EXPERIENCE LUXURY",
        "fontSize": 72,
        "fontFamily": "Playfair Display",
        "fontWeight": "bold",
        "fill": "#FFFFFF",
        "textAlign": "center",
        "originX": "center",
        "originY": "center",
        "editable": true,
        "id": "headline"
      },
      {
        "type": "text",
        "left": 540,
        "top": 440,
        "text": "Premium Aesthetic Clinic",
        "fontSize": 32,
        "fontFamily": "Inter",
        "fill": "#00f5c4",
        "textAlign": "center",
        "originX": "center",
        "originY": "center",
        "editable": true,
        "id": "subtext"
      },
      {
        "type": "rect",
        "left": 540,
        "top": 820,
        "width": 400,
        "height": 70,
        "rx": 35,
        "fill": "#00f5c4",
        "originX": "center",
        "originY": "center",
        "id": "cta-bg"
      },
      {
        "type": "text",
        "left": 540,
        "top": 820,
        "text": "BOOK NOW",
        "fontSize": 24,
        "fontFamily": "Inter",
        "fontWeight": "bold",
        "fill": "#000000",
        "textAlign": "center",
        "originX": "center",
        "originY": "center",
        "editable": true,
        "id": "cta"
      }
    ]
  }
}
```

---

## ADIM 2 — Token Sistemi

**Dosya:** `lib/tokens.ts`

```typescript
import { db } from "./db"  // mevcut db bağlantın

export interface EditorToken {
  token: string
  templateId: string
  purchaseId: string        // Etsy order ID
  usedAt: Date | null       // null = henüz kullanılmadı
  expiresAt: Date           // 30 gün
  downloadCount: number     // max 3 indirme hakkı
  createdAt: Date
}

export async function tokenOlustur(templateId: string, purchaseId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30) // 30 gün geçerli

  await db.saveEditorToken({
    token,
    templateId,
    purchaseId,
    usedAt: null,
    expiresAt,
    downloadCount: 0,
    createdAt: new Date()
  })

  return token
}

export async function tokenDogrula(token: string): Promise<{
  gecerli: boolean
  templateId?: string
  hata?: string
}> {
  const data = await db.getEditorToken(token)

  if (!data) return { gecerli: false, hata: "Geçersiz link" }
  if (new Date() > new Date(data.expiresAt)) return { gecerli: false, hata: "Link süresi dolmuş" }
  if (data.downloadCount >= 3) return { gecerli: false, hata: "İndirme hakkı doldu (max 3)" }

  return { gecerli: true, templateId: data.templateId }
}

export async function indirmeSayisiArtir(token: string): Promise<void> {
  const data = await db.getEditorToken(token)
  if (data) {
    await db.saveEditorToken({
      ...data,
      downloadCount: data.downloadCount + 1,
      usedAt: data.usedAt || new Date()
    })
  }
}
```

---

## ADIM 3 — Editör Sayfası

**Dosya:** `app/editor/[token]/page.tsx`

```tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { Canvas } from "@/components/editor/Canvas"
import { TextPanel } from "@/components/editor/TextPanel"
import { ColorPanel } from "@/components/editor/ColorPanel"
import { ImagePanel } from "@/components/editor/ImagePanel"
import { ExportButton } from "@/components/editor/ExportButton"

export default function EditorPage({ params }: { params: { token: string } }) {
  const [yukleniyor, setYukleniyor] = useState(true)
  const [hata, setHata] = useState<string | null>(null)
  const [templateJSON, setTemplateJSON] = useState<any>(null)
  const [aktifPanel, setAktifPanel] = useState<"text" | "color" | "image">("text")
  const canvasRef = useRef<any>(null)

  useEffect(() => {
    const tokenDogrula = async () => {
      try {
        const res = await fetch(`/api/editor/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: params.token })
        })
        const data = await res.json()

        if (!res.ok || !data.gecerli) {
          setHata(data.hata || "Geçersiz veya süresi dolmuş link")
          return
        }

        // Şablonu yükle
        const templateRes = await fetch(`/api/editor/template?id=${data.templateId}`)
        const template = await templateRes.json()
        setTemplateJSON(template)
      } catch {
        setHata("Bağlantı hatası")
      } finally {
        setYukleniyor(false)
      }
    }

    tokenDogrula()
  }, [params.token])

  if (yukleniyor) return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ color: "#888", fontSize: 16 }}>Editör yükleniyor...</div>
    </div>
  )

  if (hata) return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0a",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16
    }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h1 style={{ color: "#fff", fontSize: 24 }}>{hata}</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        Bu link geçersiz, süresi dolmuş veya indirme hakkı bitmiş.
      </p>
    </div>
  )

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      display: "grid",
      gridTemplateColumns: "280px 1fr",
      gridTemplateRows: "60px 1fr"
    }}>

      {/* Üst bar */}
      <div style={{
        gridColumn: "1 / -1",
        background: "#111",
        borderBottom: "1px solid #1e1e1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px"
      }}>
        <span style={{ color: "#00f5c4", fontWeight: 700, fontSize: 16 }}>
          ✦ Antigravity Editor
        </span>
        <ExportButton canvasRef={canvasRef} token={params.token} />
      </div>

      {/* Sol panel */}
      <div style={{
        background: "#111",
        borderRight: "1px solid #1e1e1e",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Panel seçici */}
        <div style={{ display: "flex", borderBottom: "1px solid #1e1e1e" }}>
          {[
            { id: "text", label: "Metin", icon: "T" },
            { id: "color", label: "Renk", icon: "●" },
            { id: "image", label: "Görsel", icon: "🖼" }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setAktifPanel(p.id as any)}
              style={{
                flex: 1,
                padding: "12px 0",
                background: aktifPanel === p.id ? "#1a1a1a" : "transparent",
                border: "none",
                borderBottom: aktifPanel === p.id ? "2px solid #00f5c4" : "2px solid transparent",
                color: aktifPanel === p.id ? "#fff" : "#555",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              {p.icon} {p.label}
            </button>
          ))}
        </div>

        {/* Panel içeriği */}
        <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
          {aktifPanel === "text" && <TextPanel canvasRef={canvasRef} />}
          {aktifPanel === "color" && <ColorPanel canvasRef={canvasRef} />}
          {aktifPanel === "image" && <ImagePanel canvasRef={canvasRef} />}
        </div>
      </div>

      {/* Canvas alanı */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        padding: 40
      }}>
        <Canvas
          ref={canvasRef}
          templateJSON={templateJSON}
        />
      </div>

    </div>
  )
}
```

---

## ADIM 4 — Fabric.js Canvas Bileşeni

**Dosya:** `components/editor/Canvas.tsx`

```tsx
"use client"

import { useEffect, useImperativeHandle, forwardRef, useRef } from "react"

// Fabric.js kurulum:
// npm install fabric@5

export const Canvas = forwardRef(function Canvas(
  { templateJSON }: { templateJSON: any },
  ref
) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<any>(null)

  useEffect(() => {
    if (!canvasElRef.current || !templateJSON) return

    // Fabric.js dinamik import (SSR sorunu önlemek için)
    import("fabric").then(({ fabric }) => {
      // Önceki canvas'ı temizle
      if (fabricRef.current) {
        fabricRef.current.dispose()
      }

      const canvas = new fabric.Canvas(canvasElRef.current, {
        width: 540,   // Ekranda 540px göster
        height: 540,  // Ama export 1080x1080
      })

      // Şablonu yükle
      canvas.loadFromJSON(templateJSON.fabricJSON, () => {
        // Ölçek ayarla (1080 → 540, yarı boyut)
        canvas.setZoom(0.5)
        canvas.renderAll()
      })

      fabricRef.current = canvas
    })

    return () => {
      fabricRef.current?.dispose()
    }
  }, [templateJSON])

  // Parent'ın canvas'a erişmesi için
  useImperativeHandle(ref, () => ({
    getCanvas: () => fabricRef.current,
    exportPNG: () => {
      const canvas = fabricRef.current
      if (!canvas) return null
      // Orijinal 1080x1080 boyutunda export
      canvas.setZoom(1)
      const dataURL = canvas.toDataURL({
        format: "png",
        quality: 1,
        multiplier: 1
      })
      canvas.setZoom(0.5)
      return dataURL
    }
  }))

  return (
    <div style={{
      boxShadow: "0 0 60px rgba(0,0,0,0.8)",
      borderRadius: 8,
      overflow: "hidden"
    }}>
      <canvas ref={canvasElRef} />
    </div>
  )
})
```

---

## ADIM 5 — Panel Bileşenleri

### TextPanel.tsx

```tsx
"use client"

import { useState, useEffect } from "react"

export function TextPanel({ canvasRef }: { canvasRef: any }) {
  const [seciliObje, setSeciliObje] = useState<any>(null)
  const [metin, setMetin] = useState("")
  const [fontSize, setFontSize] = useState(40)

  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return

    canvas.on("selection:created", (e: any) => {
      const obj = e.selected[0]
      if (obj?.type === "text" || obj?.type === "i-text") {
        setSeciliObje(obj)
        setMetin(obj.text)
        setFontSize(obj.fontSize)
      }
    })

    canvas.on("selection:cleared", () => {
      setSeciliObje(null)
    })
  }, [canvasRef])

  const metinGuncelle = (yeniMetin: string) => {
    setMetin(yeniMetin)
    if (seciliObje) {
      seciliObje.set("text", yeniMetin)
      canvasRef.current?.getCanvas()?.renderAll()
    }
  }

  const fontSizeGuncelle = (size: number) => {
    setFontSize(size)
    if (seciliObje) {
      seciliObje.set("fontSize", size)
      canvasRef.current?.getCanvas()?.renderAll()
    }
  }

  if (!seciliObje) return (
    <div style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 40 }}>
      Düzenlemek için tasarımda bir metne tıkla
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 6 }}>
          METİN
        </label>
        <textarea
          value={metin}
          onChange={e => metinGuncelle(e.target.value)}
          style={{
            width: "100%",
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "10px 12px",
            color: "#fff",
            fontSize: 14,
            resize: "vertical",
            minHeight: 80
          }}
        />
      </div>

      <div>
        <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 6 }}>
          YAZI BOYUTU — {fontSize}px
        </label>
        <input
          type="range"
          min={12}
          max={120}
          value={fontSize}
          onChange={e => fontSizeGuncelle(Number(e.target.value))}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  )
}
```

### ColorPanel.tsx

```tsx
"use client"

import { useState, useEffect } from "react"

const HAZIR_RENKLER = [
  "#000000", "#FFFFFF", "#00f5c4", "#FF2D78",
  "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#D4AF37", "#1C1C1C", "#FAF9F6", "#C4623A"
]

export function ColorPanel({ canvasRef }: { canvasRef: any }) {
  const [seciliObje, setSeciliObje] = useState<any>(null)

  useEffect(() => {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas) return
    canvas.on("selection:created", (e: any) => setSeciliObje(e.selected[0]))
    canvas.on("selection:cleared", () => setSeciliObje(null))
  }, [canvasRef])

  const renkUygula = (renk: string, alan: "fill" | "stroke") => {
    if (!seciliObje) return
    seciliObje.set(alan, renk)
    canvasRef.current?.getCanvas()?.renderAll()
  }

  if (!seciliObje) return (
    <div style={{ color: "#555", fontSize: 13, textAlign: "center", marginTop: 40 }}>
      Renk değiştirmek için bir element seç
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 10 }}>
          DOLGU RENGİ
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {HAZIR_RENKLER.map(renk => (
            <button
              key={renk}
              onClick={() => renkUygula(renk, "fill")}
              style={{
                width: "100%",
                aspectRatio: "1",
                background: renk,
                border: "2px solid #333",
                borderRadius: 8,
                cursor: "pointer"
              }}
            />
          ))}
        </div>

        {/* Özel renk */}
        <div style={{ marginTop: 10 }}>
          <label style={{ color: "#666", fontSize: 11 }}>Özel renk</label>
          <input
            type="color"
            onChange={e => renkUygula(e.target.value, "fill")}
            style={{ width: "100%", height: 40, marginTop: 6, borderRadius: 8, cursor: "pointer" }}
          />
        </div>
      </div>
    </div>
  )
}
```

### ImagePanel.tsx

```tsx
"use client"

export function ImagePanel({ canvasRef }: { canvasRef: any }) {

  const gorselEkle = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      import("fabric").then(({ fabric }) => {
        fabric.Image.fromURL(e.target?.result as string, (img) => {
          const canvas = canvasRef.current?.getCanvas()
          if (!canvas) return

          // Orantılı küçült
          img.scaleToWidth(300)
          img.set({ left: 100, top: 100 })
          canvas.add(img)
          canvas.setActiveObject(img)
          canvas.renderAll()
        })
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={{ color: "#888", fontSize: 11, display: "block", marginBottom: 10 }}>
          LOGO / GÖRSEL YÜKLE
        </label>
        <label style={{
          display: "block",
          background: "#1a1a1a",
          border: "2px dashed #333",
          borderRadius: 10,
          padding: "24px 16px",
          textAlign: "center",
          cursor: "pointer",
          color: "#555",
          fontSize: 13
        }}>
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) gorselEkle(file)
            }}
          />
          🖼 Görsel seç veya sürükle
        </label>
      </div>
    </div>
  )
}
```

---

## ADIM 6 — Export Butonu

**Dosya:** `components/editor/ExportButton.tsx`

```tsx
"use client"

import { useState } from "react"

export function ExportButton({ canvasRef, token }: { canvasRef: any; token: string }) {
  const [indiriliyor, setIndiriliyor] = useState(false)
  const [hakSayisi, setHakSayisi] = useState(3)

  const handleIndir = async () => {
    if (hakSayisi <= 0) {
      alert("İndirme hakkınız doldu (max 3)")
      return
    }

    setIndiriliyor(true)
    try {
      const dataURL = canvasRef.current?.exportPNG()
      if (!dataURL) return

      // İndirme sayısını kaydet
      await fetch("/api/editor/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      })

      // PNG olarak indir
      const link = document.createElement("a")
      link.download = "antigravity-design.png"
      link.href = dataURL
      link.click()

      setHakSayisi(h => h - 1)
    } finally {
      setIndiriliyor(false)
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ color: "#555", fontSize: 12 }}>
        {hakSayisi}/3 indirme hakkı
      </span>
      <button
        onClick={handleIndir}
        disabled={indiriliyor || hakSayisi <= 0}
        style={{
          background: hakSayisi > 0 ? "#00f5c4" : "#222",
          color: hakSayisi > 0 ? "#000" : "#555",
          border: "none",
          borderRadius: 10,
          padding: "10px 24px",
          fontWeight: 700,
          fontSize: 14,
          cursor: hakSayisi > 0 ? "pointer" : "default"
        }}
      >
        {indiriliyor ? "⏳ Hazırlanıyor..." : "⬇ PNG İndir (1080×1080)"}
      </button>
    </div>
  )
}
```

---

## ADIM 7 — API Endpoint'leri

### Token Doğrula

**Dosya:** `app/api/editor/validate/route.ts`

```typescript
import { tokenDogrula } from "@/lib/tokens"

export async function POST(req: Request) {
  const { token } = await req.json()
  const sonuc = await tokenDogrula(token)
  
  if (!sonuc.gecerli) {
    return Response.json({ gecerli: false, hata: sonuc.hata }, { status: 403 })
  }

  return Response.json({ gecerli: true, templateId: sonuc.templateId })
}
```

### Export Kaydet

**Dosya:** `app/api/editor/export/route.ts`

```typescript
import { indirmeSayisiArtir } from "@/lib/tokens"

export async function POST(req: Request) {
  const { token } = await req.json()
  await indirmeSayisiArtir(token)
  return Response.json({ success: true })
}
```

### Satış Sonrası Token Üret

**Dosya:** `app/api/purchase/route.ts`

```typescript
// Etsy webhook veya manuel tetik
// Her satıştan sonra bu endpoint çağrılır

import { tokenOlustur } from "@/lib/tokens"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
  const { templateId, purchaseId, buyerEmail } = await req.json()

  const token = await tokenOlustur(templateId, purchaseId)
  const editorLink = `https://antigravity.com/editor/${token}`

  // Müşteriye e-posta gönder
  await sendEmail({
    to: buyerEmail,
    subject: "✦ Tasarımınız Hazır — Antigravity",
    html: `
      <h2>Satın Alımınız İçin Teşekkürler!</h2>
      <p>Tasarımınızı düzenlemek için aşağıdaki linke tıklayın:</p>
      <a href="${editorLink}" style="
        background: #00f5c4;
        color: #000;
        padding: 14px 28px;
        border-radius: 8px;
        font-weight: bold;
        text-decoration: none;
        display: inline-block;
      ">
        Tasarımı Düzenle →
      </a>
      <p style="color: #888; font-size: 12px;">
        Link 30 gün geçerlidir. 3 indirme hakkınız bulunmaktadır.
      </p>
    `
  })

  return Response.json({ success: true, editorLink })
}
```

---

## ADIM 8 — Şablon Üretim Fabrikası

Sistem şablonları otomatik üretir. Sen sadece onaylar ve yayınlarsın.

```typescript
// lib/templateFactory.ts
// Mevcut Antigravity prompt sistemiyle entegre

export async function sablonUret(params: {
  sektor: string
  stil: string
  format: string
  renk: string[]
}): Promise<TemplateJSON> {

  // 1. GPT ile şablon içeriği üret
  const icerik = await gptIcerikUret(params)

  // 2. Fabric.js JSON şablonu oluştur
  const fabricJSON = fabricJSONOlustur({
    width: 1080,
    height: 1080,
    renkler: params.renk,
    icerik
  })

  // 3. Şablonu kaydet
  const template: TemplateJSON = {
    id: `${params.sektor}-${params.stil}-${Date.now()}`,
    name: icerik.name,
    category: params.sektor,
    thumbnail: "", // Sonra generate edilir
    fabricJSON
  }

  await db.saveTemplate(template)
  return template
}
```

---

## Etsy İş Modeli

```
Ürün fiyatı: $12-25
Link 30 gün geçerli
3 indirme hakkı

Etsy listesi başlığı:
"Editable Instagram Template — No Canva Needed | 
Edit in Browser | Instant Download"

Açıklama:
✅ Tarayıcıda direkt düzenle — hesap açmana gerek yok
✅ Metin, renk ve logo değiştir
✅ 1080x1080 PNG indir
✅ Instagram, TikTok, Facebook'ta kullan
✅ 30 gün erişim, 3 indirme hakkı
```

---

## Kurulum Sırası

```
□ 1.  npm install fabric@5
□ 2.  lib/tokens.ts oluştur
□ 3.  İlk şablon JSON'u yaz (beauty-promo.json)
□ 4.  Canvas.tsx bileşeni — Fabric.js entegrasyonu
□ 5.  TextPanel, ColorPanel, ImagePanel bileşenleri
□ 6.  ExportButton — PNG indirme
□ 7.  app/editor/[token]/page.tsx — editör sayfası
□ 8.  api/editor/validate — token doğrulama
□ 9.  api/editor/export — indirme sayacı
□ 10. api/purchase — token üret + e-posta gönder
□ 11. Test: Token oluştur → /editor/[token] aç → düzenle → indir
□ 12. İlk şablonu Etsy'ye yükle
```

---

## Neden Bu Sistem Kazanır

| Rakip | Sorun | Sen |
|-------|-------|-----|
| Canva şablonları | Canva hesabı gerekir | Direkt açılır |
| PDF dosyaları | Düzenlenemez | Tarayıcıda düzenlenir |
| Photoshop dosyaları | Uygulama gerekir | Hesap açmadan çalışır |
| Figma şablonları | Figma hesabı gerekir | Direkt açılır |

**Etsy'de bu kategoride neredeyse rakip yok.**

---

*Antigravity Template Editor — v1.0*
*Fabric.js · Next.js · Tek Kullanımlık Token · PNG Export*
