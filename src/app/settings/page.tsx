'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  ArrowLeft,
  Settings,
  Key,
  User,
  Mail,
  ExternalLink,
  Save,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Settings as SettingsType } from '@/types';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showCanvaSecret, setShowCanvaSecret] = useState(false);
  const [success, setSuccess] = useState(false);
  const [canvaConnected, setCanvaConnected] = useState(false);
  const [canvaWorkspaceId, setCanvaWorkspaceId] = useState('');
  const [canvaTokenType, setCanvaTokenType] = useState<string | null>(null);
  const [canvaTokenPreview, setCanvaTokenPreview] = useState<string | null>(null);
  const [canvaStatusDebug, setCanvaStatusDebug] = useState<string | null>(null);
  const [canvaConnecting, setCanvaConnecting] = useState(false);
  const [canvaConnectError, setCanvaConnectError] = useState<string | null>(null);
  const [canvaTesting, setCanvaTesting] = useState(false);
  const [canvaTestResult, setCanvaTestResult] = useState<any>(null);

  const [form, setForm] = useState<SettingsType>({
    id: 'settings',
    openaiApiKey: '',
    defaultLanguage: 'en',
    brandDefaults: {
      authorName: '',
      supportEmail: '',
      canvaHelpLink: ''
    },
    canvaClientId: '',
    canvaClientSecret: '',
    canvaRedirectUri: 'http://127.0.0.1:3000/api/canva/callback'
  });

  // Load active settings from API
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setForm({
          id: 'settings',
          openaiApiKey: data.settings.openaiApiKey || '',
          defaultLanguage: data.settings.defaultLanguage || 'en',
          brandDefaults: {
            authorName: data.settings.brandDefaults?.authorName || 'Etsy Canva Studio',
            supportEmail: data.settings.brandDefaults?.supportEmail || 'support@etsyai.com',
            canvaHelpLink: data.settings.brandDefaults?.canvaHelpLink || 'https://canva.com'
          },
          canvaClientId: data.settings.canvaClientId || '',
          canvaClientSecret: data.settings.canvaClientSecret || '',
          canvaRedirectUri: data.settings.canvaRedirectUri || 'http://127.0.0.1:3000/api/canva/callback'
        });
      }

      // Query Canva Link Status
      const statusRes = await fetch('/api/canva/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setCanvaConnected(statusData.connected);
        setCanvaWorkspaceId(statusData.workspaceId || '');
        setCanvaTokenType(statusData.tokenType || null);
        setCanvaTokenPreview(statusData.tokenPreview || null);
        setCanvaStatusDebug(statusData.debug || null);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3001);
        await fetchSettings(); // refresh with masked key
      } else {
        alert('Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectCanva = async () => {
    setCanvaConnecting(true);
    setCanvaConnectError(null);
    try {
      const res = await fetch('/api/canva/connect');
      const data = await res.json();
      if (res.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setCanvaConnectError(data.error || 'Could not generate Canva auth URL. Check Client ID and Redirect URI in settings above.');
      }
    } catch (err: any) {
      console.error(err);
      setCanvaConnectError(err.message || 'Network error during Canva handshake.');
    } finally {
      setCanvaConnecting(false);
    }
  };

  const handleDisconnectAndReset = async () => {
    if (!confirm('Disconnect Canva and clear the stored token?')) return;
    try {
      await fetch('/api/canva/status', { method: 'DELETE' });
      setCanvaConnected(false);
      setCanvaWorkspaceId('');
      setCanvaTokenType(null);
      setCanvaTokenPreview(null);
      setCanvaStatusDebug(null);
      setCanvaTestResult(null);
      setCanvaConnectError(null);
    } catch (err) {
      console.error(err);
    }
  };

  // handleDisconnectCanva replaced by handleDisconnectAndReset above

  const handleTestCanvaApi = async () => {
    setCanvaTesting(true);
    setCanvaTestResult(null);
    try {
      const res = await fetch('/api/canva/test-design');
      const data = await res.json();
      setCanvaTestResult(data);
    } catch (err: any) {
      setCanvaTestResult({ error: err.message, success: false });
    } finally {
      setCanvaTesting(false);
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-8 space-y-6 select-none">

        {/* Back navigational header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="space-y-0.5">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors py-2 rounded"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Settings className="w-6 h-6 text-emerald-400" />
              <span>System Settings</span>
            </h1>
          </div>

          {success && (
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings Saved Successfully</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">

          {/* 1. API Configuration */}
          <GlassCard hoverGlow={false} className="space-y-4">
            <div className="pb-2 border-b border-white/5 flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI API Credentials</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder={form.openaiApiKey ? '••••••••••••••••••••••••••••••••' : 'Enter your OpenAI sk-... key'}
                  value={form.openaiApiKey}
                  onChange={(e) => setForm({ ...form, openaiApiKey: e.target.value })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 leading-relaxed leading-normal">
                This key is stored locally inside your db nodes. Leave empty to fallback to system environment variables. Masked keys will show as dots.
              </p>
            </div>
          </GlassCard>

          {/* 2. Brand Default Credentials */}
          <GlassCard hoverGlow={false} className="space-y-4">
            <div className="pb-2 border-b border-white/5 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Brand Default Credentials</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Author / Shop Owner */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Author / Shop Owner Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={form.brandDefaults?.authorName}
                    onChange={(e) => setForm({
                      ...form,
                      brandDefaults: { ...form.brandDefaults!, authorName: e.target.value }
                    })}
                    className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                  />
                </div>
              </div>

              {/* Support Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Customer Support Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={form.brandDefaults?.supportEmail}
                    onChange={(e) => setForm({
                      ...form,
                      brandDefaults: { ...form.brandDefaults!, supportEmail: e.target.value }
                    })}
                    className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 3. Canva API Integration */}
          <GlassCard hoverGlow={false} className="space-y-4">
            <div className="pb-2 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Canva API Integration</h2>
              </div>
              {canvaConnected ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 tracking-wide uppercase">
                  Connected
                </span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 tracking-wide uppercase">
                  Not Connected
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Canva Client ID</label>
                <input
                  type="text"
                  placeholder="e.g. 123456789"
                  value={form.canvaClientId}
                  onChange={(e) => setForm({ ...form, canvaClientId: e.target.value })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Canva Client Secret</label>
                <div className="relative">
                  <input
                    type={showCanvaSecret ? 'text' : 'password'}
                    placeholder="Enter Canva Developer Secret"
                    value={form.canvaClientSecret}
                    onChange={(e) => setForm({ ...form, canvaClientSecret: e.target.value })}
                    className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCanvaSecret(!showCanvaSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white animate-none flex items-center justify-center p-0"
                  >
                    {showCanvaSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">OAuth Redirect URI</label>
                <input
                  type="url"
                  placeholder="http://localhost:3000/api/canva/callback"
                  value={form.canvaRedirectUri}
                  onChange={(e) => setForm({ ...form, canvaRedirectUri: e.target.value })}
                  className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 space-y-3">
              <div className="text-[10px] text-gray-500 leading-normal">
                ⚠️ Redirect URI in your Canva Developer Portal must exactly match what is set above.
                Recommended: <span className="font-mono text-amber-400">http://127.0.0.1:3000/api/canva/callback</span>
              </div>

              {/* Connect Error */}
              {canvaConnectError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300 font-mono">
                  ❌ {canvaConnectError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Connection Status Badge */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${!canvaConnected
                    ? 'bg-gray-500/10 border-gray-500/20 text-gray-400'
                    : canvaTokenType === 'real_oauth'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  }`}>
                  {!canvaConnected ? '○ Not Connected' : canvaTokenType === 'real_oauth' ? '✅ OAuth Connected' : '⚠️ Mock Token (reconnect)'}
                </div>

                <div className="flex gap-2">
                  {canvaConnected && (
                    <button
                      type="button"
                      onClick={handleDisconnectAndReset}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-xl transition-all"
                    >
                      Disconnect &amp; Reset Token
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleConnectCanva}
                    disabled={canvaConnecting}
                    className="px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                  >
                    {canvaConnecting ? 'Redirecting to Canva...' : canvaConnected ? 'Re-Connect Canva' : 'Connect Canva Account'}
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Canva OAuth Debug Panel — always visible */}
          <GlassCard hoverGlow={false} className="space-y-4">
            <div className="pb-2 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Canva OAuth Debug Panel</h2>
              </div>
              <button
                type="button"
                onClick={handleTestCanvaApi}
                disabled={canvaTesting}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-white bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/15 py-2 px-4 rounded-xl transition-all disabled:opacity-50 font-bold"
              >
                {canvaTesting ? 'Testing...' : '🧪 Run Real API Test'}
              </button>
            </div>

            {/* Connection Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">OAuth Connected</span>
                <span className={`text-xs font-bold ${canvaConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                  {canvaConnected ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Token Present</span>
                <span className={`text-xs font-bold ${canvaTokenPreview ? 'text-emerald-400' : 'text-red-400'}`}>
                  {canvaTokenPreview ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Token Type</span>
                <span className={`text-xs font-bold ${canvaTokenType === 'real_oauth' ? 'text-emerald-400' :
                    canvaTokenType === 'mock_sandbox' ? 'text-amber-400' : 'text-gray-500'
                  }`}>
                  {canvaTokenType || 'none'}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Workspace ID</span>
                <span className="text-xs font-mono text-gray-300 truncate block">{canvaWorkspaceId || '—'}</span>
              </div>
            </div>

            {/* Token Preview */}
            {canvaTokenPreview && (
              <div className="p-3 bg-slate-950/60 border border-white/5 rounded-xl space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Token Preview</span>
                <span className="text-xs font-mono text-white">{canvaTokenPreview}</span>
              </div>
            )}

            {/* Debug message */}
            {canvaStatusDebug && (
              <div className={`p-3 rounded-xl text-xs border ${canvaTokenType === 'real_oauth'
                  ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-300'
                  : 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                }`}>
                {canvaStatusDebug}
              </div>
            )}

            {/* Redirect URI consistency check */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-xl text-xs text-blue-300 space-y-1">
              <span className="font-bold block">📌 Redirect URI Consistency Check</span>
              <p>Your app&apos;s redirect URI: <span className="font-mono text-white">{form.canvaRedirectUri || 'not set'}</span></p>
              <p className="text-gray-400">This must exactly match what you set in your Canva Developer Portal app settings.</p>
            </div>

            {/* API Test Results */}
            {canvaTestResult && (
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${canvaTestResult.success
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                    : canvaTestResult.tokenType === 'mock_sandbox'
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                      : 'bg-red-500/10 border border-red-500/30 text-red-400'
                  }`}>
                  {canvaTestResult.success ? '✅ API TEST PASSED' : canvaTestResult.tokenType === 'mock_sandbox' ? '⚠️ MOCK TOKEN DETECTED' : '❌ API TEST FAILED'}
                  {canvaTestResult.response?.status && ` — HTTP ${canvaTestResult.response.status}`}
                </div>

                {/* Mock token fix guide */}
                {canvaTestResult.fix && (
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block">How to fix:</span>
                    <ol className="space-y-1 text-xs text-amber-200">
                      {canvaTestResult.fix.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {canvaTestResult.request && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Request Sent</span>
                    <pre className="text-[10px] font-mono text-gray-300 bg-black/50 border border-gray-800 p-3 rounded-xl overflow-x-auto">
                      {JSON.stringify(canvaTestResult.request, null, 2)}
                    </pre>
                  </div>
                )}

                {canvaTestResult.response && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Canva API Response</span>
                    <pre className={`text-[10px] font-mono p-3 rounded-xl overflow-x-auto border ${canvaTestResult.success
                        ? 'text-emerald-300 bg-emerald-950/30 border-emerald-800/30'
                        : 'text-red-300 bg-red-950/30 border-red-800/30'
                      }`}>
                      {JSON.stringify(canvaTestResult.response, null, 2)}
                    </pre>
                  </div>
                )}

                {canvaTestResult.success && canvaTestResult.edit_url && (
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">✅ Real Canva Design Created</span>
                    <div className="text-xs text-gray-300 space-y-1">
                      <p>Design ID: <span className="font-mono text-white">{canvaTestResult.design_id}</span></p>
                      <a href={canvaTestResult.edit_url} target="_blank" rel="noreferrer"
                        className="text-emerald-400 hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Open in Canva Editor
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </GlassCard>


          {/* 4. Language Settings */}
          <GlassCard hoverGlow={false} className="space-y-4">
            <div className="pb-2 border-b border-white/5 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">System Workspace Language</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">Default Language Accent</label>
              <select
                value={form.defaultLanguage}
                onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value as 'en' | 'tr' })}
                className="w-full bg-slate-950/60 border border-gray-800 rounded-xl py-3 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/60 transition-all"
              >
                <option value="en" className="bg-slate-950 text-white">English (EN)</option>
                <option value="tr" className="bg-slate-950 text-white">Türkçe (TR)</option>
              </select>
            </div>
          </GlassCard>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-xl border border-white/5 hover:border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save System Settings'}</span>
            </button>
          </div>

        </form>

      </main>
    </div>
  );
}
