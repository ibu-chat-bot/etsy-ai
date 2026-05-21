# 🎨 Etsy Canva Şablon Satış Sistemi
### Çalışan Workflow: Sistem Üretir → Sen Link Alırsın → Müşteri Düzenler

---

## Nasıl Çalışıyor

```
Sistem tasarımı üretir (SVG)
         ↓
"Canva'da Aç" butonuna bas (otomatik açılır)
         ↓
Canva'da "Şablon linki" alırsın (30 saniye)
         ↓
Linki sisteme yapıştırırsın
         ↓
Etsy'de ürün sayfasına otomatik eklenir
         ↓
Müşteri satın alır → linke tıklar → kendi hesabında düzenler
```

---

## Adım 1 — "Canva'da Aç" Butonu

**Dosya:** `src/app/projects/[id]/page.tsx`

Mevcut "Deploy" butonunun yanına ekle:

```tsx
// State ekle
const [canvaAcildi, setCanvaAcildi] = useState(false)
const [templateLink, setTemplateLink] = useState(project.templateLink || "")
const [linkKaydedildi, setLinkKaydedildi] = useState(!!project.templateLink)

// Canva'da aç fonksiyonu
const handleCanvadaAc = () => {
  if (!project.canvaDesignId) {
    toast.error("Önce tasarımı oluştur")
    return
  }
  // Senin Canva hesabındaki tasarımı aç
  const editUrl = `https://www.canva.com/design/${project.canvaDesignId}/edit`
  window.open(editUrl, "_blank")
  setCanvaAcildi(true)
}

