import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Search,
  Filter,
  Check,
  Loader2,
} from 'lucide-react';
import { GitHubIssue, CompletenessReport } from '../../types';
import { Badge } from '../common/Badge';

interface IncompleteIssuesViewProps {
  issues: GitHubIssue[];
  repoFullName: string;
  onEvaluateIssue: (issueNumber: number) => Promise<CompletenessReport>;
  completenessReports: Record<number, CompletenessReport>;
}

export function IncompleteIssuesView({
  issues,
  repoFullName,
  onEvaluateIssue,
  completenessReports,
}: IncompleteIssuesViewProps) {
  const [selectedIssueNumber, setSelectedIssueNumber] = useState<number | null>(
    issues[0]?.number || null
  );
  const [evaluatingMap, setEvaluatingMap] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'needs_info'>('all');

  const selectedIssue = issues.find((i) => i.number === selectedIssueNumber) || issues[0];
  const activeReport = selectedIssue ? completenessReports[selectedIssue.number] : null;

  const handleEvaluate = async (issueNumber: number) => {
    setEvaluatingMap((prev) => ({ ...prev, [issueNumber]: true }));
    try {
      await onEvaluateIssue(issueNumber);
    } finally {
      setEvaluatingMap((prev) => ({ ...prev, [issueNumber]: false }));
    }
  };

  const handleCopyComment = (commentText: string) => {
    navigator.clipboard.writeText(commentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredIssues = issues.filter((iss) => {
    const q = filterQuery.toLowerCase();
    const matchesText =
      iss.title.toLowerCase().includes(q) ||
      iss.number.toString().includes(q) ||
      iss.user.login.toLowerCase().includes(q);

    if (filterStatus === 'needs_info') {
      const rep = completenessReports[iss.number];
      const isShort = (iss.body?.length || 0) < 140;
      return matchesText && (rep ? !rep.isComplete : isShort);
    }
    return matchesText;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Incomplete Issue Detection</h2>
              <p className="text-xs text-slate-400">
                Audits bug reports against an adaptive checklist and crafts polite, ready-to-post maintainer comments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus(filterStatus === 'all' ? 'needs_info' : 'all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'needs_info'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterStatus === 'needs_info' ? 'Showing Needs Info' : 'Show All'}</span>
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
            placeholder="Search issues by title, #id or author..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* Two Column Layout: Issue selector on left, Inspection report on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Issues List */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2 h-[680px] overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>Issues ({filteredIssues.length})</span>
            <span className="text-[10px] text-slate-400">Select to inspect</span>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-8 text-center">
              No matching issues found.
            </div>
          ) : (
            filteredIssues.map((iss) => {
              const rep = completenessReports[iss.number];
              const isSelected = selectedIssue?.number === iss.number;
              const isEvaluating = evaluatingMap[iss.number];

              return (
                <div
                  key={iss.id}
                  onClick={() => setSelectedIssueNumber(iss.number)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      #{iss.number}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {rep ? (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                            rep.isComplete
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {rep.score}% Complete
                        </span>
                      ) : (
                        <Badge variant={iss.state === 'open' ? 'open' : 'closed'}>
                          {iss.state}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-xs font-medium text-slate-200 line-clamp-2">
                    {iss.title}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>@{iss.user.login}</span>
                    <span className="font-mono">{new Date(iss.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Inspection & Polite Response Generator */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          {selectedIssue ? (
            <>
              {/* Issue Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      #{selectedIssue.number}
                    </span>
                    <Badge variant={selectedIssue.state === 'open' ? 'open' : 'closed'}>
                      {selectedIssue.state}
                    </Badge>
                    <span className="text-xs text-slate-400">by @{selectedIssue.user.login}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{selectedIssue.title}</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEvaluate(selectedIssue.number)}
                    disabled={evaluatingMap[selectedIssue.number]}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {evaluatingMap[selectedIssue.number] ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{activeReport ? 'Re-evaluate' : 'Evaluate Completeness'}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={selectedIssue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Raw Issue Excerpt */}
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 max-h-36 overflow-y-auto font-mono whitespace-pre-wrap">
                {selectedIssue.body || 'No description provided by author.'}
              </div>

              {/* Completeness Report Section */}
              {activeReport ? (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Score & Verdict Banner */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">Completeness Score</div>
                      <div className="text-2xl font-bold font-mono text-white mt-0.5">
                        {activeReport.score} / 100
                      </div>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-xl font-semibold text-xs border ${
                        activeReport.isComplete
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {activeReport.isComplete ? 'Issue Is Actionable' : 'Information Missing'}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Adaptive Diagnostic Checklist
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {activeReport.checklist.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3"
                        >
                          {item.present ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                          )}
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                              <span
                                className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                                  item.importance === 'critical'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : item.importance === 'recommended'
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {item.importance}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{item.explanation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Suggested Maintainer Comment */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Suggested Maintainer Response</span>
                      </h4>
                      <button
                        onClick={() => handleCopyComment(activeReport.suggestedMaintainerComment)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 transition cursor-pointer border border-slate-700"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Comment</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs text-slate-200 leading-relaxed font-sans relative">
                      {activeReport.suggestedMaintainerComment}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                  <div className="text-xs text-slate-300 font-medium">Ready to screen issue #{selectedIssue.number}</div>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Click "Evaluate Completeness" to inspect reproduction steps, expected behavior, and environment details.
                  </p>
                  <button
                    onClick={() => handleEvaluate(selectedIssue.number)}
                    disabled={evaluatingMap[selectedIssue.number]}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Evaluate Completeness Now
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-slate-400 italic py-12 text-center">
              Select an issue on the left to evaluate its completeness.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
