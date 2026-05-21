import OpenAI from 'openai';
import { db } from '../db/provider';
import { 
  MARKET_STRATEGY_PROMPT, 
  SEO_GENERATOR_PROMPT, 
  VISUAL_DIRECTION_PROMPT, 
  CONTENT_BLUEPRINT_PROMPT,
  IMAGE_PROMPTS_PROMPT,
  CANVA_LAYOUT_PLANNER_PROMPT,
  MOCKUP_PROMPT_PROMPT,
  PRODUCT_COPY_PROMPT,
  SHOP_BRANDING_PROMPT
} from '@/prompts';

// Helper: Get configured OpenAI client
export async function getOpenAIClient(): Promise<OpenAI | null> {
  try {
    const settings = await db.getSettings();
    const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({ apiKey });
  } catch (err) {
    return null;
  }
}

export const openaiClient = {
  // 1. STRATEGIST
  async generateMarketStrategy(name: string, niche: string, style: string, language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockStrategy(name, niche, style, language);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini', // cost-effective and highly reliable
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: MARKET_STRATEGY_PROMPT },
          { 
            role: 'user', 
            content: `Analyze for:
Product Name: ${name}
Niche: ${niche}
Style Accent: ${style}
Language: ${language === 'tr' ? 'Turkish' : 'English'}` 
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.warn('OpenAI Strategy failed, falling back to mockup strategy:', err);
      return this.getMockStrategy(name, niche, style, language);
    }
  },

  // 2. SEO GENERATOR
  async generateSEODetails(name: string, niche: string, style: string, strategy: string, language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockSEO(name, niche, style, language);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SEO_GENERATOR_PROMPT },
          { 
            role: 'user', 
            content: `Generate SEO elements for:
Product Name: ${name}
Niche: ${niche}
Style: ${style}
Market Positioning Context: ${strategy}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.warn('OpenAI SEO failed, falling back to mock:', err);
      return this.getMockSEO(name, niche, style, language);
    }
  },

  // 3. VISUAL DIRECTION ENGINE
  async generateVisualDirection(name: string, niche: string, style: string, strategy: string, language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockVisualSystem(name, niche, style, language);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: VISUAL_DIRECTION_PROMPT },
          { 
            role: 'user', 
            content: `Map visual style direction for:
Product Name: ${name}
Niche: ${niche}
Style Requested: ${style}
Market Context: ${strategy}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.6
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.warn('OpenAI Visual style mapping failed, falling back to mock:', err);
      return this.getMockVisualSystem(name, niche, style, language);
    }
  },

  // 4. CONTENT BLUEPRINT ENGINE
  async generateContentBlueprints(name: string, niche: string, style: string, visualDir: string, templateCount: number, language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockBlueprints(templateCount, language);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CONTENT_BLUEPRINT_PROMPT },
          { 
            role: 'user', 
            content: `Generate exactly ${templateCount} template blueprint structures for:
Product Name: ${name}
Niche: ${niche}
Style: ${style}
Visual Guidelines Summary: ${visualDir}
Template Count: ${templateCount}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text).blueprints || this.getMockBlueprints(templateCount, language);
    } catch (err) {
      console.warn('OpenAI Blueprints failed, falling back to mock:', err);
      return this.getMockBlueprints(templateCount, language);
    }
  },

  // 5. IMAGE PROMPTS EXTRACTOR
  async generateImagePrompts(name: string, niche: string, style: string, visualDir: string, blueprints: any[], language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockImagePrompts(blueprints);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: IMAGE_PROMPTS_PROMPT },
          { 
            role: 'user', 
            content: `Generate DALL-E image prompts matching the blueprints:
Product Name: ${name}
Niche: ${niche}
Style Accent: ${style}
Visual Guidelines: ${visualDir}
Blueprints List: ${JSON.stringify(blueprints)}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text).imagePrompts || this.getMockImagePrompts(blueprints);
    } catch (err) {
      console.warn('OpenAI Image Prompts extraction failed, falling back to mock:', err);
      return this.getMockImagePrompts(blueprints);
    }
  },

  // 6. CANVA LAYOUT PLANNER
  async generateLayoutPlanner(name: string, niche: string, style: string, blueprints: any[], language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockLayoutPlanner(blueprints, language);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: CANVA_LAYOUT_PLANNER_PROMPT },
          { 
            role: 'user', 
            content: `Generate layout coords for:
Product Name: ${name}
Niche: ${niche}
Style: ${style}
Blueprints List: ${JSON.stringify(blueprints)}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.6
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.warn('OpenAI Canva Layout Planner failed, falling back to mock:', err);
      return this.getMockLayoutPlanner(blueprints, language);
    }
  },

  // 7. MOCKUP PROMPT GENERATOR
  async generateMockupPrompts(name: string, niche: string, style: string, language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockMockupPrompts(language).prompts;

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: MOCKUP_PROMPT_PROMPT },
          { 
            role: 'user', 
            content: `Generate 3 mockup prompts for:
Product Name: ${name}
Niche: ${niche}
Style: ${style}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content || '{}';
      const parsed = JSON.parse(text);
      return parsed.prompts || this.getMockMockupPrompts(language).prompts;
    } catch (err) {
      console.warn('OpenAI Mockup Prompts failed, falling back to mock:', err);
      return this.getMockMockupPrompts(language).prompts;
    }
  },

  // 8. PRODUCT COPY GENERATOR
  async generateListingCopy(name: string, niche: string, style: string, language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockListingCopy(language);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PRODUCT_COPY_PROMPT },
          { 
            role: 'user', 
            content: `Generate listing copywriting assets for:
Product Name: ${name}
Niche: ${niche}
Style: ${style}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.warn('OpenAI Listing Copy failed, falling back to mock:', err);
      return this.getMockListingCopy(language);
    }
  },

  // 9. SHOP BRANDING ASSISTANT
  async generateShopBranding(name: string, niche: string, style: string, language: 'en' | 'tr') {
    const client = await getOpenAIClient();
    if (!client) return this.getMockShopBranding(language);

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SHOP_BRANDING_PROMPT },
          { 
            role: 'user', 
            content: `Generate shop branding recommendations for:
Product Name: ${name}
Niche: ${niche}
Style: ${style}
Language: ${language === 'tr' ? 'Turkish' : 'English'}`
          }
        ],
        temperature: 0.7
      });

      const text = response.choices[0].message.content || '{}';
      return JSON.parse(text);
    } catch (err) {
      console.warn('OpenAI Shop Branding failed, falling back to mock:', err);
      return this.getMockShopBranding(language);
    }
  },

  /* ==========================================================================
     MOCK DATA FALLBACKS (WHEN OPENAI API KEY IS ABSENT)
     ========================================================================== */

  getMockStrategy(name: string, niche: string, style: string, lang: 'en' | 'tr') {
    const isTr = lang === 'tr';
    return {
      nicheOpportunity: isTr 
        ? `Etsy üzerinde ${niche} alanında ${style} tasarımlara yönelik yüksek hacimli bir talep bulunmaktadır. Düşük rekabetli alt anahtar kelimelere odaklanılarak yüksek dönüşüm elde edilebilir.` 
        : `High-volume search indicators for ${style} style digital assets in the ${niche} market. Low-competition keywords offer optimal entry.`,
      targetAudience: isTr
        ? `Kaliteli görsellere ihtiyaç duyan işletme sahipleri, Instagram üreticileri ve lüks marka konumlandırması yapmak isteyen dijital ajanslar.`
        : `Premium boutique owners, social media managers, and aesthetic influencers looking for instant high-end visual systems.`,
      marketPositioning: isTr
        ? `Lüks ve minimalizm estetiğini bir araya getiren, düzenlemesi son derece kolay, tipografi odaklı şablon koleksiyonu.`
        : `High-end editorial layout that breathes luxury, minimalist spacing, and clean typography.`,
      competitorAngle: isTr
        ? `Rakipler sıradan renk şemaları kullanırken, bu paket özgün renk geçişleri ve özel hazırlanmış profesyonel kopya taslakları ile öne çıkıyor.`
        : `While competitors use generic designs, this collection implements high-fashion color pairings and fully written CTA hooks.`,
      designOpportunity: isTr
        ? `Geniş beyaz alanlar, gölge detayları, zarif sans-serif fontlar ve lüks hissi veren altın/pastel tonları.`
        : `Generous whitespace ratios, editorial headers, delicate borders, and custom glass textures.`,
      valueProposition: isTr
        ? `Etsy'de saniyeler içinde lüks marka imajı oluşturan 1 numaralı hazır Canva paketi.`
        : `The ultimate instant luxury brand kit to capture high-ticket customers on social media.`
    };
  },

  getMockSEO(name: string, niche: string, style: string, lang: 'en' | 'tr') {
    const isTr = lang === 'tr';
    return {
      title: isTr
        ? `Lüks ${niche} Canva Instagram Şablon Paketi - ${style} Estetik Sosyal Medya Tasarımları`
        : `Luxury ${niche} Canva Instagram Templates - ${style} Social Media Bundle Post & Story`,
      description: isTr
        ? `İşletmenizi bir üst seviyeye taşıyacak profesyonel Canva şablon paketi! Kolayca düzenlenebilir, lüks detaylar içerir.`
        : `Elevate your digital branding with our professional Canva template bundle. 100% editable, highly customizable, and structured for organic engagement.`,
      tags: isTr
        ? ["canva sablonu", "instagram bundle", "luks tasarim", "dijital urun", "sosyal medya", "guzellik klinigi", "estetik post", "canva edit", "hazir tasarim", "instagram post", "isletme kiti", "seo uyumlu", "canva link"]
        : ["canva template", "instagram bundle", "luxury design", "digital product", "social media", "branding kit", "aesthetic post", "canva edit", "instagram post", "business bundle", "engagement boost", "editable post", "instant download"],
      keywords: isTr
        ? ["canva instagram şablonu", "lüks sosyal medya paketi", "hazır şablon seti"]
        : ["canva instagram template", "luxury branding bundle", "aesthetic social media pack"],
      faq: isTr
        ? [
            { question: "Canva Pro hesabı gerekiyor mu?", answer: "Hayır, ücretsiz bir Canva hesabı şablonları düzenlemek için yeterlidir." },
            { question: "Satın alma sonrası ne alacağım?", answer: "Anında indirebileceğiniz, Canva bağlantılarını ve kullanım kılavuzunu içeren şık bir teslimat PDF'i alacaksınız." },
            { question: "Ticari kullanım serbest mi?", answer: "Evet, şablonları kendi sosyal medyanız veya müşteri hesaplarınız için sınırsızca kullanabilirsiniz." }
          ]
        : [
            { question: "Do I need a Canva Pro account?", answer: "No! All elements used are completely free, a free Canva account is all you need." },
            { question: "What do I get after purchasing?", answer: "You will receive an instant download delivery PDF containing direct access links and instructions." },
            { question: "Can I use these for client accounts?", answer: "Yes, you have full rights to customize these for your brand or your clients' branding." }
          ],
      features: isTr
        ? ["%100 Düzenlenebilir Canva Bağlantısı", "Modern ve Minimalist Tasarım Dili", "Sürükle-Bırak Görsel Alanları", "Tam Uyumlu Yazı Tipi Çiftleri", "Profesyonel Satış Odaklı Kopya Düzeni"]
        : ["100% Customizable in free Canva Web App", "Harmonious and sleek color palette", "Grid system layouts for premium aesthetics", "Drag and drop placeholders for instant image swapping", "Pre-written high-converting copy headlines"]
    };
  },

  getMockVisualSystem(name: string, niche: string, style: string, lang: 'en' | 'tr') {
    return {
      colorPalette: [
        { name: 'Obsidian Black', hex: '#0B0F19' },
        { name: 'Emerald Sage', hex: '#10b981' },
        { name: 'Soft Linen Beige', hex: '#F5F5F0' },
        { name: 'Champagne Gold', hex: '#D4AF37' },
        { name: 'Mist Slate', hex: '#94A3B8' }
      ],
      typography: [
        { role: 'Headings', font: 'Playfair Display', style: 'Elegant Serif' },
        { role: 'Subheadings', font: 'Montserrat', style: 'Clean Geometric Sans' },
        { role: 'Body Text', font: 'Inter', style: 'Highly Readable Sans' }
      ],
      visualMood: lang === 'tr' ? 'Lüks, temiz, seçkin ve profesyonel.' : 'Premium, editorial, high-end, and minimalist.',
      compositionStyle: 'Wide margin grid structure focusing on typography.',
      designLanguage: 'Subtle 1px glass borders, rounded corners (16px), soft amber glowing gradients.',
      ctaStyle: 'Contrasting solid color button layouts with clean letter-spaced uppercase labels.',
      spacingSystem: 'Generous padding (24px default) and 35% empty negative space ratio.'
    };
  },

  getMockBlueprints(count: number, lang: 'en' | 'tr') {
    const isTr = lang === 'tr';
    const purposes = isTr 
      ? ["Özel Teklif / Promosyon", "Müşteri Değerlendirmesi / Testimonial", "Hizmet Vurgusu / Liste", "Önce / Sonra Karşılaştırma", "Günün İpucu / Bilgilendirici", "Sıkça Sorulan Sorular / FAQ", "Hakkımızda / Tanıtım", "Ürün Galerisi / Showcase"]
      : ["Promo Post / Special Offer", "Client Review / Testimonial", "Services Highlight / Pricing", "Before / After Visual", "Tip of the Day / Microblog", "Frequently Asked Questions", "About Us / Meet the Team", "Product Showcase"];
    
    const blueprints = [];
    for (let i = 1; i <= count; i++) {
      const purpose = purposes[(i - 1) % purposes.length];
      blueprints.push({
        templateNumber: i,
        purpose: purpose,
        layoutStructure: isTr 
          ? `Sayfa ${i}: Üstte büyük başlık, ortada 1 adet şık görsel alanı, altta belirgin buton/CTA çubuğu.` 
          : `Page ${i}: Large elegant header text block, 1 prominent central image placeholder frame, clean footer CTA button block.`,
        cta: isTr ? "Bugün Rezervasyon Yapın // Link Profilde" : "Book Your Session Today // Link in Bio",
        textHierarchy: isTr
          ? `Başlık: 'Özel Estetik Hizmeti' | Alt Başlık: '%20 İndirimli Tanıtım Fiyatı' | Gövde: 'Detaylı bilgi ve rezervasyon için profilimizi ziyaret edin.'`
          : `Headline: 'Elevate Your Look' | Subheading: '20% Off Launch Pricing' | Body: 'Limited slots available. Click the link in bio to register.'`
      });
    }
    return blueprints;
  },

  getMockImagePrompts(blueprints: any[]) {
    return blueprints.map((b) => ({
      templateNumber: b.templateNumber,
      purpose: b.purpose,
      prompt: `Stock image for '${b.purpose}': luxury minimalist backdrop, soft studio lighting, pastel colors, editorial design aesthetic, highly commercial, sharp details, raw-photo, no text watermarks`
    }));
  },

  getMockLayoutPlanner(blueprints: any[], lang: 'en' | 'tr') {
    const isTr = lang === 'tr';
    return {
      canvasSize: "1080x1080px (Square)",
      backgroundHex: "#F5F5F0",
      headingFont: "Playfair Display",
      headingCoords: isTr 
        ? "Yükseklik: Üstten 120px, Boyut: 72px, Ortalanmış, Harf Aralığı: -1px"
        : "Top: 120px, Size: 72px, Centered, Letter-spacing: -1px",
      heroImageCoords: isTr
        ? "Ortalanmış, Genişlik: 480px, Yükseklik: 650px, Kenar Yuvarlama: 12px"
        : "Centered, Width: 480px, Height: 650px, Border-radius: 12px",
      ctaButtonCoords: isTr
        ? "Alt: 150px, Boyut: 320x80px, Arka Plan: #10B981, Yuvarlaklık: 12px"
        : "Bottom: 150px, Size: 320x80px, Background: #10B981, Rounded: 12px",
      layoutGuidance: isTr
        ? "Yazı tiplerinde kontrastı yüksek tutun. Geniş beyaz alanlar bırakarak zarif bir görünüm sağlayın."
        : "Keep high contrast in typography. Allow generous negative whitespace for a sophisticated feel."
    };
  },

  getMockMockupPrompts(lang: 'en' | 'tr') {
    const isTr = lang === 'tr';
    return {
      prompts: isTr ? [
        "iPhone ekranında Instagram şablon paketini gösteren premium mockup, temiz ve nötr masa düzeni, yumuşak gölgeler, tepeden görünüm",
        "Mermer ofis çalışma alanında dijital ajanda düzenini gösteren geniş ekran laptop mockup tasarımı, minimal estetik",
        "Nötr okaliptüs yapraklarının yanında duran ahşap zemin üzerinde A4 basılı kağıt mockup, lüks ve şık görünüm"
      ] : [
        "premium Etsy listing mockup showing Instagram post bundle on iPhone screen with clean neutral desk setup, elegant shadows, top-down view",
        "widescreen laptop screen mockup displaying the digital planner layout on a marble office workspace, minimal aesthetic",
        "A4 printed paper sheet mockup on a wooden background next to neutral eucalyptus leaves, high-end look"
      ]
    };
  },

  getMockListingCopy(lang: 'en' | 'tr') {
    const isTr = lang === 'tr';
    return {
      salesBullets: isTr ? [
        "Ücretsiz Canva hesabınızla doğrudan %100 özelleştirilebilir şablonlar",
        "Kitle dönüşümünü artırmak için özel olarak yazılmış harekete geçirici başlıklar",
        "Sıcak keten ve obsidyen tonları içeren yüksek moda tarzı tasarım dili"
      ] : [
        "100% customizable templates directly inside your free Canva account",
        "Expertly written call-to-action hooks to optimize audience conversion",
        "Generous high-fashion styling with custom obsidian and warm linen tones"
      ],
      benefits: isTr 
        ? "Boutique sahipleri, içerik üreticileri ve dijital ajanslar için saniyeler içinde lüks marka algısı oluşturmak üzere tasarlandı."
        : "Perfect for digital creators, busy agencies, and boutique owners looking for instant premium branding.",
      ctaCopy: isTr 
        ? "Sosyal medyadaki konumunuzu sadece 3 tıklama ile zirveye taşıyın!"
        : "Elevate your social media game in 3 simple clicks!",
      placeholderTexts: isTr ? [
        "Buraya özel promosyon başlığınızı girin",
        "Bu kutuya ana müşteri yorumunuzu yazın"
      ] : [
        "Insert your special promotion title here",
        "Write your primary customer quote in this box"
      ],
      introCopy: isTr
        ? "Çevrimiçi ortamda inkar edilemez derecede premium bir duruş sergilemeye hazır mısınız? Bu profesyonel şablon seti, dikkati çeken ve ilgiyi sürdüren yüksek düzeyde editoryal bir hava sunar."
        : "Are you ready to establish an undeniable premium presence online? This professionally designed template set offers a high-end editorial vibe that captures attention and retains interest."
    };
  },

  getMockShopBranding(lang: 'en' | 'tr') {
    const isTr = lang === 'tr';
    return {
      shopNames: isTr ? ["EstetikStüdyo", "KetenVeObsidyen", "MinimalistDijital"] : ["AestheticStudio", "SageObsidianCo", "MinimalistDigitalX"],
      shopBio: isTr 
        ? "Boutique markalar için zarif dijital varlıklar ve premium Canva şablon setleri küratörü."
        : "Curators of elegant digital assets and premium Canva layout kits for boutique brands.",
      bannerCopy: isTr
        ? "Dijital Markalamayı Anında Yükseltin // %100 Düzenlenebilir Canva Şablonları"
        : "Elevate Your Digital Branding Instantly // 100% Customizable Canva Templates",
      profileDescription: isTr
        ? "Boutique mağaza sahiplerinin ve yaratıcıların editoryal mükemmellikle işlerini ölçeklendirmelerine yardımcı olmak için yüksek dönüşümlü, profesyonel kaynaklar tasarlıyoruz."
        : "We design high-conversion, professional resources to help creators and boutique shop owners scale their business with editorial excellence.",
      categorySuggestions: isTr ? [
        "Instagram Paketleri",
        "Butik Planlayıcılar",
        "Medya Kitleri",
        "İş Fatura Kartları"
      ] : [
        "Instagram Bundles",
        "Boutique Planners",
        "Media Kits",
        "Business Invoice Cards"
      ]
    };
  }
};
