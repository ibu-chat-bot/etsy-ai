'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  Sparkles, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  Download, 
  FileText, 
  Layers, 
  TrendingUp, 
  Compass, 
  CheckSquare,
  BookOpen,
  Layout,
  Palette,
  RefreshCw
} from 'lucide-react';
import { Project } from '@/types';

export function NewProductStepper() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [projectData, setProjectData] = useState<Project | null>(null);

  // Form State (Step 1)
  const [form, setForm] = useState({
    name: '',
    niche: 'Beauty',
    productType: 'Instagram Post Pack',
    style: 'Luxury',
    language: 'en' as 'en' | 'tr',
    templateCount: 6,
    aspectRatio: '1080x1080'
  });

  // Pipeline Data States
  const [strategy, setStrategy] = useState<any>(null);
  const [seo, setSeo] = useState<any>(null);
  const [visualSystem, setVisualSystem] = useState<any>(null);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [layoutPlanner, setLayoutPlanner] = useState<any>(null);
  const [imagePrompts, setImagePrompts] = useState<any[]>([]);
  const [mockupPrompts, setMockupPrompts] = useState<string[]>([]);
  const [listingCopy, setListingCopy] = useState<any>(null);
  const [shopBranding, setShopBranding] = useState<any>(null);

  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const stepsList = [
    { label: 'Details', icon: Compass },
    { label: 'Product Idea', icon: Sparkles },
    { label: 'Niche Analysis', icon: TrendingUp },
    { label: 'SEO Package', icon: FileText },
    { label: 'Blueprint', icon: Layers },
    { label: 'Canva Layout', icon: Layout },
    { label: 'Stock Prompts', icon: Sparkles },
    { label: 'Mockup Prompts', icon: FileText },
    { label: 'Copy & Brand', icon: CheckSquare }
  ];

  // ==========================================
  // PIPELINE RUNNERS
  // ==========================================

  // Step 1: Save project draft
  const handleInitiateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLogs([]);
    addLog('Creating project config draft inside unified database...');

    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project draft');

      setProjectId(data.project.id);
      setProjectData(data.project);
      addLog(`Draft initialized. Assigned Project Node ID: ${data.project.id}`);
      
      // Transition to Step 2 & run Product Idea Strategy
      setStep(2);
      runProductIdea(data.project.id);
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: AI Product Idea Generator
  const runProductIdea = async (id: string) => {
    setLoading(true);
    addLog('Querying Product Idea & Brand Strategist AI...');
    addLog('Analyzing product bundle concept, value propositions, and market opportunities...');
    
    try {
      const res = await fetch(`/api/projects/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'strategy' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Product idea mapping failed');
      
      const parsed = JSON.parse(data.data.content);
      setStrategy(parsed);
      addLog('Strategist completed successfully. Formulated Positioning matrix.');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Etsy Niche Analyzer
  const runNicheAnalysis = async () => {
    setLoading(true);
    addLog('Running Etsy Niche Analyzer...');
    addLog('Analyzing competitor angles, target audiences, and upsell opportunities...');
    
    // Niche analysis is derived from step 2 strategy outputs!
    setTimeout(() => {
      addLog('Niche analysis positioning and competitor intelligence compiled.');
      setLoading(false);
    }, 1000);
  };

  // Step 4: Etsy SEO Generator
  const runSEO = async () => {
    setLoading(true);
    addLog('Running Etsy SEO AI Engine...');
    addLog('Generating listing titles, 13 search tags, features, and FAQ logs...');

    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'seo' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'SEO generation failed');

      setSeo(data.data);
      addLog('Etsy SEO assets generated and logged inside database.');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Content Blueprint & Brand Guidelines
  const runBlueprintsAndVisuals = async () => {
    setLoading(true);
    addLog('Orchestrating Canva Content Blueprint Planner...');
    addLog('Generating brand color palette, typographic rules, and page flow layouts...');

    try {
      // 1. Run visual system
      const resV = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'visual' })
      });
      const dataV = await resV.json();
      if (!resV.ok) throw new Error(dataV.error || 'Visual direction failed');
      setVisualSystem(dataV.data);

      // 2. Run blueprints
      const resB = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'blueprints' })
      });
      const dataB = await resB.json();
      if (!resB.ok) throw new Error(dataB.error || 'Content blueprints failed');
      setBlueprints(dataB.data);

      addLog('Visual style board and page blueprints compiled successfully.');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Canva Layout Planner Coords
  const runLayoutPlanner = async () => {
    setLoading(true);
    addLog('Accessing Canva Layout Planner Coords engine...');
    addLog('Calculating exact background hex, header spacing, and hero coordinate bounds...');

    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'layout_planner' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Layout planner failed');

      const parsed = JSON.parse(data.data.content);
      setLayoutPlanner(parsed);
      addLog('Canva coordinates guidelines successfully calculated.');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 7: Stock Image Prompts Generator
  const runImagePrompts = async () => {
    setLoading(true);
    addLog('Triggering AI Visual Prompts generator...');
    addLog('Generating stock asset prompts for Midjourney/DALL-E 3 image creation...');

    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'image_prompts' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Stock prompts failed');

      const parsed = JSON.parse(data.data.content);
      setImagePrompts(parsed);
      addLog('High-fidelity stock image prompts successfully written.');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 8: Mockup Prompts Generator
  const runMockupPrompts = async () => {
    setLoading(true);
    addLog('Running Etsy Listing Mockup Prompts Strategist...');
    addLog('Drafting scenario layout descriptions (iPhone, desktop workspace flatlays)...');

    try {
      const res = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'mockup_prompts' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mockup prompts failed');

      const parsed = JSON.parse(data.data.content);
      setMockupPrompts(parsed.prompts);
      addLog('Mockup prompt cards created.');
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 9: Copy & Shop Branding + Export Center
  const runCopyAndBranding = async () => {
    setLoading(true);
    addLog('Accessing Listing Copy and Etsy Shop Branding Assistant...');
    addLog('Generating benefit bullet lists, profiles, and shop name ideas...');

    try {
      // 1. Run copy
      const resC = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'copy' })
      });
      const dataC = await resC.json();
      if (!resC.ok) throw new Error(dataC.error || 'Copywriter failed');
      const parsedC = JSON.parse(dataC.data.content);
      setListingCopy(parsedC);

      // 2. Run branding
      const resB = await fetch(`/api/projects/${projectId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: 'branding' })
      });
      const dataB = await resB.json();
      if (!resB.ok) throw new Error(dataB.error || 'Branding assistant failed');
      const parsedB = JSON.parse(dataB.data.content);
      setShopBranding(parsedB);

      // Update project status to completed
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      });

      addLog('Administrative digital strategy packet compiled.');
      addLog('ETSY BRANDING PACKAGE READY FOR DOWNLOAD!');
      addLog('Redirecting to your persistent project workspace in 1.5 seconds...');
      
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 1500);
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // NAVIGATION HANDLERS
  // ==========================================

  const handleNextStep = () => {
    const nextStep = step + 1;
    setStep(nextStep);
    
    if (nextStep === 3) runNicheAnalysis();
    if (nextStep === 4) runSEO();
    if (nextStep === 5) runBlueprintsAndVisuals();
    if (nextStep === 6) runLayoutPlanner();
    if (nextStep === 7) runImagePrompts();
    if (nextStep === 8) runMockupPrompts();
    if (nextStep === 9) runCopyAndBranding();
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  // ==========================================
  // DOWNLOAD STRATEGY BUNDLE (TXT)
  // ==========================================

  const downloadStrategyTXT = () => {
    let output = `# ETSY DIGITAL PRODUCT STRATEGY BUNDLE
Project: ${projectData?.name || form.name}
Niche: ${form.niche} | Style: ${form.style} | Format: ${form.productType}
Language: ${form.language === 'tr' ? 'Turkish' : 'English'}

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
Mood: ${visualSystem?.designDirection || ''}
Color Palette:
${visualSystem?.colorPalette?.map((c: any) => `- ${c.name}: ${c.hex}`).join('\n') || ''}

Typography Mappings:
${visualSystem?.typography?.map((t: any) => `- ${t.role}: ${t.font} (${t.style})`).join('\n') || ''}

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
    link.download = `Etsy-Strategy-Bundle-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isStepDataMissing = () => {
    if (step === 1) return false;
    if (step === 2) return !strategy;
    if (step === 3) return !strategy;
    if (step === 4) return !seo;
    if (step === 5) return !blueprints || blueprints.length === 0 || !visualSystem;
    if (step === 6) return !layoutPlanner;
    if (step === 7) return !imagePrompts || imagePrompts.length === 0;
    if (step === 8) return !mockupPrompts || mockupPrompts.length === 0;
    if (step === 9) return !listingCopy || !shopBranding;
    return false;
  };

  const handleRetryCurrentStep = () => {
    if (step === 2) runProductIdea(projectId);
    if (step === 3) runNicheAnalysis();
    if (step === 4) runSEO();
    if (step === 5) runBlueprintsAndVisuals();
    if (step === 6) runLayoutPlanner();
    if (step === 7) runImagePrompts();
    if (step === 8) runMockupPrompts();
    if (step === 9) runCopyAndBranding();
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderStepsIndicator = () => {
    return (
      <div className="w-full mb-8 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-800">
        <div className="flex items-center justify-between min-w-[800px] px-2">
          {stepsList.map((s, idx) => {
            const stepNum = idx + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            const Icon = s.icon;
            
            return (
              <div key={idx} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all ${
                    isCompleted 
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                      : isActive 
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-extrabold ring-4 ring-emerald-500/10 scale-105' 
                        : 'bg-slate-950 border-gray-800 text-gray-500'
                  }`}>
                    {isCompleted ? <Check className="w-4.5 h-4.5 stroke-[3]" /> : stepNum}
                  </div>
                  <span className={`text-[10px] font-bold mt-2 whitespace-nowrap uppercase tracking-wider ${
                    isActive ? 'text-emerald-400 font-extrabold' : isCompleted ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {s.label}
                  </span>
                </div>

                {idx < stepsList.length - 1 && (
                  <div className="flex-1 h-[2px] mx-3 bg-gray-800 relative -top-3">
                    <div className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500" 
                         style={{ width: isCompleted ? '100%' : '0%' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderConsoleLog = () => {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-widest font-mono">
          <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Strategist Studio Console Log</span>
        </div>
        <div className="bg-slate-950 border border-gray-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-gray-400 max-h-64 overflow-y-auto space-y-1.5 shadow-inner">
          {logs.map((log, idx) => (
            <div key={idx} className={
              log.includes('[ERROR]') ? 'text-red-400' : 
              log.includes('Success') || log.includes('complete') || log.includes('READY') ? 'text-emerald-400' : 'text-gray-400'
            }>
              {log}
            </div>
          ))}
          {loading && (
            <div className="text-emerald-400 animate-pulse flex items-center gap-1.5 mt-1 font-bold">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
              <span>AI Strategist mapping data nodes... please wait...</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 select-none">
      
      {/* Header and Back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        
        {projectId && (
          <span className="text-[10px] font-mono text-gray-500 bg-white/3 border border-white/5 px-2.5 py-1 rounded">
            PROJECT_ID: {projectId}
          </span>
        )}
      </div>

      {renderStepsIndicator()}

      {/* STEP 1: PARAMETER SETUP */}
      {step === 1 && (
        <GlassCard hoverGlow={false} className="max-w-2xl mx-auto">
          <div className="mb-6 pb-4 border-b border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Compass className="w-5.5 h-5.5 text-emerald-400" />
              <span>Project Concept Configurator</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Configure layout, size, niche, and language parameters to bootstrap AI strategists.</p>
          </div>

          <form onSubmit={handleInitiateProject} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Concept Naming</label>
              <input
                type="text"
                required
                placeholder="e.g. Sage & Obsidian Instagram Coach Pack"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Niche</label>
                <select
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                >
                  {['Beauty', 'Real Estate', 'Fitness', 'Wedding', 'Kids', 'Food', 'Education', 'Fashion', 'Spa', 'Medical', 'Restaurant', 'Social Media', 'Business', 'Finance'].map((x) => (
                    <option key={x} value={x} className="bg-slate-950 text-white">{x}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Format</label>
                <select
                  value={form.productType}
                  onChange={(e) => setForm({ ...form, productType: e.target.value })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                >
                  {['Instagram Post Pack', 'Story Bundle', 'Invitation', 'Planner', 'Ebook Template', 'Price List', 'Presentation', 'Flyer', 'Menu', 'Media Kit'].map((x) => (
                    <option key={x} value={x} className="bg-slate-950 text-white">{x}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Visual Style</label>
                <select
                  value={form.style}
                  onChange={(e) => setForm({ ...form, style: e.target.value })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                >
                  {['Luxury', 'Minimal', 'Futuristic', 'Cute', 'Corporate', 'Elegant', 'Modern', 'Editorial', 'Dark Premium'].map((x) => (
                    <option key={x} value={x} className="bg-slate-950 text-white">{x}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Canvas Dimensions</label>
                <select
                  value={form.aspectRatio}
                  onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                >
                  {['1080x1080', '1080x1920', 'A4', 'US Letter', 'Presentation'].map((x) => (
                    <option key={x} value={x} className="bg-slate-950 text-white">{x}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Template Slices Count</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={30}
                  value={form.templateCount}
                  onChange={(e) => setForm({ ...form, templateCount: Number(e.target.value) })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value as 'en' | 'tr' })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                >
                  <option value="en" className="bg-slate-950 text-white">English (EN)</option>
                  <option value="tr" className="bg-slate-950 text-white">Türkçe (TR)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all hover:shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? 'Initializing Draft Parameters...' : 'Initiate AI Strategist Pipeline'}
            </button>
          </form>
        </GlassCard>
      )}

      {/* PIPELINE LOADER PANEL */}
      {step > 1 && loading && (
        <GlassCard hoverGlow={false} className="max-w-2xl mx-auto text-center py-10 space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="w-20 h-20 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
            <Sparkles className="w-8 h-8 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wider">Running AI Strategist Node {step}</h3>
            <p className="text-xs text-gray-400 mt-1">OpenAI is currently calculating positioning matrices, layout plans, and copy sheets.</p>
          </div>
          {renderConsoleLog()}
        </GlassCard>
      )}

      {/* PIPELINE HALTED PANEL */}
      {step > 1 && !loading && isStepDataMissing() && (
        <div className="max-w-2xl mx-auto space-y-6">
          <GlassCard borderGlowColor="none" hoverGlow={false} className="text-center py-10 space-y-6 bg-slate-950/20">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Terminal className="w-7 h-7 text-rose-400" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">AI Generation Pipeline Halted</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                The strategist node could not retrieve or parse the calculated data. Review the terminal logs below for details and retry the action.
              </p>
            </div>

            <div className="pt-2 max-w-sm mx-auto">
              <button
                onClick={handleRetryCurrentStep}
                className="w-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Strategic Generation Step</span>
              </button>
            </div>
          </GlassCard>

          {renderConsoleLog()}
        </div>
      )}

      {/* STEP 2: PRODUCT IDEA */}
      {step === 2 && !loading && strategy && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard hoverGlow={false}>
            <div className="mb-6 pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-emerald-400" />
                <span>AI Product Naming &amp; Concept Pitch</span>
              </h2>
              <p className="text-xs text-gray-400">Bootstrap value propositions and brand differentiation matrices.</p>
            </div>

            <div className="space-y-6 text-sm">
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Value Proposition Hook</h4>
                <p className="text-white font-semibold leading-relaxed">"{strategy.valueProposition}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Product Concept</h4>
                  <p className="text-gray-300 leading-relaxed">{strategy.marketPositioning}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1.5">Differentiation Angle</h4>
                  <p className="text-gray-300 leading-relaxed">{strategy.competitorAngle}</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-end">
            <button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Approve &amp; Next Stage</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: NICHE OPPORTUNITY */}
      {step === 3 && !loading && strategy && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard hoverGlow={false}>
            <div className="mb-6 pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-5.5 h-5.5 text-indigo-400" />
                <span>Etsy Market Niche Intelligence</span>
              </h2>
              <p className="text-xs text-gray-400">Target customer personas and visual design gap opportunities.</p>
            </div>

            <div className="space-y-6 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Market Opportunity</h4>
                  <p className="text-gray-300 leading-relaxed">{strategy.nicheOpportunity}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1.5">Core Buyer Persona</h4>
                  <p className="text-gray-300 leading-relaxed">{strategy.targetAudience}</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Aesthetic Gap Recommendation</h4>
                <p className="text-white font-semibold leading-relaxed">{strategy.designOpportunity}</p>
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Approve &amp; Next Stage</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SEO META PACKAGE */}
      {step === 4 && !loading && seo && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard hoverGlow={false} className="space-y-6">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <FileText className="w-5.5 h-5.5 text-sky-400" />
                <span>SEO Listing Title, Tags, &amp; Desc</span>
              </h2>
              <p className="text-xs text-gray-400">Copy optimized metadata directly into Etsy listing pages.</p>
            </div>

            <div className="space-y-5 text-sm">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Optimized Listing Title</span>
                  <button onClick={() => handleCopyText(seo.title)} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1">
                    {copiedText === seo.title ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === seo.title ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-950/80 border border-gray-800 rounded-xl font-mono text-white text-xs leading-relaxed">
                  {seo.title}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">13 SEO Tags (Click to Copy)</span>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {seo.tags?.map((tag: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => handleCopyText(tag)}
                      className="text-xs font-semibold px-3 py-1 bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full font-mono hover:bg-sky-500/20 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      {copiedText === tag && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">SEO Product Description</span>
                  <button onClick={() => handleCopyText(seo.description)} className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1">
                    {copiedText === seo.description ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === seo.description ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-4 bg-slate-950/80 border border-gray-800 rounded-xl text-gray-300 text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {seo.description}
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Approve &amp; Next Stage</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CANVA BLUEPRINTS */}
      {step === 5 && !loading && blueprints && blueprints.length > 0 && visualSystem && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard hoverGlow={false} className="space-y-6">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Layers className="w-5.5 h-5.5 text-purple-400" />
                <span>Canva Visual &amp; Page Blueprint</span>
              </h2>
              <p className="text-xs text-gray-400">Cohesive HSL palettes, Google typography mappings, and blueprint flows.</p>
            </div>

            <div className="space-y-6 text-sm">
              <div className="space-y-2">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Aesthetic Colors</span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-1">
                  {visualSystem.colorPalette?.map((color: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => handleCopyColor(color.hex)}
                      className="bg-slate-900/40 border border-white/5 rounded-xl p-3 flex flex-col items-center cursor-pointer hover:border-purple-500/30 transition-all relative overflow-hidden group"
                    >
                      <div className="w-full h-12 rounded-lg mb-2 shadow-inner" style={{ backgroundColor: color.hex }} />
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
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Font Roles</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {visualSystem.typography?.map((typo: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-950/60 border border-gray-800 rounded-xl space-y-1">
                      <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-bold">{typo.role}</span>
                      <h5 className="font-extrabold text-white text-sm">{typo.font}</h5>
                      <p className="text-[10px] text-gray-400">{typo.style}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">Flow Schematics ({blueprints.length} Page Pack)</span>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {blueprints.map((b, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 border border-gray-900 rounded-xl space-y-2">
                      <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">Page {b.templateNumber}: {b.purpose}</span>
                      <p className="text-xs text-gray-300">{b.layoutStructure}</p>
                      <p className="text-[10px] text-gray-400 font-mono italic">Text: {b.textHierarchy} &bull; CTA: {b.cta}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Approve &amp; Next Stage</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: CANVA LAYOUT COORDS PLANNER */}
      {step === 6 && !loading && layoutPlanner && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard hoverGlow={false} className="space-y-6">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Layout className="w-5.5 h-5.5 text-blue-400" />
                <span>Canva Pixel Coordinate Planner</span>
              </h2>
              <p className="text-xs text-gray-400">Manual sizing and location guidance to recreate the blueprint collections inside Canva.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-gray-300">
              <div className="p-4 bg-slate-950/60 border border-gray-900 rounded-xl space-y-2">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Canvas Frame Specs</h4>
                <p>Sizing: <span className="text-white font-bold font-mono">{layoutPlanner.canvasSize}</span></p>
                <p>Background HEX: <span className="text-white font-bold font-mono">{layoutPlanner.backgroundHex}</span></p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-gray-900 rounded-xl space-y-2">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Header &amp; Typo Sizing</h4>
                <p>Font Family: <span className="text-white font-bold font-mono">{layoutPlanner.headingFont}</span></p>
                <p>Coordinates: <span className="text-white font-mono">{layoutPlanner.headingCoords}</span></p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-gray-900 rounded-xl space-y-2">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Hero Photo Placement</h4>
                <p className="text-white font-mono">{layoutPlanner.heroImageCoords}</p>
              </div>

              <div className="p-4 bg-slate-950/60 border border-gray-900 rounded-xl space-y-2">
                <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">CTA Button Layout</h4>
                <p className="text-white font-mono">{layoutPlanner.ctaButtonCoords}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-xs text-gray-300">
              <h4 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest font-mono mb-1">Layout Guidance Advice</h4>
              <p className="leading-relaxed">{layoutPlanner.layoutGuidance}</p>
            </div>
          </GlassCard>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Approve &amp; Next Stage</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: STOCK IMAGE PROMPTS */}
      {step === 7 && !loading && imagePrompts && imagePrompts.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard hoverGlow={false} className="space-y-6">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-amber-400" />
                <span>Stock Image Generation Prompts</span>
              </h2>
              <p className="text-xs text-gray-400">Copy these prompt scripts into Midjourney or DALL-E to generate premium stock photos.</p>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
              {imagePrompts.map((ip, idx) => (
                <div key={idx} className="p-4 bg-slate-950/60 border border-gray-900 rounded-xl space-y-2 relative group">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
                      Page {ip.templateNumber}: {ip.purpose}
                    </span>
                    <button onClick={() => handleCopyText(ip.prompt)} className="text-[9px] text-gray-500 hover:text-white flex items-center gap-1">
                      {copiedText === ip.prompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{copiedText === ip.prompt ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 font-mono leading-relaxed bg-black/30 p-2.5 rounded-lg border border-white/3">{ip.prompt}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Approve &amp; Next Stage</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: MOCKUP PROMPTS */}
      {step === 8 && !loading && mockupPrompts && mockupPrompts.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard hoverGlow={false} className="space-y-6">
            <div className="pb-4 border-b border-white/5">
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-5.5 h-5.5 text-orange-400" />
                <span>Etsy Listing Mockup Prompts</span>
              </h2>
              <p className="text-xs text-gray-400">Scenic descriptions to generate contextual device frames in Midjourney.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mockupPrompts.map((mp, idx) => (
                <div key={idx} className="p-4 bg-slate-950/60 border border-gray-900 rounded-xl space-y-2 relative group">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest font-mono">Mockup Scene {idx + 1}</span>
                    <button onClick={() => handleCopyText(mp)} className="text-[9px] text-gray-500 hover:text-white flex items-center gap-1">
                      {copiedText === mp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                      <span>{copiedText === mp ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-mono">{mp}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="flex justify-between">
            <button onClick={handlePrevStep} className="flex items-center gap-1 text-xs text-gray-400 hover:text-white py-2 px-4">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              onClick={handleNextStep}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Approve &amp; Next Stage</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 9: FINAL EXPORT & BRANDING */}
      {step === 9 && !loading && listingCopy && shopBranding && (
        <div className="max-w-3xl mx-auto space-y-6">
          <GlassCard borderGlowColor="emerald" hoverGlow={false} className="py-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20">
              <Check className="w-8 h-8 text-white stroke-[3.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">ETSY STRATEGY COMPILED!</h2>
              <p className="text-sm text-gradient-primary font-bold">100% Administrative Strategy &amp; Copy Assets Generated.</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                All SEO keyword arrays, page coordinate parameters, stock generation prompts, and branding assets are ready to use.
              </p>
            </div>

            <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs text-gray-300">
              <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-2">
                <h5 className="font-bold text-emerald-400 font-mono uppercase tracking-wider">Etsy Shop Branding</h5>
                <p>Shop Ideas: <span className="text-white font-bold">{shopBranding.shopNames?.join(', ')}</span></p>
                <p className="italic text-[10px] text-gray-400">Bio: "{shopBranding.shopBio}"</p>
              </div>

              <div className="p-4 bg-slate-950 border border-gray-900 rounded-xl space-y-2">
                <h5 className="font-bold text-emerald-400 font-mono uppercase tracking-wider">Sales Intro Hook</h5>
                <p className="text-gray-300 text-[11px] leading-relaxed">"{listingCopy.introCopy}"</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 w-full max-w-xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push(`/projects/${projectId}?tab=canva`)}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  <span>🚀 GO TO CANVA HUB &amp; DEPLOY</span>
                </button>

                <button
                  onClick={() => router.push(`/projects/${projectId}`)}
                  className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-3.5 px-4 rounded-xl border border-white/10 hover:border-white/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>📂 OPEN PROJECT STRATEGY</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={downloadStrategyTXT}
                  className="w-full sm:w-auto bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-bold text-xs px-5 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Strategy (TXT)</span>
                </button>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-medium text-xs px-5 py-2.5 rounded-lg border border-white/5 transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
