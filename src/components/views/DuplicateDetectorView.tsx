import React, { useState } from 'react';
import {
  Copy,
  Search,
  ExternalLink,
  Crown,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { DuplicateGroup } from '../../types';
import { Badge } from '../common/Badge';

interface DuplicateDetectorViewProps {
  groups: DuplicateGroup[];
  repoFullName: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export function DuplicateDetectorView({
  groups,
  repoFullName,
  isLoading,
  onRefresh,
}: DuplicateDetectorViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);

  const filteredGroups = groups.filter((g) => {
    const q = filterQuery.toLowerCase();
    return (
      g.canonicalIssue.title.toLowerCase().includes(q) ||
      g.commonComponent.toLowerCase().includes(q) ||
      g.similarIssues.some((s) => s.title.toLowerCase().includes(q) || s.number.toString().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Duplicate Issue Detector</h2>
              <p className="text-xs text-slate-400">
                Identifies reports describing the same underlying bug and groups them under a canonical issue recommendation.
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition cursor-pointer self-start sm:self-auto"
          >
            {isLoading ? 'Scanning Repository...' : 'Re-scan Duplicates'}
          </button>
        </div>

        {/* Filter bar */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Search duplicate clusters by component, title or issue number..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Duplicate Groups List */}
      {filteredGroups.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No Duplicate Clusters Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            All issues in <span className="font-mono text-slate-300">{repoFullName}</span> currently appear distinct, or search filter returned no matches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition shadow-sm space-y-4"
            >
              {/* Component Badge & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                    Component:
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                    {group.commonComponent}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({group.similarIssues.length + 1} related reports)
                  </span>
                </div>

                <div className="text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 self-start sm:self-auto font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Action: {group.recommendedAction}</span>
                </div>
              </div>

              {/* Canonical Issue Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 border border-slate-700/80">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                      <Crown className="w-3 h-3 text-amber-400" />
                      Recommended Canonical Issue
                    </span>
                    <Badge variant={group.canonicalIssue.state === 'open' ? 'open' : 'closed'}>
                      {group.canonicalIssue.state}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    @{group.canonicalIssue.author} • {group.canonicalIssue.commentsCount} comments
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-indigo-400 text-sm font-semibold">
                    #{group.canonicalIssue.number}
                  </span>
                  <a
                    href={group.canonicalIssue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-white hover:text-indigo-300 transition inline-flex items-center gap-1"
                  >
                    <span>{group.canonicalIssue.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Similar Duplicate Reports */}
              <div className="space-y-2.5 pl-3 border-l-2 border-amber-500/30 ml-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Similar Duplicate Reports ({group.similarIssues.length})
                </div>

                <div className="space-y-2">
                  {group.similarIssues.map((sim) => (
                    <div
                      key={sim.number}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 text-xs font-semibold">
                            #{sim.number}
                          </span>
                          <Badge variant={sim.state === 'open' ? 'open' : 'closed'}>
                            {sim.state}
                          </Badge>
                          <a
                            href={sim.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-slate-200 hover:text-indigo-400 transition inline-flex items-center gap-1"
                          >
                            <span>{sim.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-start gap-1">
                          <span className="text-slate-400 font-medium shrink-0">Overlap:</span>
                          <span>{sim.overlappingSymptoms}</span>
                        </p>
                      </div>

                      {/* Approximate Ranking Signal */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 font-mono">Similarity signal</div>
                          <div className="text-xs font-mono font-bold text-amber-300">
                            ~{sim.similarityScore}%
                          </div>
                        </div>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold ${
                            sim.confidence === 'high'
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : sim.confidence === 'medium'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {sim.confidence} conf
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
