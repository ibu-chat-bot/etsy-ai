'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { CanvaRehberi } from '@/components/CanvaRehberi';
import { 
  Sparkles, 
  ArrowLeft, 
  Settings, 
  FileText, 
  Layers, 
  CheckSquare, 
  TrendingUp, 
  RefreshCw, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  Download,
  ExternalLink,
  Compass,
  Layout,
  Palette,
  BookOpen,
  Check
} from 'lucide-react';
import { Project, SEOAssets, VisualSystem, ContentBlueprint } from '@/types';

export default function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter();
  const { id: projectId } = use(params);

  // Data States
  const [project, setProject] = useState<Project | null>(null);
  const [seo, setSeo] = useState<SEOAssets | null>(null);
  const [visual, setVisual] = useState<VisualSystem | null>(null);
  const [blueprints, setBlueprints] = useState<ContentBlueprint[]>([]);
  const [promptOutputs, setPromptOutputs] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'strategy' | 'seo' | 'styling' | 'layouts' | 'images' | 'canva' | 'package'
  >('strategy');
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [copiedJSON, setCopiedJSON] = useState(false);

  // Automation Pipeline States
  const [canvaBuilding, setCanvaBuilding] = useState(false);
  const [canvaProject, setCanvaProject] = useState<any | null>(null);
  const [canvaError, setCanvaError] = useState<{ message: string; hint?: string } | null>(null);
  const [canvaRehberiAcik, setCanvaRehberiAcik] = useState(false);
  const [inputTemplateLink, setInputTemplateLink] = useState('');
  const [savingLink, setSavingLink] = useState(false);
  const [etsyListingCopy, setEtsyListingCopy] = useState<any | null>(null);
  const [generatingEtsyListing, setGeneratingEtsyListing] = useState(false);
  const [copiedEtsyField, setCopiedEtsyField] = useState<string | null>(null);
  const [generatedAssets, setGeneratedAssets] = useState<any[]>([]);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [generatingMockups, setGeneratingMockups] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [packagingZip, setPackagingZip] = useState(false);

  // Load project aggregate details
  const loadProjectDetails = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setProject(data.project);
      setSeo(data.seo);
      setVisual(data.visual);
      setBlueprints(data.blueprints || []);
      setPromptOutputs(data.promptOutputs || []);
      setCanvaProject(data.canvaProject || null);
      if (data.canvaProject?.templateLink) {
        setInputTemplateLink(data.canvaProject.templateLink);
      }
      setGeneratedAssets(data.generatedAssets || []);
    } catch (err) {
      console.error('Failed to load project details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectDetails();
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');
      if (tab && ['strategy', 'seo', 'styling', 'layouts', 'images', 'canva', 'package'].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, [projectId]);

  // Extract parsed strategic content helpers
  const getOutputByType = (type: string) => {
    const found = promptOutputs.find((p) => p.promptType === type);
    if (!found) return null;
    try {
      return JSON.parse(found.content);
    } catch {
      return found.content;
    }
  };

  const strategy = getOutputByType('idea_generator');
  const layoutPlanner = getOutputByType('layout_planner');
  const imagePrompts = getOutputByType('image_prompts');
  const mockupPrompts = getOutputByType('mockup_prompts')?.prompts || [];
  const listingCopy = getOutputByType('product_copy');
  const shopBranding = getOutputByType('shop_branding');

  // Handle Copy Node
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Color Copier
  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  // JSON Recipe Copier & Downloader
  const handleCopyJSON = (recipe: string) => {
    navigator.clipboard.writeText(recipe);
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const handleDownloadJSON = (recipe: string) => {
    const blob = new Blob([recipe], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'layout-recipe.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Duplicator
  const handleDuplicate = async () => {
    if (!project) return;
    setRegenerating('duplicate');
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${project.name} (Copy)`,
          niche: project.niche,
          productType: project.productType,
          style: project.style,
          language: project.language,
          templateCount: project.templateCount,
          aspectRatio: project.aspectRatio
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/projects/${data.project.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegenerating(null);
    }
  };

  // Delete project
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    setRegenerating('delete');
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error(err);
      setRegenerating(null);
    }
  };

  // Selective Strategy Regeneration Router
  const handleRegenerate = async (target: string) => {
    setRegenerating(target);
    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      
      if (res.ok) {
        await loadProjectDetails();
      } else {
        const errData = await res.json();
        alert(`Regeneration failed: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error during regeneration: ${err.message}`);
    } finally {
      setRegenerating(null);
    }
  };

  // Download consolidator TXT helper
  const downloadStrategyTXT = () => {
    let output = `# ETSY DIGITAL PRODUCT STRATEGY BUNDLE
Project: ${project?.name}
Niche: ${project?.niche} | Style: ${project?.style} | Format: ${project?.productType}
Language: ${project?.language === 'tr' ? 'Turkish' : 'English'}

==================================================
1. PRODUCT IDEA & VALUE PROPOSITION
==================================================
Niche Opportunity: ${strategy?.nicheOpportunity || ''}
Target Audience: ${strategy?.targetAudience || ''}
Market Positioning: ${strategy?.marketPositioning || ''}
Competitor Angle: ${strategy?.competitorAngle || ''}
Value Proposition: ${strategy?.valueProposition || ''}

==================================================
2. SEO META PACKAGE
==================================================
Title: ${seo?.title || ''}
Description:
${seo?.description || ''}

Tags (exactly 13):
${seo?.tags?.join(', ') || ''}

Keywords:
${seo?.keywords?.join(', ') || ''}

Features:
${seo?.features?.map((f: string) => `- ${f}`).join('\n') || ''}

==================================================
3. VISUAL STYLE BOARD
==================================================
Mood: ${visual?.designDirection || ''}
Color Palette:
${visual?.colorPalette?.map((c: any) => `- ${c.name}: ${c.hex}`).join('\n') || ''}

Typography Mappings:
${visual?.typography?.map((t: any) => `- ${t.role}: ${t.font} (${t.style})`).join('\n') || ''}

==================================================
4. CANVA PAGE BLUEPRINTS
==================================================
${blueprints?.map((b: any) => `Page ${b.templateNumber}: ${b.purpose}
  - Layout Plan: ${b.layoutStructure}
  - Text Hierarchy: ${b.textHierarchy}
  - Page CTA: ${b.cta}
`).join('\n') || ''}

==================================================
5. CANVA LAYOUT COORDS (PIXEL GUIDANCE)
==================================================
Canvas Sizing: ${layoutPlanner?.canvasSize || ''}
Base Background HEX: ${layoutPlanner?.backgroundHex || ''}
Headline Font: ${layoutPlanner?.headingFont || ''}
Headline Location: ${layoutPlanner?.headingCoords || ''}
Hero Frame Size & Coords: ${layoutPlanner?.heroImageCoords || ''}
CTA Button Size & Coords: ${layoutPlanner?.ctaButtonCoords || ''}
Design Grid Guidelines: ${layoutPlanner?.layoutGuidance || ''}

==================================================
6. STOCK IMAGE PROMPTS (MIDJOURNEY/DALL-E)
==================================================
${imagePrompts?.map((ip: any) => `Page ${ip.templateNumber} [${ip.purpose}]:
${ip.prompt}
`).join('\n') || ''}

==================================================
7. ETSY LISTING MOCKUP SCENE PROMPTS
==================================================
${mockupPrompts?.map((mp: string, idx: number) => `Scene ${idx + 1}:
${mp}
`).join('\n') || ''}

==================================================
8. SALES COPYWRITING PACK
==================================================
Introduction Hook: ${listingCopy?.introCopy || ''}
Emotional Benefit Narrative: ${listingCopy?.benefits || ''}
Primary Conversion CTA Hook: ${listingCopy?.ctaCopy || ''}

Sales Bullets:
${listingCopy?.salesBullets?.map((sb: string) => `- ${sb}`).join('\n') || ''}

Placeholder Text Suggestions:
${listingCopy?.placeholderTexts?.map((p: string) => `- ${p}`).join('\n') || ''}

==================================================
9. ETSY SHOP BRANDING RECOMMENDATIONS
==================================================
Shop Name Ideas: ${shopBranding?.shopNames?.join(', ') || ''}
Shop Tagline/Bio: ${shopBranding?.shopBio || ''}
Shop Banner Copy: ${shopBranding?.bannerCopy || ''}
Shop Profile Narrative: ${shopBranding?.profileDescription || ''}
Etsy Section Categories: ${shopBranding?.categorySuggestions?.join(', ') || ''}
`;

    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Etsy-Strategy-Bundle-${project?.name.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateImages = async () => {
    setGeneratingImages(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-images`, { method: 'POST' });
      if (res.ok) {
        await loadProjectDetails();
      } else {
        alert('Failed to generate visual templates');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering image pipeline');
    } finally {
      setGeneratingImages(false);
    }
  };

  const handleBuildCanva = async () => {
    setCanvaBuilding(true);
    setCanvaError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/build-canva`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCanvaError(null);
        await loadProjectDetails();
      } else {
        // Show the actual Canva API error in the UI
        setCanvaError({
          message: data?.error || 'Unknown Canva API error',
          hint: data?.hint
        });
      }
    } catch (err: any) {
      console.error(err);
      setCanvaError({
        message: err.message || 'Network error calling Canva API',
        hint: 'Check browser console and server terminal for detailed logs'
      });
    } finally {
      setCanvaBuilding(false);
    }
  };

  const handleSaveTemplateLink = async (link: string) => {
    if (!link.includes('canva.com/design')) {
      alert('Lütfen geçerli bir Canva şablon kopyalama bağlantısı (https://www.canva.com/design/...) girin.');
      return;
    }
    setSavingLink(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/template-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateLink: link })
      });
      const data = await res.json();
      if (res.ok) {
        await loadProjectDetails();
        alert('Canva Şablon bağlantısı başarıyla kaydedildi!');
      } else {
        alert(data.error || 'Bağlantı kaydedilemedi');
      }
    } catch (err: any) {
      alert(`Kaydetme hatası: ${err.message}`);
    } finally {
      setSavingLink(false);
    }
  };

  const handleGenerateEtsyListing = async (link: string) => {
    setGeneratingEtsyListing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/etsy-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateLink: link })
      });
      const data = await res.json();
      if (res.ok) {
        setEtsyListingCopy(data);
      } else {
        alert(data.error || 'Etsy listing metinleri üretilemedi');
      }
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setGeneratingEtsyListing(false);
    }
  };

  const handleCopyEtsyField = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEtsyField(fieldName);
    setTimeout(() => setCopiedEtsyField(null), 2000);
  };

  const handleGenerateMockups = async () => {
    setGeneratingMockups(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-mockups`, { method: 'POST' });
      if (res.ok) {
        await loadProjectDetails();
      } else {
        alert('Failed to craft display mockups');
      }
    } catch (err) {
      console.error(err);
      alert('Error rendering showcase frames');
    } finally {
      setGeneratingMockups(false);
    }
  };

  const handleGeneratePDF = async () => {
    setGeneratingPDF(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-pdf`, { method: 'POST' });
      if (res.ok) {
        await loadProjectDetails();
      } else {
        alert('Failed to compile PDF deliverable instructions');
      }
    } catch (err) {
      console.error(err);
      alert('Error building instructions guide');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleExportPackage = async () => {
    setPackagingZip(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/export-package`, { method: 'POST' });
      if (res.ok) {
        await loadProjectDetails();
      } else {
        alert('Failed to compile absolute ZIP deliverable package');
      }
    } catch (err) {
      console.error(err);
      alert('Error compiling ZIP packet');
    } finally {
      setPackagingZip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
        </main>
      </div>
    );
  }

  if (!project) return null;

  const tabs = [
    { id: 'strategy', name: 'Niche Strategy', icon: TrendingUp },
    { id: 'seo', name: 'SEO & Copy Deck', icon: FileText },
    { id: 'styling', name: 'Brand Styling', icon: Palette },
    { id: 'layouts', name: 'Page Blueprints', icon: Layers },
    { id: 'images', name: 'AI Image Builder', icon: Sparkles },
    { id: 'canva', name: 'Canva Design Hub', icon: ExternalLink },
    { id: 'package', name: 'ZIP Exporter', icon: Download }
  ] as const;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 select-none">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-black text-white flex items-center gap-3">
              <span>{project.name}</span>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 tracking-wide uppercase">
                STRATEGY BUILT
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDuplicate}
              disabled={!!regenerating}
              className="px-4 py-2 bg-white/5 border border-white/5 hover:border-white/15 text-white text-xs font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {regenerating === 'duplicate' ? 'Duplicating...' : 'Duplicate Config'}
            </button>
            <button
              onClick={handleDelete}
              disabled={!!regenerating}
              className="p-2 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 rounded-xl transition-all"
            >
              <Trash2 className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Tabbed Side-menu Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1 glass-panel border border-white/5 p-4 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 block font-mono">
              Strategy Studio Tabs
            </span>
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 text-xs font-semibold px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 font-extrabold border-l-4 border-emerald-500' 
                      : 'text-gray-400 hover:text-white hover:bg-white/3'
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Core Panel Content */}
          <div className="lg:col-span-3">
            
            {/* 1. NICHE STRATEGY PANEL */}
            {activeTab === 'strategy' && (
              <div className="space-y-6">
                <GlassCard hoverGlow={false}>
                  <h3 className="text-base font-bold text-white mb-4 pb-2 border-b border-white/5 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-400" />
                    <span>Concept Blueprint Parameters</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-gray-500 font-bold uppercase block">Niche Category</span>
                      <span className="text-gray-200 font-medium">{project.niche}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 font-bold uppercase block">Product Format</span>
                      <span className="text-gray-200 font-medium">{project.productType}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 font-bold uppercase block">Visual Style</span>
                      <span className="text-gray-200 font-medium">{project.style}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 font-bold uppercase block">Aspect Ratio</span>
                      <span className="text-gray-200 font-medium">{project.aspectRatio}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 font-bold uppercase block">Language</span>
                      <span className="text-gray-200 font-medium uppercase font-mono">{project.language}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-gray-500 font-bold uppercase block">Templates Volume</span>
                      <span className="text-gray-200 font-medium">{project.templateCount} Pages</span>
                    </div>
                  </div>
                </GlassCard>

                {strategy && (
                  <GlassCard hoverGlow={false} className="space-y-5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h3 className="text-base font-bold text-white">
                        Strategic Pitch &amp; Value Proposition
                      </h3>
                      <button
                        onClick={() => handleRegenerate('strategy')}
                        disabled={!!regenerating}
                        className="flex items-center gap-1 text-[10px] text-emerald-400 hover:underline"
                      >
                        <RefreshCw className={`w-3 h-3 ${regenerating === 'strategy' ? 'animate-spin' : ''}`} />
                        <span>Regenerate Pitch</span>
                      </button>
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block tracking-wider mb-1">Value Proposition Hook</span>
                      <p className="text-white font-semibold text-sm">"{strategy.valueProposition}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1 bg-slate-950 p-4 border border-gray-900 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase block">Strategic Positioning</span>
                        <p className="text-gray-300 leading-relaxed pt-1">{strategy.marketPositioning}</p>
                      </div>
                      <div className="space-y-1 bg-slate-950 p-4 border border-gray-900 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase block">Differentiation Strategy</span>
                        <p className="text-gray-300 leading-relaxed pt-1">{strategy.competitorAngle}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}

                {shopBranding && (
                  <GlassCard hoverGlow={false} className="space-y-5">
                    <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">
                      Etsy Shop Branding Specification
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase block">Shop Name Recommendations</span>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {shopBranding.shopNames?.map((n: string, idx: number) => (
                            <span key={idx} className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 rounded font-mono font-bold">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase block">Shop Tagline/Bio</span>
                        <p className="text-gray-300 italic pt-1">"{shopBranding.shopBio}"</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl text-xs space-y-2">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase block">Banner Slogan & Banner Copy</span>
                      <p className="text-white font-mono font-semibold">"{shopBranding.bannerCopy}"</p>
                    </div>
                  </GlassCard>
                )}

                <div className="pt-2">
                  <button
                    onClick={downloadStrategyTXT}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Unified Strategy Pack (TXT)</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. SEO & COPY PANEL */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Etsy SEO Copy Deck</h3>
                  <button
                    onClick={() => handleRegenerate('seo')}
                    disabled={!!regenerating}
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-white bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/15 py-1.5 px-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regenerating === 'seo' ? 'animate-spin' : ''}`} />
                    <span>{regenerating === 'seo' ? 'Generating...' : 'Regenerate Copy'}</span>
                  </button>
                </div>

                {seo && (
                  <GlassCard hoverGlow={false} className="space-y-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Listing Title</span>
                        <button onClick={() => handleCopyText(seo.title)} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1">
                          {copiedText === seo.title ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedText === seo.title ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl font-mono text-white text-xs leading-relaxed">
                        {seo.title}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">13 Search Tags</span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {seo.tags?.map((t, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleCopyText(t)}
                            className="text-xs px-2.5 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full font-mono hover:bg-sky-500/20 active:scale-95 transition-all flex items-center gap-1"
                          >
                            <span>{t}</span>
                            {copiedText === t && <Check className="w-3 h-3 text-emerald-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Listing Description</span>
                        <button onClick={() => handleCopyText(seo.description)} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1">
                          {copiedText === seo.description ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedText === seo.description ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl text-gray-300 text-xs leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">
                        {seo.description}
                      </div>
                    </div>
                  </GlassCard>
                )}

                {listingCopy && (
                  <GlassCard hoverGlow={false} className="space-y-5">
                    <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Sales Copywriter Assistant</h3>
                    <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-teal-400 uppercase block">Conversion Hook</span>
                      <p className="text-white text-xs leading-normal">"{listingCopy.introCopy}"</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-teal-400 uppercase block">High-Value Highlights</span>
                        <ul className="space-y-1.5 list-disc list-inside text-gray-300">
                          {listingCopy.salesBullets?.map((sb: string, idx: number) => (
                            <li key={idx}>{sb}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-teal-400 uppercase block">Emotional Selling Story</span>
                        <p className="text-gray-300 leading-normal">{listingCopy.benefits}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl text-xs space-y-2">
                      <span className="text-[10px] font-bold text-teal-400 uppercase block">Call to Action (CTA) Button Link Hook</span>
                      <p className="text-white font-mono bg-black/40 p-2 border border-white/5 rounded">{listingCopy.ctaCopy}</p>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {/* 3. BRAND STYLING PANEL */}
            {activeTab === 'styling' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Brand Visual Guide</h3>
                  <button
                    onClick={() => handleRegenerate('visual')}
                    disabled={!!regenerating}
                    className="flex items-center gap-1.5 text-xs text-pink-400 hover:text-white bg-pink-500/5 hover:bg-pink-500/10 border border-pink-500/15 py-1.5 px-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regenerating === 'visual' ? 'animate-spin' : ''}`} />
                    <span>{regenerating === 'visual' ? 'Generating...' : 'Regenerate Style'}</span>
                  </button>
                </div>

                {visual && (
                  <GlassCard hoverGlow={false} className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block">HEX Color Palette</span>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                        {visual.colorPalette?.map((color, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleCopyColor(color.hex)}
                            className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex flex-col items-center cursor-pointer hover:border-pink-500/30 transition-all select-none relative overflow-hidden group"
                          >
                            <div className="w-full h-10 rounded-lg mb-2 shadow-inner" style={{ backgroundColor: color.hex }} />
                            <span className="text-[10px] font-bold text-white truncate max-w-full text-center">{color.name}</span>
                            <span className="text-[9px] font-mono text-gray-400 mt-0.5">{color.hex}</span>
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] font-bold text-white flex items-center gap-1 uppercase tracking-wider">
                                {copiedColor === color.hex ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                <span>{copiedColor === color.hex ? 'Copied' : 'Copy'}</span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block">Typography Structure</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {visual.typography?.map((typo, idx) => (
                          <div key={idx} className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-0.5">
                            <span className="text-[9px] font-mono text-pink-400 uppercase font-bold tracking-widest">{typo.role}</span>
                            <h5 className="font-extrabold text-white text-sm">{typo.font}</h5>
                            <p className="text-[10px] text-gray-400">{typo.style}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-pink-400 uppercase tracking-wider block mb-1.5">Art Direction Narrative</span>
                      <p className="text-gray-300 leading-relaxed text-xs">{visual.designDirection}</p>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {/* 4. PAGE BLUEPRINTS PANEL */}
            {activeTab === 'layouts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Page Structural Blueprints</h3>
                  <button
                    onClick={() => handleRegenerate('blueprints')}
                    disabled={!!regenerating}
                    className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-white bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/15 py-1.5 px-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${regenerating === 'blueprints' ? 'animate-spin' : ''}`} />
                    <span>{regenerating === 'blueprints' ? 'Generating...' : 'Regenerate Blueprints'}</span>
                  </button>
                </div>

                {blueprints.length > 0 && (
                  <GlassCard hoverGlow={false} className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                    {blueprints.map((b, idx) => (
                      <div key={idx} className="p-4 bg-slate-900/30 border border-white/5 rounded-xl space-y-3">
                        <span className="text-xs font-extrabold text-purple-400 uppercase tracking-widest font-mono block">
                          Page {b.templateNumber} &bull; {b.purpose}
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block">Layout Wireframe</span>
                            <p className="text-gray-300">{b.layoutStructure}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase block">Text Node Content</span>
                            <p className="text-white font-mono bg-slate-950 p-2.5 rounded-lg border border-gray-800">
                              {b.textHierarchy}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </GlassCard>
                )}

                {layoutPlanner && (
                  <GlassCard hoverGlow={false} className="space-y-5">
                    <h3 className="text-base font-bold text-white border-b border-white/5 pb-2">Canvas Placement Coordinates Specs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-1">
                        <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Canvas size coordinates</span>
                        <p className="text-white font-bold">{layoutPlanner.canvasSize}</p>
                      </div>
                      <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-1">
                        <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest block font-mono">Heading font & coords</span>
                        <p className="text-white font-bold">{layoutPlanner.headingFont} // {layoutPlanner.headingCoords}</p>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            )}

            {/* 5. AI IMAGE BUILDER (DALL-E 3) PANEL */}
            {activeTab === 'images' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">AI Stock Visual Pipeline</h3>
                    <p className="text-xs text-gray-500 mt-1">Generate high-fidelity placeholder assets for each blueprint step using DALL-E 3.</p>
                  </div>
                  <button
                    onClick={handleGenerateImages}
                    disabled={generatingImages}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-white bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 py-2 px-4 rounded-xl transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingImages ? 'animate-spin' : ''}`} />
                    <span>{generatingImages ? 'Running DALL-E...' : 'Generate AI Visuals (DALL-E 3)'}</span>
                  </button>
                </div>

                {generatedAssets.filter(a => a.assetType === 'image').length > 0 ? (
                  <GlassCard hoverGlow={false} className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider block">Generated Slide Visuals</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {generatedAssets.filter(a => a.assetType === 'image').map((img, idx) => (
                        <div key={idx} className="bg-slate-900/30 border border-white/5 rounded-xl p-3 flex flex-col space-y-2 relative overflow-hidden group">
                          <img
                            src={img.fileUrl}
                            alt={`Slide asset ${idx + 1}`}
                            className="w-full aspect-square rounded-lg object-cover bg-slate-950 shadow-inner group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-white block">Slide Visual #{idx + 1}</span>
                            <span className="text-[8px] font-mono text-gray-500 block truncate" title={img.promptUsed}>{img.promptUsed || 'DALL-E 3 Placeholder'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard hoverGlow={false} className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-300 mb-1">No AI visual assets generated yet</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">Click generate above to fetch visual layout graphic shapes.</p>
                  </GlassCard>
                )}
              </div>
            )}

            {/* 6. CANVA DESIGN HUB PANEL */}
            {activeTab === 'canva' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Canva Developer Suite</h3>
                    <p className="text-xs text-gray-500 mt-1">Deploy visual boards, upload generated images, and register editable templates links.</p>
                  </div>
                  <button
                    onClick={handleBuildCanva}
                    disabled={canvaBuilding}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-white bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 py-2 px-4 rounded-xl transition-all disabled:opacity-50 font-bold"
                  >
                    <ExternalLink className={`w-3.5 h-3.5 ${canvaBuilding ? 'animate-pulse' : ''}`} />
                    <span>{canvaBuilding ? 'Deploying...' : 'Deploy Templates to Canva'}</span>
                  </button>
                </div>

                {canvaProject ? (
                  <div className="space-y-6">
                    {/* Active Canva Resource Header */}
                    <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Active Canva Design Workspace</span>
                        <h4 className="text-sm font-semibold text-white mt-1">Sistem Tasarımı Üretti & Canva Altyapısı Hazır</h4>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 text-gray-400 py-1 px-3 rounded-lg border border-white/5 align-self-start sm:align-self-auto">
                        Design ID: {canvaProject.canvaDesignId}
                      </span>
                    </div>

                    {/* Step-by-Step Flow Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Step 1: Open in Canva & Extract Link */}
                      <GlassCard hoverGlow={false} className="space-y-5 p-5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono block">Adım 1 — Tasarımı Canva'da Açın</span>
                          <h4 className="text-base font-bold text-white">Canva Hesabınızda Düzenleme & Link Alma</h4>
                          <p className="text-xs text-gray-400">
                            Aşağıdaki butona basarak şablon tasarımını kendi Canva hesabınızda açın. Canva içinde gerekli düzenlemeleri yapıp şablon kopyalama bağlantısını çıkartın.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <a
                            href={`https://www.canva.com/design/${canvaProject.canvaDesignId}/edit`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setCanvaRehberiAcik(true)}
                            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl text-center shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                          >
                            <span>🎨 Canva'da Şablonu Aç</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          
                          <button
                            onClick={() => setCanvaRehberiAcik(true)}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 font-semibold text-xs py-3.5 px-4 rounded-xl border border-white/5 active:scale-[0.98] transition-all"
                          >
                            Nasıl Yapılır? 💡
                          </button>
                        </div>

                        {/* CanvaRehberi Component Injection */}
                        <CanvaRehberi isOpen={canvaRehberiAcik} onClose={() => setCanvaRehberiAcik(false)} />
                      </GlassCard>

                      {/* Step 2: Paste the template Link */}
                      <GlassCard hoverGlow={false} className="space-y-5 p-5">
                        <div className="space-y-1">
                          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono block">Adım 2 — Şablon Kopyalama Bağlantısı</span>
                          <h4 className="text-base font-bold text-white">Müşteri Şablon Bağlantısını Kaydet</h4>
                          <p className="text-xs text-gray-400">
                            Canva'da "Paylaş → Şablon olarak kullan linki" seçeneğinden kopyaladığınız `/copy` bağlantısını buraya yapıştırıp kaydedin.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={inputTemplateLink}
                              onChange={(e) => setInputTemplateLink(e.target.value)}
                              placeholder="https://www.canva.com/design/.../copy"
                              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            
                            <button
                              onClick={() => handleSaveTemplateLink(inputTemplateLink)}
                              disabled={savingLink || !inputTemplateLink.includes('canva.com')}
                              className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/5 text-black disabled:text-gray-500 font-bold text-xs uppercase tracking-wider py-3 px-5 rounded-xl transition-all active:scale-[0.98] shrink-0 disabled:scale-100 flex items-center justify-center gap-1.5"
                            >
                              {savingLink ? 'Kaydediliyor...' : 'Bağlantıyı Kaydet ✓'}
                            </button>
                          </div>

                          {/* Link Saved Success State Indicator */}
                          {canvaProject.templateLink && canvaProject.templateLink.includes('/copy') ? (
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center gap-2">
                                <span className="text-xs">✅</span>
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                                  Şablon Linki Aktif & Kaydedildi
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(canvaProject.templateLink);
                                    alert('Link panoya kopyalandı!');
                                  }}
                                  className="text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 py-1 px-3 rounded-lg border border-white/5 transition-all"
                                >
                                  Kopyala
                                </button>
                                <button
                                  onClick={() => {
                                    setInputTemplateLink('');
                                  }}
                                  className="text-[9px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 py-1 px-3 rounded-lg border border-white/5 transition-all"
                                >
                                  Değiştir
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
                              <p className="text-[10px] text-yellow-500/70 leading-relaxed text-center sm:text-left">
                                ⚠️ Henüz şablon kopyalama bağlantısı kaydedilmedi. Müşterilere teslimat linki sunmak için bağlantıyı girmelisiniz.
                              </p>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    </div>

                    {/* Step 3: Etsy SEO Copywriting Generator */}
                    {canvaProject.templateLink && (
                      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
                        <div className="bg-gradient-to-r from-purple-950/20 to-indigo-950/20 border border-purple-500/15 rounded-3xl p-6 sm:p-8 space-y-6">
                          
                          {/* Header section */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono block">Adım 3 — Satış Asistanı</span>
                              <h3 className="text-lg font-bold text-white">🛍️ Etsy SEO Listing Üretici (AI-Powered)</h3>
                              <p className="text-xs text-gray-400">
                                Canva kopyalama bağlantınız hazır! Şimdi AI gücüyle Etsy mağazanızda hemen satışa sunabileceğiniz SEO başlığını, açıklamasını ve 13 adet etiketi anında oluşturun.
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleGenerateEtsyListing(canvaProject.templateLink)}
                              disabled={generatingEtsyListing}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98] transition-all disabled:opacity-50 shrink-0 self-start sm:self-auto"
                            >
                              {generatingEtsyListing ? 'AI Hazırlıyor...' : 'Etsy Listing Metinlerini Üret ✨'}
                            </button>
                          </div>

                          {/* Listing Results Showcase */}
                          {etsyListingCopy ? (
                            <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
                              
                              {/* 1. SEO Title card */}
                              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">1. SEO Optimize Etsy Ürün Başlığı (Title)</span>
                                  <button
                                    onClick={() => handleCopyEtsyField(etsyListingCopy.title, 'title')}
                                    className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-white/5 transition-all flex items-center gap-1.5"
                                  >
                                    {copiedEtsyField === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-450" />}
                                    <span>{copiedEtsyField === 'title' ? 'Kopyalandı!' : 'Kopyala'}</span>
                                  </button>
                                </div>
                                <p className="text-sm font-semibold text-white bg-black/30 p-3.5 rounded-xl border border-white/5 leading-relaxed">
                                  {etsyListingCopy.title}
                                </p>
                              </div>

                              {/* 2. Description and Tags columns */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                
                                {/* Description Box */}
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 flex flex-col space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">2. Etsy Ürün Açıklaması (Description)</span>
                                    <button
                                      onClick={() => handleCopyEtsyField(etsyListingCopy.description, 'desc')}
                                      className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-white/5 transition-all flex items-center gap-1.5"
                                    >
                                      {copiedEtsyField === 'desc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-450" />}
                                      <span>{copiedEtsyField === 'desc' ? 'Kopyalandı!' : 'Kopyala'}</span>
                                    </button>
                                  </div>
                                  <textarea
                                    readOnly
                                    value={etsyListingCopy.description}
                                    className="flex-1 min-h-[250px] text-xs text-gray-300 font-mono bg-black/35 p-4 rounded-xl border border-white/5 focus:outline-none leading-relaxed resize-none scrollbar-thin"
                                  />
                                </div>

                                {/* Tags & Pricing Box */}
                                <div className="space-y-5 flex flex-col">
                                  
                                  {/* Tags card */}
                                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-3 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono">3. Etsy Arama Etiketleri (13 Tags)</span>
                                      <button
                                        onClick={() => handleCopyEtsyField(etsyListingCopy.tags, 'tags')}
                                        className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-white/5 transition-all flex items-center gap-1.5"
                                      >
                                        {copiedEtsyField === 'tags' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-450" />}
                                        <span>{copiedEtsyField === 'tags' ? 'Kopyalandı!' : 'Kopyala'}</span>
                                      </button>
                                    </div>
                                    
                                    <p className="text-xs text-gray-300 bg-black/30 p-3.5 rounded-xl border border-white/5 leading-relaxed font-mono">
                                      {etsyListingCopy.tags}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                      {etsyListingCopy.tags.split(',').map((tag: string, tid: number) => (
                                        <span key={tid} className="text-[10px] font-medium text-purple-300/80 bg-purple-500/5 border border-purple-500/10 py-1 px-2.5 rounded-lg">
                                          {tag.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Pricing suggestion */}
                                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 sm:p-5 space-y-2.5">
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider font-mono block">4. Önerilen Liste Satış Fiyatı (USD)</span>
                                    <div className="flex items-center justify-between bg-black/30 p-4 rounded-xl border border-white/5">
                                      <span className="text-2xl font-black text-emerald-400 font-mono">${etsyListingCopy.price || '14.99'}</span>
                                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Rekabet Analizine Göre Önerilen Fiyat</span>
                                    </div>
                                  </div>

                                </div>
                              </div>

                              {/* Delivery PDF generation note */}
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-gray-400 leading-relaxed text-center">
                                🎉 Etsy listing hazır! Şimdi <strong className="text-white">"Download Package"</strong> sekmesine giderek müşterilerinize satın alma sonrası sunacağınız şık teslimat PDF'ini anında indirin!
                              </div>

                            </div>
                          ) : (
                            <div className="border border-dashed border-white/10 rounded-2xl py-12 text-center text-gray-500">
                              <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                              <p className="text-xs">Şablon linki girildikten sonra Etsy Listing detaylarınızı AI yardımıyla anında üretin.</p>
                            </div>
                          )}
                          
                        </div>
                      </div>
                    )}

                    {/* Technical details accordion block */}
                    {canvaProject.layoutRecipe && (
                      <div className="mt-4 p-5 bg-slate-950/40 border border-white/5 rounded-2xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-2">
                          <div>
                            <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-widest font-mono block">
                              Programmatic Multi-Page Layout coordinates Recipe JSON
                            </span>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              100% complete layout coordinate configuration recipe mapping brand styling rules:
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleCopyJSON(canvaProject.layoutRecipe)}
                              className="bg-purple-500/10 hover:bg-purple-500/15 text-purple-300 hover:text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl border border-purple-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                            >
                              {copiedJSON ? <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5 text-purple-450" />}
                              <span>{copiedJSON ? 'Copied!' : 'Copy Layout JSON'}</span>
                            </button>

                            <button
                              onClick={() => handleDownloadJSON(canvaProject.layoutRecipe)}
                              className="bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-300 hover:text-white font-bold text-[10px] uppercase tracking-wider px-3.5 py-2 rounded-xl border border-indigo-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Download JSON</span>
                            </button>
                          </div>
                        </div>

                        <pre className="text-[10px] text-gray-300 font-mono bg-black/60 p-4 rounded-xl max-h-[300px] overflow-y-auto border border-gray-900 scrollbar-thin leading-normal">
                          {canvaProject.layoutRecipe}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <GlassCard hoverGlow={false} className="text-center py-12">
                    <ExternalLink className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-gray-300 mb-1">Templates not deployed to Canva yet</p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">Click deploy above to synchronize metadata parameters and trigger REST generation.</p>
                  </GlassCard>
                )}

                {/* Canva API Error Reporter */}
                {canvaError && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <span className="text-xs font-extrabold text-red-400 uppercase tracking-widest block">Canva API Error</span>
                        <p className="text-sm text-red-200 font-mono leading-relaxed bg-black/40 p-3 rounded-xl border border-red-500/20 break-all">
                          {canvaError.message}
                        </p>
                        {canvaError.hint && (
                          <p className="text-xs text-gray-400 pt-1">
                            💡 {canvaError.hint}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setCanvaError(null)}
                        className="text-red-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-all shrink-0"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 7. PRODUCTION ZIP EXPORTER PANEL */}
            {activeTab === 'package' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">ZIP Deliverable Compilation</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Package instructions PDFs, copy decks, and mockup assets into a structured release ZIP.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Step 1: Mockup Compilation */}
                  <GlassCard hoverGlow={false} className="p-5 space-y-3 flex flex-col justify-between h-full bg-slate-900/30">
                    <div>
                      <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest font-mono">1. Etsy Mockups</h4>
                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                        Compile device mockups (MacBook, Phone, Desktop showcase flatlays) to upload directly as listing cover images.
                      </p>
                    </div>
                    <div className="pt-2 space-y-2">
                      {generatedAssets.filter(a => a.assetType === 'mockup').length > 0 && (
                        <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{generatedAssets.filter(a => a.assetType === 'mockup').length} Mockups Ready</span>
                        </div>
                      )}
                      <button
                        onClick={handleGenerateMockups}
                        disabled={generatingMockups}
                        className="w-full text-center py-2.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition-all"
                      >
                        {generatingMockups ? 'Rendering...' : 'Compile Mockup Frames'}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Step 2: Delivery PDF compilation */}
                  <GlassCard hoverGlow={false} className="p-5 space-y-3 flex flex-col justify-between h-full bg-slate-900/30">
                    <div>
                      <h4 className="text-xs font-extrabold text-teal-400 uppercase tracking-widest font-mono">2. Delivery Instructions</h4>
                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                        Generate the buyer-facing thank-you instructions PDF containing the clickable editable Canva template import buttons.
                      </p>
                    </div>
                    <div className="pt-2 space-y-2">
                      {generatedAssets.find(a => a.assetType === 'pdf') && (
                        <a
                          href={generatedAssets.find(a => a.assetType === 'pdf')?.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>PDF Guide Generated (Download)</span>
                        </a>
                      )}
                      <button
                        onClick={handleGeneratePDF}
                        disabled={generatingPDF}
                        className="w-full text-center py-2.5 bg-teal-500/10 hover:bg-teal-500/15 border border-teal-500/20 text-teal-400 text-xs font-bold rounded-xl transition-all"
                      >
                        {generatingPDF ? 'Assembling PDF...' : 'Compile Delivery PDF'}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Step 3: JSZip Bundle creation */}
                  <GlassCard hoverGlow={false} className="p-5 space-y-3 flex flex-col justify-between h-full bg-slate-900/30">
                    <div>
                      <h4 className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-mono">3. Output ZIP Packet</h4>
                      <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                        Merge title/tags sheet logs, instruction sheets, and mockups directory folders into a consolidated deliverable ZIP archive.
                      </p>
                    </div>
                    <div className="pt-2 space-y-2">
                      {generatedAssets.find(a => a.assetType === 'zip') && (
                        <a
                          href={generatedAssets.find(a => a.assetType === 'zip')?.fileUrl}
                          download
                          className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ZIP Package Compiled (Download)</span>
                        </a>
                      )}
                      <button
                        onClick={handleExportPackage}
                        disabled={packagingZip}
                        className="w-full text-center py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl transition-all shadow"
                      >
                        {packagingZip ? 'Bundling ZIP...' : 'Export Complete Bundle (ZIP)'}
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  );
}
