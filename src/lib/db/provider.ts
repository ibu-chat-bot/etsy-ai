import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

// Detect if Supabase is configured via environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
import { User, Project, SEOAssets, VisualSystem, ContentBlueprint, PromptOutput, Settings, CanvaConnection, CanvaProject, GeneratedAsset, EditorToken } from '@/types';

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Interface for the local DB structure
interface LocalDB {
  users: User[];
  projects: Project[];
  seo_assets: SEOAssets[];
  visual_systems: VisualSystem[];
  content_blueprints: ContentBlueprint[];
  prompt_outputs: PromptOutput[];
  settings: Settings[];
  canva_connections: CanvaConnection[];
  canva_projects: CanvaProject[];
  generated_assets: GeneratedAsset[];
  editor_tokens?: EditorToken[];
}

// Default state of local database
const DEFAULT_DB: LocalDB = {
  editor_tokens: [],
  users: [
    {
      id: 'admin-id',
      email: 'admin@etsyai.com',
      passwordHash: 'admin123', // Clean, simple password for easy login in the local internal tool
      createdAt: new Date().toISOString()
    }
  ],
  projects: [],
  seo_assets: [],
  visual_systems: [],
  content_blueprints: [],
  prompt_outputs: [],
  settings: [
    {
      id: 'default-settings',
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      defaultLanguage: 'en',
      brandDefaults: {
        authorName: 'Etsy Canva Studio',
        supportEmail: 'support@etsyai.com',
        canvaHelpLink: 'https://canva.com'
      }
    }
  ],
  canva_connections: [],
  canva_projects: [],
  generated_assets: []
};

const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const isKvConfigured = !!(kvUrl && kvToken);

// Path to persistent local JSON database
const LOCAL_DB_PATH = path.join(process.cwd(), 'local-db.json');

// In-memory fallback DB state (used ONLY if file operations fail)
let localDBInMemory: LocalDB = JSON.parse(JSON.stringify(DEFAULT_DB));

// Helper: Read local DB
async function readLocalDB(): Promise<LocalDB> {
  if (isKvConfigured) {
    try {
      const res = await fetch(`${kvUrl}/get/etsy_ai:db`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          return {
            users: parsed.users || DEFAULT_DB.users,
            projects: parsed.projects || [],
            seo_assets: parsed.seo_assets || [],
            visual_systems: parsed.visual_systems || [],
            content_blueprints: parsed.content_blueprints || [],
            prompt_outputs: parsed.prompt_outputs || [],
            settings: parsed.settings || DEFAULT_DB.settings,
            canva_connections: parsed.canva_connections || [],
            canva_projects: parsed.canva_projects || [],
            generated_assets: parsed.generated_assets || []
          };
        }
      }
    } catch (error) {
      console.error('Failed to read from Vercel KV / Redis:', error);
    }
  }

  // File-based persistent local storage
  try {
    const fileContent = await fs.readFile(LOCAL_DB_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    return {
      users: parsed.users || DEFAULT_DB.users,
      projects: parsed.projects || [],
      seo_assets: parsed.seo_assets || [],
      visual_systems: parsed.visual_systems || [],
      content_blueprints: parsed.content_blueprints || [],
      prompt_outputs: parsed.prompt_outputs || [],
      settings: parsed.settings || DEFAULT_DB.settings,
      canva_connections: parsed.canva_connections || [],
      canva_projects: parsed.canva_projects || [],
      generated_assets: parsed.generated_assets || []
    };
  } catch (error) {
    // If file doesn't exist, create it from DEFAULT_DB
    try {
      await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    } catch (writeErr) {
      console.warn('Could not write initial local-db.json file:', writeErr);
    }
    return DEFAULT_DB;
  }
}

// Helper: Write local DB
async function writeLocalDB(data: LocalDB): Promise<void> {
  localDBInMemory = data;
  if (isKvConfigured) {
    try {
      await fetch(`${kvUrl}/set/etsy_ai:db`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        cache: 'no-store'
      });
    } catch (error) {
      console.error('Failed to write to Vercel KV / Redis:', error);
    }
  }

  // File-based persistent local storage
  try {
    await fs.writeFile(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to write to local-db.json file:', error);
  }
}