// JSX
<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
  
  {/* Canva'da Aç Butonu */}
  <button
    onClick={handleCanvadaAc}
    style={{
      background: "#7C3AED",
      color: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "12px 24px",
      fontWeight: 700,
      fontSize: 14,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: 8
    }}
  >
    🎨 Canva'da Aç
  </button>

  {/* Canva açıldıktan sonra link girişi çıkar */}
  {canvaAcildi && !linkKaydedildi && (
    <div style={{
      background: "#111",
      border: "1px solid #7C3AED40",
      borderRadius: 12,
      padding: 16
    }}>
      <p style={{ color: "#aaa", fontSize: 13, marginBottom: 10 }}>
        Canva'da şu adımları yap:
      </p>
      <ol style={{ color: "#888", fontSize: 12, paddingLeft: 16, marginBottom: 12, lineHeight: 2 }}>
        <li>Sağ üstte <strong style={{color:"#fff"}}>"Paylaş"</strong> butonuna tıkla</li>
        <li><strong style={{color:"#fff"}}>"Şablon olarak kullan linki"</strong> seçeneğini bul</li>
        <li><strong style={{color:"#fff"}}>"Linki Kopyala"</strong> butonuna bas</li>
        <li>Aşağıya yapıştır</li>
      </ol>
      
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={templateLink}
          onChange={e => setTemplateLink(e.target.value)}
          placeholder="https://www.canva.com/design/.../copy"
          style={{
            flex: 1,
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "10px 14px",
            color: "#fff",
            fontSize: 13
          }}
        />
        <button
          onClick={() => handleTemplateLinkKaydet(templateLink)}
          disabled={!templateLink.includes("canva.com")}
          style={{
            background: templateLink.includes("canva.com") ? "#00f5c4" : "#222",
            color: templateLink.includes("canva.com") ? "#000" : "#555",
            border: "none",
            borderRadius: 8,
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 13,
            whiteSpace: "nowrap"
          }}
        >
          Kaydet ✓
        </button>
      </div>
    </div>
  )}

  {/* Link kaydedildiyse göster */}
  {linkKaydedildi && (
    <div style={{
      background: "#00f5c410",
      border: "1px solid #00f5c440",
      borderRadius: 10,
      padding: 12,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }}>
      <span style={{ color: "#00f5c4", fontSize: 13 }}>
        ✅ Şablon linki kaydedildi
      </span>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => navigator.clipboard.writeText(templateLink)}
          style={{
            background: "transparent",
            border: "1px solid #333",
            borderRadius: 6,
            padding: "4px 10px",
            color: "#888",
            cursor: "pointer",
            fontSize: 12
          }}
        >
          📋 Kopyala
        </button>
        <button
          onClick={() => {
            setLinkKaydedildi(false)
            setTemplateLink("")
          }}
          style={{
            background: "transparent",
            border: "1px solid #333",
            borderRadius: 6,
            padding: "4px 10px",
            color: "#888",
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Değiştir
        </button>
      </div>
    </div>
  )}

</div>
```

---

## Adım 2 — Template Link Kaydet API

**Yeni dosya:** `src/app/api/projects/[id]/template-link/route.ts`

```typescript
import { NextRequest } from "next/server"
import { db } from "@/lib/db"  // kendi db bağlantın

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { templateLink } = await req.json()

  // Linkin gerçekten Canva linki olduğunu doğrula
  if (!templateLink.includes("canva.com/design")) {
    return Response.json({ error: "Geçersiz Canva linki" }, { status: 400 })
  }

  // Veritabanına kaydet
  await db.project.update({
    where: { id: params.id },
    data: { 
      templateLink,
      templateLinkSavedAt: new Date()
    }
  })

  return Response.json({ success: true, templateLink })
}
```

**handleTemplateLinkKaydet fonksiyonu** (page.tsx'e ekle):

```typescript
const handleTemplateLinkKaydet = async (link: string) => {
  try {
    const res = await fetch(`/api/projects/${project.id}/template-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateLink: link })
    })

    if (res.ok) {
      setLinkKaydedildi(true)
      toast.success("Şablon linki kaydedildi!")
    } else {
      toast.error("Geçersiz link")
    }
  } catch {
    toast.error("Kaydetme hatası")
  }
}
```

---

## Adım 3 — Veritabanı Güncellemesi

**Prisma schema'ya ekle** (`prisma/schema.prisma`):

```prisma
model Project {
  // mevcut alanlar...
  
  templateLink          String?   // Canva şablon linki
  templateLinkSavedAt   DateTime? // Link kayıt tarihi
  canvaDesignId         String?   // Canva design ID
}
```

```bash
npx prisma migrate dev --name add_template_link
```

---

## Adım 4 — Etsy Ürün Sayfası Otomatik Güncelle (Opsiyonel)

Template link kaydedilince Etsy listing'e otomatik ekle.

**Dosya:** `src/app/api/projects/[id]/template-link/route.ts` — kaydet fonksiyonuna ekle:

```typescript
// Template link kaydedildikten sonra
// Etsy listing description'ına ekle

const etsyDescription = `
🎨 CANVA ŞABLONu — HEMEN DÜZENLEMEYE BAŞLA

Şablonu almak için: ${templateLink}

✅ Canva hesabına kopyalanır
✅ Tüm metinleri değiştirebilirsin
✅ Renkleri ve fontları düzenleyebilirsin
✅ Canva ücretsiz hesapla çalışır
`

// Eğer Etsy API entegrasyonu varsa buraya ekle
// Yoksa description'ı kopyala-yapıştır hazır ver
await db.project.update({
  where: { id: params.id },
  data: { 
    templateLink,
    etsyDescription,  // Hazır Etsy açıklaması
    templateLinkSavedAt: new Date()
  }
})
```

---

## Adım 5 — Canva'da Şablon Linki Nasıl Alınır (Görsel Rehber)

Sisteme bu adımları gösteren küçük bir modal ekle.
Kullanıcı "Canva'da Aç" basınca otomatik açılsın.

**Yeni dosya:** `src/components/CanvaRehberi.tsx`

```tsx
export function CanvaRehberi({ acik, onKapat }: { acik: boolean; onKapat: () => void }) {
  if (!acik) return null

  const ADIMLAR = [
    {
      no: 1,
      baslik: "Paylaş butonuna tıkla",
      aciklama: "Canva editörünün sağ üst köşesindeki yeşil 'Paylaş' butonuna bas",
      icon: "🔗"
    },
    {
      no: 2,
      baslik: "Şablon linkini bul",
      aciklama: "Açılan menüde 'Şablon olarak kullan linki' seçeneğini bul ve tıkla",
      icon: "📋"
    },
    {
      no: 3,
      baslik: "Linki kopyala",
      aciklama: "'Linki Kopyala' butonuna bas. Link panoya kopyalanır.",
      icon: "✅"
    },
    {
      no: 4,
      baslik: "Sisteme yapıştır",
      aciklama: "Geri gel ve kopyaladığın linki kutuya yapıştır, Kaydet'e bas",
      icon: "💾"
    },
  ]

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000
    }}>
      <div style={{
        background: "#111",
        border: "1px solid #222",
        borderRadius: 16,
        padding: 32,
        maxWidth: 480,
        width: "90%"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>
            🎨 Canva Şablon Linki Al
          </h2>
          <button
            onClick={onKapat}
            style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 20 }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {ADIMLAR.map(adim => (
            <div key={adim.no} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#00f5c420", border: "1px solid #00f5c440",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: 18
              }}>
                {adim.icon}
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{adim.baslik}</div>
                <div style={{ color: "#666", fontSize: 12, marginTop: 2, lineHeight: 1.5 }}>{adim.aciklama}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 24,
          background: "#0a0a0a",
          border: "1px solid #1e1e1e",
          borderRadius: 10,
          padding: 12
        }}>
          <p style={{ color: "#555", fontSize: 11, margin: 0 }}>
            💡 Canva Pro gereklidir. Ücretsiz hesapta şablon linki özelliği bulunmaz.
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## Adım 6 — Etsy Listing Hazırlama

Template link kaydedildikten sonra sistem hazır Etsy metni üretsin.

**Dosya:** `src/app/api/projects/[id]/etsy-listing/route.ts`

```typescript
import OpenAI from "openai"
const openai = new OpenAI()

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { projectName, niche, templateLink, slideCount } = await req.json()

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "user",
      content: `
        Etsy'de satılacak Canva şablon paketi için listing metni yaz.
        
        Ürün: ${projectName}
        Niş: ${niche}
        Şablon sayısı: ${slideCount}
        Canva linki: ${templateLink}
        
        Şunları üret:
        1. title: SEO optimize Etsy başlığı (max 140 karakter)
        2. description: Etsy açıklaması (emoji kullan, faydaları listele, linki ekle)
        3. tags: 13 Etsy etiketi (virgülle ayır)
        4. price: Önerilen fiyat (USD)
        
        Dil: İngilizce (Etsy global pazar)
        
        JSON formatında ver:
        { "title": "", "description": "", "tags": "", "price": "" }
      `
    }],
    response_format: { type: "json_object" }
  })

  const listing = JSON.parse(completion.choices[0].message.content!)
  return Response.json(listing)
}
```

---

## Tam Akış Özeti

```
1. Sistem 9 adımı tamamlar → tasarım oluşur
         ↓
