import React from 'react';
import {
  Copy,
  Bug,
  AlertCircle,
  GitPullRequest,
  FileCheck2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Clock,
  GitCommit,
  CheckCircle2,
  Network,
} from 'lucide-react';
import { RepositoryAnalysisSummary, AnalysisHistoryItem } from '../../types';
import { NavTab } from '../Sidebar';

interface OverviewViewProps {
  summary: RepositoryAnalysisSummary | null;
  history: AnalysisHistoryItem[];
  onNavigate: (tab: NavTab) => void;
  onQuickBugCheck: (sampleBug?: boolean) => void;
}

export function OverviewView({ summary, history, onNavigate, onQuickBugCheck }: OverviewViewProps) {
  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
          <Bug className="w-8 h-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No Repository Analyzed Yet</h3>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Enter any public GitHub repository URL above (or load the bundled demo repository) to inspect duplicates, screen incomplete issues, and check bugs before fixing.
        </p>
      </div>
    );
  }

  const { repo } = summary;

  return (
    <div className="space-y-6">
      {/* Hero / Quick Action Banner - Non-Luminous Matte Card */}
      <div className="rounded-xl border border-[#242834] bg-[#15171f] p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Bug className="w-3.5 h-3.5 text-zinc-400" />
              <span>Core Capability: Check Before Fixing</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
              Investigating a bug in <span className="text-zinc-200 underline decoration-[#383e52]">{repo.name}</span>?
            </h2>
            <p className="text-xs md:text-sm text-zinc-400">
              Prevent duplicate PRs and wasted triage time. Screen newly discovered bugs against existing issues, closed reports, and merged pull requests before writing code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onQuickBugCheck(true)}
              className="px-4 py-2 rounded-md bg-[#232836] hover:bg-[#2c3345] text-zinc-100 text-xs font-semibold flex items-center gap-2 border border-[#353d52] transition cursor-pointer"
            >
              <Bug className="w-4 h-4 text-zinc-300" />
              <span>Launch Bug Detective</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            <button
              onClick={() => onNavigate('architecture')}
              className="px-4 py-2 rounded-md bg-[#1e2332] hover:bg-[#272e42] text-indigo-300 text-xs font-semibold flex items-center gap-2 border border-indigo-500/30 transition cursor-pointer"
            >
              <Network className="w-4 h-4 text-indigo-400" />
              <span>Architecture Visualizer</span>
            </button>
            <button
              onClick={() => onNavigate('duplicate_detector')}
              className="px-4 py-2 rounded-md bg-[#181a22] hover:bg-[#20232c] text-zinc-300 text-xs font-medium border border-[#272b38] transition cursor-pointer"
            >
              <span>View Duplicate Groups</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('repository_analysis')}
          className="bg-[#15171f] hover:bg-[#191c25] border border-[#232733] hover:border-[#323847] p-4 rounded-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Issues Analyzed</span>
            <div className="p-1.5 rounded bg-[#1c202a] text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400/90" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{summary.issuesAnalyzedCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Filtered out PR items</div>
        </div>

        <div
          onClick={() => onNavigate('duplicate_detector')}
          className="bg-[#15171f] hover:bg-[#191c25] border border-[#232733] hover:border-[#323847] p-4 rounded-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Duplicate Clusters</span>
            <div className="p-1.5 rounded bg-[#1c202a] text-zinc-300">
              <Copy className="w-4 h-4 text-amber-400/90" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{summary.duplicateGroupsCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Consolidation candidates</div>
        </div>

        <div
          onClick={() => onNavigate('incomplete_issues')}
          className="bg-[#15171f] hover:bg-[#191c25] border border-[#232733] hover:border-[#323847] p-4 rounded-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Incomplete Issues</span>
            <div className="p-1.5 rounded bg-[#1c202a] text-zinc-300">
              <AlertCircle className="w-4 h-4 text-rose-400/90" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{summary.incompleteIssuesCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Missing repro / logs</div>
        </div>

        <div
          onClick={() => onNavigate('pr_analyzer')}
          className="bg-[#15171f] hover:bg-[#191c25] border border-[#232733] hover:border-[#323847] p-4 rounded-lg transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-400 font-medium">Pull Requests</span>
            <div className="p-1.5 rounded bg-[#1c202a] text-zinc-300">
              <GitPullRequest className="w-4 h-4 text-zinc-300" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">{summary.pullRequestsAnalyzedCount}</div>
          <div className="text-[11px] text-zinc-500 mt-1">Ready for review</div>
        </div>
      </div>

      {/* Main Grid: Repo Info + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Repository Context Card */}
        <div className="lg:col-span-2 bg-[#15171f] border border-[#232733] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#232733]">
            <div className="flex items-center gap-3">
              <img
                src={repo.owner.avatar_url}
                alt={repo.owner.login}
                className="w-9 h-9 rounded border border-[#2e3342]"
              />
              <div>
                <h3 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                  <span>{repo.full_name}</span>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-500 hover:text-zinc-300 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </h3>
                <p className="text-xs text-zinc-400">{repo.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="bg-[#0f1115] p-3 rounded border border-[#21242e]">
              <div className="text-zinc-500 text-[11px]">Primary Language</div>
              <div className="font-mono font-medium text-zinc-200 mt-0.5">{repo.language || 'Multiple'}</div>
            </div>
            <div className="bg-[#0f1115] p-3 rounded border border-[#21242e]">
              <div className="text-zinc-500 text-[11px]">Default Branch</div>
              <div className="font-mono font-medium text-zinc-200 mt-0.5">{repo.default_branch}</div>
            </div>
            <div className="bg-[#0f1115] p-3 rounded border border-[#21242e]">
              <div className="text-zinc-500 text-[11px]">License</div>
              <div className="font-mono font-medium text-zinc-200 mt-0.5">{repo.license?.spdx_id || repo.license?.name || 'Unspecified'}</div>
            </div>
            <div className="bg-[#0f1115] p-3 rounded border border-[#21242e]">
              <div className="text-zinc-500 text-[11px]">Analysis Mode</div>
              <div className="font-mono font-medium text-zinc-300 mt-0.5">
                {summary.isDemo ? 'Offline Demo' : 'Live GitHub API'}
              </div>
            </div>
          </div>

          {/* Maintainer Shortcuts */}
          <div className="pt-2">
            <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mb-2.5">Maintainer Workflows</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => onNavigate('bug_detective')}
                className="p-3 bg-[#0f1115] hover:bg-[#1a1c24] border border-[#21242e] hover:border-[#323644] rounded text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between text-zinc-300 mb-1">
                  <Bug className="w-4 h-4 text-zinc-400" />
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-xs font-medium text-zinc-200">Bug Detective</div>
                <div className="text-[11px] text-zinc-500">Check for existing fixes</div>
              </button>

              <button
                onClick={() => onNavigate('incomplete_issues')}
                className="p-3 bg-[#0f1115] hover:bg-[#1a1c24] border border-[#21242e] hover:border-[#323644] rounded text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between text-zinc-300 mb-1">
                  <AlertCircle className="w-4 h-4 text-zinc-400" />
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-xs font-medium text-zinc-200">Screen Incomplete</div>
                <div className="text-[11px] text-zinc-500">Request repro info</div>
              </button>

              <button
                onClick={() => onNavigate('pr_analyzer')}
                className="p-3 bg-[#0f1115] hover:bg-[#1a1c24] border border-[#21242e] hover:border-[#323644] rounded text-left transition group cursor-pointer"
              >
                <div className="flex items-center justify-between text-zinc-300 mb-1">
                  <FileCheck2 className="w-4 h-4 text-zinc-400" />
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div className="text-xs font-medium text-zinc-200">Review Drafts</div>
                <div className="text-[11px] text-zinc-500">Generate PR review</div>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Copilot Activity */}
        <div className="bg-[#15171f] border border-[#232733] rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-[#232733] mb-3">
            <h3 className="font-semibold text-zinc-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Recent Activity</span>
            </h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              View all
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-[340px]">
            {history.length === 0 ? (
              <div className="text-xs text-zinc-500 italic py-8 text-center">
                No previous analyses in this session yet.
              </div>
            ) : (
              history.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded bg-[#0f1115] border border-[#21242e] text-xs space-y-1 hover:border-[#2f3340] transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-200 truncate pr-2">{item.title}</span>
                    <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2">{item.summary}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
