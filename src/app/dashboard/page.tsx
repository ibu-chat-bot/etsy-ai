'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  FolderGit2, 
  Image as ImageIcon, 
  FileArchive, 
  Clock, 
  PlusCircle, 
  ArrowRight, 
  Trash2, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Project } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [canvaWorkspaceId, setCanvaWorkspaceId] = useState('');
  const [storageType, setStorageType] = useState('database');
  const [mounted, setMounted] = useState(false);

  // Load Projects
  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
        if (data.storageType) {
          setStorageType(data.storageType);
        }
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCanvaStatus = async () => {
    try {
      const res = await fetch('/api/canva/status');
      if (res.ok) {
        const data = await res.json();
        setCanvaConnected(data.connected);
        setCanvaWorkspaceId(data.workspaceId || '');
      }
    } catch (err) {
      console.error('Failed to load Canva status', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    loadProjects();
    loadCanvaStatus();
  }, []);

  // Compute Metrics
  const totalProjects = projects.length;
  const turkishStrategies = projects.filter(p => p.language === 'tr').length;
  const englishStrategies = projects.filter(p => p.language === 'en').length;
  const totalStrategySlices = projects.reduce((acc, p) => acc + p.templateCount, 0);

  // Handle Project Deletion
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project and all its generated assets?')) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
      }
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Project Duplication
  const handleDuplicate = async (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(project.id);
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
        // Insert new project in list
        setProjects([data.project, ...projects]);
      }
    } catch (err) {
      console.error('Duplication failed', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper: Status color mapper
  const getStatusBadge = (status: Project['status']) => {
    const configs: Record<Project['status'], { label: string; style: string }> = {
      draft: { label: 'Draft', style: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
      strategy_ready: { label: 'Strategy Generated', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      seo_ready: { label: 'SEO Configured', style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
      visual_ready: { label: 'Style Mapped', style: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
      blueprint_ready: { label: 'Blueprint Done', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      images_ready: { label: 'Images Rendered', style: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      mockups_ready: { label: 'Mockups Crafted', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      pdf_ready: { label: 'PDF Generated', style: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
      completed: { label: 'Etsy Ready (ZIP)', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      failed: { label: 'Failed', style: 'bg-red-500/10 text-red-400 border-red-500/20' }
    };
    const c = configs[status] || configs.draft;
    return (
      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wide uppercase ${c.style}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 select-none">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
              Admin <span className="text-gradient-primary">Studio Dashboard</span>
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Analyze niches, orchestrate content blueprints, and compile complete Etsy digital product strategy packs.
            </p>
          </div>
          <div className="text-xs text-gray-500 font-mono bg-white/5 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 self-start md:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>NODE ACTIVE // SINGLE ADMIN SESSION</span>
          </div>
        </div>

        {/* Dashboard Widgets Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <GlassCard hoverGlow={false} className="relative overflow-hidden py-5 px-6">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-emerald-500" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Products</span>
              <FolderGit2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white">{loading ? '...' : totalProjects}</div>
            <p className="text-[10px] text-gray-500 mt-1 font-medium">Packages stored on {mounted ? storageType : 'Loading...'}</p>
          </GlassCard>

          <GlassCard hoverGlow={false} className="relative overflow-hidden py-5 px-6">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-indigo-500" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">English Strategies</span>
              <FolderGit2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white">{loading ? '...' : englishStrategies}</div>
            <p className="text-[10px] text-gray-500 mt-1 font-medium">Targeting international markets</p>
          </GlassCard>

          <GlassCard hoverGlow={false} className="relative overflow-hidden py-5 px-6">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-pink-500" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Turkish Strategies</span>
              <FolderGit2 className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-3xl font-black text-white">{loading ? '...' : turkishStrategies}</div>
            <p className="text-[10px] text-gray-500 mt-1 font-medium">Targeting domestic markets</p>
          </GlassCard>

          <GlassCard hoverGlow={false} className="relative overflow-hidden py-5 px-6">
            <div className="absolute top-0 left-0 w-[3px] h-full bg-amber-500" />
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Page Blueprints</span>
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white">{loading ? '...' : totalStrategySlices}</div>
            <p className="text-[10px] text-gray-500 mt-1 font-medium font-mono">Consolidated blueprint slices</p>
          </GlassCard>

        </div>

        {/* Dynamic CTA + Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Quick Action Side Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* New Product Direct Card */}
            <GlassCard 
              borderGlowColor="emerald" 
              onClick={() => router.push('/projects/new')}
              className="relative overflow-hidden group bg-slate-950/20"
            >
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/15 transition-all" />
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-5.5 h-5.5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">New Product Creator</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Trigger the step-by-step AI wizard. Set up parameters, research SEO, and compile high-resolution images, mockups, and deliverables automatically.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mt-6 group-hover:gap-2.5 transition-all">
                  <span>Start Wizard Process</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </GlassCard>

            {/* Canva API Automation Status Widget */}
            <GlassCard hoverGlow={false} className="p-5 space-y-4 bg-slate-950/40 border border-white/5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Canva Automation Engine</span>
                </h4>
                {canvaConnected ? (
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 tracking-wide uppercase">
                    Connected
                  </span>
                ) : (
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 tracking-wide uppercase">
                    Disconnected
                  </span>
                )}
              </div>

              {canvaConnected ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 leading-normal">
                    Successfully linked to Canva workspace <span className="font-mono text-white text-[11px] bg-white/5 px-1.5 py-0.5 rounded">{canvaWorkspaceId || 'Active'}</span>. 
                    Your generated templates are actively compiled directly inside your connected Canva account.
                  </p>
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-center py-2 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-lg transition-all animate-none flex items-center justify-center"
                  >
                    Manage Settings
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-400 leading-normal">
                    Canva integration is disconnected. Configure credentials and link a real Canva account in Settings to generate templates.
                  </p>
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-center py-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-all animate-none flex items-center justify-center"
                  >
                    Connect Canva Account
                  </button>
                </div>
              )}
            </GlassCard>

            {/* Quick Tips */}
            <GlassCard hoverGlow={false} className="p-5 text-xs space-y-3 bg-white/2 border border-white/5">
              <h4 className="font-bold text-white uppercase tracking-wider text-[10px]">Studio Operations Guidelines</h4>
              <ul className="space-y-2 text-gray-400 list-disc list-inside">
                <li>Input concise ideas like <span className="text-emerald-400 font-medium">"Gold Sparkle Instagram Templates"</span>.</li>
                <li>Make sure your <span className="font-bold text-gray-300">OpenAI API Key</span> is configured in Settings.</li>
                <li>Downloaded products contain organized assets inside `/images` and `/mockups` and a customized Deliverables PDF.</li>
              </ul>
            </GlassCard>
            
          </div>

          {/* Project History Grid List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-indigo-400" />
                <span>Production History</span>
              </h3>
              <span className="text-xs text-gray-400 font-medium">{projects.length} Saved Projects</span>
            </div>

            {loading ? (
              // Loading skeletons
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-panel border border-white/5 rounded-2xl p-6 animate-pulse space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-gray-800 rounded w-1/3" />
                      <div className="h-4 bg-gray-800 rounded w-1/6" />
                    </div>
                    <div className="h-3 bg-gray-800 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <GlassCard hoverGlow={false} className="text-center py-12 bg-white/2">
                <FolderGit2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-300">No projects found</p>
                <p className="text-xs text-gray-500 mt-1">Get started by creating your very first Etsy digital product template bundle!</p>
              </GlassCard>
            ) : (
              // Active grid
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => router.push(`/projects/${project.id}`)}
                    className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-emerald-500/20 hover:bg-slate-900/10 cursor-pointer transition-all active:scale-[0.99] flex flex-col sm:flex-row sm:items-center justify-between gap-4 group relative overflow-hidden"
                  >
                    {/* Tiny background highlight */}
                    <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-white/1 to-transparent pointer-events-none" />

                    <div className="space-y-1.5 max-w-lg">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                          {project.name}
                        </h4>
                        {getStatusBadge(project.status)}
                      </div>
                      
                      {/* Subheaders */}
                      <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-gray-400 font-medium">
                        <span>Niche: <strong className="text-gray-300">{project.niche}</strong></span>
                        <span>&bull;</span>
                        <span>Type: <strong className="text-gray-300">{project.productType}</strong></span>
                        <span>&bull;</span>
                        <span>Count: <strong className="text-gray-300">{project.templateCount} Templates</strong></span>
                      </div>
                    </div>

                    {/* Actions and Nav indicators */}
                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 z-10">
                      {actionLoading === project.id ? (
                        <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-3" />
                      ) : (
                        <>
                          {/* Duplicate */}
                          <button
                            onClick={(e) => handleDuplicate(project, e)}
                            title="Duplicate Project Configuration"
                            className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(project.id, e)}
                            title="Wipe Project"
                            className="p-2 text-gray-500 hover:text-red-400 rounded-xl hover:bg-white/5 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Arrow Nav */}
                          <div className="p-2 text-gray-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
