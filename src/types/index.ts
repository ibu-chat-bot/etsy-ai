export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  niche: string;
  productType: string;
  style: string;
  language: 'en' | 'tr';
  templateCount: number;
  aspectRatio: string;
  status: 'draft' | 'strategy_ready' | 'seo_ready' | 'visual_ready' | 'blueprint_ready' | 'images_ready' | 'mockups_ready' | 'pdf_ready' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface SEOAssets {
  id: string;
  projectId: string;
  title: string;
  description: string;
  tags: string[]; // exactly 13 tags
  keywords: string[];
  faq: { question: string; answer: string }[];
  features: string[];
}

export interface VisualSystem {
  id: string;
  projectId: string;
  colorPalette: { name: string; hex: string }[];
  typography: { role: string; font: string; style: string }[];
  designDirection: string;
  layoutRules: string[];
}

export interface ContentBlueprint {
  id: string;
  projectId: string;
  templateNumber: number;
  purpose: string;
  layoutStructure: string;
  cta: string;
  textHierarchy: string;
}

export interface PromptOutput {
  id: string;
  projectId: string;
  promptType: 'idea_generator' | 'niche_analyzer' | 'layout_planner' | 'image_prompts' | 'mockup_prompts' | 'product_copy' | 'shop_branding';
  content: string;
  createdAt: string;
}

export interface Settings {
  id: string;
  openaiApiKey: string;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  defaultLanguage: 'en' | 'tr';
  brandDefaults: {
    authorName: string;
    supportEmail: string;
    canvaHelpLink: string;
  };
  canvaClientId?: string;
  canvaClientSecret?: string;
  canvaRedirectUri?: string;
  canvaCodeVerifier?: string;
  canvaAccessToken?: string;
  canvaRefreshToken?: string;
  connectedWorkspaceId?: string;
  oauthState?: string;
}

export interface CanvaConnection {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  workspaceId: string;
  createdAt: string;
}

export interface CanvaProject {
  id: string;
  projectId: string;
  canvaDesignId: string;
  templateLink: string;
  previewLink: string;
  layoutRecipe?: string;
  createdAt: string;
}

export interface GeneratedAsset {
  id: string;
  projectId: string;
  assetType: 'image' | 'mockup' | 'pdf' | 'zip';
  fileUrl: string;
  promptUsed?: string;
  createdAt: string;
}

export interface EditorToken {
  token: string;
  templateId: string;
  purchaseId: string;
  usedAt: string | null;
  expiresAt: string;
  downloadCount: number;
  createdAt: string;
}