2. "Canva'da Aç" butonuna bas
         ↓  
3. Canva açılır (senin hesabında tasarım görünür)
         ↓
4. Paylaş → Şablon linki al → Kopyala (30 saniye)
         ↓
5. Linki sisteme yapıştır → Kaydet
         ↓
6. Sistem otomatik Etsy listing metni üretir
         ↓
7. Etsy'de ürün sayfası aç, metni yapıştır, linki ekle
         ↓
8. Müşteri satın alır → linke tıklar → kendi Canva'sında düzenler
```

---

## Uygulama Sırası

```
□ 1. prisma/schema.prisma'ya templateLink ve canvaDesignId ekle
□ 2. npx prisma migrate dev çalıştır
□ 3. api/projects/[id]/template-link/route.ts oluştur
□ 4. CanvaRehberi.tsx bileşenini oluştur
□ 5. page.tsx'e "Canva'da Aç" butonunu ekle
□ 6. handleTemplateLinkKaydet fonksiyonunu ekle
□ 7. api/projects/[id]/etsy-listing/route.ts oluştur
□ 8. Template link kaydedilince Etsy listing butonu çıkar
□ 9. Test: Tasarım oluştur → Canva'da aç → Link al → Kaydet
```

---

## Canva Pro Notu

Şablon linki özelliği **Canva Pro** gerektirir.
Aylık ~$15 — Etsy'den ilk 2-3 satışta karşılanır.

---

*Etsy Canva Şablon Sistemi — Çalışan Workflow v1.0*
*Sistem Üretir · Sen Link Alırsın · Müşteri Düzenler*
