import React, { useState } from 'react';
import {
  FileCheck2,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  ExternalLink,
  Sparkles,
  AlertCircle,
  FileCode,
  CheckCircle2,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { ReviewDraft, ReviewCommentDraft } from '../../types';
import { Badge } from '../common/Badge';

interface ReviewDraftsViewProps {
  drafts: ReviewDraft[];
  onUpdateDraft: (id: string, updates: Partial<ReviewDraft>) => Promise<ReviewDraft>;
  onRegenerateDraft: (prNumber: number, userFeedback?: string) => Promise<ReviewDraft>;
  activePrNumber?: number | null;
}

export function ReviewDraftsView({
  drafts,
  onUpdateDraft,
  onRegenerateDraft,
  activePrNumber,
}: ReviewDraftsViewProps) {
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(
    drafts[0]?.id || null
  );
  const [isEditingMarkdown, setIsEditingMarkdown] = useState(false);
  const [editedMarkdown, setEditedMarkdown] = useState('');
  const [customFeedback, setCustomFeedback] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync selection
  React.useEffect(() => {
    if (activePrNumber) {
      const match = drafts.find((d) => d.prNumber === activePrNumber);
      if (match) setSelectedDraftId(match.id);
    } else if (!selectedDraftId && drafts.length > 0) {
      setSelectedDraftId(drafts[0].id);
    }
  }, [activePrNumber, drafts]);

  const activeDraft = drafts.find((d) => d.id === selectedDraftId) || drafts[0];

  React.useEffect(() => {
    if (activeDraft) {
      setEditedMarkdown(activeDraft.markdownDraft);
      setIsEditingMarkdown(false);
    }
  }, [activeDraft?.id]);

  const handleCopy = () => {
    if (!activeDraft) return;
    navigator.clipboard.writeText(editedMarkdown || activeDraft.markdownDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveMarkdown = async () => {
    if (!activeDraft) return;
    await onUpdateDraft(activeDraft.id, { markdownDraft: editedMarkdown });
    setIsEditingMarkdown(false);
  };

  const handleToggleReviewed = async () => {
    if (!activeDraft) return;
    const newStatus = activeDraft.status === 'reviewed' ? 'draft' : 'reviewed';
    await onUpdateDraft(activeDraft.id, { status: newStatus });
  };

  const handleRegenerate = async () => {
    if (!activeDraft) return;
    setIsRegenerating(true);
    try {
      const regenerated = await onRegenerateDraft(activeDraft.prNumber, customFeedback);
      setSelectedDraftId(regenerated.id);
      setCustomFeedback('');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Code Review Drafts</h2>
              <p className="text-xs text-slate-400">
                Grounded review drafts with file and line references. Editable and exportable without automatic posting.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Reviewer approval required before GitHub publishing</span>
          </div>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileCode className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Review Drafts Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Go to the <span className="font-semibold text-indigo-400">Pull Request Analyzer</span> tab, pick any PR, and click "Generate Grounded Review Draft".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Drafts List Selector */}
          <div className="lg:col-span-4 bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-2 h-[720px] overflow-y-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2 pb-2 border-b border-slate-800">
              Saved Drafts ({drafts.length})
            </div>

            {drafts.map((d) => {
              const isSelected = activeDraft?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDraftId(d.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      PR #{d.prNumber}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                        d.status === 'reviewed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <div className="text-xs font-medium text-slate-200 line-clamp-2">
                    {d.prTitle}
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {new Date(d.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Review Draft Workspace */}
          {activeDraft && (
            <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
              {/* Draft Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-400 text-sm">
                      PR #{activeDraft.prNumber}
                    </span>
                    <Badge variant={activeDraft.status === 'reviewed' ? 'open' : 'warning'}>
                      {activeDraft.status}
                    </Badge>
                  </div>
                  <h3 className="text-base font-semibold text-white mt-1">{activeDraft.prTitle}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleToggleReviewed}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                      activeDraft.status === 'reviewed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{activeDraft.status === 'reviewed' ? 'Reviewed' : 'Mark Reviewed'}</span>
                  </button>

                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied Draft!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Markdown</span>
                      </>
                    )}
                  </button>

                  <a
                    href={activeDraft.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Open PR on GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Grounded Inline Comments Breakdown */}
              {activeDraft.suggestedComments && activeDraft.suggestedComments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Grounded Inline Comments ({activeDraft.suggestedComments.length})</span>
                  </h4>

                  <div className="space-y-2">
                    {activeDraft.suggestedComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs text-indigo-300 font-semibold">
                            {comment.filePath || 'Repository Context'}
                            {comment.lineNumber ? `:${comment.lineNumber}` : ''}
                          </span>
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${
                              comment.severity === 'blocking'
                                ? 'bg-rose-500/20 text-rose-300'
                                : comment.severity === 'important'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {comment.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editable Markdown Review Section */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Formatted Review Body</span>
                  </h4>
                  <button
                    onClick={() => {
                      if (isEditingMarkdown) {
                        handleSaveMarkdown();
                      } else {
                        setIsEditingMarkdown(true);
                      }
                    }}
                    className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                  >
                    {isEditingMarkdown ? 'Save Changes' : 'Edit Text'}
                  </button>
                </div>

                {isEditingMarkdown ? (
                  <textarea
                    rows={10}
                    value={editedMarkdown}
                    onChange={(e) => setEditedMarkdown(e.target.value)}
                    className="w-full bg-slate-950 border border-indigo-500 rounded-xl p-3 text-xs text-slate-100 font-mono outline-none"
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                    {editedMarkdown || activeDraft.markdownDraft}
                  </div>
                )}
              </div>

              {/* Regenerate with Maintainer Guidance */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 pt-3">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Regenerate Draft with Custom Guidance</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customFeedback}
                    onChange={(e) => setCustomFeedback(e.target.value)}
                    placeholder="e.g. Focus on memory cleanup in streamHandler or ask for unit tests..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer border border-slate-700 flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isRegenerating ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