/* ==========================================================================
   UNIFIED DATABASE API IMPLEMENTATION
   ========================================================================== */

export const db = {
  isSupabase: () => !!isSupabaseConfigured,
  getStorageType: () => {
    if (isSupabaseConfigured) return 'Supabase Persistent Storage';
    if (isKvConfigured) return 'Vercel KV / Upstash Redis Persistent Store';
    if (process.env.VERCEL === '1') {
      return 'EPHEMERAL WARNING: In-Memory Fallback (Configure Vercel KV or Supabase env vars!)';
    }
    return 'Persistent local-db.json';
  },

  // --- SETTINGS ---
  async getSettings(): Promise<Settings> {
    let settingsData: Settings;
    if (supabase) {
      const { data, error } = await supabase.from('settings').select('*').limit(1).single();
      if (!error && data) {
        settingsData = data as Settings;
      } else {
        settingsData = DEFAULT_DB.settings[0];
      }
    } else {
      const local = await readLocalDB();
      if (!local.settings || local.settings.length === 0) {
        local.settings = [DEFAULT_DB.settings[0]];
        await writeLocalDB(local);
      }
      settingsData = local.settings[0];
    }

    // Merge with process.env values so env vars are the single source of truth for Canva credentials
    return {
      ...settingsData,
      openaiApiKey: process.env.OPENAI_API_KEY || settingsData.openaiApiKey || '',
      canvaClientId: process.env.CANVA_CLIENT_ID || settingsData.canvaClientId || '',
      canvaClientSecret: process.env.CANVA_CLIENT_SECRET || settingsData.canvaClientSecret || '',
      canvaRedirectUri: process.env.CANVA_REDIRECT_URI || settingsData.canvaRedirectUri || 'https://etsy-ai-nine.vercel.app/api/canva/callback'
    };
  },

  async saveSettings(updates: Partial<Settings>): Promise<Settings> {
    // If Canva credentials are provided via env vars, we ignore updates to them
    const filteredUpdates = { ...updates };
    if (process.env.CANVA_CLIENT_ID) delete filteredUpdates.canvaClientId;
    if (process.env.CANVA_CLIENT_SECRET) delete filteredUpdates.canvaClientSecret;
    if (process.env.CANVA_REDIRECT_URI) delete filteredUpdates.canvaRedirectUri;

    let savedData: Settings;
    if (supabase) {
      const current = await this.getSettings();
      const { data, error } = await supabase
        .from('settings')
        .update(filteredUpdates)
        .eq('id', current.id || 'default-settings')
        .select()
        .single();
      if (!error && data) {
        savedData = data as Settings;
      } else {
        savedData = { ...current, ...filteredUpdates };
      }
    } else {
      const local = await readLocalDB();
      if (!local.settings || local.settings.length === 0) {
        local.settings = [DEFAULT_DB.settings[0]];
      }
      local.settings[0] = { ...local.settings[0], ...filteredUpdates };
      await writeLocalDB(local);
      savedData = local.settings[0];
    }

    return {
      ...savedData,
      openaiApiKey: process.env.OPENAI_API_KEY || savedData.openaiApiKey || '',
      canvaClientId: process.env.CANVA_CLIENT_ID || savedData.canvaClientId || '',
      canvaClientSecret: process.env.CANVA_CLIENT_SECRET || savedData.canvaClientSecret || '',
      canvaRedirectUri: process.env.CANVA_REDIRECT_URI || savedData.canvaRedirectUri || 'https://etsy-ai-nine.vercel.app/api/canva/callback'
    };
  },

  // --- PROJECTS ---
  async getProjects(): Promise<Project[]> {
    if (supabase) {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as Project[];
    }
    const local = await readLocalDB();
    return local.projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getProject(id: string): Promise<Project | null> {
    if (supabase) {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();
      if (!error && data) return data as Project;
      return null;
    }
    const local = await readLocalDB();
    return local.projects.find((p) => p.id === id) || null;
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = 'proj_' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    const newProject: Project = {
      ...project,
      id,
      createdAt: now,
      updatedAt: now
    };

    if (supabase) {
      const { data, error } = await supabase.from('projects').insert([newProject]).select().single();
      if (!error && data) return data as Project;
    }
    const local = await readLocalDB();
    local.projects.push(newProject);
    await writeLocalDB(local);
    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const now = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Project;
    }
    const local = await readLocalDB();
    const index = local.projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');
    local.projects[index] = { ...local.projects[index], ...updates, updatedAt: now };
    await writeLocalDB(local);
    return local.projects[index];
  },

  async deleteProject(id: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      return !error;
    }
    const local = await readLocalDB();
    local.projects = local.projects.filter((p) => p.id !== id);
    local.seo_assets = local.seo_assets.filter((s) => s.projectId !== id);
    local.visual_systems = local.visual_systems.filter((v) => v.projectId !== id);
    local.content_blueprints = local.content_blueprints.filter((b) => b.projectId !== id);
    local.prompt_outputs = local.prompt_outputs.filter((a) => a.projectId !== id);
    await writeLocalDB(local);
    return true;
  },

  // --- SEO ASSETS ---
  async getSEOAssets(projectId: string): Promise<SEOAssets | null> {
    if (supabase) {
      const { data, error } = await supabase.from('seo_assets').select('*').eq('project_id', projectId).single();
      if (!error && data) return data as SEOAssets;
      return null;
    }
    const local = await readLocalDB();
    return local.seo_assets.find((s) => s.projectId === projectId) || null;
  },

  async saveSEOAssets(seo: Omit<SEOAssets, 'id'>): Promise<SEOAssets> {
    if (supabase) {
      const current = await this.getSEOAssets(seo.projectId);
      if (current) {
        const { data, error } = await supabase.from('seo_assets').update(seo).eq('project_id', seo.projectId).select().single();
        if (!error && data) return data as SEOAssets;
      } else {
        const { data, error } = await supabase.from('seo_assets').insert([{ ...seo, id: 'seo_' + Math.random().toString(36).substring(2, 11) }]).select().single();
        if (!error && data) return data as SEOAssets;
      }
    }
    const local = await readLocalDB();
    const index = local.seo_assets.findIndex((s) => s.projectId === seo.projectId);
    const newSeo: SEOAssets = {
      ...seo,
      id: index !== -1 ? local.seo_assets[index].id : 'seo_' + Math.random().toString(36).substring(2, 11)
    };
    if (index !== -1) {
      local.seo_assets[index] = newSeo;
    } else {
      local.seo_assets.push(newSeo);
    }
    await writeLocalDB(local);
    return newSeo;
  },

  // --- VISUAL SYSTEMS ---
  async getVisualSystem(projectId: string): Promise<VisualSystem | null> {
    if (supabase) {
      const { data, error } = await supabase.from('visual_systems').select('*').eq('project_id', projectId).single();
      if (!error && data) return data as VisualSystem;
      return null;
    }
    const local = await readLocalDB();
    return local.visual_systems.find((v) => v.projectId === projectId) || null;
  },

  async saveVisualSystem(visual: Omit<VisualSystem, 'id'>): Promise<VisualSystem> {
    if (supabase) {
      const current = await this.getVisualSystem(visual.projectId);
      if (current) {
        const { data, error } = await supabase.from('visual_systems').update(visual).eq('project_id', visual.projectId).select().single();
        if (!error && data) return data as VisualSystem;
      } else {
        const { data, error } = await supabase.from('visual_systems').insert([{ ...visual, id: 'vs_' + Math.random().toString(36).substring(2, 11) }]).select().single();
        if (!error && data) return data as VisualSystem;
      }
    }
    const local = await readLocalDB();
    const index = local.visual_systems.findIndex((v) => v.projectId === visual.projectId);
    const newVisual: VisualSystem = {
      ...visual,
      id: index !== -1 ? local.visual_systems[index].id : 'vs_' + Math.random().toString(36).substring(2, 11)
    };
    if (index !== -1) {
      local.visual_systems[index] = newVisual;
    } else {
      local.visual_systems.push(newVisual);
    }
    await writeLocalDB(local);
    return newVisual;
  },

  // --- CONTENT BLUEPRINTS ---
  async getContentBlueprints(projectId: string): Promise<ContentBlueprint[]> {
    if (supabase) {
      const { data, error } = await supabase.from('content_blueprints').select('*').eq('project_id', projectId).order('template_number', { ascending: true });
      if (!error && data) return data as ContentBlueprint[];
    }
    const local = await readLocalDB();
    return local.content_blueprints
      .filter((b) => b.projectId === projectId)
      .sort((a, b) => a.templateNumber - b.templateNumber);
  },

  async saveContentBlueprints(projectId: string, blueprints: Omit<ContentBlueprint, 'id'>[]): Promise<ContentBlueprint[]> {
    if (supabase) {
      // Clear existing blueprints for this project and insert new ones
      await supabase.from('content_blueprints').delete().eq('project_id', projectId);
      const toInsert = blueprints.map((b) => ({ 
        ...b, 
        project_id: projectId,
        projectId,
        id: 'cb_' + Math.random().toString(36).substring(2, 11) 
      }));
      const { data, error } = await supabase.from('content_blueprints').insert(toInsert).select();
      if (!error && data) return data as ContentBlueprint[];
    }
    const local = await readLocalDB();
    // Filter out old blueprints
    local.content_blueprints = local.content_blueprints.filter((b) => b.projectId !== projectId);
    // Add new ones
    const newBlueprints = blueprints.map((b) => ({
      ...b,
      projectId,
      id: 'cb_' + Math.random().toString(36).substring(2, 11)
    }));
    local.content_blueprints.push(...newBlueprints);
    await writeLocalDB(local);
    return newBlueprints;
  },

  // --- PROMPT OUTPUTS ---
  async getPromptOutputs(projectId: string): Promise<PromptOutput[]> {
    if (supabase) {
      const { data, error } = await supabase.from('prompt_outputs').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
      if (!error && data) return data as PromptOutput[];
    }
    const local = await readLocalDB();
    return local.prompt_outputs.filter((a) => a.projectId === projectId);
  },

  async savePromptOutput(output: Omit<PromptOutput, 'id' | 'createdAt'>): Promise<PromptOutput> {
    const now = new Date().toISOString();
    
    if (supabase) {
      const { data: existing } = await supabase
        .from('prompt_outputs')
        .select('id')
        .eq('project_id', output.projectId)
        .eq('prompt_type', output.promptType)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('prompt_outputs')
          .update({ content: output.content })
          .eq('id', existing.id)
          .select()
          .single();
        if (!error && data) return data as PromptOutput;
      } else {
        const newOutput = {
          ...output,
          id: 'prompt_' + Math.random().toString(36).substring(2, 11),
          created_at: now
        };
        const { data, error } = await supabase.from('prompt_outputs').insert([newOutput]).select().single();
        if (!error && data) return data as PromptOutput;
      }
    }

    const local = await readLocalDB();
    const index = local.prompt_outputs.findIndex((a) => a.projectId === output.projectId && a.promptType === output.promptType);
    const newOutput: PromptOutput = {
      ...output,
      id: index !== -1 ? local.prompt_outputs[index].id : 'prompt_' + Math.random().toString(36).substring(2, 11),
      createdAt: index !== -1 ? local.prompt_outputs[index].createdAt : now
    };

    if (index !== -1) {
      local.prompt_outputs[index] = newOutput;
    } else {
      local.prompt_outputs.push(newOutput);
    }

    await writeLocalDB(local);
    return newOutput;
  },

  async deletePromptOutputs(projectId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('prompt_outputs').delete().eq('project_id', projectId);
      return !error;
    }
    const local = await readLocalDB();
    local.prompt_outputs = local.prompt_outputs.filter((a) => a.projectId !== projectId);
    await writeLocalDB(local);
    return true;
  },

  // --- SINGLE USER AUTHENTICATION ---
  async validateUser(email: string, passwordHash: string): Promise<User | null> {
    // If Supabase is configured, we can query users
    if (supabase) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).eq('password_hash', passwordHash).single();
      if (!error && data) return data as User;
      return null;
    }
    const local = await readLocalDB();
    const found = local.users.find((u) => u.email === email && u.passwordHash === passwordHash);
    return found || null;
  },

  // --- CANVA CONNECTIONS ---
  async getCanvaConnection(userId: string): Promise<CanvaConnection | null> {
    if (supabase) {
      const { data, error } = await supabase.from('canva_connections').select('*').eq('user_id', userId).single();
      if (!error && data) return data as CanvaConnection;
      return null;
    }
    
    // Cookie-based fallback for Vercel serverless environments
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('canva_access_token')?.value;
      const refreshToken = cookieStore.get('canva_refresh_token')?.value;
      const workspaceId = cookieStore.get('canva_workspace_id')?.value;
      
      if (accessToken) {
        return {
          id: 'cookie-conn',
          userId,
          accessToken,
          refreshToken: refreshToken || '',
          workspaceId: workspaceId || 'workspace_default',
          createdAt: new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Could not read cookies on server side:', e);
    }

    const local = await readLocalDB();
    const conn = local.canva_connections.find((c) => c.userId === userId);
    return conn || null;
  },

  async saveCanvaConnection(conn: Omit<CanvaConnection, 'id' | 'createdAt'>): Promise<CanvaConnection> {
    const now = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('canva_connections')
        .upsert({
          user_id: conn.userId,
          access_token: conn.accessToken,
          refresh_token: conn.refreshToken,
          workspace_id: conn.workspaceId,
          created_at: now
        })
        .select()
        .single();
      if (!error && data) return data as CanvaConnection;
    }
    
    // Cookie-based fallback for Vercel serverless environments
    try {
      const cookieStore = await cookies();
      cookieStore.set('canva_access_token', conn.accessToken, {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
      cookieStore.set('canva_refresh_token', conn.refreshToken || '', {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
      cookieStore.set('canva_workspace_id', conn.workspaceId || '', {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: 30 * 24 * 60 * 60 // 30 days
      });
    } catch (e) {
      console.warn('Could not write cookies on server side:', e);
    }

    const local = await readLocalDB();
    const index = local.canva_connections.findIndex((c) => c.userId === conn.userId);
    const newConn: CanvaConnection = {
      ...conn,
      id: index !== -1 ? local.canva_connections[index].id : 'conn_' + Math.random().toString(36).substring(2, 11),
      createdAt: index !== -1 ? local.canva_connections[index].createdAt : now
    };
    if (index !== -1) {
      local.canva_connections[index] = newConn;
    } else {
      local.canva_connections.push(newConn);
    }
    await writeLocalDB(local);
    return newConn;
  },

  async deleteCanvaConnection(userId: string): Promise<boolean> {
    if (supabase) {
      const { error } = await supabase.from('canva_connections').delete().eq('user_id', userId);
    }
    
    // Clear cookies
    try {
      const cookieStore = await cookies();
      cookieStore.delete('canva_access_token');
      cookieStore.delete('canva_refresh_token');
      cookieStore.delete('canva_workspace_id');
    } catch (e) {
      console.warn('Could not delete cookies on server side:', e);
    }

    const local = await readLocalDB();
    local.canva_connections = local.canva_connections.filter((c) => c.userId !== userId);
    await writeLocalDB(local);
    return true;
  },

  // --- CANVA PROJECTS ---
  async getCanvaProject(projectId: string): Promise<CanvaProject | null> {
    if (supabase) {
      const { data, error } = await supabase.from('canva_projects').select('*').eq('project_id', projectId).single();
      if (!error && data) return data as CanvaProject;
      return null;
    }
    const local = await readLocalDB();
    const proj = local.canva_projects.find((p) => p.projectId === projectId);
    return proj || null;
  },

  async saveCanvaProject(proj: Omit<CanvaProject, 'id' | 'createdAt'>): Promise<CanvaProject> {
    const now = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('canva_projects')
        .upsert({
          project_id: proj.projectId,
          canva_design_id: proj.canvaDesignId,
          template_link: proj.templateLink,
          preview_link: proj.previewLink,
          ...(proj.layoutRecipe ? { layout_recipe: proj.layoutRecipe } : {}),
          created_at: now
        })
        .select()
        .single();
      if (!error && data) return data as CanvaProject;
    }
    const local = await readLocalDB();
    const index = local.canva_projects.findIndex((p) => p.projectId === proj.projectId);
    const newProj: CanvaProject = {
      ...proj,
      id: index !== -1 ? local.canva_projects[index].id : 'canvaproj_' + Math.random().toString(36).substring(2, 11),
      createdAt: index !== -1 ? local.canva_projects[index].createdAt : now
    };
    if (index !== -1) {
      local.canva_projects[index] = newProj;
    } else {
      local.canva_projects.push(newProj);
    }
    await writeLocalDB(local);
    return newProj;
  },

  // --- GENERATED ASSETS ---
  async getGeneratedAssets(projectId: string): Promise<GeneratedAsset[]> {
    if (supabase) {
      const { data, error } = await supabase.from('generated_assets').select('*').eq('project_id', projectId);
      if (!error && data) return data as GeneratedAsset[];
      return [];
    }
    const local = await readLocalDB();
    return local.generated_assets.filter((a) => a.projectId === projectId);
  },

  async saveGeneratedAsset(asset: Omit<GeneratedAsset, 'id' | 'createdAt'>): Promise<GeneratedAsset> {
    const now = new Date().toISOString();
    if (supabase) {
      const { data, error } = await supabase
        .from('generated_assets')
        .insert([{
          project_id: asset.projectId,
          asset_type: asset.assetType,
          file_url: asset.fileUrl,
          prompt_used: asset.promptUsed || '',
          created_at: now
        }])
        .select()
        .single();
      if (!error && data) return data as GeneratedAsset;
    }
    const local = await readLocalDB();
    const newAsset: GeneratedAsset = {
      ...asset,
      id: 'asset_' + Math.random().toString(36).substring(2, 11),
      createdAt: now
    };
    local.generated_assets.push(newAsset);
    await writeLocalDB(local);
    return newAsset;
  },

  // --- EDITOR TOKENS ---
  async getEditorToken(token: string): Promise<EditorToken | null> {
    if (supabase) {
      const { data, error } = await supabase.from('editor_tokens').select('*').eq('token', token).single();
      if (!error && data) return data as EditorToken;
      return null;
    }
    const local = await readLocalDB();
    if (!local.editor_tokens) {
      local.editor_tokens = [];
    }
    const tokenObj = local.editor_tokens.find((t) => t.token === token);
    return tokenObj || null;
  },

  async saveEditorToken(tokenData: EditorToken): Promise<EditorToken> {
    if (supabase) {
      await supabase.from('editor_tokens').upsert({
        token: tokenData.token,
        template_id: tokenData.templateId,
        purchase_id: tokenData.purchaseId,
        used_at: tokenData.usedAt,
        expires_at: tokenData.expiresAt,
        download_count: tokenData.downloadCount,
        created_at: tokenData.createdAt
      });
      return tokenData;
    }
    const local = await readLocalDB();
    if (!local.editor_tokens) {
      local.editor_tokens = [];
    }
    const index = local.editor_tokens.findIndex((t) => t.token === tokenData.token);
    if (index !== -1) {
      local.editor_tokens[index] = tokenData;
    } else {
      local.editor_tokens.push(tokenData);
    }
    await writeLocalDB(local);
    return tokenData;
  }
};
