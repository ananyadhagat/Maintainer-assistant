import React, { useState } from 'react';
import {
  GitBranch,
  Search,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Star,
  GitFork,
  AlertCircle,
  Copy,
  GitPullRequest,
  FileCheck2,
} from 'lucide-react';
import { RepositoryAnalysisSummary, GitHubIssue, GitHubPullRequest } from '../../types';
import { Badge } from '../common/Badge';

interface RepositoryAnalysisViewProps {
  summary: RepositoryAnalysisSummary | null;
  issues: GitHubIssue[];
  pulls: GitHubPullRequest[];
  onAnalyze: (url: string, forceDemo?: boolean) => void;
  isLoading: boolean;
  error?: string | null;
}

export function RepositoryAnalysisView({
  summary,
  issues,
  pulls,
  onAnalyze,
  isLoading,
  error,
}: RepositoryAnalysisViewProps) {
  const [inputUrl, setInputUrl] = useState(summary?.repo.html_url || 'https://github.com/acme/taskflow-core');
  const [filterQuery, setFilterQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'unassigned' | 'assigned' | 'closed'>('all');

  React.useEffect(() => {
    if (summary?.repo.html_url) {
      setInputUrl(summary.repo.html_url);
    }
  }, [summary?.repo.html_url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onAnalyze(inputUrl.trim(), false);
    }
  };

  const openIssuesCount = issues.filter((i) => i.state === 'open').length;
  const unassignedCount = issues.filter((i) => !i.assignee && (!i.assignees || i.assignees.length === 0)).length;
  const assignedCount = issues.filter((i) => i.assignee || (i.assignees && i.assignees.length > 0)).length;
  const closedCount = issues.filter((i) => i.state === 'closed').length;

  const filteredIssues = issues.filter((i) => {
    const matchesQuery =
      i.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      i.number.toString().includes(filterQuery) ||
      i.user.login.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (i.assignee?.login || '').toLowerCase().includes(filterQuery.toLowerCase());

    if (!matchesQuery) return false;

    if (statusFilter === 'open') return i.state === 'open';
    if (statusFilter === 'closed') return i.state === 'closed';
    if (statusFilter === 'unassigned') return !i.assignee && (!i.assignees || i.assignees.length === 0);
    if (statusFilter === 'assigned') return Boolean(i.assignee || (i.assignees && i.assignees.length > 0));
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Input Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Repository Analysis & Diagnostic Inspection</h2>
            <p className="text-xs text-slate-400">
              Validate repository URL, retrieve clean issues, filter out PRs, and triage unassigned reports.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-400 font-mono outline-none transition focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputUrl.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching Repository...</span>
              </>
            ) : (
              <span>Analyze Repository</span>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <div className="font-semibold">Analysis Failed</div>
              <div className="text-[11px] text-rose-300/90">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Results View */}
      {summary && (
        <div className="space-y-6">
          {/* Summary Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Issues Analyzed</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">{summary.issuesAnalyzedCount}</div>
              <p className="text-[10px] text-emerald-400 mt-1">
                {openIssuesCount} open • {unassignedCount} unassigned
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Duplicate Clusters</span>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{summary.duplicateGroupsCount}</div>
              <p className="text-[10px] text-amber-400/80 mt-1">Overlapping bug reports</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Incomplete Issues</span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{summary.incompleteIssuesCount}</div>
              <p className="text-[10px] text-rose-400/80 mt-1">Missing diagnostic details</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400">Pull Requests</span>
              <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">{summary.pullRequestsAnalyzedCount}</div>
              <p className="text-[10px] text-indigo-400/80 mt-1">Segregated from issues</p>
            </div>
          </div>

          {/* Issues Table with Live Filter & Unassigned Filter */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>Retrieved Issues</span>
                  <Badge variant="neutral">{filteredIssues.length}</Badge>
                </h3>
                <p className="text-xs text-slate-400">
                  Clean issue reports loaded from repository (PRs segregated, unassigned tracked).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Status & Unassigned Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({issues.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('open')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      statusFilter === 'open'
                        ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Open ({openIssuesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('unassigned')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      statusFilter === 'unassigned'
                        ? 'bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    Unassigned ({unassignedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('closed')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                      statusFilter === 'closed'
                        ? 'bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Closed ({closedCount})
                  </button>
                </div>

                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search issues..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-mono">
                    <th className="pb-2.5 font-medium">Issue</th>
                    <th className="pb-2.5 font-medium">Status</th>
                    <th className="pb-2.5 font-medium">Assignee</th>
                    <th className="pb-2.5 font-medium">Author</th>
                    <th className="pb-2.5 font-medium">Comments</th>
                    <th className="pb-2.5 font-medium text-right">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        No issues matching current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredIssues.map((issue) => {
                      const isUnassigned = !issue.assignee && (!issue.assignees || issue.assignees.length === 0);
                      const primaryAssignee = issue.assignee || (issue.assignees && issue.assignees[0]);

                      return (
                        <tr key={issue.id} className="hover:bg-slate-800/40 transition group">
                          <td className="py-3 pr-4 max-w-md">
                            <div className="flex items-start gap-2">
                              <span className="font-mono text-slate-400 text-xs font-semibold shrink-0">
                                #{issue.number}
                              </span>
                              <div>
                                <a
                                  href={issue.html_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-200 group-hover:text-indigo-400 font-medium hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{issue.title}</span>
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                                </a>
                                {issue.labels && issue.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {issue.labels.slice(0, 3).map((l, idx) => (
                                      <span
                                        key={idx}
                                        className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700"
                                      >
                                        {typeof l === 'string' ? l : l.name}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 pr-4">
                            <Badge variant={issue.state === 'open' ? 'open' : 'closed'}>
                              {issue.state}
                            </Badge>
                          </td>

                          <td className="py-3 pr-4">
                            {isUnassigned ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                Unassigned
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 font-mono text-slate-300 text-xs">
                                {primaryAssignee?.avatar_url && (
                                  <img
                                    src={primaryAssignee.avatar_url}
                                    alt={primaryAssignee.login}
                                    className="w-4 h-4 rounded-full border border-slate-700"
                                  />
                                )}
                                <span>@{primaryAssignee?.login}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 pr-4 font-mono text-slate-300">
                            @{issue.user.login}
                          </td>

                          <td className="py-3 pr-4 font-mono text-slate-400">
                            {issue.comments}
                          </td>

                          <td className="py-3 text-right font-mono text-[11px] text-slate-400">
                            {new Date(issue.updated_at).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
