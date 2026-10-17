import React, { useState } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Search,
  Filter,
  Loader2,
  ArrowRight,
  GitCommit,
} from 'lucide-react';
import { GitHubPullRequest, PullRequestAnalysis } from '../../types';
import { Badge } from '../common/Badge';

interface PullRequestAnalyzerViewProps {
  pulls: GitHubPullRequest[];
  repoFullName: string;
  onSummarizePr: (prNumber: number) => Promise<PullRequestAnalysis>;
  onGenerateDraft: (prNumber: number) => void;
  cachedAnalyses: Record<number, PullRequestAnalysis>;
}

export function PullRequestAnalyzerView({
  pulls,
  repoFullName,
  onSummarizePr,
  onGenerateDraft,
  cachedAnalyses,
}: PullRequestAnalyzerViewProps) {
  const [selectedPrNumber, setSelectedPrNumber] = useState<number | null>(pulls[0]?.number || null);
  const [summarizingMap, setSummarizingMap] = useState<Record<number, boolean>>({});
  const [filterQuery, setFilterQuery] = useState('');
  const [filterState, setFilterState] = useState<'all' | 'open' | 'closed'>('all');

  const selectedPr = pulls.find((p) => p.number === selectedPrNumber) || pulls[0];
  const activeAnalysis = selectedPr ? cachedAnalyses[selectedPr.number] : null;

  const handleSummarize = async (prNumber: number) => {
    setSummarizingMap((prev) => ({ ...prev, [prNumber]: true }));
    try {
      await onSummarizePr(prNumber);
    } finally {
      setSummarizingMap((prev) => ({ ...prev, [prNumber]: false }));
    }
  };

  const filteredPulls = pulls.filter((p) => {
    const q = filterQuery.toLowerCase();
    const matchesText =
      p.title.toLowerCase().includes(q) ||
      p.number.toString().includes(q) ||
      p.user.login.toLowerCase().includes(q);

    if (filterState === 'open') return matchesText && p.state === 'open';
    if (filterState === 'closed') return matchesText && p.state === 'closed';
    return matchesText;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Pull Request Analyzer</h2>
              <p className="text-xs text-slate-400">
                Grounded inspection of PR diffs: summaries, affected modules, edge case risks, and test coverage checks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterState('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterState === 'all'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterState('open')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterState === 'open'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilterState('closed')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                filterState === 'closed'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search PRs by title, #id or author..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: PR list */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2 h-[720px] overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Pull Requests ({filteredPulls.length})</span>
            <span className="text-[10px] text-slate-400">Select to inspect</span>
          </div>

          {filteredPulls.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-8 text-center">
              No matching pull requests found.
            </div>
          ) : (
            filteredPulls.map((pr) => {
              const isSelected = selectedPr?.number === pr.number;
              const hasAnalysis = Boolean(cachedAnalyses[pr.number]);

              return (
                <div
                  key={pr.id}
                  onClick={() => setSelectedPrNumber(pr.number)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      #{pr.number}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {pr.merged_at ? (
                        <Badge variant="merged">merged</Badge>
                      ) : pr.draft ? (
                        <Badge variant="draft">draft</Badge>
                      ) : (
                        <Badge variant={pr.state === 'open' ? 'open' : 'closed'}>
                          {pr.state}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-medium text-slate-200 line-clamp-2">
                    {pr.title}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>@{pr.user.login}</span>
                    {hasAnalysis && (
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-500/30">
                        Analyzed
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: PR Details & Analysis Card */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          {selectedPr ? (
            <>
              {/* PR Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      #{selectedPr.number}
                    </span>
                    {selectedPr.merged_at ? (
                      <Badge variant="merged">merged</Badge>
                    ) : selectedPr.draft ? (
                      <Badge variant="draft">draft</Badge>
                    ) : (
                      <Badge variant={selectedPr.state === 'open' ? 'open' : 'closed'}>
                        {selectedPr.state}
                      </Badge>
                    )}
                    <span className="text-xs text-slate-400">by @{selectedPr.user.login}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{selectedPr.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSummarize(selectedPr.number)}
                    disabled={summarizingMap[selectedPr.number]}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {summarizingMap[selectedPr.number] ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing Diff...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{activeAnalysis ? 'Re-analyze' : 'Analyze PR Diff'}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={selectedPr.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* PR Description Box */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 max-h-32 overflow-y-auto font-mono whitespace-pre-wrap">
                {selectedPr.body || 'No description provided by author.'}
              </div>

              {/* Analysis Results */}
              {activeAnalysis ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* AI Summary Card */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Architectural Summary</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {activeAnalysis.aiSummary}
                    </p>
                  </div>

                  {/* Components & Risk Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Affected Components
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {activeAnalysis.affectedComponents.map((comp, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Risk Level Assessment
                      </span>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span
                          className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded font-bold ${
                            activeAnalysis.riskLevel === 'high'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : activeAnalysis.riskLevel === 'medium'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {activeAnalysis.riskLevel} Risk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risks & Edge Cases */}
                  {activeAnalysis.risksAndEdgeCases.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
                      <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Risks & Edge Cases to Inspect</span>
                      </div>
                      <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-1">
                        {activeAnalysis.risksAndEdgeCases.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Test Sufficiency Audit */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Test Sufficiency Audit</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                          activeAnalysis.testSufficiency.status === 'adequate'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {activeAnalysis.testSufficiency.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{activeAnalysis.testSufficiency.explanation}</p>
                    {activeAnalysis.testSufficiency.suggestedCases.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] font-medium text-slate-300">Suggested test cases:</div>
                        <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5 mt-0.5">
                          {activeAnalysis.testSufficiency.suggestedCases.map((c, idx) => (
                            <li key={idx}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* CTA: Generate Code Review Draft */}
                  <div className="pt-2">
                    <button
                      onClick={() => onGenerateDraft(selectedPr.number)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Grounded Review Draft</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-3">
                  <FileCode className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div className="text-xs text-slate-300 font-medium">Ready to analyze PR #{selectedPr.number}</div>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Fetches and parses the pull request diff to examine changes, edge case risks, and test coverage.
                  </p>
                  <button
                    onClick={() => handleSummarize(selectedPr.number)}
                    disabled={summarizingMap[selectedPr.number]}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Analyze PR Diff Now
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-slate-400 italic py-12 text-center">
              Select a pull request on the left to inspect its diff and analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
