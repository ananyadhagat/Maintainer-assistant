import React, { useState } from 'react';
import {
  Settings,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  Sparkles,
  Server,
  Save,
  Check,
} from 'lucide-react';

interface SettingsViewProps {
  geminiConfigured: boolean;
  githubTokenConfigured: boolean;
  onSaveToken: (token: string) => Promise<void>;
  isDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
}

export function SettingsView({
  geminiConfigured,
  githubTokenConfigured,
  onSaveToken,
  isDemoMode,
  onToggleDemoMode,
}: SettingsViewProps) {
  const [tokenInput, setTokenInput] = useState(
    localStorage.getItem('maintainer_github_token') || ''
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveToken(tokenInput.trim());
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Application Settings & Integrations</h2>
            <p className="text-xs text-slate-400">
              Configure credentials, monitor API quotas, and manage demonstration modes.
            </p>
          </div>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gemini AI Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-white">Gemini API Engine</span>
            </div>
            {geminiConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                <AlertCircle className="w-3 h-3" />
                Missing Env Key
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Model: <span className="text-indigo-300 font-mono">gemini-3.8-flash</span> via server-side GoogleGenAI SDK.
            Keys are securely held by the server proxy and never exposed to the client.
          </p>
        </div>

        {/* GitHub REST API Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold text-white">GitHub Rate Limit Tier</span>
            </div>
            {githubTokenConfigured ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Authenticated (5,000/hr)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                Public Anonymous (60/hr)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Adding a personal access token boosts public repository querying limits from 60 to 5,000 requests per hour.
          </p>
        </div>
      </div>

      {/* GitHub Personal Access Token Form */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-400" />
              <span>Configure GitHub Personal Access Token</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              Used solely to authenticate with GitHub's REST API for higher rate limits. Only the public "read:user" or no scopes are needed for public repos.
            </p>
          </div>
          <a
            href="https://github.com/settings/tokens/new?description=Maintainer+Copilot&scopes=public_repo"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1 transition"
          >
            <span>Create Token on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono placeholder:text-slate-400 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Token is kept in your local browser session and proxy memory.</span>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Token</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Mode Toggle */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-white">Default Demo Mode Fallback</h3>
          <p className="text-xs text-slate-400 max-w-xl">
            When enabled or when GitHub's anonymous rate limit is exceeded, Maintainer Copilot loads rich curated open-source repository fixtures (`acme/taskflow-core`) with realistic OOM bug reports, Redis timeouts, and PR diffs.
          </p>
        </div>

        <button
          onClick={() => onToggleDemoMode(!isDemoMode)}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer self-start sm:self-auto ${
            isDemoMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {isDemoMode ? 'Demo Mode: Active' : 'Demo Mode: Disabled'}
        </button>
      </div>

      {/* Architecture & Security Disclosure */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-xs text-slate-400 space-y-2">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Architecture & Security Posture
        </div>
        <p>
          • <strong>Untrusted Content Isolation:</strong> All GitHub issue bodies, comments, and PR diffs are wrapped in isolation blocks (`&lt;untrusted_repository_content&gt;`) with system instruction prompts forbidding instruction overriding.
        </p>
        <p>
          • <strong>Read-Only Safety:</strong> Copilot generates drafts and analysis only; it does not post comments, close issues, or merge pull requests automatically without user action.
        </p>
      </div>
    </div>
  );
}
