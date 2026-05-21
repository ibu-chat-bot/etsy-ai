import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/provider';
import { getOpenAIClient } from '@/lib/openai/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const project = await db.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Proje bulunamadı' }, { status: 404 });
    }

    const { templateLink } = await request.json();

    const client = await getOpenAIClient();
    const slideCount = project.templateCount || 5;

    if (!client) {
      // Return high-quality, fully populated premium Turkish/English fallback templates
      const isTr = project.language === 'tr';
      return NextResponse.json({
        title: isTr
          ? `Lüks ${project.niche} Canva Instagram Şablon Paketi - ${project.style} Sosyal Medya Tasarımları (${slideCount} Slayt)`
          : `Luxury ${project.niche} Canva Instagram Templates - ${project.style} Social Media Bundle Post & Story (${slideCount} Pages)`,
        description: isTr
          ? `🎨 CANVA ŞABLONU — HEMEN DÜZENLEMEYE BAŞLA\n\nŞablonu almak için bu bağlantıyı kullanın:\n${templateLink}\n\n✅ Canva ücretsiz hesapla çalışır\n✅ Tüm metinleri, renkleri ve görselleri değiştirebilirsiniz\n✅ Sürükle-bırak yöntemi ile son derece pratiktir\n\nBu minimalist ${project.niche} şablon paketi, sosyal medyadaki konumlandırmanızı lüks seviyeye taşımak için özel olarak tasarlandı.`
          : `🎨 CANVA TEMPLATE — ELEVATE YOUR BRAND INSTANTLY\n\n📥 CLICK HERE TO DOWNLOAD YOUR TEMPLATES:\n${templateLink}\n\n✅ Fully compatible with a FREE Canva account\n✅ Customize all text, color schemes, and elements in 3 seconds\n\nDesigned specifically for ${project.niche} businesses looking to showcase an editorial, ${project.style} aesthetic that builds high-end trust and boosts organic user engagement.`,
        tags: isTr
          ? 'canva sablonu, instagram bundle, luks tasarim, dijital urun, sosyal medya, guzellik klinigi, estetik post, canva edit, hazir tasarim, instagram post, isletme kiti, seo uyumlu, canva link'
          : 'canva template, instagram bundle, luxury design, digital product, social media, branding kit, aesthetic post, canva edit, instagram post, business bundle, engagement boost, editable post, instant download',
        price: '14.99'
      });
    }

    // Call OpenAI for high-fidelity personalized listing generation
    const userPrompt = `
      Etsy'de satılacak Canva şablon paketi için listing metni yaz.
      
      Ürün Adı: ${project.name}
      Niş / Sektör: ${project.niche}
      Tarz / Stil: ${project.style}
      Şablon Sayısı: ${slideCount}
      Canva Kopyalama Linki: ${templateLink}
      
      Şunları üret:
      1. title: SEO optimize yüksek dönüşümlü Etsy başlığı (en fazla 140 karakter)
      2. description: Zengin, açıklayıcı, faydaları listeleyen, emojili ve Canva bağlantısını net gösteren Etsy açıklaması
      3. tags: Virgülle ayrılmış tam 13 adet popüler Etsy etiketi (her etiket en fazla 20 karakter)
      4. price: Önerilen perakende satış fiyatı (USD cinsinden, örn: "12.99")
      
      Dil: ${project.language === 'tr' ? 'Türkçe' : 'İngilizce (Etsy global pazar için)'}
      
      Yanıtı sadece şu JSON formatında ver, başka hiçbir metin ekleme:
      {
        "title": "Etsy basligi buraya",
        "description": "Etsy aciklamasi buraya",
        "tags": "etiket1, etiket2, ...",
        "price": "14.99"
      }
    `;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are an expert Etsy SEO specialist and copywriter generating digital product listings.' },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7
    });

    const text = response.choices[0].message.content || '{}';
    const listing = JSON.parse(text);

    return NextResponse.json({
      title: listing.title,
      description: listing.description,
      tags: listing.tags,
      price: listing.price || '14.99'
    });
  } catch (err: any) {
    console.error('[Etsy Listing Save] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
