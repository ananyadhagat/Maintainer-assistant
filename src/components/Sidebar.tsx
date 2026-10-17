import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Copy,
  Bug,
  AlertCircle,
  GitPullRequest,
  FileCheck2,
  History,
  Settings,
  Sparkles,
  ExternalLink,
  Github,
} from 'lucide-react';
import { RepositoryMetadata } from '../types';

export type NavTab =
  | 'overview'
  | 'repository_analysis'
  | 'duplicate_detector'
  | 'bug_detective'
  | 'incomplete_issues'
  | 'pr_analyzer'
  | 'review_drafts'
  | 'history'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeRepo: RepositoryMetadata | null;
  counts?: {
    duplicates?: number;
    incomplete?: number;
    pulls?: number;
    drafts?: number;
  };
  isDemo?: boolean;
}

export function Sidebar({ currentTab, onSelectTab, activeRepo, counts, isDemo }: SidebarProps) {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    highlight?: boolean;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'repository_analysis', label: 'Repository Analysis', icon: GitBranch },
    {
      id: 'duplicate_detector',
      label: 'Duplicate Issues',
      icon: Copy,
      badge: counts?.duplicates ? counts.duplicates : undefined,
    },
    {
      id: 'bug_detective',
      label: 'Bug Detective',
      icon: Bug,
      highlight: true,
      badge: 'Check First',
    },
    {
      id: 'incomplete_issues',
      label: 'Incomplete Issues',
      icon: AlertCircle,
      badge: counts?.incomplete ? counts.incomplete : undefined,
    },
    {
      id: 'pr_analyzer',
      label: 'Pull Request Analyzer',
      icon: GitPullRequest,
      badge: counts?.pulls ? counts.pulls : undefined,
    },
    {
      id: 'review_drafts',
      label: 'Review Drafts',
      icon: FileCheck2,
      badge: counts?.drafts ? counts.drafts : undefined,
    },
    { id: 'history', label: 'Analysis History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#12141a] border-r border-[#21242d] flex flex-col h-screen select-none shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#21242d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1c1f28] border border-[#2b303d] flex items-center justify-center text-slate-200">
            <GitBranch className="w-4 h-4 text-slate-300" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">Maintainer</span>
              <span className="text-[11px] px-1 py-0.5 bg-[#1e222b] text-zinc-300 font-mono rounded border border-[#2b303c]">
                Copilot
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">Repository Triage & Screening</p>
          </div>
        </div>
      </div>

      {/* Active Repo Block */}
      <div className="p-3 border-b border-[#21242d] bg-[#0e1014]">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-1.5 flex items-center justify-between">
          <span>Active Repository</span>
          {isDemo && (
            <span className="px-1.5 py-0.5 text-[9px] bg-amber-950/40 text-amber-300/90 rounded font-mono border border-amber-800/40">
              Demo
            </span>
          )}
        </div>
        {activeRepo ? (
          <div className="flex items-center justify-between bg-[#161820] border border-[#242833] p-2 rounded-lg group hover:border-[#323644] transition">
            <div className="flex items-center gap-2 overflow-hidden">
              <img
                src={activeRepo.owner.avatar_url || 'https://github.com/github.png'}
                alt={activeRepo.owner.login}
                className="w-5 h-5 rounded border border-[#2e3342] shrink-0"
              />
              <span className="text-xs font-mono font-medium text-zinc-200 truncate" title={activeRepo.full_name}>
                {activeRepo.full_name}
              </span>
            </div>
            <a
              href={activeRepo.html_url}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-500 hover:text-zinc-300 p-1"
              title="Open repository on GitHub"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 italic bg-[#161820]/60 p-2 rounded border border-dashed border-[#242833]">
            No repository selected
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-[#1f232d] text-zinc-100 border border-[#2c3240]'
                  : 'text-zinc-400 hover:bg-[#171a22] hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? 'text-zinc-200'
                      : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    isActive
                      ? 'bg-[#282d3a] text-zinc-200 border-[#383e50]'
                      : 'bg-[#1a1d26] text-zinc-400 border-[#262a37]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#21242d] text-xs text-zinc-500 flex items-center justify-between bg-[#0e1014]">
        <div className="flex items-center gap-1.5">
          <Github className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[11px] font-mono text-zinc-400">GitHub API</span>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">Gemma 4 / Gemini</span>
      </div>
    </aside>
  );
}
