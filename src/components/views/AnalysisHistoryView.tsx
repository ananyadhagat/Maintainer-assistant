import React, { useState } from 'react';
import {
  History,
  Bug,
  GitBranch,
  FileCheck2,
  Copy,
  ExternalLink,
  Filter,
  Clock,
} from 'lucide-react';
import { AnalysisHistoryItem } from '../../types';

interface AnalysisHistoryViewProps {
  history: AnalysisHistoryItem[];
  onSelectHistoryItem?: (item: AnalysisHistoryItem) => void;
}

export function AnalysisHistoryView({ history }: AnalysisHistoryViewProps) {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = history.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const getIcon = (type: AnalysisHistoryItem['type']) => {
    switch (type) {
      case 'bug_detective':
        return <Bug className="w-4 h-4 text-rose-400" />;
      case 'repo_analysis':
        return <GitBranch className="w-4 h-4 text-emerald-400" />;
      case 'duplicate_detection':
        return <Copy className="w-4 h-4 text-amber-400" />;
      case 'pr_review':
        return <FileCheck2 className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Analysis History</h2>
              <p className="text-xs text-slate-400">
                Log of past triage operations, bug checks, and generated review drafts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === 'all'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('bug_detective')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === 'bug_detective'
                  ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Bug Detective
            </button>
            <button
              onClick={() => setFilterType('pr_review')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === 'pr_review'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              PR Reviews
            </button>
            <button
              onClick={() => setFilterType('repo_analysis')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterType === 'repo_analysis'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Repo Scans
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs italic">
            No history records recorded yet for this session.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                    {getIcon(item.type)}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-400 font-semibold">
                        {item.repoFullName}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-400">{item.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {item.detailsUrl && (
                    <a
                      href={item.detailsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
