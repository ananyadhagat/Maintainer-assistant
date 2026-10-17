import React, { useState } from 'react';
import {
  Bug,
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  GitPullRequest,
  GitCommit,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Terminal,
  RefreshCw,
  Info,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  FileCode,
  ArrowRight,
  MessageSquare,
  Wrench,
} from 'lucide-react';
import { BugDetectiveResult, BugDetectiveState } from '../../types';
import { Badge } from '../common/Badge';

interface BugDetectiveViewProps {
  repoUrl: string;
  onCheckBug: (payload: {
    bugTitle: string;
    bugDescription?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    observedBehavior?: string;
    stepsToReproduce?: string;
    errorMessage?: string;
    relevantFiles?: string;
    repoUrl?: string;
  }) => Promise<BugDetectiveResult>;
  lastResult: BugDetectiveResult | null;
  isLoading: boolean;
}

export function BugDetectiveView({
  repoUrl,
  onCheckBug,
  lastResult,
  isLoading,
}: BugDetectiveViewProps) {
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [observedBehavior, setObservedBehavior] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [relevantFiles, setRelevantFiles] = useState('');
  const [currentRepoUrl, setCurrentRepoUrl] = useState(repoUrl);
  const [result, setResult] = useState<BugDetectiveResult | null>(lastResult);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [showFixChecklist, setShowFixChecklist] = useState(false);

  // Sync if lastResult changes from outside
  React.useEffect(() => {
    if (lastResult) setResult(lastResult);
  }, [lastResult]);

  React.useEffect(() => {
    if (repoUrl) setCurrentRepoUrl(repoUrl);
  }, [repoUrl]);

  // Sample quick loader for hackathon demo & testing
  const loadSample = (sampleType: 'fixed' | 'duplicate_unfixed' | 'uncertain' | 'unique' | 'sparse' | 'awesome_unmaintained') => {
    setErrorMsg(null);
    if (sampleType === 'fixed') {
      setBugTitle('Redis reconnect timeout causes UnhandledPromiseRejection in retry backoff');
      setBugDescription('When primary Redis drops during failover, socket times out and throws an unhandled rejection rather than backing off cleanly.');
      setExpectedBehavior('Socket reconnect should catch errors during retry interval and dispatch disconnect event.');
      setObservedBehavior('UnhandledPromiseRejection: Error: Socket closed unexpectedly during reconnect retry 3');
      setStepsToReproduce('1. Kill primary redis daemon.\n2. Trigger task dispatch.\n3. Watch console crash.');
      setErrorMessage('UnhandledPromiseRejection: Error: Socket closed unexpectedly during reconnect retry 3 at RedisTransport.retry (/src/transport/redis.ts:114:15)');
      setRelevantFiles('src/transport/redis.ts');
    } else if (sampleType === 'duplicate_unfixed') {
      setBugTitle('High memory consumption in worker streaming large buffers');
      setBugDescription('Node container crashes with OOM after running several large streaming jobs.');
      setExpectedBehavior('Buffer memory should be released as soon as chunks are consumed.');
      setObservedBehavior('RSS memory increases linearly without being garbage collected in streamHandler.ts.');
      setStepsToReproduce('1. Dispatch 100MB chunk streams.\n2. Check memoryUsage()');
      setErrorMessage('JavaScript heap out of memory (OOMKilled)');
      setRelevantFiles('src/workers/streamHandler.ts');
    } else if (sampleType === 'uncertain') {
      setBugTitle('Intermittent connection drops during idle WebSocket telemetry');
      setBugDescription('Clients lose telemetry stream on idle after 90 seconds without clear error code.');
      setExpectedBehavior('Keepalive ping-pong should keep connection active or trigger clean onDisconnect.');
      setObservedBehavior('Socket closes silently without invoking registered event handler.');
      setStepsToReproduce('1. Connect WebSocket telemetry client.\n2. Leave idle for 90s.');
      setErrorMessage('WebSocket connection closed with code 1006');
      setRelevantFiles('src/telemetry/ws.ts');
    } else if (sampleType === 'unique') {
      setBugTitle('Custom Brotli compression level 11 silently ignored in tarball pipeline');
      setBugDescription('When specifying custom Brotli compression level 11, the pipeline defaults to standard gzip without warning.');
      setExpectedBehavior('Archive generator should utilize configured Brotli dictionary and compression level.');
      setObservedBehavior('Output file is standard gzip with compression level 6.');
      setStepsToReproduce('1. Set compression.algorithm = "brotli" and level = 11.\n2. Inspect archive output.');
      setErrorMessage('');
      setRelevantFiles('src/archive/compress.ts');
    } else if (sampleType === 'awesome_unmaintained') {
      setCurrentRepoUrl('https://github.com/sindresorhus/awesome');
      setBugTitle('unmainted repository');
      setBugDescription('Differentiating and handling unmaintained repositories in the list.');
      setExpectedBehavior('Clear guidelines or flags for unmaintained or archived repositories.');
      setObservedBehavior('Unmaintained repositories lack clear differentiation from active ones.');
      setStepsToReproduce('1. Browse list items.\n2. Identify unmaintained projects.');
      setErrorMessage('');
      setRelevantFiles('readme.md');
    } else {
      setBugTitle('App crashes');
      setBugDescription('It stopped working.');
      setExpectedBehavior('');
      setObservedBehavior('');
      setStepsToReproduce('');
      setErrorMessage('');
      setRelevantFiles('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim()) {
      setErrorMsg('Please enter a bug title or short description.');
      return;
    }
    setErrorMsg(null);

    try {
      const res = await onCheckBug({
        bugTitle,
        bugDescription,
        expectedBehavior,
        actualBehavior: observedBehavior,
        observedBehavior,
        stepsToReproduce,
        errorMessage,
        relevantFiles,
        repoUrl: currentRepoUrl,
      });
      setResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to check for existing bug.');
    }
  };

  const handleCopyDraftComment = () => {
    if (result?.draftContributionComment) {
      navigator.clipboard.writeText(result.draftContributionComment);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    }
  };

  // State presentation helper for all 5 requested states
  const getStatePresentation = (state: BugDetectiveState) => {
    switch (state) {
      case 'existing_fix_found':
      case 'existing_fix_available':
        return {
          badgeText: 'State A: Existing Report & Relevant Fix Found',
          bg: 'bg-[#131d16] border-[#1e3b2b] text-emerald-300/90',
          icon: ShieldCheck,
          accent: 'emerald',
          subtext: 'An existing issue and an active or merged fix was located.',
        };
      case 'existing_issue_no_fix':
      case 'possible_duplicate_no_fix':
        return {
          badgeText: 'State B: Existing Issue Found (No Verified Fix)',
          bg: 'bg-[#1c1811] border-[#382b1b] text-amber-300/90',
          icon: AlertTriangle,
          accent: 'amber',
          subtext: 'Matching report exists, but no verified merged solution was identified.',
        };
      case 'uncertain_match':
        return {
          badgeText: 'State C: Similar Issue Found (Match Uncertain)',
          bg: 'bg-[#181520] border-[#2f243d] text-purple-300/90',
          icon: Info,
          accent: 'purple',
          subtext: 'Candidate issues share some symptoms, but differences or unknowns remain.',
        };
      case 'no_strong_match':
        return {
          badgeText: 'State D: No Strong Match Found',
          bg: 'bg-[#121720] border-[#1f2b3b] text-sky-300/90',
          icon: CheckCircle2,
          accent: 'sky',
          subtext: 'No matching report located in retrieved data; appears to be a new bug.',
        };
      case 'insufficient_details':
      case 'insufficient_information':
      default:
        return {
          badgeText: 'State E: Insufficient Bug Details',
          bg: 'bg-[#1d1214] border-[#3b1d22] text-rose-300/90',
          icon: HelpCircle,
          accent: 'rose',
          subtext: 'Additional reproduction steps or logs needed to evaluate against repository.',
        };
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Primary Pre-Fix Heading - Matte Card */}
      <div className="bg-[#15171f] border border-[#232733] rounded-xl p-6 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e222c] text-zinc-300 text-xs font-mono border border-[#2b313f]">
                <Bug className="w-3.5 h-3.5 text-zinc-400" />
                <span>Pre-Fix Bug Detective</span>
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#181a22] text-zinc-400 border border-[#262934]">
                Engine: Gemma 4 (gemma-4-26b-a4b-it)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
              Found a bug? Check whether someone has already reported or fixed it before writing a solution.
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Don't waste hours diagnosing an issue or authoring a pull request that someone already solved.
              Screen your bug against open issues, closed reports, and merged pull requests before writing code.
            </p>
          </div>

          {/* Test Scenarios */}
          <div className="flex flex-col gap-1.5 shrink-0 bg-[#0e1014] p-3 rounded-lg border border-[#232631]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 font-semibold">
              Demo Scenarios:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => loadSample('fixed')}
                className="px-2 py-1 rounded bg-[#161820] hover:bg-[#20242e] text-zinc-300 text-[10px] font-mono border border-[#262a36] transition cursor-pointer text-left"
              >
                1. Fixed (#118/122)
              </button>
              <button
                type="button"
                onClick={() => loadSample('duplicate_unfixed')}
                className="px-2 py-1 rounded bg-[#161820] hover:bg-[#20242e] text-zinc-300 text-[10px] font-mono border border-[#262a36] transition cursor-pointer text-left"
              >
                2. Unfixed Duplicate
              </button>
              <button
                type="button"
                onClick={() => loadSample('uncertain')}
                className="px-2 py-1 rounded bg-[#161820] hover:bg-[#20242e] text-zinc-300 text-[10px] font-mono border border-[#262a36] transition cursor-pointer text-left"
              >
                3. Uncertain Match
              </button>
              <button
                type="button"
                onClick={() => loadSample('unique')}
                className="px-2 py-1 rounded bg-[#161820] hover:bg-[#20242e] text-zinc-300 text-[10px] font-mono border border-[#262a36] transition cursor-pointer text-left"
              >
                4. Unique New Bug
              </button>
              <button
                type="button"
                onClick={() => loadSample('awesome_unmaintained')}
                className="col-span-2 px-2 py-1 rounded bg-[#1a1e28] hover:bg-[#242938] text-zinc-200 text-[10px] font-mono border border-[#2c3344] transition cursor-pointer text-left flex items-center justify-between"
              >
                <span>5. sindresorhus/awesome (unmainted repo)</span>
                <span className="text-[9px] text-zinc-400 font-bold">#3642 / #628</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Pre-Fix Input Form */}
      {/* Developer Pre-Fix Input Form */}
      <form
        onSubmit={handleFormSubmit}
        id="bug-form"
        className="bg-[#15171f] border border-[#232733] rounded-xl p-6 space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-zinc-200 flex items-center justify-between">
              <span>Bug Title or Short Description *</span>
              <span className="text-[10px] text-zinc-500 font-normal">Core failure symptom or function name</span>
            </label>
            <input
              type="text"
              value={bugTitle}
              onChange={(e) => setBugTitle(e.target.value)}
              placeholder="e.g. Redis reconnect timeout causes UnhandledPromiseRejection in retry backoff"
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3.5 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none font-medium transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-200">GitHub Repository URL *</label>
            <input
              type="text"
              value={currentRepoUrl}
              onChange={(e) => setCurrentRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3 py-1.5 text-xs text-zinc-200 font-mono outline-none transition"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-200">Affected File, Module, or Component (Optional)</label>
            <input
              type="text"
              value={relevantFiles}
              onChange={(e) => setRelevantFiles(e.target.value)}
              placeholder="e.g. src/transport/redis.ts or StreamHandler"
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3 py-1.5 text-xs text-zinc-300 font-mono outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-200">Observed Behavior *</label>
            <textarea
              rows={3}
              value={observedBehavior}
              onChange={(e) => setObservedBehavior(e.target.value)}
              placeholder="What actually happens? (e.g. Socket disconnect throws unhandled rejection and crashes process)"
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-200">Expected Behavior *</label>
            <textarea
              rows={3}
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="What did you expect to happen? (e.g. Connection should trigger exponential backoff without crashing)"
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3.5 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-200">Steps to Reproduce</label>
            <textarea
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Drop primary Redis connection&#10;2. Dispatch task queue item&#10;3. Observe crash"
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 font-mono outline-none transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Error Message or Logs (Optional)</span>
            </label>
            <textarea
              rows={3}
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Paste traceback or console error logs..."
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3 py-1.5 text-xs text-zinc-300 font-mono placeholder:text-zinc-600 outline-none transition"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-semibold text-zinc-200">Additional Context (Optional)</label>
            <input
              type="text"
              value={bugDescription}
              onChange={(e) => setBugDescription(e.target.value)}
              placeholder="Any other details (OS, version, deployment environment)..."
              className="w-full bg-[#0d0f13] border border-[#262a36] focus:border-zinc-500 rounded-md px-3.5 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 outline-none transition"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-md bg-rose-950/40 border border-rose-800/40 text-rose-300/90 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#232733]">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 font-mono">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Searches open/closed issues, linked PRs, and commit evidence</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !bugTitle.trim()}
            className="px-5 py-2 rounded-md bg-[#232836] hover:bg-[#2c3345] disabled:opacity-50 text-zinc-100 text-xs font-semibold flex items-center justify-center gap-2 border border-[#353d52] transition cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-zinc-400" />
                <span>Searching Repository with Gemma 4...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4 text-zinc-300" />
                <span>Search Before Fixing</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Structured Actionable Result Display (5 States) */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {(() => {
            const pres = getStatePresentation(result.state);
            const StateIcon = pres.icon;

            return (
              <div className={`p-6 rounded-2xl border ${pres.bg} shadow-lg space-y-4`}>
                {/* Status Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-current/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-black/30 text-white">
                      <StateIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider font-semibold opacity-90">
                        {pres.badgeText}
                      </div>
                      <h3 className="text-lg font-bold text-white">{result.verdictTitle}</h3>
                      <p className="text-xs text-slate-300">{pres.subtext}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-black/40 text-white font-medium">
                      Confidence: {result.confidenceScore}%
                    </span>
                    <span className="text-[10px] font-mono text-slate-300">
                      Model: {result.modelUsed}
                    </span>
                  </div>
                </div>

                {/* Scope of Search Notice */}
                <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{result.searchScopeNotes}</span>
                </div>

                {/* Recommendation Box */}
                <div className="p-4 rounded-xl bg-black/35 border border-current/20 space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Actionable Recommendation for Developer</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{result.recommendation}</div>
                  <p className="text-xs text-slate-300">{result.reasoning}</p>
                </div>

                {/* Step 4: Next Decision Actions */}
                <div className="p-3.5 rounded-xl bg-black/30 border border-slate-700/60 space-y-2">
                  <div className="text-[11px] font-mono uppercase font-bold text-slate-300">
                    What would you like to do next?
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matches[0]?.issueUrl && (
                      <a
                        href={result.matches[0].issueUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Existing Issue #{result.matches[0].issueNumber}</span>
                      </a>
                    )}

                    {result.matches[0]?.linkedPrUrl && (
                      <a
                        href={result.matches[0].linkedPrUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 text-xs font-medium flex items-center gap-1.5 transition border border-emerald-500/40"
                      >
                        <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Inspect Related Pull Request #{result.matches[0].linkedPrNumber}</span>
                      </a>
                    )}

                    {result.draftContributionComment && (
                      <button
                        onClick={() => setShowDraftModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition border border-indigo-500/40 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Open Issue for Contribution (Draft Comment)</span>
                      </button>
                    )}

                    <button
                      onClick={() => setShowFixChecklist(!showFixChecklist)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 text-sky-400" />
                      <span>Continue with My Own Fix</span>
                    </button>

                    <a
                      href="#bug-form"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-400" />
                      <span>Search Again with More Details</span>
                    </a>
                  </div>
                </div>

                {/* Continue with Own Fix Checklist Drawer */}
                {showFixChecklist && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-sky-500/30 space-y-2 text-xs text-slate-200 animate-in fade-in duration-200">
                    <div className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4" />
                      <span>Pre-Implementation Best Practices for {result.analyzedRepository}:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                      <li>Create an isolated reproduction test case before editing module files.</li>
                      <li>Reference any overlapping symptom numbers in your PR description.</li>
                      <li>Check default branch ({result.analyzedRepository}) for recent changes in the affected files.</li>
                    </ul>
                  </div>
                )}

                {/* Missing Details for State E */}
                {(result.state === 'insufficient_details' || result.state === 'insufficient_information') &&
                  result.missingDetailsSuggested &&
                  result.missingDetailsSuggested.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/30 space-y-2">
                      <div className="text-xs font-bold text-rose-300">Suggested Missing Details to Add:</div>
                      <ul className="text-xs text-rose-200 list-disc list-inside space-y-1">
                        {result.missingDetailsSuggested.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {/* Candidate Matches & Evidence */}
                {result.matches.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center justify-between">
                      <span>Candidate Matches & Verified Evidence ({result.matches.length})</span>
                      <span className="text-[11px] font-mono text-slate-300 font-normal">
                        Click link to inspect on GitHub
                      </span>
                    </div>

                    <div className="space-y-3">
                      {result.matches.map((match) => (
                        <div
                          key={match.issueNumber}
                          className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-indigo-400 font-bold text-sm">
                                #{match.issueNumber}
                              </span>
                              <Badge variant={match.issueState === 'open' ? 'open' : 'closed'}>
                                {match.issueState}
                              </Badge>
                              <a
                                href={match.issueUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-white hover:text-indigo-400 transition inline-flex items-center gap-1 text-sm"
                              >
                                <span>{match.issueTitle}</span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              </a>
                            </div>

                            <div className="text-xs font-mono font-bold text-amber-300 self-start sm:self-auto">
                              ~{match.similarityScore}% match
                            </div>
                          </div>

                          {/* Why Related */}
                          {match.whyRelated && (
                            <div className="text-xs text-slate-300">
                              <span className="font-semibold text-slate-200">Why Related: </span>
                              {match.whyRelated}
                            </div>
                          )}

                          {/* Fix Details if linked PR exists */}
                          {(match.linkedPrNumber || match.linkedCommitSha || match.isVerifiedFix) && (
                            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs flex flex-wrap items-center gap-3">
                              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <GitPullRequest className="w-3.5 h-3.5" />
                                {match.isVerifiedFix ? 'Verified Fix Linked:' : 'Linked Candidate PR:'}
                              </span>

                              {match.linkedPrNumber && (
                                <a
                                  href={match.linkedPrUrl || `https://github.com/${result.analyzedRepository}/pull/${match.linkedPrNumber}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono font-medium text-emerald-300 hover:underline inline-flex items-center gap-1"
                                >
                                  PR #{match.linkedPrNumber}
                                  {match.linkedPrMerged && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                      Merged
                                    </span>
                                  )}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}

                              {match.linkedCommitSha && (
                                <span className="font-mono text-[11px] text-slate-300 flex items-center gap-1">
                                  <GitCommit className="w-3 h-3 text-slate-400" />
                                  commit {match.linkedCommitSha.slice(0, 7)}
                                </span>
                              )}

                              {match.whatFixChanges && (
                                <div className="w-full text-slate-300 text-[11px] pt-1">
                                  <span className="font-semibold text-emerald-300">What Fix Changes: </span>
                                  {match.whatFixChanges}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Overlapping Symptoms & Differences */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                            {match.overlappingSymptoms && match.overlappingSymptoms.length > 0 && (
                              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                <div className="text-[11px] font-semibold text-emerald-400 mb-1">
                                  Overlapping Symptoms / Root Cause:
                                </div>
                                <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                                  {match.overlappingSymptoms.map((s, idx) => (
                                    <li key={idx}>{s}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {match.differencesAndUncertainties && match.differencesAndUncertainties.length > 0 && (
                              <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                <div className="text-[11px] font-semibold text-amber-400 mb-1">
                                  Differences & Uncertainties:
                                </div>
                                <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                                  {match.differencesAndUncertainties.map((u, idx) => (
                                    <li key={idx}>{u}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Contribution Comment Drawer Modal */}
      {showDraftModal && result?.draftContributionComment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Draft Comment for Contributing to Existing Issue</h3>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Rather than opening a duplicate issue, maintainers appreciate confirming symptoms on the existing thread:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {result.draftContributionComment}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Requires manual copy & pasting to GitHub. No automatic posting.
              </span>
              <button
                onClick={handleCopyDraftComment}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedDraft ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied Comment!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
