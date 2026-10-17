import React, { useState } from 'react';
import {
  Search,
  Star,
  GitFork,
  AlertCircle,
  PlayCircle,
  RefreshCw,
  Code2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { RepositoryMetadata } from '../types';

interface HeaderProps {
  activeRepo: RepositoryMetadata | null;
  onAnalyze: (url: string, forceDemo?: boolean) => void;
  isLoading: boolean;
  isDemo?: boolean;
  rateLimitRemaining?: number;
}

export function Header({
  activeRepo,
  onAnalyze,
  isLoading,
  isDemo,
  rateLimitRemaining,
}: HeaderProps) {
  const [repoInput, setRepoInput] = useState(activeRepo?.full_name || 'acme/taskflow-core');

  React.useEffect(() => {
    if (activeRepo?.full_name) {
      setRepoInput(activeRepo.full_name);
    }
  }, [activeRepo?.full_name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoInput.trim()) {
      onAnalyze(repoInput.trim(), false);
    }
  };

  const handleQuickSelect = (url: string, demo = false) => {
    setRepoInput(url);
    onAnalyze(url, demo);
  };

  return (
    <header className="border-b border-[#21242d] bg-[#12141a] px-6 py-3 sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Search / Repo input */}
      <div className="flex-1 max-w-2xl">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="Enter GitHub URL or owner/repo (e.g. sindresorhus/awesome)"
              className="w-full bg-[#0d0f13] border border-[#262a35] focus:border-zinc-500 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 font-mono outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !repoInput.trim()}
            className="px-3.5 py-1.5 bg-[#252a36] hover:bg-[#2e3444] disabled:opacity-50 text-zinc-100 text-xs font-medium rounded-md border border-[#343b4d] flex items-center gap-1.5 transition shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5 text-zinc-300" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </form>

        {/* Quick select presets */}
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto text-[11px] text-zinc-500">
          <span className="text-zinc-500 shrink-0">Try:</span>
          <button
            type="button"
            onClick={() => handleQuickSelect('sindresorhus/awesome')}
            className="px-1.5 py-0.5 rounded bg-[#181a22] hover:bg-[#222530] hover:text-zinc-200 text-zinc-300 font-mono text-[10px] transition shrink-0 cursor-pointer border border-[#282d3b]"
          >
            sindresorhus/awesome
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('TheAlgorithms/Java')}
            className="px-1.5 py-0.5 rounded bg-[#181a22] hover:bg-[#222530] hover:text-zinc-200 text-zinc-400 font-mono text-[10px] transition shrink-0 cursor-pointer border border-[#242834]"
          >
            TheAlgorithms/Java
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('facebook/react')}
            className="px-1.5 py-0.5 rounded bg-[#181a22] hover:bg-[#222530] hover:text-zinc-200 text-zinc-400 font-mono text-[10px] transition shrink-0 cursor-pointer border border-[#242834]"
          >
            facebook/react
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('acme/taskflow-core', true)}
            className="px-1.5 py-0.5 rounded bg-[#181a22] hover:bg-[#222530] hover:text-amber-300/90 text-zinc-300 font-mono text-[10px] transition shrink-0 cursor-pointer border border-[#2b2f3d]"
          >
            acme/taskflow-core (Demo)
          </button>
        </div>
      </div>

      {/* Right: Active Repository Stats */}
      {activeRepo && (
        <div className="flex items-center gap-3 shrink-0 text-xs">
          {isDemo && (
            <div className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40 text-amber-300/90 font-mono text-[11px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Demo Mode
            </div>
          )}

          <div className="flex items-center gap-3 bg-[#0d0f13] border border-[#242732] px-3 py-1.5 rounded-md font-mono text-zinc-300">
            <div className="flex items-center gap-1" title="Stars">
              <Star className="w-3.5 h-3.5 text-zinc-400" />
              <span>{activeRepo.stargazers_count?.toLocaleString() || 0}</span>
            </div>

            <div className="flex items-center gap-1 text-zinc-400" title="Forks">
              <GitFork className="w-3.5 h-3.5 text-zinc-500" />
              <span>{activeRepo.forks_count?.toLocaleString() || 0}</span>
            </div>

            <div className="flex items-center gap-1" title="Open Issues">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
              <span>{activeRepo.open_issues_count?.toLocaleString() || 0}</span>
            </div>

            {activeRepo.language && (
              <div className="hidden sm:flex items-center gap-1 text-zinc-400 border-l border-[#242732] pl-2">
                <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>{activeRepo.language}</span>
              </div>
            )}
          </div>

          <a
            href={activeRepo.html_url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-md bg-[#181a22] hover:bg-[#222530] text-zinc-400 hover:text-zinc-200 border border-[#262a36] transition"
            title="Open on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </header>
  );
}
